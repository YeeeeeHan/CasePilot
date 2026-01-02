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

## Tech Stack

| Layer        | Technology                         | Purpose                                                    |
| ------------ | ---------------------------------- | ---------------------------------------------------------- |
| App Shell    | Tauri v2                           | Native desktop, small bundle (~10MB), **Air-gap friendly** |
| Backend      | Rust + `lopdf`                     | Memory-safe file handling, PDF manipulation                |
| Frontend     | React + TypeScript + Tailwind      | Component-driven UI                                        |
| State        | **Zustand**                        | Project state "Brain" (Files/Artifacts)                    |
| Explorer     | **react-arborist** + **@dnd-kit**  | VS Code-like file tree & drag-and-drop                     |
| Data Grid    | **@tanstack/react-table**          | High-performance Master Index (sorting)                    |
| Editor       | TipTap (ProseMirror)               | Rich text with custom nodes                                |
| Preview      | **react-virtuoso** + **react-pdf** | Virtualized continuous bundle scrolling                    |
| Database     | SQLite (`sqlx`)                    | Structured data (Files, Artifacts, Entries)                |
| Intelligence | llama.cpp (bundled)                | Local LLM inference (Phase 3)                              |

## System Architecture

**Core Concept**: The database distinguishes between **Files** (Source of Truth) and **Artifacts** (Containers like Affidavits or Bundles).

```

┌─────────────────────────────────────────────────────────────────┐
│ CasePilot Desktop App │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Frontend (WebView) │ │
│ │ ┌───────────┐ ┌───────────────┐ ┌─────────────────┐ │ │
│ │ │ Explorer │ │ Workbench │ │ Preview │ │ │
│ │ │(Arborist) │ │(TipTap/Table) │ │(Virtuoso/PDF) │ │ │
│ │ └───────────┘ └───────────────┘ └─────────────────┘ │ │
│ │ State: Zustand (Project Store) │ │
│ └──────────────────────────┬───────────────────────────────┘ │
│ │ invoke() │
│ ┌──────────────────────────▼───────────────────────────────┐ │
│ │ Backend (Rust/Tauri) │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │
│ │ │ Commands │ │ PDF Engine │ │ File System │ │ │
│ │ │ (lib.rs) │ │ (lopdf) │ │ (PDFs) │ │ │
│ │ └─────────────┘ └─────────────┘ └─────────────────┘ │ │
│ └──────────────────────────┬───────────────────────────────┘ │
│ │ │
│ ┌──────────────────────────▼───────────────────────────────┐ │
│ │ Storage Layer (SQLite) │ │
│ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ │ Files Table: id, path, metadata │ │ │
│ │ │ Artifacts Table: id, type (affidavit/bundle) │ │ │
│ │ │ ArtifactEntries: Polymorphic (File/Component) │ │ │
│ │ └───────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

```

## UI Architecture: v2.0 Layout

**Core Philosophy**: "Explorer for Navigation, Workbench for Creation, Preview for Verification."

### Layout Diagram

```

┌──────┬──────────────┬─────────────────────────────────┬──────────────────────┐
│ 48px │ 250px │ flex-1 (The Workbench) │ 400px │
├──────┼──────────────┼─────────────────────────────────┼──────────────────────┤
│ Act- │ EXPLORER │ TAB A: AFFIDAVIT WRITER │ INTELLIGENT PREVIEW │
│ ivity│ (Arborist) │ (TipTap Editor) │ (Virtuoso) │
│ Bar │ │ │ │
│ │ 📁 Cases │ "I refer to the invoice..." │ [ Continuous PDF ] │
│ 📁 │ └─ 📁 Docs │ │ [ Stream ] │
│ │ └─ Inv.pdf│ [Exhibit Node: TAK-1] │ │
│ 📝 │ │ │ ┌──────────────────┐ │
│ │ │ OR │ │ COVER PAGE │ │
│ │ │ │ │ (React Comp) │ │
│ │ │ TAB B: BUNDLE INDEX │ ├──────────────────┤ │
│ │ │ (TanStack Table) │ │ SECTION DIV │ │
│ │ │ │ ├──────────────────┤ │
│ │ │ No | Date | Desc | Page │ │ PDF FILE │ │
│ │ │ 1 | 14 Feb | Invoice | 1-4 │ └──────────────────┘ │
└──────┴──────────────┴─────────────────────────────────┴──────────────────────┘

```

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

## File Structure

```

CasePilot/
├── src/
│ ├── components/
│ │ ├── explorer/ # react-arborist setup
│ │ ├── workbench/ # TipTap + TanStack Table
│ │ ├── preview/ # react-virtuoso + react-pdf
│ │ └── ui/ # Shared UI components
│ ├── store/ # Zustand (useProjectStore)
│ ├── lib/ # Utilities
│ └── hooks/ # Custom React hooks
├── src-tauri/
│ ├── src/
│ │ ├── lib.rs # Commands
│ │ ├── db.rs # SQLite (Files/Artifacts)
│ │ └── export.rs # PDF generation (lopdf)
└── CLAUDE.md # This file

```

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

