/**
 * Pagination Utilities
 *
 * Pure functions for recalculating page ranges in the Master Index table.
 * These utilities handle the core logic for auto-renumbering when documents
 * are reordered or inserted.
 *
 * Key design: Section breaks (tabs) count as 1 page each.
 */

// Re-export types from domain for backward compatibility
export type { RowType, IndexEntry } from "@/types/domain";

import type { IndexEntry } from "@/types/domain";

/**
 * Recalculates page ranges for all entries based on their current order.
 * Section breaks (tabs) occupy exactly 1 page each.
 *
 * Each entry's pageStart is determined by the previous entry's pageEnd + 1.
 * The page count (pageEnd - pageStart) is preserved from the original entry.
 *
 * @param entries - Array of index entries in desired order
 * @returns New array with updated pageStart and pageEnd values
 */
export function recalculatePageRanges(entries: IndexEntry[]): IndexEntry[] {
  if (entries.length === 0) return [];

  const result: IndexEntry[] = [];
  let lastDocumentPageEnd = 0;

  for (const entry of entries) {
    if (entry.rowType === "section-break") {
      // Section breaks (tabs) occupy exactly 1 page
      const pageStart = lastDocumentPageEnd === 0 ? 1 : lastDocumentPageEnd + 1;
      const pageEnd = pageStart;

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
      // Document (imported PDF)
      const pageCount = entry.pageEnd - entry.pageStart + 1;
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
 */
export function getTotalPages(entries: IndexEntry[]): number {
  if (entries.length === 0) return 0;
  return entries[entries.length - 1].pageEnd;
}

/**
 * Counts the number of document entries (excluding section breaks).
 */
export function getDocumentCount(entries: IndexEntry[]): number {
  return entries.filter((e) => e.rowType === "document").length;
}

/**
 * Creates a new cover page entry with optional TipTap content.
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
 */
export function isEditableEntry(entry: IndexEntry): boolean {
  return entry.rowType === "cover-page" || entry.rowType === "divider";
}

/**
 * Determines if an entry renders as a PDF (evidence).
 */
export function isEvidenceEntry(entry: IndexEntry): boolean {
  return entry.rowType === "document";
}
