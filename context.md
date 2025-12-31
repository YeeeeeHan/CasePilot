# CasePilot Architecture Reference

## System Overview

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
│  │                                                          │   │
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

## Data Flow: Cmd+K Action

```
1. User: Highlight text + Cmd+K + "Add car photo"
                    │
                    ▼
2. Frontend: Capture context (selection, surrounding text)
                    │
                    ▼
3. invoke("process_edit_request", { prompt, context })
                    │
                    ▼
4. Backend: Query LanceDB for "car photo"
                    │
                    ▼
5. Backend: Find match → evidence/IMG_2024.jpg
                    │
                    ▼
6. Backend: Construct prompt for LLM
                    │
                    ▼
7. llama.cpp: Generate legal prose
                    │
                    ▼
8. Backend: Return { text, exhibitId, imagePath }
                    │
                    ▼
9. Frontend: Insert text + ExhibitNode into editor
                    │
                    ▼
10. ExhibitRegistry: Auto-renumber all exhibits
```

## Data Flow: Auto-Renumbering

```
1. New exhibit inserted at position 2
                    │
                    ▼
2. ExhibitRegistry.insert(newExhibit, index=2)
                    │
                    ▼
3. Loop: Recalculate sequenceIndex for all exhibits
                    │
                    ▼
4. Loop: Regenerate currentLabel ("A" → "B" → "C")
                    │
                    ▼
5. TipTap: Find all ExhibitNode instances
                    │
                    ▼
6. TipTap: Re-render with updated labels
                    │
                    ▼
7. Toast: "Renumbered 12 citations automatically. [Undo]"
```

## Key State Structures

### ExhibitRegistry (Frontend)
```typescript
{
  exhibits: [
    { id: "uuid-1", filePath: "...", sequenceIndex: 0, currentLabel: "Exhibit A" },
    { id: "uuid-2", filePath: "...", sequenceIndex: 1, currentLabel: "Exhibit B" },
  ],
  namingConvention: "alphabetical"
}
```

### AppState (Backend)
```rust
struct AppState {
    db: SqlitePool,
    vector_db: LanceDBConnection,
    config: AppConfig,
}
```

## File Structure (Target)

```
CasePilot/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── editor/
│   │   │   ├── Editor.tsx
│   │   │   ├── nodes/
│   │   │   │   ├── ExhibitNode.tsx
│   │   │   │   └── ImageNode.tsx
│   │   │   └── extensions/
│   │   │       └── CmdK.tsx
│   │   ├── sidebar/
│   │   │   ├── CaseFiles.tsx
│   │   │   └── Timeline.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── useExhibitRegistry.ts
│   │   └── useInvoke.ts
│   └── lib/
│       └── utils.ts
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs          # Tauri commands
│   │   ├── pdf.rs          # PDF parsing
│   │   ├── ai.rs           # LLM integration
│   │   └── db.rs           # SQLite operations
│   ├── migrations/
│   │   ├── 001_create_cases.sql
│   │   └── 002_create_exhibits.sql
│   ├── Cargo.toml
│   └── tauri.conf.json
├── CLAUDE.md
├── context.md
└── .claude/
    ├── settings.json
    ├── rules/
    ├── agents/
    └── skills/
```

## Development Workflow

```bash
# Start development (Hot reload for React, recompile for Rust)
npm run tauri dev

# Build for distribution
npm run tauri build

# Run database migrations
cd src-tauri && sqlx migrate run

# Type-check Rust
cargo check --manifest-path src-tauri/Cargo.toml
```

## Agent Responsibilities

| Task | Primary Agent | Supporting |
|------|--------------|------------|
| TipTap custom nodes | editor-specialist | - |
| Tauri commands | rust-architect | - |
| RAG pipeline | ai-rag-engineer | rust-architect |
| User flow design | legal-ux-strategist | - |
| CI/CD setup | release-commander | - |
| Database schema | rust-architect | ai-rag-engineer |
| Performance issues | editor-specialist | rust-architect |
