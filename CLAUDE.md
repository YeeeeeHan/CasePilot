# CasePilot: AI-Native IDE for Litigation

## Project Overview

CasePilot is a desktop application that treats legal case building like coding in an IDE. Instead of fragmented workflows across Word, PDF editors, and email, lawyers work in a unified environment where the AI acts as a "Case Architect."

**Philosophy**: Replace context-switching fatigue with cognitive continuity.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| App Shell | Tauri v2 | Native desktop, small bundle (~10MB) |
| Backend | Rust | Memory-safe file handling, SQLite |
| Frontend | React + TypeScript + Tailwind | Component-driven UI |
| Editor | TipTap (ProseMirror) | Rich text with custom nodes |
| Intelligence | llama.cpp (bundled) | Local LLM inference |
| Database | SQLite + LanceDB | Structured + vector data |

## Architecture

```
CasePilot/
├── src/                    # React Frontend
│   ├── components/
│   │   └── editor/         # TipTap editor + custom nodes
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities
├── src-tauri/
│   ├── src/
│   │   └── lib.rs          # Tauri commands
│   └── migrations/         # SQLite schema (sqlx)
└── assets/                 # Static files
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
