# CasePilot Development Roadmap

**Last Updated**: 2026-01-01

## Current Phase: Phase 2A - Bundle Composer UI Pivot

**Completed**: Phase 0 (Foundation) ✓, Phase 0.5 (Layout) ✓, Phase 1 (Editor + Basic Bundle) ✓, Phase 2 (Smart Bundle) ✓
**Next Milestone**: Wire up App.tsx state management and complete UI integration

---

## Strategic Pivot (Dec 2024)

> **"It's not about Multimedia; it's about Pagination."** — Jun Hao, Singapore Litigator

User research revealed the core pain point is **Bundle Compliance**, not AI writing:

- Ensuring PDF page numbers match Table of Contents exactly
- The "shag" factor: 200+ hours of manual pagination work per case
- Tool to replace: **Adobe Acrobat** (not Word)

**Result**: Full pivot from "AI-Native IDE" to "Bundle Compliance Automator"

- AI features (Cmd+K, RAG) moved to Phase 3+
- Bundle compilation features promoted to Phase 1-2

---

## Phase 0: Foundation ✓

**Goal**: Define architecture, skills, and development patterns

### Completed

- [x] Project structure initialized
- [x] CLAUDE.md documentation
- [x] Tech stack decisions (Tauri, React, Rust, TipTap)
- [x] 11 skills defined:
  - [x] tauri-command (invoke pattern)
  - [x] exhibit-registry (auto-renumbering)
  - [x] pdf-unbundling (RAG pipeline)
  - [x] ide-feature-patterns (IDE→Legal mapping)
  - [x] cursor-optimization (AI performance)
  - [x] cmd-k-architect (floating menu)
  - [x] source-to-cite (hover/split-view)
  - [x] compiler-errors (validation)
  - [x] smart-unbundler (PDF splitting)
  - [x] product-roadmap (prioritization)
  - [x] **bundle-compiler** (THE killer feature)
- [x] Agent personas defined (5 specialists)

---

## Phase 0.5: Core Layout Architecture ✓

**Goal**: Implement the Split-Screen layout foundation (the "killer UX")

### Status: Complete ✓

**Priority**: The mandatory split-view that solves "Does the Index match the Page Number?" anxiety.

### Architecture Pivot (Jan 2025)

**Original design**: 4-zone layout with dedicated Staging Area (Zone B)
**New design**: 3-column "Inspector" model

```
┌────────────────┬──────────────────────┬────────────────┐
│ SIDEBAR        │ MASTER INDEX         │ INSPECTOR      │
│ (200px)        │ (flex-1)             │ (320px)        │
│                │                      │                │
│ 📥 Inbox (47)  │ Tab │ Desc   │ Pages │ [Preview]      │
│ ├─ scan01.pdf  │ ─── │ ────── │ ───── │ [Metadata]     │
│ ├─ scan02.pdf  │  1  │ Email  │ 1-3   │ [Actions]      │
│ 📁 Evidence    │  2  │ Photo  │ 4     │                │
│ 📁 Drafts      │  3  │ Cont.  │ 5-12  │                │
└────────────────┴──────────────────────┴────────────────┘
```

**Rationale**: Dedicated Zone B (Staging Area) wasted vertical space. The Inbox badge + Inspector model saves screen real estate while preserving the triage workflow.

### Tasks

- [x] **P0**: 3-column resizable layout shell
  - [x] Sidebar (Inbox + file tree) + Master Index (center) + Inspector (right)
  - [x] Resizable dividers between panes
  - [x] Responsive layout (minimum/maximum widths)
- [x] **P0**: Zone A - Case switcher
  - [x] Minimal sidebar (VS Code-style icons)
  - [x] Case list with active case indicator
- [x] **P0**: Inbox (replaces Zone B Staging Area)
  - [x] Collapsible inbox section with badge count
  - [x] Drop zone for raw files (Tauri drag-drop events)
  - [x] Triage status indicators (Unprocessed/Processed/Bundled)
  - [x] Visual distinction between states
