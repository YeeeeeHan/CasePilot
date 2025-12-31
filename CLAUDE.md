# CasePilot: Bundle Compliance Automator for Singapore Litigation

## Project Overview

CasePilot is a desktop application that automates the tedious, error-prone process of assembling court-compliant document bundles. Instead of spending 200+ hours in Adobe Acrobat ensuring page numbers match Table of Contents entries, paralegals and associates get automatic pagination, dynamic TOC generation, and ePD 2021 compliance validation.

**Philosophy**: Replace "shag" pagination work with one-click bundle compilation.

> "It's not about Multimedia; it's about Pagination." — User Research, Dec 2024

## Tech Stack

| Layer        | Technology                    | Purpose                              |
| ------------ | ----------------------------- | ------------------------------------ |
| App Shell    | Tauri v2                      | Native desktop, small bundle (~10MB) |
| Backend      | Rust                          | Memory-safe file handling, SQLite    |
| Frontend     | React + TypeScript + Tailwind | Component-driven UI                  |
| Editor       | TipTap (ProseMirror)          | Rich text with custom nodes          |
| Intelligence | llama.cpp (bundled)           | Local LLM inference                  |
| Database     | SQLite + LanceDB              | Structured + vector data             |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CasePilot Desktop App                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Frontend (WebView)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   Editor    │  │   Sidebar   │  │   Cmd+K Menu    │  │   │
│  │  │  (TipTap)   │  │  (Files)    │  │   (AI Actions)  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  │  React + TypeScript + Tailwind                           │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │ invoke()                          │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │              Backend (Rust/Tauri)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   Commands  │  │    State    │  │   File System   │  │   │
│  │  │  (lib.rs)   │  │  (AppState) │  │    (PDFs)       │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │              Storage Layer                               │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐   │   │
│  │  │   SQLite (sqlx)     │  │   LanceDB (Vectors)     │   │   │
│  │  │   - Case metadata   │  │   - Document chunks     │   │   │
│  │  │   - Exhibit registry│  │   - Embeddings          │   │   │
│  │  └─────────────────────┘  └─────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AI Layer (Sidecar)                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │   llama.cpp (Llama-3-8B-Q4)                     │    │   │
│  │  │   - Local inference                             │    │   │
│  │  │   - ~4GB model (downloaded on first launch)     │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## UI Architecture: Split-Screen Layout

