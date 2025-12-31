# AI & RAG Rules (Local LLM)

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
fn get_ai_response(_prompt: &str) -> String {
    "Mock AI response for development".to_string()
}

#[cfg(not(debug_assertions))]
fn get_ai_response(prompt: &str) -> String {
    // Real llama.cpp inference
}
```

Toggle real AI only when testing generation quality.

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

### 3. Retrieval
```rust
// Query flow
user_query → embed(query) → LanceDB.search(top_k=5) → context
```

### 4. Generation
```
system_prompt + retrieved_context + user_query → LLM → response
```

## Context Window Management

- Llama-3-8B: ~8K token context
- Reserve ~2K for system prompt
- Reserve ~1K for generation
- Available for retrieval: ~5K tokens (~3-5 chunks)

## Prompt Patterns

### Cmd+K (Edit Request)
```
You are a legal document editor. Given the surrounding text and user instruction, generate the appropriate content.

SURROUNDING TEXT:
{before_cursor}
[CURSOR]
{after_cursor}

USER REQUEST: {user_prompt}

Generate only the text to insert at [CURSOR]. No explanations.
```

### Evidence Summary
```
Summarize this legal document for an exhibit caption. Be factual and concise (1-2 sentences).

DOCUMENT:
{document_text}

CAPTION:
```

## Error Handling

- Model loading can take 5-30 seconds - show progress
- If GPU unavailable, fallback to CPU (slower but works)
- Handle OOM gracefully - suggest closing other apps