```
A **Bundle** is rarely just a stack of external PDFs. In Singapore, a Bundle is a **Composition** that looks like this:

1.  **Cover Page** (Generated/Drafted in app)
2.  **Table of Contents** (Auto-Generated)
3.  **Section Divider: "Plaintiff's Documents"** (Simple text page)
4.  **Exhibit P1** (External PDF)
5.  **Exhibit P2** (External PDF)

If we only store `file_id` in the `artifact_entries` table, we cannot represent items 1, 2, and 3.

Here is how we handle **Mixed Content (Hybrid Bundles)** in the architecture.

---

### 1. The Database Fix: Polymorphic Entries

We modify the `artifact_entries` table to support three "Types" of rows. It doesn't just point to files anymore; it points to **Content Sources**.

**Updated `artifact_entries` Schema:**
*   `id`: UUID
*   `artifact_id`: FK to the parent Bundle.
*   `sequence_order`: Integer (1, 2, 3...)
*   **`row_type`**: Enum (`'file'` | `'component'` | `'artifact'`)
*   **`file_id`**: FK to `files` table (Used if type is `'file'`).
*   **`config_json`**: JSON blob (Used if type is `'component'`).
    *   *Example for Cover Page:* `{ "template": "cover_v1", "title": "Bundle of Documents", "party": "Plaintiff" }`
    *   *Example for Divider:* `{ "text": "PLAINTIFF'S DOCUMENTS" }`
*   **`ref_artifact_id`**: FK to `artifacts` table (Used if type is `'artifact'`).
    *   *Use Case:* Nesting the "Affidavit of Tan" (which you wrote in CasePilot) *inside* the "Agreed Bundle".

---

### 2. The UI Implication: The "Hybrid Renderer"

This affects your **Bundle Mode (Panel B: Continuous Preview)** significantly. The Virtual Scroller must be smart enough to render different things based on the `row_type`.

**Scenario: Scrolling down the Bundle Preview**

*   **Row 1 (Cover Page):**
    *   *Type:* `'component'`
    *   *Renderer:* **React Component**. It reads the `config_json` and renders a clean HTML/CSS Cover Page using Tailwind. It looks exactly like the PDF will look.
    *   *Editability:* You can click directly on the text in the preview to edit the title.

*   **Row 2 (Section Divider):**
    *   *Type:* `'component'`
    *   *Renderer:* **React Component**. A simple page with centered text: "PLAINTIFF'S DOCUMENTS".

*   **Row 3 (Invoice.pdf):**
    *   *Type:* `'file'`
    *   *Renderer:* **PDF Canvas (`react-pdf`)**. Renders the actual binary content.

**The "Mental Model":**
To the user, it looks like one continuous document. Under the hood, it is a list of **React Components** and **PDF Canvases** interleaved.

---

### 3. The Compilation Logic (Rust)

When the user clicks "Export Bundle", the Rust backend (`compile_bundle`) must handle this hybrid list:

1.  **Iterate** through `artifact_entries`.
2.  **If `file`:**
    *   Read PDF path.
    *   Measure page count.
    *   Append pages to Master Stream.
3.  **If `component` (e.g., Cover Page):**
    *   Rust cannot render React.
    *   **Solution:** The Frontend sends the *HTML string* of the cover page to Rust.
    *   **Rust Action:** Uses a library like `wkhtmltopdf` or a headless browser instance (or a lightweight HTML-to-PDF crate like `genpdf`) to convert that HTML chunk into a PDF page in memory.
    *   Append that new page to Master Stream.
4.  **If `artifact` (e.g., Nested Affidavit):**
    *   Recursively compile that Affidavit first.
    *   Append the result to Master Stream.


```

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

### Summary of Library Choices (Answered)

| Capability         | Best Library Choice     | Why?                                                                                                 |
| ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| **File Tree**      | `react-arborist`        | Handles drag-and-drop, nesting, and virtualization better than writing your own recursive component. |
| **Data Grid**      | `@tanstack/react-table` | Headless, extremely performant for sorting/filtering the Master Index.                               |
| **Drag & Drop**    | `@dnd-kit/core`         | Modern, accessible, lightweight. Integrates well with both Arborist and TanStack.                    |
| **PDF Viewing**    | `react-pdf`             | Standard for rendering PDF pages in canvas/svg.                                                      |
| **Virtual Scroll** | `react-virtuoso`        | Essential for the "Continuous Bundle Preview" (Panel B) so you don't crash the DOM with 500 pages.   |
| **PDF Backend**    | `lopdf`                 | Pure Rust, fast for merging and page counting. Use `printpdf` if you need complex drawing.           |

```

```