**Core Principle**: The Split-View is mandatory. The #1 user anxiety is "Does the Index match the Page Number?" Separating them into tabs prevents instant verification.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Zone A (Case Area)                                                        │
│ [📁] [📁] [📁]  ← Project switcher (VS Code-style icons, minimal)        │
├────────────────────┬────────────────────┬────────────────────────────────┤
│ Zone B             │ Zone C             │ Zone D                          │
│ Staging Area       │ Master Index       │ Compiler Preview                │
│                    │ (Scaffold)         │ (Bundle)                        │
│ ┌────────────────┐ │ ┌────────────────┐ │ ┌────────────────────────────┐ │
│ │ Raw files dump │ │ │ Tab │ Desc │ Pg │ │ │                            │ │
│ │                │ │ │ ─── │ ──── │ ── │ │ │     PDF Preview            │ │
│ │ ○ Unprocessed  │ │ │  1  │ Email│ 1-3│ │ │                            │ │
│ │ ◐ Processed    │ │ │  2  │ Photo│ 4  │ │ │   [Page 15 of 347]         │ │
│ │ ● Bundled      │ │ │  3  │ Cont.│5-12│ │ │      ↑ stamp               │ │
│ └────────────────┘ │ └────────────────┘ │ └────────────────────────────┘ │
│ Drag files here    │ Click row → jumps  │ Shows pagination stamp         │
└────────────────────┴────────────────────┴────────────────────────────────┘
```

### Zone Definitions

| Zone | Name             | Purpose                                              |
| ---- | ---------------- | ---------------------------------------------------- |
| A    | Case Area        | Project switcher (minimal, users work 4+ hours/case) |
| B    | Staging Area     | Inbox for raw files with triage status               |
| C    | Master Index     | High-density TOC table (THE main editing surface)    |
| D    | Compiler Preview | Live PDF preview with pagination stamps              |

### Zone C: Master Index Columns

| Column      | Type        | Description                              |
| ----------- | ----------- | ---------------------------------------- |
| Tab         | Drag handle | Reorder documents by dragging            |
| Description | Editable    | Auto-filled from metadata, user-editable |
| Status      | Toggle      | "Agreed" or "Disputed"                   |
| Page Range  | Read-only   | Auto-calculated (e.g., "pp. 15-18")      |

### Zone B: Triage Status

- **Unprocessed**: Raw file just dropped in
- **Processed**: Metadata extracted (Date, Sender, etc.)
- **Bundled**: Already moved into the scaffold

### Key Interaction

Click a row in Zone C (Index) → Zone D (Preview) immediately jumps to that page. This enables rapid "spot-checking" to verify descriptions match documents.

### A4 Canvas Logic

| Input Type                    | Action                                         |
| ----------------------------- | ---------------------------------------------- |
| Standard A4 PDF               | Keep as-is, apply 35mm margin check            |
| Image (PNG/JPG) or screenshot | Center on blank A4 canvas, leave header/footer |
| Non-standard PDF              | Scale to fit A4 with margin preservation       |

## File Structure

```
CasePilot/
├── src/                    # React Frontend
│   ├── components/
│   │   ├── editor/         # TipTap editor + custom nodes
│   │   ├── sidebar/        # Case file browser
│   │   └── ui/             # Shared UI components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs          # Tauri commands
│   │   ├── pdf.rs          # PDF parsing
│   │   ├── ai.rs           # LLM integration
│   │   └── db.rs           # SQLite operations
│   └── migrations/         # SQLite schema (sqlx)
├── .claude/
│   ├── rules/              # Code conventions
│   └── skills/             # Implementation patterns
├── CLAUDE.md               # This file
└── ROADMAP.md              # Progress tracking
```

## Key Commands

```bash
npm run tauri dev       # Start dev server (HMR + Rust recompile)
npm run tauri build     # Create installers (.dmg / .msi)
npm run test            # Run frontend tests (watch mode)
npm run test:run        # Run frontend tests once
npm run test:coverage   # Run with coverage report
cargo test              # Run Rust backend tests
sqlx migrate run        # Apply database migrations
cargo check             # Type-check Rust code
```

## Core Features

1. **Bundle Compiler** (THE killer feature): Assemble documents → auto-generate TOC with correct page numbers → export eLitigation-ready PDF
2. **Auto-Pagination**: Inject "Page X of Y" stamps that match TOC entries exactly (ePD Para 78 compliance)
3. **Late Insert Handling**: Add document mid-bundle → auto-renumber all pages OR use sub-numbering (45A, 45B)
4. **Exhibit Auto-Renumbering**: Insert exhibit → all subsequent exhibits renumber automatically
5. **Compiler Errors**: Pre-export validation ("TOC says Page 15, PDF is Page 16")
6. **Smart Unbundler**: Drop 500-page PDF → auto-split into searchable chunks with TOC extraction
7. **Cmd+K Architect** (Phase 3): AI-powered text editing with case context

## Code Conventions

See detailed rules:

- @.claude/rules/frontend.md - React/TipTap patterns
- @.claude/rules/backend.md - Rust/Tauri patterns
- @.claude/rules/ai-rag.md - LLM integration
- @.claude/rules/singapore-legal.md - Court formatting
- @.claude/rules/testing.md - Testing requirements and patterns

## Quick Reference

### Tauri Command Pattern

```rust
#[tauri::command]
async fn my_command(input: String) -> Result<String, String> {
    Ok(input)
}
```

### React Invoke Pattern

```typescript
import { invoke } from "@tauri-apps/api/core";
const result = await invoke<string>("my_command", { input: "test" });
```

### Cross-Platform Paths

Always use `std::path::PathBuf` in Rust - handles `/` (Mac) vs `\` (Windows) automatically.

## Target Users

- **Primary**: Junior Associates (power users, late nights, exhibit management)
- **Secondary**: Paralegals (bulk bundle work, 200+ hours per case, high-volume operations)
- **Tertiary**: Partners (review mode, clean PDF preview)

## Singapore Context

- **Authoritative Source**: Supreme Court Practice Directions (ePD 2021)
  - Link: https://epd2021-supremecourt.judiciary.gov.sg
  - Part 10, Para 78-80: Affidavit pagination requirements
  - Part 11, Para 102: Trial bundle structure
- **The Sacred Rule**: Index Page # == PDF Footer Page # == PDF Metadata Page #
- Exhibit formats: Alphabetical (A, B, C), Tab (Tab 1, 2), Initials (JW-1, JW-2)
- Export: eLitigation-ready PDF bundles (only accepts PDF)

## Data Flows

### Bundle Compilation (THE core flow)

```
User: Click "Compile Bundle"
  → Frontend: Gather document order from sidebar
  → invoke("compile_bundle", { documents, options })
  → Backend: Calculate page offsets for each document
  → Backend: Generate TOC with correct page numbers
  → Backend: Inject pagination stamps (Page X of Y)
  → Backend: Merge all PDFs into single file
  → Backend: Add bookmarks per document
  → Backend: Validate TOC matches actual pages
  → Frontend: Show success + download link
  → Toast: "Bundle compiled: 347 pages, 0 errors"
