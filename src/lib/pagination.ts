/**
 * Pagination Utilities
 *
 * Pure functions for recalculating page ranges in the Master Index table.
 * These utilities handle the core logic for auto-renumbering when documents
 * are reordered or inserted.
 *
 * Key design: Section breaks (tabs) count as 1 page each.
 */

export type RowType = "document" | "section-break" | "cover-page" | "divider";

export interface IndexEntry {
  id: string;
  rowType: RowType;
  // For section breaks:
  sectionLabel?: string;
  // For documents (imported PDFs):
  fileId?: string;
  filePath?: string;
  // For cover-page and divider (TipTap-editable):
  tiptapContent?: string;
  generatedPageCount?: number;
  // Common fields:
  description: string;
  date?: string;
  pageStart: number;
  pageEnd: number;
  disputed: boolean;
}

/**
 * Recalculates page ranges for all entries based on their current order.
 * Section breaks (tabs) occupy exactly 1 page each.
 *
 * Each entry's pageStart is determined by the previous entry's pageEnd + 1.
 * The page count (pageEnd - pageStart) is preserved from the original entry.
 *
 * @param entries - Array of index entries in desired order
 * @returns New array with updated pageStart and pageEnd values
 *
 * @example
 * const entries = [
 *   { id: "1", rowType: "section-break", sectionLabel: "TAB A", ... },
 *   { id: "2", rowType: "document", pageStart: 1, pageEnd: 5, ... },   // 5 pages
 *   { id: "3", rowType: "document", pageStart: 10, pageEnd: 12, ... }  // 3 pages (was wrong)
 * ];
 * const updated = recalculatePageRanges(entries);
 * // Section break: pageStart=1, pageEnd=1 (1 page)
 * // Document 2: pageStart=2, pageEnd=6 (5 pages)
 * // Document 3: pageStart=7, pageEnd=9 (corrected!)
 */
export function recalculatePageRanges(entries: IndexEntry[]): IndexEntry[] {
  if (entries.length === 0) return [];

  const result: IndexEntry[] = [];
  let lastDocumentPageEnd = 0;

  for (const entry of entries) {
    if (entry.rowType === "section-break") {
      // Section breaks (tabs) occupy exactly 1 page
      const pageStart = lastDocumentPageEnd === 0 ? 1 : lastDocumentPageEnd + 1;
      const pageEnd = pageStart; // Always 1 page

      result.push({
        ...entry,
        pageStart,
        pageEnd,
      });

      lastDocumentPageEnd = pageEnd;
    } else if (entry.rowType === "cover-page" || entry.rowType === "divider") {
      // Generated content uses generatedPageCount (from TipTap page detection)
      const pageCount = entry.generatedPageCount || 1;
      const pageStart = lastDocumentPageEnd === 0 ? 1 : lastDocumentPageEnd + 1;
      const pageEnd = pageStart + pageCount - 1;

      result.push({
        ...entry,
        pageStart,
        pageEnd,
      });

      lastDocumentPageEnd = pageEnd;
    } else {
      // Document (imported PDF) - calculate page count from existing range
      const pageCount = entry.pageEnd - entry.pageStart + 1;

      // First document starts at page 1
      // Otherwise, continue from the last document's pageEnd
      const pageStart = lastDocumentPageEnd === 0 ? 1 : lastDocumentPageEnd + 1;
      const pageEnd = pageStart + pageCount - 1;

      result.push({
        ...entry,
        pageStart,
        pageEnd,
      });

      lastDocumentPageEnd = pageEnd;
    }
  }

  return result;
}

/**
 * Reorders an array by moving an item from one index to another.
 * This is a pure function that does not mutate the original array.
 *
 * @param array - Source array
 * @param fromIndex - Index of item to move
 * @param toIndex - Destination index
 * @returns New array with item moved
 *
 * @example
 * const items = ["A", "B", "C", "D"];
 * const reordered = reorderArray(items, 0, 2);
 * // Result: ["B", "C", "A", "D"]
 */
export function reorderArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const result = Array.from(array);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Creates a new document entry with default values.
 *
 * @param fileId - ID of the file in the repository
 * @param description - Document description for TOC
 * @param pageCount - Number of pages in the document
 * @returns New IndexEntry for a document
 */
export function createDocumentEntry(
  fileId: string,
  description: string,
  pageCount: number,
): IndexEntry {
  return {
    id: crypto.randomUUID(),
    rowType: "document",
    fileId,
    description,
    date: "",
    pageStart: 1,
    pageEnd: pageCount,
    disputed: false,
  };
}

/**
 * Creates a new section break entry.
 *
 * @param sectionLabel - Label for the section (e.g., "TAB A - Pleadings")
 * @returns New IndexEntry for a section break
 */
export function createSectionBreak(sectionLabel: string): IndexEntry {
  return {
    id: crypto.randomUUID(),
    rowType: "section-break",
    sectionLabel,
    description: "",
    pageStart: 1,
    pageEnd: 1,
    disputed: false,
  };
}

/**
 * Calculates the total page count from all entries with pages.
 *
 * @param entries - Array of index entries
 * @returns Total number of pages across all entries
 */
export function getTotalPages(entries: IndexEntry[]): number {
  // All entry types now have pages, so just get the last entry's pageEnd
  if (entries.length === 0) return 0;
  return entries[entries.length - 1].pageEnd;
}

/**
 * Counts the number of document entries (excluding section breaks).
 *
 * @param entries - Array of index entries
 * @returns Number of document entries
 */
export function getDocumentCount(entries: IndexEntry[]): number {
  return entries.filter((e) => e.rowType === "document").length;
}

/**
 * Creates a new cover page entry with optional TipTap content.
 *
 * @param content - Optional serialized TipTap JSON content
 * @param description - Description for the TOC (default: "Cover Page")
 * @returns New IndexEntry for a cover page
 */
export function createCoverPage(
  content?: string,
  description: string = "Cover Page",
): IndexEntry {
  return {
    id: crypto.randomUUID(),
    rowType: "cover-page",
    description,
    tiptapContent: content,
    generatedPageCount: 1,
    date: "",
    pageStart: 1,
    pageEnd: 1,
    disputed: false,
  };
}

/**
 * Creates a new divider page entry with optional TipTap content.
 *
 * @param title - Title for the divider (e.g., "PLAINTIFF'S DOCUMENTS")
 * @param content - Optional serialized TipTap JSON content
 * @returns New IndexEntry for a divider page
 */
export function createDividerPage(title: string, content?: string): IndexEntry {
  return {
    id: crypto.randomUUID(),
    rowType: "divider",
    description: title,
    tiptapContent: content,
    generatedPageCount: 1,
    date: "",
    pageStart: 1,
    pageEnd: 1,
    disputed: false,
  };
}

/**
 * Determines if an entry is editable (TipTap canvas) vs immutable (PDF).
 *
 * @param entry - The index entry to check
 * @returns true if the entry uses TipTap for editing
 */
export function isEditableEntry(entry: IndexEntry): boolean {
  return entry.rowType === "cover-page" || entry.rowType === "divider";
}

/**
 * Determines if an entry renders as a PDF (evidence).
 *
 * @param entry - The index entry to check
 * @returns true if the entry is an imported PDF document
 */
export function isEvidenceEntry(entry: IndexEntry): boolean {
  return entry.rowType === "document";
}
