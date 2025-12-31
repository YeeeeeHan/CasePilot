# CasePilot Development Roadmap

**Last Updated**: 2024-12-31

## Current Phase: Phase 0 - Foundation

**Status**: Planning Complete ✓
**Next Milestone**: Phase 1 kickoff

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

## Phase 0.5: Core Layout Architecture

**Target**: TBD
**Goal**: Implement the Split-Screen layout foundation (the "killer UX")

### Status: Not Started

**Priority**: The mandatory split-view that solves "Does the Index match the Page Number?" anxiety.

### Tasks

- [ ] **P0**: Split-view layout shell
  - [ ] Left pane (Scaffold) + Right pane (Bundle Preview)
  - [ ] Resizable divider between panes
  - [ ] Responsive layout (minimum widths)
- [ ] **P0**: Zone A - Case switcher
  - [ ] Minimal sidebar (VS Code-style icons)
  - [ ] Case list with active case indicator
- [ ] **P0**: Zone B - Staging Area
  - [ ] Drop zone for raw files
  - [ ] Triage status indicators (Unprocessed/Processed/Bundled)
  - [ ] Visual distinction between states
- [ ] **P0**: Zone C - Master Index table
  - [ ] High-density table component
  - [ ] Columns: Tab (drag handle), Description (editable), Status (toggle), Page Range (read-only)
  - [ ] Row selection state
- [ ] **P0**: Zone D - PDF Preview pane
  - [ ] Placeholder component for PDF viewer
  - [ ] Pagination stamp display area (top-right)
- [ ] **P1**: Click-to-navigate interaction
  - [ ] Click row in Zone C → Zone D jumps to page
  - [ ] Visual feedback on selected row
- [ ] **P1**: A4 Canvas logic
  - [ ] Detect document dimensions
  - [ ] Center non-A4 content on A4 canvas
  - [ ] 35mm margin warning for edge-to-edge content

**Success Metric**: Visual layout matches the 4-zone architecture diagram in CLAUDE.md

---

## Phase 1: Editor + Basic Bundle

**Target**: TBD
**Goal**: Basic editing AND bundle assembly (the core value)

### Status: Not Started

**Priority**: TipTap setup + PDF import + TOC generation

### Tasks

- [ ] **P0**: TipTap editor setup
  - [ ] Initialize TipTap in React
  - [ ] Basic extensions (bold, italic, headings)
  - [ ] Custom paragraph styling
- [ ] **P0**: SQLite schema design
  - [ ] Cases table
  - [ ] Documents table
  - [ ] Exhibits table
  - [ ] **Bundle table** (compilation metadata)
  - [ ] Migrations setup (sqlx)
- [ ] **P0**: PDF import and display
  - [ ] Import PDF files into case
  - [ ] PDF thumbnail generation
  - [ ] Page count extraction
- [ ] **P0**: Dynamic Table of Contents
  - [ ] TOC component that lists documents
  - [ ] Auto-calculate page numbers based on document order
  - [ ] **TOC page # must match PDF position**
- [ ] **P1**: File save/load (Tauri commands)
  - [ ] `save_document` command
  - [ ] `load_document` command
  - [ ] `list_cases` command
- [ ] **P1**: Case sidebar
  - [ ] File tree component
  - [ ] Drag-and-drop reordering
  - [ ] New file/folder actions

**Success Metric**: Assemble a 50-document bundle with correct TOC page numbers

---

## Phase 2: Smart Bundle Compilation

**Target**: TBD
**Goal**: The "Perfect Compiler" - automated pagination and compliance

### Status: Planned

### Tasks

- [ ] **P0**: Auto-pagination (page stamps)
  - [ ] Inject "Page X of Y" into PDF headers/footers
  - [ ] Configurable position (top-right per ePD 2021)
  - [ ] Stamps must not break existing layout
- [ ] **P0**: Bundle PDF export
  - [ ] Merge all documents into single PDF
  - [ ] Apply pagination stamps
  - [ ] Generate bookmarks per document
  - [ ] Include TOC as first pages
- [ ] **P0**: "Late Insert" handling
  - [ ] Re-Pagination mode: Full renumber all pages
  - [ ] Sub-Numbering mode: Insert as Page 45A, 45B
  - [ ] Auto-update TOC after insert
- [ ] **P1**: Pagination validation (Compiler Errors)
  - [ ] TOC page # matches PDF position
  - [ ] No pagination gaps
  - [ ] ePD Para 78 compliance check
- [ ] **P1**: Auto exhibit renumbering
  - [ ] Detect exhibit insertion
  - [ ] Recalculate sequence
  - [ ] Update all references
- [ ] **P1**: PDF text extraction (for metadata)
  - [ ] pdfium integration (Rust)
  - [ ] Extract Date, Sender, Recipient, Subject from emails
  - [ ] Auto-fill TOC descriptions

**Success Metric**: Compile 500-page bundle with correct pagination in < 60 seconds

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

| Date       | Decision                                 | Rationale                                                                              |
| ---------- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| 2024-12-31 | Use TipTap over Slate                    | Better docs, ProseMirror foundation                                                    |
| 2024-12-31 | Start with Windows target                | 90% of SG law firms use Windows                                                        |
| 2024-12-31 | Local-first architecture                 | Lawyer privacy concerns, court compliance                                              |
| 2024-12-31 | Use llama.cpp for local AI               | Privacy-first, streaming via Tauri events, no API costs                                |
| 2024-12-31 | Hybrid editor (prose + slash/K)          | Matches lawyer expectations (Word-like), supports AI features                          |
| 2024-12-31 | **Full pivot to Bundle Compilation**     | User research: "It's about pagination, not multimedia." Replace Acrobat, not Word.     |
| 2024-12-31 | AI features deprioritized to Phase 3+    | Core value is bundle compliance; AI is enhancement, not MVP                            |
| 2024-12-31 | Paralegal as secondary user persona      | They do 200+ hours of bundle work; design UX for bulk operations                       |
| 2024-12-31 | ePD 2021 as authoritative compliance src | Supreme Court Practice Directions Part 10 (Para 78-80), Part 11 (Para 102) are the law |

---

## Quick Reference

- **Tech Stack**: Tauri v2, Rust, React, TypeScript, TipTap, SQLite, LanceDB
- **Agent Personas**: editor-specialist, rust-architect, ai-rag-engineer, legal-ux-strategist, release-commander
- **Skills**: See `.claude/skills/` directory
- **Docs**: `CLAUDE.md`, `context.md`, `brainstorm.md`