```

### Late Insert

```
User: Drag new document to position 5
  → Frontend: Detect insert position
  → invoke("recalculate_pagination", { insertIndex: 5 })
  → Backend: Option A (Re-Pagination): Renumber all pages from position 5+
  → Backend: Option B (Sub-Numbering): Assign pages 45A, 45B, 45C
  → Backend: Update TOC entries
  → Frontend: Re-render TOC component
  → Toast: "Inserted at position 5. Renumbered 42 pages. [Undo]"
```

### Auto-Renumbering (Exhibits)

```
New exhibit inserted at position 2
  → ExhibitRegistry.insert(newExhibit, index=2)
  → Recalculate sequenceIndex for all exhibits
  → Regenerate labels ("A" → "B" → "C")
  → TipTap: Re-render all ExhibitNode instances
  → Toast: "Renumbered 12 citations automatically. [Undo]"
```

### Cmd+K Action (Phase 3)

```
User: Highlight + Cmd+K + "Add car photo"
  → Frontend: Capture context (selection, surrounding text)
  → invoke("process_edit_request", { prompt, context })
  → Backend: Query LanceDB for "car photo"
  → Backend: Find match → evidence/IMG_2024.jpg
  → llama.cpp: Generate legal prose
  → Frontend: Insert text + ExhibitNode
  → ExhibitRegistry: Auto-renumber all exhibits
```

## Agent Responsibilities

| Task                      | Primary Agent       |
| ------------------------- | ------------------- |
| PDF manipulation/bundling | rust-architect      |
| TipTap custom nodes       | editor-specialist   |
| Tauri commands            | rust-architect      |
| Metadata extraction       | ai-rag-engineer     |
| User flow design          | legal-ux-strategist |
| CI/CD setup               | release-commander   |
| Test infrastructure       | test-engineer       |

## Skills Reference

See `.claude/skills/` for implementation patterns:

### Core Bundle Skills (Phase 1-2)

- **Bundle Compiler** (`bundle-compiler`): THE killer feature - dynamic TOC, auto-pagination, late insert handling, ePD 2021 compliance.
- **Compiler Errors** (`compiler-errors`): Pre-export validation including pagination checks ("TOC says Page 15, PDF is Page 16").
- **Smart Unbundler** (`smart-unbundler`): Pipeline to split large PDF bundles and extract TOC structure.
- **Exhibit Registry** (`exhibit-registry`): Auto-renumbering logic for exhibits (A, B, C...) and stable ID tracking.

### Infrastructure Skills

- **Tauri Command** (`tauri-command`): Pattern for bridging React frontend to Rust backend via `invoke()`.
- **Product Roadmap** (`product-roadmap`): MVP phases, prioritization criteria, and feature scoping framework.
- **Testing Patterns** (`testing-patterns`): Vitest, cargo test, Playwright patterns for full-stack Tauri testing.

### Domain Knowledge

- **Singapore Legal Domain** (`singapore-legal-domain`): Comprehensive Singapore civil litigation reference - ROC 2021 Five Ideals, Evidence Act 1893, document types (AEIC, BOD, Exhibits), court-specific rules, eLitigation specs, and 27 official links.

### AI Skills (Phase 3+)

- **Cmd+K Architect** (`cmd-k-architect`): Floating AI command palette with context-aware actions and diff previews.
- **AI Streaming UI** (`ai-streaming-ui`): Token-by-token LLM streaming with "thinking" indicators and ChatGPT-like UX.
- **Source-to-Cite** (`source-to-cite`): "Go to Definition" for law - hover cards and split-view evidence viewers.
- **Cursor Optimization** (`cursor-optimization`): Performance patterns for AI latency (speculative edits, pre-fetching).