- [x] **P0**: Zone C - Master Index table
  - [x] High-density table component
  - [x] Columns: Tab (drag handle), Description (editable), Status (toggle), Page Range (read-only)
  - [x] Row selection state
- [x] **P0**: Inspector Panel (replaces Zone D Preview)
  - [x] Context-aware metadata editing
  - [x] PDF preview placeholder
  - [x] "Add to Bundle" / "Remove from Bundle" actions
  - [x] Unified selection state (drives Inspector content)
- [ ] **P1**: Click-to-navigate interaction
  - [x] Click row in Master Index → Inspector shows file
  - [ ] Click row → PDF jumps to page (requires PDF viewer)
  - [x] Visual feedback on selected row
- [ ] **P1**: A4 Canvas logic
  - [ ] Detect document dimensions
  - [ ] Center non-A4 content on A4 canvas
  - [ ] 35mm margin warning for edge-to-edge content

**Success Metric**: 3-column layout with functional Inspector and Inbox

---

## Phase 1: Editor + Basic Bundle ✓

**Target**: TBD
**Goal**: Basic editing AND bundle assembly (the core value)

### Status: Complete ✓

**Priority**: TipTap setup + PDF import + TOC generation

### Tasks

- [x] **P0**: TipTap editor setup
  - [x] Initialize TipTap in React
  - [x] Basic extensions (bold, italic, headings)
  - [x] Custom paragraph styling
- [x] **P0**: SQLite schema design
  - [x] Cases table
  - [x] Documents table
  - [x] Exhibits table (with status: unprocessed/processed/bundled)
  - [x] **Bundle table** (compilation metadata)
  - [x] Migrations setup (sqlx)
- [x] **P0**: PDF import and display
  - [x] Import PDF files into case (drag-drop to Inbox)
  - [x] PDF metadata extraction (page count)
  - [x] Page count extraction
- [x] **P0**: Dynamic Table of Contents
  - [x] TOC component (Master Index)
  - [x] Auto-calculate page numbers based on document order
  - [x] **TOC page # must match PDF position**
- [x] **P1**: File save/load (Tauri commands)
  - [x] `list_cases`, `create_case`, `delete_case` commands
  - [x] `list_exhibits`, `create_exhibit`, `update_exhibit` commands
  - [x] `promote_to_bundled`, `reorder_exhibits` commands
- [x] **P1**: Case sidebar
  - [x] Project switcher (case icons)
  - [x] Drag-and-drop reordering in Master Index
  - [x] Inbox with file management

**Success Metric**: Assemble a 50-document bundle with correct TOC page numbers ✓

---

## Phase 2: Smart Bundle Compilation

**Target**: TBD
**Goal**: The "Perfect Compiler" - automated pagination and compliance

### Status: Complete ✓

### Tasks

- [x] **P0**: Auto-pagination (page stamps)
  - [x] Inject "Page X of Y" into PDF headers/footers
  - [x] Configurable position (top-right per ePD 2021)
  - [x] Stamps must not break existing layout
- [x] **P0**: Bundle PDF export
  - [x] Merge all documents into single PDF
  - [x] Apply pagination stamps
  - [x] Generate bookmarks per document (placeholder)
  - [x] Include TOC as first pages
- [x] **P0**: "Late Insert" handling
  - [x] Re-Pagination mode: Full renumber all pages (via frontend reorder)
  - [x] Sub-Numbering mode: Insert as Page 45A, 45B
  - [x] Auto-update TOC after insert
- [x] **P1**: Pagination validation (Compiler Errors)
  - [x] TOC page # matches PDF position
  - [x] No pagination gaps
  - [x] ePD Para 78 compliance check
- [x] **P1**: Auto exhibit renumbering
  - [x] Detect exhibit insertion
  - [x] Recalculate sequence
  - [x] Update all references
- [x] **P1**: PDF text extraction (for metadata)
  - [x] lopdf text extraction (Rust)
  - [x] Extract Date, Sender, Recipient, Subject from emails
  - [x] Auto-fill TOC descriptions

