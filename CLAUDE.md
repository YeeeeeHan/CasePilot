# CasePilot: Bundle Compliance Automator for Singapore Litigation

## Project Overview

CasePilot is a desktop application that automates the tedious, error-prone process of assembling court-compliant document bundles. Instead of spending 200+ hours in Adobe Acrobat ensuring page numbers match Table of Contents entries, paralegals and associates get automatic pagination, dynamic TOC generation, and ePD 2021 compliance validation.

**Philosophy**:

1.  **Decouple Data**: A file is just a blob; an Artifact (Affidavit/Bundle) is the context.
2.  **Relationship Manager**: CasePilot is not just an editor; it manages the relationship between the **Evidence** and the **Narrative** (Bundle/Affidavit).

> "It's not about Multimedia; it's about Pagination." — User Research, Dec 2024

### 1. The "Bucket load of PDFs" Problem

Bundles are chaotic and chronological. Affidavits are narrative and structured. CasePilot's challenge is the **synchronization** between these two use cases.

### 2. Workflow Logic: The Dual Engine

| Feature                 | **Affidavit Flow** (The Narrative)                                                        | **Bundle Flow** (The Repository)                                                     |
| :---------------------- | :---------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **User Goal**           | To prove a specific story.                                                                | To organize discovery for the court.                                                 |
| **Logic Engine**        | **"The Automator"**: Scans text for mentions like "Exhibit A" and finds the file.         | **"The Sorter"**: Bulk edits metadata (Date, Author) to create a chronological list. |
| **Source of Truth**     | **The Editor**: The text dictates the order of the exhibits.                              | **The Index**: The dates/types dictate the order of the files.                       |
| **Primary Interaction** | **Type & Predict**: As you type, the PDF pops up in the right panel for "fact-checking."  | **Drag & Tag**: Multi-selecting files to tag them as "Correspondence" or "Invoices." |
| **The "Export"**        | **Word Doc + Exhibit PDF**: A `.docx` file and a compiled PDF of just the cited evidence. | **The Master Bundle**: One massive 2,000-page PDF with an Index and Page Stamps.     |

## UI Architecture: v2.0 Layout

**Core Philosophy**: "Explorer for Navigation, Workbench for Creation, Preview for Verification."

### Zone Definitions

| Zone             | Purpose                                                                              |
| :--------------- | :----------------------------------------------------------------------------------- |
| **Activity Bar** | Switch between Project Tree, File Repo, and Search.                                  |
| **Explorer**     | `react-arborist` tree. Draggable source for files.                                   |
| **Workbench**    | **Mode A (Affidavit)**: TipTap editor. **Mode B (Bundle)**: Master Index Grid.       |
| **Preview**      | **Affidavit**: Single PDF. **Bundle**: Hybrid continuous scroll (Components + PDFs). |

## Database Schema (v2.0)

1.  **`files`**: The raw assets. (`id`, `path`, `metadata_json`)
2.  **`artifacts`**: The containers. (`id`, `type` ['affidavit'|'bundle'], `content_json`)
3.  **`artifact_entries`**: The links.
    - `row_type`: `'file'` | `'component'` (Cover/Divider) | `'artifact'` (Nested)
    - `config_json`: Stores data for components (e.g., Title text).

## Active Implementation Plan (v2.0)

Here is the consolidated **CasePilot v2.0 Roadmap**.

I have merged Roadmap B’s superior **"Artifact" architecture** (which allows for multiple affidavits and bundles) with Roadmap A’s specific **UI tooling** (`react-arborist`, `dnd-kit`).

I have also explicitly answered your embedded technical questions within the relevant phases.

---

# CasePilot v2.0: The Unified Implementation Roadmap

### Phase 1: The Data Foundation (Rust & SQL)

**Goal:** Decouple "Raw Files" from "Contextual Usage".
**Why:** A file is just a blob. An exhibit is a file _used_ in a specific context (Affidavit A vs. Bundle B).

1.  **Refactor DB Schema (`src-tauri/src/db.rs`):**
    *   Drop `exhibits` table.
    *   **Create `files` table:** The Source of Truth.
        *   `id` (UUID), `path`, `original_name`, `metadata_json` (Date, Desc), `created_at`.
    *   **Create `artifacts` table:** The Containers.
        *   `id` (UUID), `case_id`, `type` (`'affidavit'` | `'bundle'`), `name` (e.g., "Affidavit of Tan Ah Kow").
        *   `content_json`: Stores the TipTap JSON for Affidavits.
    *   **Create `artifact_entries` table:** The Links.
        *   `id`, `artifact_id`, `file_id`, `sequence_order`, `label_override` (e.g., "TAK-1").

