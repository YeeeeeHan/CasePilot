---
name: bundle-compiler
description: Pattern for assembling court-compliant PDF bundles with dynamic TOC and auto-pagination. THE killer feature per user research.
allowed-tools: Read, Edit, Grep, Glob
---

# Bundle Compiler Pattern

## Overview

The "Bundle Compiler" is CasePilot's killer feature. It solves the #1 pain point identified in user research: ensuring that Table of Contents page numbers match actual PDF positions exactly.

> **"It's not about Multimedia; it's about Pagination."**

## The Problem

Lawyers spend 200+ hours per case in Adobe Acrobat:

- Manually numbering pages
- Updating Table of Contents after every document insert
- Verifying that TOC page 15 actually corresponds to PDF page 15
- Re-doing everything when a "late insert" breaks pagination

If TOC says page 15 but PDF shows page 16, the court may reject the bundle.

## The Solution

```
Assemble Documents → Calculate Offsets → Generate TOC →
Inject Pagination Stamps → Merge PDFs → Validate → Export
```

## The Sacred Rule (ePD Para 78)

> **Index Page # == PDF Footer Page # == PDF Metadata Page #**

This is non-negotiable. Every feature in this skill serves this rule.

## Core Data Structures

```typescript
interface Bundle {
  id: string;
  name: string;
  caseId: string;
  documents: BundleDocument[];
  tocStyle: TOCStyle;
  paginationStyle: PaginationStyle;
  createdAt: Date;
  lastCompiled?: Date;
}

interface BundleDocument {
  id: string;
  documentId: string; // Reference to imported document
  orderIndex: number;
  label: string; // "Tab 1", "Exhibit A", etc.
  description: string;
  pageCount: number;

  // Computed at compile time
  startPage?: number;
  endPage?: number;
}

interface TOCStyle {
  format: 'tab' | 'exhibit' | 'numbered';
  prefix?: string; // For initials style: "JW-"
  includePageCount: boolean;
  includeDescription: boolean;
}

interface PaginationStyle {
  format: 'Page X of Y' | 'Page X' | 'X';
  position: 'top-right' | 'bottom-center' | 'top-center';
  font: string;
  fontSize: number;
}
```

## Compilation Pipeline

```typescript
interface CompileResult {
  success: boolean;
  pdfPath?: string;
  tocEntries: TOCEntry[];
  totalPages: number;
  errors: CompileError[];
  warnings: CompileWarning[];
}

interface TOCEntry {
  label: string;
  description: string;
  startPage: number;
  endPage: number;
  pageCount: number;
}

async function compileBundle(bundle: Bundle): Promise<CompileResult> {
  // 1. Validate all documents exist
  const validation = await validateDocuments(bundle.documents);
  if (validation.errors.length > 0) {
    return { success: false, errors: validation.errors };
  }

  // 2. Calculate page offsets
  // TOC takes pages 1-N, then documents start
  const tocPageCount = calculateTOCPageCount(bundle);
  let currentPage = tocPageCount + 1;

  const tocEntries: TOCEntry[] = [];
  for (const doc of bundle.documents) {
    tocEntries.push({
      label: doc.label,
      description: doc.description,
      startPage: currentPage,
      endPage: currentPage + doc.pageCount - 1,
      pageCount: doc.pageCount,
    });
    currentPage += doc.pageCount;
  }

  const totalPages = currentPage - 1;

  // 3. Generate TOC PDF
  const tocPdf = await generateTOCPdf(tocEntries, bundle.tocStyle);

  // 4. Inject pagination stamps into each document
  const stampedDocs: Buffer[] = [];
  for (let i = 0; i < bundle.documents.length; i++) {
    const doc = bundle.documents[i];
    const entry = tocEntries[i];

    const stamped = await injectPagination(
      doc.documentId,
      entry.startPage,
      totalPages,
      bundle.paginationStyle
    );
    stampedDocs.push(stamped);
  }

  // 5. Merge all PDFs
  const mergedPdf = await mergePdfs([tocPdf, ...stampedDocs]);

  // 6. Add bookmarks
  const bookmarkedPdf = await addBookmarks(mergedPdf, tocEntries);

  // 7. Validate the result (THE critical step)
  const finalValidation = await validatePagination(bookmarkedPdf, tocEntries);
  if (finalValidation.errors.length > 0) {
    return {
      success: false,
      errors: finalValidation.errors,
      warnings: finalValidation.warnings,
    };
  }

  // 8. Save and return
  const pdfPath = await savePdf(bookmarkedPdf, bundle.name);

  return {
    success: true,
    pdfPath,
    tocEntries,
    totalPages,
    errors: [],
    warnings: finalValidation.warnings,
  };
}
```

## Dynamic TOC Generation

