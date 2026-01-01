/**
 * Pagination Utilities
 *
 * Pure functions for recalculating page ranges in the Master Index table.
 * These utilities handle the core logic for auto-renumbering when documents
 * are reordered or inserted.
 *
 * Key design: Section breaks do NOT count towards page numbers.
 */

export type RowType = "document" | "section-break";

export interface IndexEntry {
  id: string;
  rowType: RowType;
  // For section breaks:
  sectionLabel?: string;
  // For documents:
  fileId?: string;
  description: string;
  date?: string;
  pageStart: number;
  pageEnd: number;
  disputed: boolean;
}

/**
 * Recalculates page ranges for all document entries based on their current order.
 * Section breaks are skipped in the page calculation.
 *
 * Each document's pageStart is determined by the previous document's pageEnd + 1.
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
 * // Section break is unchanged
 * // Document 2: pageStart=1, pageEnd=5
 * // Document 3: pageStart=6, pageEnd=8 (corrected!)
 */
export function recalculatePageRanges(entries: IndexEntry[]): IndexEntry[] {
  if (entries.length === 0) return [];

  const result: IndexEntry[] = [];
  let lastDocumentPageEnd = 0;

  for (const entry of entries) {
    if (entry.rowType === "section-break") {
      // Section breaks don't have page numbers, pass through unchanged
      result.push({ ...entry });
    } else {
      // Calculate the page count from the original entry
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
    pageStart: 0,
    pageEnd: 0,
    disputed: false,
  };
}

/**
 * Calculates the total page count from all document entries.
 *
 * @param entries - Array of index entries
 * @returns Total number of pages across all documents
 */
export function getTotalPages(entries: IndexEntry[]): number {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].rowType === "document") {
      return entries[i].pageEnd;
    }
  }
  return 0;
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
