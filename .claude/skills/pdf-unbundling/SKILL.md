---
name: pdf-unbundling
description: Pattern for splitting large PDF bundles and indexing them for semantic search. Use when implementing document ingestion, chunking, or RAG pipeline.
allowed-tools: Read, Edit, Grep
---

# PDF Unbundling Pattern

## Pipeline Overview

```
Large PDF → Parse → Detect Boundaries → Split → Chunk → Embed → Index
```

## Boundary Detection

Heuristics for legal bundles:
- Blank pages between documents
- "Tab X" or "Exhibit X" headers
- Table of Contents references
- Page numbering resets

## Chunking Strategy

```python
chunk_size = 500    # tokens
overlap = 50        # tokens between chunks
preserve_paragraphs = True
```

## Metadata to Store

```typescript
interface Chunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    sourceFile: string;
    pageNumber: number;
    documentType: string;  // "email", "invoice", "report"
    dateExtracted: string;
  };
}
```

## Search Flow

```
Query → Embed → LanceDB.search(top_k=5) → Ranked Chunks
```

## Key Files
- PDF parsing: `src-tauri/src/pdf.rs`
- Vector storage: LanceDB (embedded)
- Embedding: Local model or sentence-transformers
