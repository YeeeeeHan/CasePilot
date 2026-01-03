# AI & RAG Rules (Local LLM)

## Strategic Objective

**Primary Use Case:** Predictive Evidence Retrieval (NOT text generation)

> "The AI can run concurrent with my drafting... and pull out the exhibit in a tab for me as I draft."
> — Litigation Associate

Lawyers do NOT want AI to write legal arguments. They want AI to:

1. Suggest relevant documents as they type
2. Surface exhibits without "digging"
3. Predict what evidence supports their current paragraph

## Architecture

- **Inference Engine**: llama.cpp (bundled as sidecar)
- **Model**: Llama-3-8B quantized (GGUF, ~4GB)
- **Vector DB**: LanceDB (embedded, no server)
- **Download**: Model downloaded on first launch, not bundled in installer

## Development Mode

### Mock Mode

Don't load the 4GB model for every dev restart:

```rust
#[cfg(debug_assertions)]
fn get_relevant_documents(_query: &str) -> Vec<DocumentMatch> {
    vec![
        DocumentMatch {
            file_id: "mock-1",
            snippet: "Invoice dated 12 Feb 2024",
            relevance: 0.89
        }
    ]
}

#[cfg(not(debug_assertions))]
fn get_relevant_documents(query: &str) -> Vec<DocumentMatch> {
    // Real llama.cpp inference
}
```

Toggle real AI only when testing retrieval quality.

## RAG Pipeline

### 1. Document Ingestion

```
PDF → Parse (pdfium) → Chunk → Embed → Store (LanceDB)
```

### 2. Chunking Strategy

- Chunk size: ~500 tokens (legal documents are dense)
- Overlap: 50 tokens between chunks
- Preserve paragraph boundaries where possible
- Store metadata: page number, document source, date extracted

### 3. Retrieval (The Core Feature)

```rust
// Query flow: User types → Debounced query → Vector search → UI update
paragraph_text → embed(text) → LanceDB.search(top_k=3) → Context Watcher Panel
```

**UI Integration:**
As the lawyer types in TipTap, the Right Panel ("Context Watcher") automatically shows the top 3 most relevant PDFs from the case repository.

### 4. Context Window Management

- Llama-3-8B: ~8K token context
- Reserve ~2K for system prompt
- Reserve ~1K for embedding generation
- Available for document matching: ~5K tokens (~3-5 document chunks)

## Interaction Patterns

### Primary: Live Context Watcher (Passive)

```
User types: "The defendant breached the contract by failing to deliver..."

AI Pipeline:
1. Extract last 200 words from editor
2. Embed query
3. Search LanceDB for contracts, delivery docs
4. Update Right Panel with:
   - Contract.pdf (Page 3: "Delivery Obligations")
   - Email_12Feb.pdf ("Re: Delayed shipment")
```

**No user action required.** The panel updates automatically (debounced 500ms).

### Secondary: Evidence Search (Cmd+K)

```
User presses Cmd+K → Types "invoice february" → Search results appear
User selects → ExhibitNode inserted
```

**This is search, not AI generation.**

### ❌ NOT SUPPORTED: Text Generation

Do NOT implement:

- "Rewrite this paragraph"
- "Expand this argument"
- "Summarize this section"

## Prompt Patterns

### Evidence Retrieval (Primary Pattern)

```
You are a legal document retrieval system. Given a paragraph being drafted, identify the most relevant supporting evidence.

PARAGRAPH CONTEXT:
{editor_text}

TASK: Return the top 3 most relevant document chunks from the case repository.

OUTPUT FORMAT (JSON):
[
  {
    "file_id": "uuid",
    "page": 5,
    "snippet": "Brief excerpt showing relevance",
    "confidence": 0.87
  }
]
```

### Evidence Caption (Secondary)

```
Generate a 1-sentence caption for this document suitable for a Table of Contents.

DOCUMENT:
{document_text}

CAPTION (max 80 chars):
```

## Error Handling

- Model loading can take 5-30 seconds - show progress
- If GPU unavailable, fallback to CPU (slower but works)
- Handle OOM gracefully - suggest closing other apps
- If LLM fails, fallback to simple keyword search (don't break UX)

## Performance Targets

- **< 500ms retrieval latency** for Context Watcher updates
- **< 2s for Cmd+K search** (including embedding + search)
- Debounce typing events to avoid excessive queries
