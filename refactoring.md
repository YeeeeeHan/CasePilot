Based on the "Workspace Persistence" convention in desktop application development and the specific architecture of CasePilot, here is the recommendation:

### The Short Answer

**You must persist BOTH.**

In desktop applications—particularly "work-in-progress" tools like video editors (Premiere Pro) or IDEs (VS Code)—the database represents the **entire state of the project**, not just the final output.

If a paralegal drags 50 files into Zone B (Staging) but only organizes 10 of them into Zone C (Master Index) before going home, they expect the other 40 to be waiting in the Staging area when they reopen the app the next morning.

### The Standard App Development Convention

The convention is **"Single Source of Truth, Variable State."**

Instead of creating separate tables for "Staging Files" and "Index Files," you typically create a single inventory (a `documents` table) and use a **State Machine** or **Status Column** to determine which Zone the file appears in.

#### Recommended Schema Design for CasePilot

Based on your `sqlite` requirement and the Zone B/C definitions, here is the recommended schema:

**1. Table: `documents` (The Inventory)**
This table stores every file known to the project, regardless of where it lives in the UI.

| Column            | Type | Purpose                                         |
| ----------------- | ---- | ----------------------------------------------- |
| `id`              | UUID | Primary Key                                     |
| `file_path`       | TEXT | Absolute path to the PDF on disk                |
| `original_name`   | TEXT | "contract_v2.pdf"                               |
| `status`          | TEXT | **ENUM: 'unprocessed', 'processed', 'bundled'** |
| `sort_order`      | INT  | Null if staging; 1, 2, 3... if bundled          |
| `toc_description` | TEXT | The editable description for Zone C             |
| `page_count`      | INT  | Cached page count (for calculation)             |

**2. How this maps to your UI Zones:**

- **Zone B (Staging Area):** Queries the database for items _waiting_ for action.

```sql
SELECT * FROM documents WHERE status IN ('unprocessed', 'processed');

```

_This preserves the "triage status" mentioned in your specs (Unprocessed vs Processed)._

- **Zone C (Master Index):** Queries the database for items _in_ the bundle.

```sql
SELECT * FROM documents WHERE status = 'bundled' ORDER BY sort_order ASC;

```

_This populates the high-density TOC table._

### Why this approach fits CasePilot

**1. Data Integrity for "The Sacred Rule"**
Your CLAUDE.md states the #1 rule is "Index Page # == PDF Footer Page #".
By keeping everything in one table, you avoid "drift" where a file in Staging might be updated but the copy in the Master Index isn't.

**2. Handling the "Late Insert" Flow**
Your `Late Insert` feature requires complex re-calculation.

- **Scenario:** User drags a file from **Zone B** to **Zone C** at Position 5.
- **Database Action:** You simply update that one row's `status` to `'bundled'` and `sort_order` to `5`, then shift the `sort_order` of all subsequent items by +1. You don't need to move data between tables.

**3. "Smart Unbundler" Support**
Your roadmap mentions a "Smart Unbundler" that splits a 500-page PDF.

- When this happens, you will generate 500 new rows in the `documents` table with `status = 'unprocessed'` (landing them in Zone B for triage). Persisting Zone B is critical here because the user cannot organize 500 documents in one sitting.

### Summary Diagram

**The Convention Logic:**

1. **Import:** File enters DB (`status: unprocessed`). Visible in **Zone B**.
2. **Metadata Extract:** Background job updates row (`status: processed`, `toc_description: "Email from..."`). Visible in **Zone B**.
3. **Drag to Index:** User moves file. Update row (`status: bundled`, `sort_order: 1`). Moves to **Zone C**.
4. **Save Project:** SQLite is already up to date; no separate "save" serialization needed for the file list.

`so would it be a huge refactoring from my current schema?`

No, it would **not be a huge refactoring**. It is a "Medium" refactor—mostly changing one table definition and updating the corresponding Rust struct.

