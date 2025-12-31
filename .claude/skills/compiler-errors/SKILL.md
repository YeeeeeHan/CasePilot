---
name: compiler-errors
description: Pattern for pre-export validation and the Problems panel. Use when implementing document linting, broken reference detection, or court formatting compliance checks.
allowed-tools: Read, Edit, Grep, Glob
---

# Compiler Errors Pattern

## Overview

The "Problems" panel is CasePilot's equivalent of IDE build errors. It catches mistakes before filing - turning potential courtroom embarrassment into pre-submit warnings.

## Problem Severity Levels

| Level   | Icon | Use Case                      | User Action |
| ------- | ---- | ----------------------------- | ----------- |
| Error   | 🔴   | Blocks filing, must fix       | Required    |
| Warning | 🟡   | Should fix, but can proceed   | Recommended |
| Info    | 🔵   | Suggestion, style improvement | Optional    |

## Error Categories

### 1. Exhibit Integrity

```typescript
interface ExhibitError {
  type: "exhibit";
  subtype:
    | "referenced_not_attached" // 🔴 Exhibit D mentioned but not in bundle
    | "attached_not_referenced" // 🟡 Exhibit E in bundle but never cited
    | "duplicate_label" // 🔴 Two exhibits both labeled "A"
    | "missing_file" // 🔴 File path no longer exists
    | "corrupted_file"; // 🔴 PDF/image won't open
}
```

**Example Messages**:

- 🔴 `Exhibit D is referenced in paragraph 40 but not attached to the bundle`
- 🟡 `Exhibit E is attached but never referenced in the text`
- 🔴 `Duplicate exhibit label "Exhibit A" found - exhibits must be unique`

### 2. Citation Format

```typescript
interface CitationError {
  type: "citation";
  subtype:
    | "invalid_format" // 🟡 "[2023] SGHC" missing case number
    | "unknown_court" // 🔵 "SGHCC" is not a valid court code
    | "future_date" // 🟡 Case dated 2025 (typo?)
    | "inconsistent_style"; // 🔵 Mix of [Year] and (Year) formats
}
```

**Example Messages**:

- 🟡 `Citation "[2023] SGHC" is incomplete - missing case number`
- 🔵 `Inconsistent citation style: paragraph 12 uses [Year], paragraph 15 uses (Year)`

### 3. Cross-Reference Integrity

```typescript
interface ReferenceError {
  type: "reference";
  subtype:
    | "paragraph_deleted" // 🔴 "See para 12" but para 12 was deleted
    | "page_mismatch" // 🟡 "Page 45" but exhibit only has 30 pages
    | "circular_reference"; // 🔵 Para 5 refs Para 8 which refs Para 5
}
```

**Example Messages**:

- 🔴 `Paragraph 12 is referenced but has been deleted`
- 🟡 `Reference to "page 45 of Exhibit B" but Exhibit B only has 30 pages`

### 4. Content Consistency

```typescript
interface ConsistencyError {
  type: "consistency";
  subtype:
    | "party_name_spelling" // 🔵 "Plantiff" vs "Plaintiff"
    | "date_mismatch" // 🟡 Text says "12 Oct" but exhibit dated "14 Oct"
    | "amount_mismatch" // 🟡 "$50,000" in text vs "$55,000" in invoice
    | "undefined_term"; // 🔵 "Agreement" capitalized but not defined
}
```

**Example Messages**:

- 🔵 `Inconsistent spelling: "Plantiff" in para 3, "Plaintiff" elsewhere`
- 🟡 `Date "12 October 2023" in text doesn't match exhibit metadata (14 October 2023)`
- 🔵 `"Agreement" is capitalized but not defined - add definition or use lowercase`

### 5. Court Formatting (Singapore)

```typescript
interface FormattingError {
  type: "formatting";
  subtype:
    | "wrong_margin" // 🟡 Not 1 inch (2.54cm) margins
    | "wrong_font" // 🟡 Not Times New Roman 12pt
    | "wrong_spacing" // 🟡 Not 1.5 line spacing
    | "missing_pagination" // 🔴 No page numbers
    | "wrong_date_format"; // 🔵 "Oct 12" should be "12 October"
}
```

**Example Messages**:

- 🟡 `Margins are 1.5 inches - Supreme Court requires 1 inch (2.54cm)`
- 🔴 `Document has no page numbers - required for eLitigation submission`
- 🔵 `Date "Oct 12, 2023" should be "12 October 2023" per court convention`