**Success Metric**: Compile 500-page bundle with correct pagination in < 60 seconds

---

## Phase 2A: Bundle Composer UI Pivot

**Target**: TBD
**Goal**: Implement "Zone B is the Truth; Zone C is the Lens" philosophy

### Status: In Progress

### Philosophy

> **"Zone B is the Truth; Zone C is the Lens."**

Key insights from lawyer feedback:

1. **Description is King** - Filename doesn't matter, only TOC description matters
2. **Disputed = TOC Label** - Just append "(Disputed)" in the TOC, no watermarking
3. **No Staging Zone** - Edit descriptions directly in Inspector
4. **Auto-Sort Disputed** - Usually put disputed docs at the end

### New Architecture

```
┌──────┬──────────────┬─────────────────────────────────┬──────────────────────┐
│ 48px │ 200px        │ flex-1                          │ 360px                │
├──────┼──────────────┼─────────────────────────────────┼──────────────────────┤
│ Case │ REPOSITORY   │ MASTER INDEX ("The Truth")      │ INSPECTOR ("Lens")   │
│ Icons│ (Source)     │                                 │                      │
│      │              │ No│ Date   │ Description │Page  │ ┌──────────────────┐ │
│      │ 📁 Files     │ ──│────────│─────────────│───── │ │[File] [Preview]  │ │
│      │ ├─ doc1.pdf  │ A.│        │ TAB A       │      │ ├──────────────────┤ │
│      │ └─ doc2.pdf  │ 1.│ 14 Feb │ Statement...│ 6-98 │ │ [TOC Preview]    │ │
│      │ (✓=linked)   │ 2.│ 21 Feb │ Defence...  │99-265│ │                  │ │
│      │              │ ────────────────────────────────│ │ Disputed: ☐      │ │
│      │              │ [+ Add Doc] [+ Section Break]   │ └──────────────────┘ │
└──────┴──────────────┴─────────────────────────────────┴──────────────────────┘
```

### Tasks

- [x] **P0**: Master Index column restructure
  - [x] Change columns to: No | Date | Description | Page
  - [x] Remove "Status" column (Agreed/Disputed toggle)
  - [x] Implement two-column No + Date layout
  - [x] Update page range format to "6 - 98" style
- [x] **P0**: Section break system
  - [x] Add `section-break` row type
  - [x] Alphabetical labels (A., B., C.) auto-generated
  - [x] User-defined description for TOC
  - [x] Bold row styling for section breaks
- [x] **P0**: Floating toolbar
  - [x] [+ Add Document] button
  - [x] [+ Insert Section Break] button
  - [x] Position at bottom of Master Index
- [x] **P0**: Repository simplification
  - [x] Rename Inbox → Repository
  - [x] Remove triage status (unprocessed/processed/bundled)
  - [x] Add simple "linked" indicator (✓)
- [x] **P0**: Inspector dual-tab
  - [x] Add shadcn Tabs component
  - [x] Tab 1: File Inspector (metadata + PDF preview)
  - [x] Tab 2: Page Preview (live TOC preview)
  - [x] Disputed checkbox in File tab
- [ ] **P1**: Wire up App.tsx state management
  - [ ] Update state for new IndexEntry format
  - [ ] Connect Repository → Master Index flow
  - [ ] Two-way sync between Inspector and Master Index
- [ ] **P1**: Backend commands
  - [ ] create_section_break command
  - [ ] generate_toc_html command
  - [ ] move_disputed_to_end command
  - [ ] Database schema migration

**Success Metric**: Bundle assembly matches real court TOC format exactly

---

## Phase 3: Intelligence Layer (AI Features)

**Target**: TBD
**Goal**: AI that understands the case (deprioritized per user research)

### Status: Planned

### Tasks

- [ ] **P0**: Cmd+K floating menu
  - [ ] Keyboard shortcut listener
  - [ ] Floating UI component
  - [ ] Context assembly logic
- [ ] **P0**: Local LLM integration
  - [ ] llama.cpp sidecar setup
  - [ ] Model download on first launch
  - [ ] Inference command (Rust)
  - [ ] Streaming UI with "thinking" indicators
