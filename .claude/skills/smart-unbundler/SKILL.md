---
name: smart-unbundler
description: Pattern for first-launch PDF ingestion - splitting 500-page bundles into individual searchable assets. Use when implementing document import, boundary detection, or the onboarding flow.
allowed-tools: Read, Edit, Grep, Glob
---

# Smart Unbundler Pattern

## Overview

The "Unbundler" is CasePilot's onboarding magic trick. Drop a 500-page litigation bundle → get 32 individually indexed, searchable documents. This is the "Time-to-Value" accelerator.

## The Problem

Lawyers receive discovery as massive concatenated PDFs:

- `Defendant_Discovery_Bundle_Vol1.pdf` (500 pages)
- No internal structure visible
- Searching requires knowing page numbers
- Copying evidence means hunting through the blob

## The Solution

```
Drop Bundle → Parse → Detect Boundaries → Split →
Extract Metadata → Index → Display Timeline
```

## Boundary Detection Heuristics

### 1. Table of Contents Extraction

```typescript
interface TOCEntry {
  label: string; // "Tab 1", "Exhibit A"
  pageNumber: number;
  description?: string;
}

// Pattern matching for Singapore bundle TOCs
const tocPatterns = [
  /Tab\s+(\d+)\s+[–-]\s+(.+?)\s+(\d+)/, // Tab 1 - Email dated... 45
  /Exhibit\s+([A-Z]+)\s+[–-]\s+(.+?)\s+(\d+)/, // Exhibit A - Contract... 12
  /(\d+)\.\s+(.+?)\s+\.+\s+(\d+)/, // 1. Invoice dated... ... 78
];

async function extractTOC(pdf: PDFDocument): Promise<TOCEntry[]> {
  // 1. Find pages that look like TOC (usually pages 1-3)
  // 2. Extract text and parse with patterns
  // 3. Return structured entries
}
```

### 2. Visual Boundary Detection

```typescript
interface BoundarySignal {
  type: string;
  confidence: number; // 0-1
  pageNumber: number;
}

const boundarySignals: BoundarySignal[] = [
  // Blank pages between documents
  { type: "blank_page", confidence: 0.9 },

  // "Tab X" or "Exhibit X" headers
  { type: "exhibit_header", confidence: 0.95 },

  // Page numbering resets (1, 2, 3 → 1)
  { type: "page_reset", confidence: 0.7 },

  // Dramatic layout change (email → invoice)
  { type: "layout_change", confidence: 0.6 },

  // Date discontinuity (> 30 days gap)
  { type: "date_jump", confidence: 0.5 },
];
```

### 3. Header/Footer Analysis

```typescript
// Many law firms add consistent headers to each document
const headerPatterns = [
  /Page \d+ of \d+/, // Resets indicate new doc
  /\[CONFIDENTIAL\]/, // Often at doc start
  /From:.*To:.*Date:/s, // Email header
  /INVOICE|RECEIPT|CONTRACT/i, // Document type headers
];
```

## Split Pipeline

```typescript
interface UnbundleResult {
  originalFile: string;
  documents: ExtractedDocument[];
  timeline: TimelineEvent[];
  stats: {
    totalPages: number;
    documentsFound: number;
    processingTime: number;
  };
}

interface ExtractedDocument {
  id: string;
  type: DocumentType;
  pageRange: { start: number; end: number };
  extractedText: string;
  metadata: {
    title: string;
    date?: string;
    sender?: string;
    recipient?: string;
    documentType:
      | "email"
      | "invoice"
      | "contract"
      | "report"
      | "photo"
      | "unknown";
  };
  thumbnail: string; // Base64 of first page
}

async function unbundle(pdfPath: string): Promise<UnbundleResult> {
  // 1. Load PDF
  const pdf = await loadPdf(pdfPath);

  // 2. Try TOC extraction first (most reliable)
  const toc = await extractTOC(pdf);

  // 3. If no TOC, use visual boundary detection
  const boundaries =
    toc.length > 0 ? tocToBoundaries(toc) : await detectBoundaries(pdf);

  // 4. Split at boundaries
  const documents = await splitAtBoundaries(pdf, boundaries);

  // 5. Extract metadata from each document
  for (const doc of documents) {
    doc.metadata = await extractMetadata(doc);
    doc.thumbnail = await generateThumbnail(doc);
  }

  // 6. Build timeline
  const timeline = buildTimeline(documents);

  return { originalFile: pdfPath, documents, timeline, stats };
}
```

## Metadata Extraction

```typescript
interface MetadataExtractor {
  // Email detection
  extractEmailMetadata(text: string): {
    from: string;
    to: string[];
    cc: string[];
    date: string;
    subject: string;
  } | null;

  // Invoice detection
  extractInvoiceMetadata(text: string): {
    vendor: string;
    invoiceNumber: string;
    date: string;
    amount: string;
    currency: string;
  } | null;

  // Date extraction (general)
  extractDates(text: string): string[];

  // Party name extraction
  extractPartyNames(text: string, knownParties: string[]): string[];
}

// Use local LLM for complex extraction
const extractionPrompt = `
Extract metadata from this legal document.
Return JSON with: date, document_type, parties_mentioned, summary (1 sentence).

