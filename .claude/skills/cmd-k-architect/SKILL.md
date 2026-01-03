---
name: cmd-k-architect
description: Pattern for the Cmd+K floating menu and context-aware AI actions. Use when implementing inline AI commands, the action palette, or context assembly for LLM prompts.
allowed-tools: Read, Edit, Grep, Glob
---

# Cmd+K Architect Pattern

## Overview

Cmd+K is the primary AI interaction in CasePilot. It's the legal equivalent of Cursor's inline edit - a floating command palette that understands document context.

## Trigger Conditions

```typescript
interface CmdKTrigger {
  // Keyboard shortcut
  shortcut: "Cmd+K" | "Ctrl+K";

  // Context at trigger time
  hasSelection: boolean;
  selectionText?: string;
  cursorPosition: number;
  surroundingParagraphs: {
    before: string[]; // 2-3 paragraphs before
    after: string[]; // 2-3 paragraphs after
  };
}
```

## UI States

### State 1: Input Mode

```
┌─────────────────────────────────────────┐
│ 🔍 Add the car accident photo here...   │
│                                         │
│ [Recent: Insert exhibit | Rewrite...]   │
└─────────────────────────────────────────┘
```

- Floating above/below selection
- Auto-suggest recent actions
- Fuzzy search through action history

### State 2: Processing

```
┌─────────────────────────────────────────┐
│ ⏳ Finding relevant evidence...          │
│ ████████░░░░░░░░░░░░░░░░░░             │
└─────────────────────────────────────────┘
```

- Show progress with descriptive text
- Cancel button available

### State 3: Preview (Diff Mode)

```
┌─────────────────────────────────────────┐
│ Preview changes:                        │
│                                         │
│ - The Plaintiff suffered injuries.      │
│ + The Plaintiff suffered injuries, as   │
│ + evidenced by the medical report at    │
│ + Exhibit C.                            │
│                                         │
│ [Accept] [Edit] [Cancel]                │
└─────────────────────────────────────────┘
```

- Show diff before applying
- Allow editing before acceptance
- Keyboard shortcuts: Enter=Accept, Esc=Cancel

## Action Types

### 1. Insert Evidence

```typescript
// User: "Add the car accident photo here"
interface InsertEvidenceAction {
  type: "insert_evidence";
  query: string; // "car accident photo"
  position: "inline" | "new_paragraph";

  // System retrieves from vector DB
  // Returns exhibit match with confidence score
}
```

### 2. Rewrite

```typescript
// User: "Make this more formal"
interface RewriteAction {
  type: "rewrite";
  instruction: string;
  preserveExhibitRefs: boolean; // Don't lose exhibit links!
}
```

### 3. Expand

```typescript
// User: "Add supporting case law"
interface ExpandAction {
  type: "expand";
  direction: "before" | "after" | "inline";
  context: "case_law" | "facts" | "argument";
}
```

### 4. Summarize

```typescript
// User: "Condense this to one sentence"
interface SummarizeAction {
  type: "summarize";
  targetLength: "sentence" | "paragraph" | "bullet_points";
}
```

### 5. Format

```typescript
// User: "Convert to numbered list"
interface FormatAction {
  type: "format";
  targetFormat: "numbered" | "bulleted" | "table" | "timeline";
}
```

## Context Assembly

The quality of Cmd+K depends on context. Assemble in this order (for KV-cache efficiency):

```typescript
function assembleCmdKContext(trigger: CmdKTrigger): string {
  return `
## System Instructions (STATIC - CACHED)
You are a legal document editor for Singapore litigation.
Your task is to modify text based on user instructions.
Preserve all exhibit references (e.g., "Exhibit A").
Output only the modified text, no explanations.

## Document Context
Case: ${caseMetadata.title}
Document Type: ${documentType}
Current Section: ${sectionHeading}

## Available Exhibits (for reference)
${exhibitRegistry.map((e) => `- ${e.currentLabel}: ${e.description}`).join("\n")}

## Surrounding Text
BEFORE:
${trigger.surroundingParagraphs.before.join("\n")}

SELECTED TEXT:
${trigger.selectionText || "[CURSOR POSITION]"}

AFTER:
${trigger.surroundingParagraphs.after.join("\n")}

## User Instruction
${userPrompt}

## Output
Generate the replacement text:
`.trim();
}
```

## Prompt Patterns

### Evidence Insertion

```
Given the context, insert a reference to the most relevant exhibit.
The exhibit should be introduced naturally in legal prose.

Example output:
"as evidenced by the photograph of the damaged vehicle at Exhibit C"
```

### Formal Rewrite

```
Rewrite the selected text in formal legal language suitable for
Singapore High Court submissions. Maintain the same meaning.
Do not add new information. Preserve all exhibit references.
```

### Case Law Expansion

```
Add a supporting case citation after the selected text.
Use Singapore case law where possible.
Format: [Year] SGHC/SGCA [Number]
If no specific case is known, write [CITATION NEEDED] as placeholder.
```

## Response Handling

```typescript
async function handleCmdKResponse(stream: AsyncIterable<string>) {
  let buffer = "";

  for await (const chunk of stream) {
    buffer += chunk;

    // Stream to preview panel
    updatePreviewPanel(buffer);

    // Check for early termination signals
    if (buffer.includes("[END]") || buffer.includes("[ERROR]")) {
      break;
    }
  }

  // Post-process
  const processed = postProcess(buffer, {
    validateExhibitRefs: true,
    fixPunctuation: true,
    preserveFormatting: true,
  });

  return processed;
}
```

## Keyboard Shortcuts in Cmd+K

| Shortcut    | Action                   |
| ----------- | ------------------------ |
| `Enter`     | Execute / Accept preview |
| `Esc`       | Cancel                   |
| `Tab`       | Select suggestion        |
| `Cmd+Enter` | Execute without preview  |
| `Up/Down`   | Navigate history         |

## Performance Requirements

- **Time to menu**: < 50ms after keystroke
- **Time to first token**: < 500ms
- **Full response**: < 3s for typical requests
- **Preview diff render**: < 16ms (60fps)

## Error Handling

```typescript
const cmdKErrors = {
  NO_CONTEXT: "Please select some text or place cursor in a paragraph",
  NO_EXHIBITS: "No matching evidence found. Try a different description.",
  RATE_LIMITED: "Too many requests. Please wait a moment.",
  MODEL_ERROR: "AI temporarily unavailable. Try again.",
};
```