```typescript
interface TOCGeneratorOptions {
  style: TOCStyle;
  entries: TOCEntry[];
  includeHeader: boolean;
  headerText?: string; // e.g., "TABLE OF CONTENTS"
}

async function generateTOCPdf(
  entries: TOCEntry[],
  style: TOCStyle
): Promise<Buffer> {
  // Generate a PDF that looks like:
  //
  // TABLE OF CONTENTS
  //
  // Tab 1   Email from John to Mary (12 Oct 2023)........... 3
  // Tab 2   Invoice #4521 - ABC Corp........................ 8
  // Tab 3   Contract - Service Agreement................... 15
  //
  // The page numbers are calculated, not hardcoded

  const content = entries.map((entry) => ({
    label: formatLabel(entry.label, style),
    description: entry.description,
    page: entry.startPage,
  }));

  return await renderTOCPdf(content);
}

function formatLabel(label: string, style: TOCStyle): string {
  switch (style.format) {
    case 'tab':
      return `Tab ${label}`;
    case 'exhibit':
      return `Exhibit ${label}`;
    case 'numbered':
      return `${label}.`;
  }
}
```

## Pagination Stamp Injection

```typescript
interface PaginationInjector {
  // Inject "Page X of Y" without breaking layout
  injectPagination(
    pdfBuffer: Buffer,
    startPage: number,
    totalPages: number,
    style: PaginationStyle
  ): Promise<Buffer>;
}

// Key constraint: stamps must NOT reflow content
// We overlay text on existing pages, not insert new content

async function injectPagination(
  documentId: string,
  startPage: number,
  totalPages: number,
  style: PaginationStyle
): Promise<Buffer> {
  const pdf = await loadDocument(documentId);

  for (let i = 0; i < pdf.pageCount; i++) {
    const pageNumber = startPage + i;
    const stampText = formatStamp(pageNumber, totalPages, style);

    // Overlay stamp at specified position
    await overlayText(pdf, i, stampText, style.position, {
      font: style.font,
      size: style.fontSize,
    });
  }

  return pdf.toBuffer();
}

function formatStamp(
  page: number,
  total: number,
  style: PaginationStyle
): string {
  switch (style.format) {
    case 'Page X of Y':
      return `Page ${page} of ${total}`;
    case 'Page X':
      return `Page ${page}`;
    case 'X':
      return `${page}`;
  }
}
```

## Late Insert Handling

The "nightmare scenario": a document needs to be inserted after the bundle is assembled.

```typescript
interface LateInsertOptions {
  mode: 'repaginate' | 'subnumber';
  insertIndex: number;
  newDocument: BundleDocument;
}

async function handleLateInsert(
  bundle: Bundle,
  options: LateInsertOptions
): Promise<CompileResult> {
  const { mode, insertIndex, newDocument } = options;

  if (mode === 'repaginate') {
    // Full re-pagination: all pages after insert point renumber
    // Tab 3 was page 15, now it's page 25
    bundle.documents.splice(insertIndex, 0, newDocument);
    return await compileBundle(bundle);
  }

  if (mode === 'subnumber') {
    // Sub-numbering: preserve existing pagination
    // Insert as pages 15A, 15B, 15C
    // This requires special handling in TOC
    newDocument.label = generateSubLabel(
      bundle.documents[insertIndex - 1].label,
      newDocument.pageCount
    );
    bundle.documents.splice(insertIndex, 0, newDocument);
    return await compileBundle(bundle);
  }
}

function generateSubLabel(previousLabel: string, pageCount: number): string {
  // "Tab 3" → "Tab 3A" (for 1 page)
  // "Tab 3" → "Tab 3A-3C" (for 3 pages)
  const suffix = String.fromCharCode(65); // 'A'
  if (pageCount === 1) {
    return `${previousLabel}${suffix}`;
  }
  const endSuffix = String.fromCharCode(65 + pageCount - 1);
  return `${previousLabel}${suffix}-${previousLabel}${endSuffix}`;
}
```

## Validation (The Gate)

```typescript
interface PaginationValidation {
  errors: PaginationError[];
  warnings: PaginationWarning[];
}

async function validatePagination(
  pdf: Buffer,
  expectedTOC: TOCEntry[]
): Promise<PaginationValidation> {
  const errors: PaginationError[] = [];
  const warnings: PaginationWarning[] = [];

  // 1. Check TOC page numbers match actual positions
  for (const entry of expectedTOC) {
    const actualPage = findDocumentStartPage(pdf, entry.label);
    if (actualPage !== entry.startPage) {
      errors.push({
        type: 'toc_page_mismatch',
        message: `TOC shows "${entry.label}" on page ${entry.startPage}, but actual position is page ${actualPage}`,
        expected: entry.startPage,
        actual: actualPage,
      });
    }
  }

  // 2. Check for pagination gaps
  const pageNumbers = extractAllPageNumbers(pdf);
  for (let i = 1; i < pageNumbers.length; i++) {
    if (pageNumbers[i] !== pageNumbers[i - 1] + 1) {
      errors.push({
        type: 'pagination_gap',
        message: `Pagination gap: page ${pageNumbers[i - 1]} jumps to ${
          pageNumbers[i]
        }`,
      });
    }
  }

  // 3. Check stamp positions
  const stamps = extractPaginationStamps(pdf);
  for (const stamp of stamps) {
    if (stamp.position !== 'top-right') {
      warnings.push({
        type: 'stamp_position_wrong',
        message: `Page ${stamp.page}: stamp is ${stamp.position}, ePD requires top-right`,
      });
    }
  }

  return { errors, warnings };
}
```

