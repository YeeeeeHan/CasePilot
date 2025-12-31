# CasePilot Development Roadmap

**Last Updated**: 2024-12-31

## Current Phase: Phase 0 - Foundation
**Status**: Planning Complete ✓
**Next Milestone**: Phase 1 kickoff

---

## Phase 0: Foundation ✓
**Goal**: Define architecture, skills, and development patterns

### Completed
- [x] Project structure initialized
- [x] CLAUDE.md documentation
- [x] Tech stack decisions (Tauri, React, Rust, TipTap)
- [x] 10 skills defined:
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
- [x] Agent personas defined (5 specialists)

---

## Phase 1: Editor Foundation
**Target**: TBD
**Goal**: Replace Word for basic legal drafting

### Status: Not Started
**Priority**: Start TipTap editor setup

### Tasks
- [ ] **P0**: TipTap editor setup
  - [ ] Initialize TipTap in React
  - [ ] Basic extensions (bold, italic, headings)
  - [ ] Custom paragraph styling
- [ ] **P0**: SQLite schema design
  - [ ] Cases table
  - [ ] Documents table
  - [ ] Exhibits table
  - [ ] Migrations setup (sqlx)
- [ ] **P0**: File save/load (Tauri commands)
  - [ ] `save_document` command
  - [ ] `load_document` command
  - [ ] `list_cases` command
- [ ] **P1**: Case sidebar
  - [ ] File tree component
  - [ ] Case navigation
  - [ ] New file/folder actions
- [ ] **P1**: Manual exhibit linking
  - [ ] Insert exhibit reference UI
  - [ ] ExhibitRegistry basic implementation

**Success Metric**: Draft a 10-page affidavit without switching to Word

---

## Phase 2: Intelligence Layer
**Target**: TBD
**Goal**: AI that understands the case

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
- [ ] **P1**: PDF text extraction
  - [ ] pdfium integration (Rust)
  - [ ] Extract text command
- [ ] **P1**: Vector search (LanceDB)
  - [ ] Embedding generation
  - [ ] Vector storage
  - [ ] Semantic search command
- [ ] **P1**: Auto exhibit renumbering
  - [ ] Detect exhibit insertion
  - [ ] Recalculate sequence
  - [ ] Update all references

**Success Metric**: 10+ Cmd+K invocations per document

---

## Phase 3: Trust & Polish
**Target**: TBD
**Goal**: Lawyers trust output enough to file

### Status: Planned

### Tasks
- [ ] **P0**: Source-to-Cite hover cards
- [ ] **P0**: Compiler errors (validation)
- [ ] **P1**: Split-view evidence viewer
- [ ] **P1**: Diff preview for AI changes
- [ ] **P1**: Undo/redo for AI actions

**Success Metric**: Zero filing rejections due to exhibit errors

---

## Phase 4: Onboarding Magic
**Target**: TBD
**Goal**: 5-minute time-to-value

### Status: Planned

### Tasks
- [ ] **P0**: Smart Unbundler
- [ ] **P1**: Timeline view
- [ ] **P1**: Word import (.docx)
- [ ] **P2**: Auto-link existing refs

**Success Metric**: Import case and see value in < 5 minutes

---

## Phase 5: Singapore Compliance
**Target**: TBD
**Goal**: eLitigation-ready exports

### Status: Planned

### Tasks
- [ ] **P0**: PDF export with bookmarks
- [ ] **P0**: Auto-pagination
- [ ] **P1**: Certificate of Exhibits
- [ ] **P1**: Margin/font validation
- [ ] **P2**: Bundle cover page

**Success Metric**: 100% eLitigation acceptance rate

---

## How to Use This Roadmap

1. **Weekly Review**: Update checkboxes as tasks complete
2. **Phase Transitions**: Move to next phase when Success Metric is met
3. **Priority Adjustments**: Refer to `product-roadmap` skill for re-prioritization
4. **Blockers**: Document in "Notes" section below

---

## Notes & Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-31 | Use TipTap over Slate | Better docs, ProseMirror foundation |
| 2024-12-31 | Start with Windows target | 90% of SG law firms use Windows |
| 2024-12-31 | Local-first architecture | Lawyer privacy concerns, court compliance |

---

## Quick Reference

- **Tech Stack**: Tauri v2, Rust, React, TypeScript, TipTap, SQLite, LanceDB
- **Agent Personas**: editor-specialist, rust-architect, ai-rag-engineer, legal-ux-strategist, release-commander
- **Skills**: See `.claude/skills/` directory
- **Docs**: `CLAUDE.md`, `context.md`, `brainstorm.md`