Based on your `db.rs` and `lib.rs`, you are currently separating **Documents** (authored text/TipTap) from **Exhibits** (PDFs/Evidence). To implement the "Single Source of Truth" pattern, you just need to broaden the scope of your `exhibits` table to handle files that aren't "exhibits" yet.

### The Core Change

Currently, your `exhibits` table is too strict. It enforces `label` and `sequence_index` as `NOT NULL`, which means a file _must_ be part of the bundle to exist in the database.

**The Refactor:** You need to relax the `exhibits` table to allow "raw" files (Stage B) that don't have a label or sequence yet.

### Step 1: Update the Schema (`db.rs`)

You need to recreate the `exhibits` table (or rename it to `project_files` for clarity) with these changes:

1. **Add `status**`: To track if it's 'staging' or 'bundled'.
2. **Make fields Nullable**: `label` and `sequence_index` must be optional because a raw PDF sitting in Staging doesn't have a "Tab Number" yet.

Modify `run_migrations` in `db.rs`:

```rust
// db.rs

// ... inside run_migrations ...

// 1. Check if we need to migrate (e.g. check for 'status' column)
let has_status = sqlx::query_scalar::<_, i32>(
    "SELECT COUNT(*) FROM pragma_table_info('exhibits') WHERE name = 'status'"
)
.fetch_one(pool)
.await
.unwrap_or(0);

// 2. If no status column, drop and recreate (since SQLite struggles to remove NOT NULL constraints via ALTER)
if has_status == 0 {
    sqlx::query("DROP TABLE IF EXISTS exhibits").execute(pool).await.ok();
}

sqlx::query(
    r#"
    CREATE TABLE IF NOT EXISTS exhibits (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,

        -- NEW: Track where the file is (staging vs bundled)
        status TEXT NOT NULL DEFAULT 'staging',

        -- CHANGED: Nullable, because staging files don't have these yet
        label TEXT,
        sequence_index INTEGER,

        file_path TEXT, -- Already nullable in your code, but keep it
        page_count INTEGER,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    )
    "#,
)
.execute(pool)
.await?;

```

### Step 2: Update Rust Structs (`lib.rs`)

Update your `Exhibit` struct to reflect that some fields are now optional (Option).

```rust
// lib.rs

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Exhibit {
    pub id: String,
    pub case_id: String,
    pub status: String, // New field
    pub label: Option<String>, // Now Option<>
    pub sequence_index: Option<i32>, // Now Option<>
    pub file_path: Option<String>,
    // ... rest same as before
}

```

### Step 3: Update Queries (`db.rs`)

You will need two queries now: one for the **Staging Area** (Zone B) and one for the **Master Index** (Zone C).

```rust
// db.rs

// For Zone C (The Bundle) - Existing logic, just add filter
pub async fn list_bundled_exhibits(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<Exhibit>, String> {
    sqlx::query_as::<_, Exhibit>(
        "SELECT * FROM exhibits WHERE case_id = ? AND status = 'bundled' ORDER BY sequence_index ASC"
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    // ...
}

// For Zone B (Staging Area) - New query
pub async fn list_staging_files(pool: &Pool<Sqlite>, case_id: &str) -> Result<Vec<Exhibit>, String> {
    sqlx::query_as::<_, Exhibit>(
        "SELECT * FROM exhibits WHERE case_id = ? AND status = 'staging' ORDER BY created_at DESC"
    )
    .bind(case_id)
    .fetch_all(pool)
    .await
    // ...
}

```

### Summary of Work Required

- **Database:** Drop and recreate `exhibits` table (SQLite logic already exists in your `run_migrations`).
- **Rust:** Change `label` and `sequence_index` to `Option<T>` in `lib.rs` and `db.rs`.
- **Frontend:** Update your TypeScript interface to match the new Rust struct (allow nulls).

This is a **safe, low-risk refactor** that fits perfectly with your current architecture. You are simply removing constraints, not adding complexity.
