---
name: cursor-optimization
description: Performance patterns from Cursor IDE for AI-native features. Use when implementing streaming responses, predictive caching, inline completions, or optimizing LLM latency.
allowed-tools: Read, Edit, Grep
---

# Cursor IDE Optimization Patterns

## Overview

Cursor serves billions of AI completions daily with sub-100ms latency. These patterns, adapted for CasePilot's local-first architecture, ensure responsive AI interactions.

## Core Optimization Techniques

### 1. Speculative Edits

**Problem**: Generating full text token-by-token is slow.

**Solution**: Feed original text as a "prior" - the model mostly agrees with existing content and only generates at change points.

```typescript
// Instead of regenerating entire paragraph
// Use the original as speculation base
interface SpeculativeEdit {
  originalText: string;
  changePoints: Array<{
    position: number;
    newContent: string;
  }>;
}

// The LLM streams agreement with original until it diverges
// Result: 3-5x faster than naive generation
```

**CasePilot Application**: When user requests "make this more formal", feed original paragraph and let model output diffs rather than rewriting from scratch.

### 2. Semantic Diff (Code-Apply Pattern)

**Problem**: Full file rewrites are expensive and error-prone.

**Solution**: Use two-stage approach:
1. Frontier model produces "semantic diff" (intent + anchors)
2. Cheap local model applies the diff to actual content

```typescript
interface SemanticDiff {
  anchor: string;           // Text to locate
  operation: "insert_after" | "insert_before" | "replace" | "delete";
  content: string;          // New content (empty for delete)
  confidence: number;       // 0-1, for review threshold
}

// Example semantic diff from LLM:
// { anchor: "Exhibit A", operation: "replace", content: "Exhibit B" }
// Local apply function finds and executes
```

### 3. Caching-Aware Prompting

**Problem**: Recomputing attention for repeated context is wasteful.

**Solution**: Design prompts for KV-cache reuse:

```typescript
// BAD: Dynamic content at the start
const badPrompt = `
User selected: "${dynamicSelection}"
System: You are a legal editor...
`;

// GOOD: Static content first (cacheable)
const goodPrompt = `
System: You are a legal editor for Singapore litigation...
[Long static instructions here - cached after first request]

---
User selected: "${dynamicSelection}"
`;
```

**CasePilot Application**: Keep system prompts and exhibit registry at the start of context. Only dynamic content (user selection, recent edits) at the end.

### 4. Zero-Entropy Edits

**Problem**: Users perform predictable actions that waste cognitive load.

**Solution**: Identify actions with 100% predictability and automate them.

```typescript
// Zero-entropy actions in CasePilot:
const zeroEntropyActions = [
  "Renumber exhibits after insertion",      // Always needed
  "Update page references after reflow",    // Always needed
  "Fix spacing after paste",                // Always needed
  "Capitalize party names consistently",    // User never wants inconsistency
];

// Don't ask, just do (with undo available)
```

### 5. Predictive Pre-fetching

**Problem**: Cold-start latency when user invokes AI.

**Solution**: Predict likely actions and pre-warm caches.

```typescript
interface PredictiveCache {
  // Pre-fetch when user hovers near exhibit reference
  onNearExhibit(exhibitId: string): void {
    this.preloadThumbnail(exhibitId);
    this.preloadMetadata(exhibitId);
  }

  // Pre-compute when user selects text
  onTextSelection(selection: string): void {
    this.precomputeEmbedding(selection);
    this.preloadSimilarExhibits(selection);
  }

  // Pre-warm LLM context on document open
  onDocumentOpen(docId: string): void {
    this.warmLLMContext(this.getStaticPrompt());
  }
}
```

### 6. Model Hierarchy

**Problem**: Frontier models are slow; small models lack reasoning.

**Solution**: Use the right model for each task.

```typescript
const modelStrategy = {
  // Fast, local model (llama-3-8B)
  local: {
    tasks: [
      "Tab completion",
      "Exhibit label generation",
      "Date extraction",
      "Apply semantic diff"
    ],
    latencyTarget: "< 100ms"
  },

  // Frontier model (when available)
  frontier: {
    tasks: [
      "Complex legal reasoning",
      "Multi-document synthesis",
      "Case strategy suggestions"
    ],
    latencyTarget: "< 3s"
  }
};
```

## Performance Targets for CasePilot

| Interaction | Target Latency | Technique |
|-------------|---------------|-----------|
| Tab completion | < 100ms | Local model, speculative edits |
| Cmd+K response start | < 500ms | Streaming, pre-warmed context |
| Exhibit hover preview | < 50ms | Pre-fetched thumbnails |
| Auto-renumber | < 16ms | Pure frontend, no LLM |
| Document validation | < 1s | Parallel checks, local only |

## Implementation Checklist

- [ ] Static prompt sections at start of all LLM calls
- [ ] Streaming enabled for all generation
- [ ] Semantic diff for edits (not full rewrites)
- [ ] Pre-fetch on hover/selection events
- [ ] Local model for latency-sensitive tasks
- [ ] Zero-entropy actions automated with undo

## Sources

- [Pragmatic Engineer: Building Cursor](https://newsletter.pragmaticengineer.com/p/cursor)
- [ByteByteGo: How Cursor Serves Billions](https://blog.bytebytego.com/p/how-cursor-serves-billions-of-ai)
- [ZenML: AI-Enhanced Code Editor](https://www.zenml.io/llmops-database/building-a-next-generation-ai-enhanced-code-editor-with-real-time-inference)
