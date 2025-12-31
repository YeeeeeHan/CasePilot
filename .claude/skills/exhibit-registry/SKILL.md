---
name: exhibit-registry
description: Pattern for implementing the ExhibitRegistry auto-renumbering system. Use when working on exhibit management, label generation, or reference updates.
allowed-tools: Read, Edit, Grep
---

# ExhibitRegistry Pattern

## Data Structure

```typescript
interface Exhibit {
  id: string;              // UUID (stable reference)
  filePath: string;        // Local file path
  sequenceIndex: number;   // Position in document
  currentLabel: string;    // "Exhibit A" (computed)
  metadata: {
    date: string;
    description: string;
  };
}

interface ExhibitRegistry {
  exhibits: Exhibit[];
  namingConvention: "alphabetical" | "numeric" | "initials";
}
```

## Auto-Renumbering Logic

```typescript
function onInsertExhibit(registry: ExhibitRegistry, insertIndex: number) {
  // 1. Insert new exhibit at index
  // 2. Recalculate all sequenceIndex values
  // 3. Regenerate all currentLabel values
  // 4. Update editor nodes referencing these exhibits
}
```

## TipTap Node Pattern

Store `exhibitId`, render `currentLabel`:

```typescript
addAttributes() {
  return { exhibitId: { default: null } };
}
```

## Key Principle
References are by ID (stable). Labels are computed (dynamic).