> **Answer to your questions:**
>     > *   **How to handle TipTap documents?** They are stored in the `artifacts` table under a `content_json` column. An Affidavit *is* an Artifact.
>     > *   **How to handle Content Pages?** You do _not_ store Content Pages in the DB. They are **Generated Assets**. They are created on-the-fly by the Rust backend during the `export_bundle` command based on the data in `artifact_entries`.
>     > \*   **`affidavit_entries`?** No. Use the generic `artifact_entries` table. The `artifact_id` tells you if it belongs to an Affidavit or a Bundle.

2.  **Ingestion Command (`ingest_files`):**
    *   **Libraries to use:**
        *   `walkdir`: For recursive folder scanning.
        *   `lopdf`: For fast extraction of page counts (lighter than pdfium).
        *   `chrono`: For parsing metadata dates.
        \*   `serde_json`: For storing metadata.

### Phase 2: The State Engine (Frontend)

**Goal:** A "Brain" that manages the Project Tree.

1.  **Install Zustand:** `npm install zustand`.
2.  **Create Store (`src/store/useProjectStore.ts`):**
    *   `files`: Map of all raw files (The Repo).
    *   `artifacts`: Tree structure of Affidavits and Bundles.
    *   `activeArtifactId`: Determines what renders in the Workbench.
    *   `selection`: Currently selected ID (for the Preview panel).
3.  **Create Sync Hooks:** Listen for DB changes -> Update Store.

### Phase 3: The Explorer (Left Panel)

**Goal:** VS Code fidelity with Project switching.

1.  **Libraries:** `npm install react-arborist @dnd-kit/core lucide-react`.
2.  **Implement `ActivityBar`:** Vertical strip to switch between "Project Tree" and "File Repo".
3.  **Implement `FileExplorer.tsx`:**
    *   Use `react-arborist` for the file tree.
    *   **Drag Source:** Configure nodes to be draggable (payload: `file_id`).
4.  **Implement `MetadataPane.tsx`:** Fixed footer showing Date/Description of selected file.

### Phase 4: The Affidavit Workbench (Center Panel A)

**Goal:** The Narrative Writer.

1.  **TipTap Integration:**
    *   Load content from `activeArtifact.content_json`.
    *   Auto-save logic (debounced) to DB.
2.  **Smart `ExhibitNode`:**
    *   **Logic:** It does NOT store "Exhibit A". It stores `file_id`.
    *   **Render:** It queries `artifact_entries` for the current affidavit.
    \*   *Calculation:* `index = entries.findIndex(e => e.file_id === this.file_id)`.
    \*   *Label:* `Initials + (index + 1)` (e.g., TAK-1).
3.  **Drop Handler:** Dropping a file from Explorer -> Inserts Node -> Creates `artifact_entry`.

### Phase 5: The Bundle Workbench (Center Panel B)

**Goal:** The Logistics Manager.

1.  **Library:** `npm install @tanstack/react-table date-fns`.
2.  **Implement `MasterIndex`:**
    *   Data Grid view of `artifact_entries`.
    *   **Sort Logic:** "Sort by Date" button (Crucial for Agreed Bundles).
    *   **Renumbering Logic:**
        *   *Input:* List of entries + File Page Counts.
        \*   *Output:* Computed columns for `Page Start` and `Page End`.
        \*   *Note:* This happens in memory/UI, not DB, for instant feedback.

### Phase 6: The Intelligent Preview (Right Panel)

**Goal:** Context-aware verification.

1.  **Library:** `npm install react-virtuoso react-pdf`.
2.  **Context: Affidavit Mode:**
    *   Render `SinglePDFViewer`.
    *   Listens to cursor position in TipTap.
3.  **Context: Bundle Mode (The "Fake Merge"):**
    *   Render `ContinuousPDFViewer` using `react-virtuoso`.
    *   **Logic:** Calculate cumulative height of all PDFs.
    *   **Virtualization:** Only render the PDF currently in the viewport.
    *   **Overlay:** CSS Badge "Page X" calculated from the offset.

### Phase 7: The "Cross-Compile" Logic (The Glue)

**Goal:** Moving data between modes.

1.  **"Import from Affidavits" Command:**
    *   UI: Button in Bundle Workbench.
    *   Logic: Query `artifact_entries` where `type = 'affidavit'`.
    *   Action: Insert unique files into current Bundle Artifact.
2.  **"Back-Propagate" (Future/Phase 7.5):**
    *   Allow Affidavit to reference the Bundle's computed page numbers ("See Page 50 AB").

### Phase 8: Final Export

**Goal:** Money-making output.

1.  **Implement `export_affidavit` (Rust):**
    *   Process: Generate HTML Dividing Sheets (Handlebars) -> Convert to PDF -> Merge with Exhibits -> Stamp Page Numbers.
2.  **Implement `export_bundle` (Rust):**
    *   Process: Sort by Date -> Merge PDFs (No dividers) -> Continuous Pagination -> Inject Bookmarks.

---

```

```