## UI Integration

### Compile Button

```typescript
async function onCompileClick(bundleId: string) {
  // 1. Pre-flight check
  const preflightResult = await invoke<ValidationResult>(
    'validate_bundle_preflight',
    { bundleId }
  );

  if (preflightResult.errors.length > 0) {
    showErrorModal('Cannot compile', preflightResult.errors);
    return;
  }

  // 2. Show progress
  showProgressModal('Compiling bundle...');

  // 3. Compile
  const result = await invoke<CompileResult>('compile_bundle', { bundleId });

  // 4. Handle result
  if (result.success) {
    showSuccessToast(`Bundle compiled: ${result.totalPages} pages, 0 errors`);
    openPdfPreview(result.pdfPath);
  } else {
    showErrorModal('Compilation failed', result.errors);
  }
}
```

### Drag-and-Drop Reordering

```typescript
// When user drags document to new position
async function onDocumentReorder(
  bundleId: string,
  documentId: string,
  newIndex: number
) {
  // 1. Update order in database
  await invoke('reorder_bundle_document', {
    bundleId,
    documentId,
    newIndex,
  });

  // 2. Recalculate TOC preview (instant feedback)
  const preview = await invoke<TOCEntry[]>('preview_toc', { bundleId });

  // 3. Update UI
  updateTOCPreview(preview);

  // 4. Show toast
  showInfoToast('TOC updated. Recompile to apply changes.');
}
```

## Performance Targets

| Operation                   | Target  | Notes                        |
| --------------------------- | ------- | ---------------------------- |
| 100-page bundle compilation | < 5s    | Including validation         |
| 500-page bundle compilation | < 30s   | Full pipeline                |
| Late insert (repaginate)    | < 2s    | Incremental if possible      |
| TOC preview update          | < 100ms | No PDF generation, just math |
| Pagination validation       | < 1s    | Post-compilation check       |

## Rust Backend Commands

```rust
#[tauri::command]
async fn compile_bundle(
    bundle_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<CompileResult, String> {
    // 1. Load bundle from database
    let bundle = get_bundle(&state.db, &bundle_id).await?;

    // 2. Run compilation pipeline
    let result = compile_bundle_pipeline(bundle, &state).await?;

    // 3. Save result and return
    Ok(result)
}

#[tauri::command]
async fn preview_toc(
    bundle_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<TOCEntry>, String> {
    // Fast TOC calculation without PDF generation
    let bundle = get_bundle(&state.db, &bundle_id).await?;
    Ok(calculate_toc_preview(bundle))
}

#[tauri::command]
async fn handle_late_insert(
    bundle_id: String,
    document_id: String,
    insert_index: usize,
    mode: String, // "repaginate" or "subnumber"
    state: tauri::State<'_, AppState>,
) -> Result<CompileResult, String> {
    // Handle late document insertion
    let bundle = get_bundle(&state.db, &bundle_id).await?;
    let document = get_document(&state.db, &document_id).await?;

    let options = LateInsertOptions {
        mode: mode.parse()?,
        insert_index,
        document,
    };

    let result = late_insert_pipeline(bundle, options, &state).await?;
    Ok(result)
}
```

## ePD 2021 Compliance

This skill directly implements requirements from:

- **Part 10, Para 78-80**: Affidavit pagination requirements
- **Part 11, Para 102**: Trial bundle structure

Key requirements encoded:

1. Page numbers in TOC must match PDF positions
2. Pagination stamps typically top-right (configurable)
3. Continuous pagination across all documents
4. Bookmarks for each document in bundle

## Error Messages

```typescript
const compileErrors = {
  DOCUMENT_NOT_FOUND: 'Document not found: {documentId}',
  DOCUMENT_CORRUPTED: 'Document is corrupted: {documentId}',
  TOC_PAGE_MISMATCH:
    'TOC shows "{label}" on page {expected}, but actual position is page {actual}',
  PAGINATION_GAP: 'Pagination gap: page {prev} jumps to {next}',
  STAMP_INJECTION_FAILED: 'Failed to inject pagination stamp on page {page}',
  MERGE_FAILED: 'Failed to merge PDFs: {reason}',
  VALIDATION_FAILED: 'Bundle validation failed: {count} error(s)',
};
```
