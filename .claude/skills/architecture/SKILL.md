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

### Summary of Library Choices (Answered)

| Capability         | Best Library Choice     | Why?                                                                                                 |
| ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| **File Tree**      | `react-arborist`        | Handles drag-and-drop, nesting, and virtualization better than writing your own recursive component. |
| **Data Grid**      | `@tanstack/react-table` | Headless, extremely performant for sorting/filtering the Master Index.                               |
| **Drag & Drop**    | `@dnd-kit/core`         | Modern, accessible, lightweight. Integrates well with both Arborist and TanStack.                    |
| **PDF Viewing**    | `react-pdf`             | Standard for rendering PDF pages in canvas/svg.                                                      |
| **Virtual Scroll** | `react-virtuoso`        | Essential for the "Continuous Bundle Preview" (Panel B) so you don't crash the DOM with 500 pages.   |
| **PDF Backend**    | `lopdf`                 | Pure Rust, fast for merging and page counting. Use `printpdf` if you need complex drawing.           |
