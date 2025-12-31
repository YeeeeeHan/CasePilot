# CasePilot: AI-Native IDE for Litigation

## Project Overview

CasePilot is a desktop application that treats legal case building like coding in an IDE. Instead of fragmented workflows across Word, PDF editors, and email, lawyers work in a unified environment where the AI acts as a "Case Architect."

**Philosophy**: Replace context-switching fatigue with cognitive continuity.

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
sqlx migrate run        # Apply database migrations
cargo check             # Type-check Rust code
```

## Core Features

1. **Cmd+K Architect**: Highlight text, invoke AI to insert/modify with context
2. **Exhibit Auto-Renumbering**: Insert exhibit → all subsequent exhibits renumber automatically
3. **Source-to-Cite**: Hover citations to preview evidence, Cmd+Click for split-view
4. **Smart Unbundler**: Drop 500-page PDF → auto-split into searchable chunks
5. **Compiler Errors**: Pre-export validation ("Exhibit D referenced but not attached")

## Code Conventions

See detailed rules:

- @.claude/rules/frontend.md - React/TipTap patterns
- @.claude/rules/backend.md - Rust/Tauri patterns
- @.claude/rules/ai-rag.md - LLM integration
- @.claude/rules/singapore-legal.md - Court formatting

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
- **Secondary**: Partners (review mode, clean PDF preview)

## Singapore Context

- Target: Supreme Court Practice Directions compliance
- Exhibit formats: Alphabetical (A, B, C), Tab (Tab 1, 2), Initials (JW-1, JW-2)
- Export: eLitigation-ready PDF bundles with proper pagination

## Data Flows

### Cmd+K Action

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

### Auto-Renumbering

```
New exhibit inserted at position 2
  → ExhibitRegistry.insert(newExhibit, index=2)
  → Recalculate sequenceIndex for all exhibits
  → Regenerate labels ("A" → "B" → "C")
  → TipTap: Re-render all ExhibitNode instances
  → Toast: "Renumbered 12 citations automatically. [Undo]"
```

## Agent Responsibilities

| Task                | Primary Agent       |
| ------------------- | ------------------- |
| TipTap custom nodes | editor-specialist   |
| Tauri commands      | rust-architect      |
| RAG pipeline        | ai-rag-engineer     |
| User flow design    | legal-ux-strategist |
| CI/CD setup         | release-commander   |

## Skills Reference

See `.claude/skills/` for implementation patterns:

- **Tauri Command** (`tauri-command`): Pattern for bridging React frontend to Rust backend via `invoke()`.
- **Exhibit Registry** (`exhibit-registry`): Auto-renumbering logic for exhibits (A, B, C...) and stable ID tracking.
- **Cmd+K Architect** (`cmd-k-architect`): Floating AI command palette with context-aware actions and diff previews.
- **AI Streaming UI** (`ai-streaming-ui`): Token-by-token LLM streaming with "thinking" indicators and ChatGPT-like UX.
- **Source-to-Cite** (`source-to-cite`): "Go to Definition" for law - hover cards and split-view evidence viewers.
- **Compiler Errors** (`compiler-errors`): Pre-export validation engine (linting) for missing exhibits and broken refs.
- **Smart Unbundler** (`smart-unbundler`): Pipeline to split large PDF bundles into individually searchable assets.
- **Cursor Optimization** (`cursor-optimization`): Performance patterns for AI latency (speculative edits, pre-fetching).
- **Product Roadmap** (`product-roadmap`): MVP phases, prioritization criteria, and feature scoping framework.
