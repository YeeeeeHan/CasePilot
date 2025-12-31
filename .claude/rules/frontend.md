# Frontend Rules (React + TipTap)

## Component Patterns

- Functional components only (no class components)
- Use hooks for state: `useState`, `useCallback`, `useMemo`
- Colocate styles with components using Tailwind classes
- Extract reusable logic into custom hooks in `src/hooks/`

## TipTap Editor

### Custom Nodes Location

All custom TipTap nodes live in `src/components/editor/nodes/`

### Node Structure

```typescript
// src/components/editor/nodes/ExhibitNode.tsx
import { Node, mergeAttributes } from "@tiptap/core";

export const ExhibitNode = Node.create({
  name: "exhibit",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      exhibitId: { default: null }, // Reference by ID, not label
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});
```

### Key Principle

Store `exhibitId` (UUID), not the label text. The label ("Exhibit A") is computed at render time from the ExhibitRegistry.

## State Management

- Local component state for UI-only concerns
- ExhibitRegistry (shared state) for document structure
- Tauri `invoke()` for persistence operations

## Performance Targets

- **60fps typing** - no dropped frames during text input
- Virtualize documents over 50 pages
- Debounce expensive operations (search, AI calls)
- Avoid re-renders: use `React.memo`, stable callbacks

## File Organization

```
src/
├── components/
│   ├── editor/
│   │   ├── Editor.tsx           # Main editor wrapper
│   │   ├── nodes/               # Custom TipTap nodes
│   │   └── extensions/          # TipTap extensions
│   ├── sidebar/                 # Case file browser
│   └── ui/                      # Shared UI components
├── hooks/
│   ├── useExhibitRegistry.ts    # Exhibit state management
│   └── useInvoke.ts             # Tauri invoke wrapper
└── lib/
    └── utils.ts                 # Pure utility functions
```

## TypeScript Strictness

- Enable `strict: true` in tsconfig
- No `any` types - use `unknown` if truly unknown
- Define interfaces for all Tauri command responses