## UI Implementation

### Problems Panel (Bottom Dock)

```
┌─────────────────────────────────────────────────────────────┐
│ PROBLEMS (5)  │  OUTPUT  │  TERMINAL                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔴 Exhibit D referenced in para 40 but not attached         │
│    affidavit.casepilot : paragraph 40                       │
│                                                             │
│ 🔴 Paragraph 12 referenced but deleted                      │
│    affidavit.casepilot : paragraph 8                        │
│                                                             │
│ 🟡 Date mismatch: "12 Oct" vs exhibit "14 Oct"              │
│    affidavit.casepilot : paragraph 15                       │
│                                                             │
│ 🔵 Inconsistent party spelling: "Plantiff"                  │
│    affidavit.casepilot : paragraph 3                        │
│                                                             │
│ 🔵 Term "Agreement" capitalized but undefined               │
│    affidavit.casepilot : paragraph 7                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Inline Decorations

```typescript
// Squiggly underlines in editor (like spell-check)
const errorDecorations = {
  error: "wavy underline red",
  warning: "wavy underline yellow",
  info: "wavy underline blue",
};
```

### Status Bar Summary

```
┌──────────────────────────────────────────────────────────┐
│  affidavit.casepilot    🔴 2  🟡 1  🔵 2    Ready to Export │
└──────────────────────────────────────────────────────────┘
```

## Validation Runner

```typescript
interface ValidationResult {
  errors: Problem[];
  warnings: Problem[];
  info: Problem[];
  canExport: boolean; // false if any errors
}

interface Problem {
  id: string;
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  location: {
    paragraph?: number;
    line?: number;
    exhibitId?: string;
  };
  quickFix?: QuickFix;
}

interface QuickFix {
  label: string;
  action: () => void;
}

// Example quick fixes
const quickFixes = {
  attached_not_referenced: {
    label: "Remove from bundle",
    action: () => exhibitRegistry.remove(exhibitId),
  },
  party_name_spelling: {
    label: "Fix all to 'Plaintiff'",
    action: () => editor.commands.replaceAll("Plantiff", "Plaintiff"),
  },
  undefined_term: {
    label: "Add definition",
    action: () => editor.commands.insertDefinition("Agreement"),
  },
};
```

## Validation Pipeline

```typescript
async function validateDocument(doc: Document): Promise<ValidationResult> {
  // Run all validators in parallel for speed
  const [
    exhibitResults,
    citationResults,
    referenceResults,
    consistencyResults,
    formattingResults,
  ] = await Promise.all([
    validateExhibits(doc),
    validateCitations(doc),
    validateReferences(doc),
    validateConsistency(doc),
    validateFormatting(doc),
  ]);

  const allProblems = [
    ...exhibitResults,
    ...citationResults,
    ...referenceResults,
    ...consistencyResults,
    ...formattingResults,
  ];

  return {
    errors: allProblems.filter((p) => p.severity === "error"),
    warnings: allProblems.filter((p) => p.severity === "warning"),
    info: allProblems.filter((p) => p.severity === "info"),
    canExport: !allProblems.some((p) => p.severity === "error"),
  };
}
```

## When to Run Validation

| Trigger              | Scope                  | Debounce |
| -------------------- | ---------------------- | -------- |
| On type              | Current paragraph only | 500ms    |
| On save              | Full document          | None     |
| On export            | Full document + strict | None     |
| Manual (Cmd+Shift+M) | Full document          | None     |

## Export Gate

```typescript
async function onExportClick() {
  const result = await validateDocument(currentDoc);

  if (!result.canExport) {
    // Show modal with errors
    showValidationModal({
      title: "Cannot Export",
      message: `${result.errors.length} error(s) must be fixed before filing.`,
      errors: result.errors,
      action: "Fix Errors",
    });
    return;
  }

  if (result.warnings.length > 0) {
    // Allow proceed with warnings
    const proceed = await showWarningModal({
      title: "Warnings Found",
      message: `${result.warnings.length} warning(s) found. Proceed anyway?`,
      warnings: result.warnings,
      actions: ["Fix Warnings", "Export Anyway"],
    });

    if (!proceed) return;
  }

  // Proceed to export
  await exportToPdf(currentDoc);
}
```

## Performance Targets

| Validation               | Target Time |
| ------------------------ | ----------- |
| Single paragraph         | < 50ms      |
| Full document (50 pages) | < 1s        |
| Pre-export (strict)      | < 3s        |
