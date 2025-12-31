# Frontend Rules (React + TipTap)

## Component Patterns

- Functional components only (no class components)
- Use hooks for state: `useState`, `useCallback`, `useMemo`
- Colocate styles with components using Tailwind classes
- Extract reusable logic into custom hooks in `src/hooks/`

## TipTap Editor

### Editor Format: Hybrid (Prose + Slash/Cmd+K)

**Decision**: Use traditional continuous prose editing (Word-like) with slash commands and Cmd+K for AI interactions.

**Not using**: Notion-style block editor with drag handles. Legal documents are continuous prose, and Singapore courts expect traditional formatting.

### Interaction Patterns

1. **Continuous typing**: Standard rich text editing, no block transformations
2. **Slash commands**: Type `/` to open floating menu for insertions (`/exhibit`, `/heading`, `/citation`)
3. **Cmd+K menu**: Highlight text + Cmd+K for AI actions (rewrite, expand, summarize)
4. **Inline nodes**: Exhibits render as inline nodes within prose flow

### Required Extensions

```typescript
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
// Custom extensions
import { ExhibitNode } from './nodes/ExhibitNode';
import { CommandMenu } from './extensions/CommandMenu';

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: 'Type / for commands or start writing...',
  }),
  ExhibitNode,
  CommandMenu, // Handles both / and Cmd+K
];
```

### Custom Nodes Location

All custom TipTap nodes live in `src/components/editor/nodes/`

### Node Structure

```typescript
// src/components/editor/nodes/ExhibitNode.tsx
import { Node, mergeAttributes } from '@tiptap/core';

export const ExhibitNode = Node.create({
  name: 'exhibit',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      exhibitId: { default: null }, // Reference by ID, not label
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});
```

### Key Principle

Store `exhibitId` (UUID), not the label text. The label ("Exhibit A") is computed at render time from the ExhibitRegistry.

### Slash Command Implementation Pattern

```typescript
// src/components/editor/extensions/CommandMenu.ts
import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';

export const CommandMenu = Extension.create({
  name: 'commandMenu',

  addKeyboardShortcuts() {
    return {
      '/': () => {
        // Open floating menu at cursor position
        this.editor.commands.openCommandMenu();
        return true;
      },
      'Mod-k': () => {
        // Open Cmd+K menu with selected text context
        const selection = this.editor.state.selection;
        this.editor.commands.openCmdKMenu({ selection });
        return true;
      },
    };
  },
});
```

### Command Menu State

Keep menu state local to the editor component. Don't pollute global state.

```typescript
// src/components/editor/Editor.tsx
const [menuState, setMenuState] = useState<{
  isOpen: boolean;
  type: 'slash' | 'cmdk' | null;
  position: { x: number; y: number };
}>({
  isOpen: false,
  type: null,
  position: { x: 0, y: 0 },
});
```

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
