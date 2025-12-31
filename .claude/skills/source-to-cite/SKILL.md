---
name: source-to-cite
description: Pattern for implementing the hover-preview and split-view citation system. Use when building evidence linking UI, "Go to Definition" for legal citations, or exhibit preview cards.
allowed-tools: Read, Edit, Grep, Glob
---

# Source-to-Cite Pattern

## Overview

Source-to-Cite is CasePilot's "Go to Definition" for legal documents. Citations are **active objects**, not dead text. This is the key UX differentiator from Word.

## Visual Language

### Citation Markers
```css
/* Inline citation styling */
.citation-mark {
  text-decoration: underline;
  text-decoration-color: #6366f1;  /* Indigo - distinct from spell-check */
  text-decoration-style: solid;
  text-underline-offset: 2px;
  cursor: pointer;
}

/* Gutter marker (right margin) */
.citation-gutter-icon {
  /* Paperclip or document icon */
  opacity: 0.6;
  transition: opacity 0.15s;
}
.citation-gutter-icon:hover {
  opacity: 1;
}
```

## Interaction States

### State A: Hover (Quick Context)

**Trigger**: Mouse hovers over citation text or gutter marker

**Response Time**: < 50ms (pre-fetched)

```
┌─────────────────────────────────────────┐
│ ┌─────────────┐                         │
│ │  [Thumbnail │  whatsapp_evidence.png  │
│ │   of image] │  Source Date: 12 Oct 23 │
│ │             │  Status: ✓ Attached     │
│ └─────────────┘                         │
│                                         │
│ [Open] [Replace] [Edit Caption]         │
└─────────────────────────────────────────┘
```

**Content**:
- Thumbnail: Cropped preview of first page / image
- Filename: Original file name
- Metadata: Date, status, description
- Actions: Quick action buttons

```typescript
interface HoverCard {
  exhibitId: string;
  thumbnail: string;        // Base64 or blob URL
  fileName: string;
  metadata: {
    sourceDate: string;
    status: "attached" | "missing" | "draft";
    description: string;
  };
  actions: Array<"open" | "replace" | "edit_caption" | "remove">;
}
```

### State B: Split-View (Deep Work)

**Trigger**: Cmd+Click (Mac) / Ctrl+Click (Windows) on citation

**Response**: Window splits 50/50 vertically

```
┌────────────────────────┬────────────────────────┐
│                        │                        │
│   Draft Affidavit      │   Evidence Viewer      │
│                        │                        │
│   ...the Defendant     │   ┌──────────────────┐ │
│   admitted to the      │   │                  │ │
│   delay, as evidenced  │   │  [WhatsApp       │ │
│   by the WhatsApp      │   │   Screenshot]    │ │
│   message at           │   │                  │ │
│   [Exhibit C]← cursor  │   │                  │ │
│                        │   └──────────────────┘ │
│                        │   Page 1 of 1          │
│                        │   [Zoom] [Crop] [OCR]  │
└────────────────────────┴────────────────────────┘
```

**Features**:
- Auto-scroll: Viewer scrolls to relevant page/region
- Cursor stays active in draft (no context switch)
- Live crop: Adjust image bounds, thumbnail updates
- PDF navigation: Page controls for multi-page exhibits

```typescript
interface SplitViewState {
  leftPane: "editor";
  rightPane: "evidence-viewer";
  exhibitId: string;
  scrollToPage?: number;
  highlightRegion?: {
    x: number; y: number;
    width: number; height: number;
  };
}
```

### State C: Live Update

**Trigger**: User modifies exhibit in viewer (crop, annotate)

**Response**: All references update immediately

```typescript
// When exhibit is modified:
function onExhibitModified(exhibitId: string, changes: ExhibitChanges) {
  // 1. Update stored exhibit
  exhibitRegistry.update(exhibitId, changes);

  // 2. Regenerate thumbnail
  const newThumb = await generateThumbnail(exhibitId);

  // 3. Notify all citation nodes
  editor.chain()
    .updateAttributes('citation', { exhibitId })
    .run();

  // 4. Show toast
  toast.success("Exhibit updated. All references refreshed.");
}
```

## TipTap Implementation

### Citation Mark
```typescript
import { Mark, mergeAttributes } from "@tiptap/core";

export const CitationMark = Mark.create({
  name: "citation",

  addAttributes() {
    return {
      exhibitId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-citation]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-citation": true,
        class: "citation-mark",
      }),
      0,  // Content slot
    ];
  },

  addNodeView() {
    return ({ node, editor }) => {
      const dom = document.createElement("span");
      dom.className = "citation-mark";

      // Hover handler
      dom.addEventListener("mouseenter", () => {
        showHoverCard(node.attrs.exhibitId, dom);
      });

      // Cmd+Click handler
      dom.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey) {
          openSplitView(node.attrs.exhibitId);
          e.preventDefault();
        }
      });

      return { dom };
    };
  },
});
```

### Gutter Markers Extension
```typescript
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

export const GutterMarkers = Extension.create({
  name: "gutterMarkers",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("gutterMarkers"),
        props: {
          decorations: (state) => {
            // Find all paragraphs with citations
            // Add gutter decoration to each
          },
        },
      }),
    ];
  },
});
```

## Pre-fetching Strategy

```typescript
class CitationPreloader {
  private cache = new Map<string, HoverCard>();
  private pendingLoads = new Set<string>();

  // Called when document loads
  async warmCache(exhibitIds: string[]) {
    const uncached = exhibitIds.filter(id => !this.cache.has(id));
    await Promise.all(uncached.map(id => this.loadExhibit(id)));
  }

  // Called on cursor movement (debounced)
  onCursorNearCitation(exhibitId: string) {
    if (!this.cache.has(exhibitId) && !this.pendingLoads.has(exhibitId)) {
      this.pendingLoads.add(exhibitId);
      this.loadExhibit(exhibitId);
    }
  }

  private async loadExhibit(exhibitId: string) {
    const data = await invoke<HoverCard>("get_exhibit_preview", { exhibitId });
    this.cache.set(exhibitId, data);
    this.pendingLoads.delete(exhibitId);
  }

  getFromCache(exhibitId: string): HoverCard | null {
    return this.cache.get(exhibitId) || null;
  }
}
```

## Accessibility

- Hover cards also triggered by keyboard focus (Tab to citation)
- Screen reader: "Exhibit A, WhatsApp screenshot dated 12 October 2023, attached"
- Split view can be toggled with keyboard shortcut (Cmd+Shift+E)

## Performance Targets

| Interaction | Target |
|-------------|--------|
| Hover card appear | < 50ms |
| Split view open | < 200ms |
| Thumbnail load | < 100ms (cached) |
| Live update propagation | < 16ms |