DOCUMENT:
{text}

JSON:
`;
```

## Progress Feedback (UX)

The unbundler must **narrate** its progress - not just show a spinner.

```typescript
interface ProgressEvent {
  stage: "scanning" | "detecting" | "splitting" | "indexing";
  message: string;
  progress: number; // 0-100
}

// Example progress messages
const progressMessages = [
  { stage: "scanning", message: "Scanning Def_Discovery_Bundle_Vol1.pdf..." },
  { stage: "detecting", message: "Found Table of Contents on page 2..." },
  { stage: "detecting", message: "Detecting document boundaries..." },
  { stage: "splitting", message: "Found 32 distinct documents" },
  {
    stage: "splitting",
    message: "Extracting: Email from John dated 12 Oct...",
  },
  { stage: "indexing", message: "Indexing for semantic search..." },
  { stage: "indexing", message: "Building timeline view..." },
];
```

### Progress UI

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   📄 Unbundling Def_Discovery_Bundle_Vol1.pdf                │
│                                                              │
│   ████████████████░░░░░░░░░░░░░░░░░░░░  45%                 │
│                                                              │
│   ✓ Found Table of Contents                                  │
│   ✓ Detected 32 document boundaries                          │
│   → Extracting: Invoice #4521 from ABC Corp...               │
│   ○ Indexing for search                                      │
│   ○ Building timeline                                        │
│                                                              │
│                                               [Cancel]       │
└──────────────────────────────────────────────────────────────┘
```

## Output Views

### 1. Sidebar (File List)

```
📁 Case Files
├── 📄 Def_Discovery_Bundle_Vol1.pdf (original)
│   ├── 📧 Email - John to Mary (12 Oct 2023)
│   ├── 📧 Email - Mary to John (14 Oct 2023)
│   ├── 🧾 Invoice #4521 - ABC Corp
│   ├── 📄 Contract - Service Agreement
│   └── ... (28 more)
```

### 2. Timeline View

```
Oct 2023                                              Dec 2023
|----|----|----|----|----|----|----|----|----|----|----|----|
     📧       📧🧾                        📄📄📄
     |        ||                          |||
     |        |└─ Invoice #4521           ||└─ Police Report
     |        └─ Email: Mary to John      |└─ Medical Report
     └─ Email: John to Mary               └─ Witness Statement
```

### 3. Auto-Generated Summary

```markdown
## Bundle Summary: Def_Discovery_Bundle_Vol1.pdf

**Total Documents**: 32
**Date Range**: 12 October 2023 - 15 December 2023
**Key Parties**: John Tan, Mary Lee, ABC Corp Pte Ltd

### Document Types:

- Emails: 18
- Invoices: 4
- Contracts: 2
- Reports: 5
- Other: 3

### Timeline Highlights:

- 12 Oct: Initial email exchange between parties
- 25 Oct: Invoice dispute begins
- 15 Dec: Police report filed
```

## Rust Backend Integration

```rust
#[tauri::command]
async fn unbundle_pdf(
    pdf_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<UnbundleResult, String> {
    // 1. Validate path
    let path = PathBuf::from(&pdf_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    // 2. Parse PDF (using pdfium or lopdf)
    let pdf = parse_pdf(&path).await
        .map_err(|e| format!("Failed to parse PDF: {}", e))?;

    // 3. Run unbundling pipeline
    let result = unbundle_pipeline(pdf, &state.db).await
        .map_err(|e| format!("Unbundle failed: {}", e))?;

    // 4. Store extracted documents in SQLite
    for doc in &result.documents {
        store_document(&state.db, doc).await?;
    }

    // 5. Index in vector DB
    for doc in &result.documents {
        index_document(&state.vector_db, doc).await?;
    }

    Ok(result)
}
```

## Performance Targets

| Operation             | Target  | Notes                      |
| --------------------- | ------- | -------------------------- |
| 100-page PDF          | < 10s   | Boundary detection + split |
| 500-page PDF          | < 45s   | Full pipeline              |
| Per-document indexing | < 500ms | Vector embedding           |
| Timeline generation   | < 100ms | Client-side                |

## Error Handling

```typescript
const unbundleErrors = {
  CORRUPT_PDF: "PDF file is corrupted or password-protected",
  NO_TEXT: "PDF contains only images - OCR required",
  TOO_LARGE: "PDF exceeds 1000 pages - split manually first",
  NO_BOUNDARIES: "Could not detect document boundaries - manual review needed",
};
```

## Future Enhancements

- [ ] OCR for scanned PDFs (Tesseract integration)
- [ ] Learn from user corrections (ML boundary detection)
- [ ] Batch unbundling (multiple files)
- [ ] Cloud processing option for very large bundles