- [ ] **P1**: Vector search (LanceDB)
  - [ ] Embedding generation
  - [ ] Vector storage
  - [ ] Semantic search command
- [ ] **P1**: Source-to-Cite hover cards
- [ ] **P1**: Diff preview for AI changes

**Success Metric**: 10+ Cmd+K invocations per document

---

## Phase 4: Onboarding Magic

**Target**: TBD
**Goal**: 5-minute time-to-value

### Status: Planned

### Tasks

- [ ] **P0**: Smart Unbundler
  - [ ] Drop 500-page PDF → split into individual documents
  - [ ] Extract TOC from existing bundles
  - [ ] Preserve page numbers from source
- [ ] **P1**: Timeline view
- [ ] **P1**: Word import (.docx)
- [ ] **P2**: Auto-link existing refs

**Success Metric**: Import case and see value in < 5 minutes

---

## Phase 5: Trust & Polish

**Target**: TBD
**Goal**: Lawyers trust output enough to file

### Status: Planned

### Tasks

- [ ] **P0**: Document version history
  - [ ] Auto-save snapshots every 5 minutes
  - [ ] "Versions" sidebar with timestamps
  - [ ] One-click restore to previous version
- [ ] **P1**: Split-view evidence viewer
- [ ] **P1**: Certificate of Exhibits (auto-generated)
- [ ] **P1**: Margin/font validation (Practice Directions)
- [ ] **P2**: Bundle cover page

**Success Metric**: 100% eLitigation acceptance rate, zero filing rejections

---

## How to Use This Roadmap

1. **Weekly Review**: Update checkboxes as tasks complete
2. **Phase Transitions**: Move to next phase when Success Metric is met
3. **Priority Adjustments**: Refer to `product-roadmap` skill for re-prioritization
4. **Blockers**: Document in "Notes" section below

---

## Notes & Decisions

| Date       | Decision                                 | Rationale                                                                                   |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 2024-12-31 | Use TipTap over Slate                    | Better docs, ProseMirror foundation                                                         |
| 2024-12-31 | Start with Windows target                | 90% of SG law firms use Windows                                                             |
| 2024-12-31 | Local-first architecture                 | Lawyer privacy concerns, court compliance                                                   |
| 2024-12-31 | Use llama.cpp for local AI               | Privacy-first, streaming via Tauri events, no API costs                                     |
| 2024-12-31 | Hybrid editor (prose + slash/K)          | Matches lawyer expectations (Word-like), supports AI features                               |
| 2024-12-31 | **Full pivot to Bundle Compilation**     | User research: "It's about pagination, not multimedia." Replace Acrobat, not Word.          |
| 2024-12-31 | AI features deprioritized to Phase 3+    | Core value is bundle compliance; AI is enhancement, not MVP                                 |
| 2024-12-31 | Paralegal as secondary user persona      | They do 200+ hours of bundle work; design UX for bulk operations                            |
| 2024-12-31 | ePD 2021 as authoritative compliance src | Supreme Court Practice Directions Part 10 (Para 78-80), Part 11 (Para 102) are the law      |
| 2025-01-01 | **3-column Inspector model**             | Replaced 4-zone layout. Inbox + Inspector saves vertical space, metadata editing in context |
| 2026-01-01 | **Bundle Compiler implemented**          | Phase 2 core: TOC generation, pagination stamps, PDF merging via lopdf + printpdf crates    |
| 2026-01-01 | **Phase 2 Complete**                     | Sub-numbering (45A, 45B), pagination validation, PDF text extraction for auto-descriptions  |

---

## Quick Reference

- **Tech Stack**: Tauri v2, Rust, React, TypeScript, TipTap, SQLite, LanceDB
- **Agent Personas**: editor-specialist, rust-architect, ai-rag-engineer, legal-ux-strategist, release-commander
- **Skills**: See `.claude/skills/` directory
- **Docs**: `CLAUDE.md`, `context.md`, `brainstorm.md`
