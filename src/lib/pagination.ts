/**
 * Pagination Utilities
 *
 * Pure functions for recalculating page ranges and tab numbers
 * in the Master Index table. These utilities handle the core logic
 * for auto-renumbering when documents are reordered or inserted.
 */

export interface IndexEntry {
  id: string;
  tabNumber: number;
  description: string;
  status: "agreed" | "disputed";
  pageStart: number;
  pageEnd: number;
  fileId?: string;
}

/**
 * Recalculates page ranges for all entries based on their current order.
 * Each entry's pageStart is determined by the previous entry's pageEnd + 1.
 * The page count (pageEnd - pageStart) is preserved from the original entry.
 *
 * @param entries - Array of index entries in desired order
 * @returns New array with updated pageStart and pageEnd values
 *
 * @example
 * const entries = [
 *   { id: "1", pageStart: 1, pageEnd: 5, ... },   // 5 pages
 *   { id: "2", pageStart: 10, pageEnd: 12, ... }  // 3 pages (was wrong)
 * ];
 * const updated = recalculatePageRanges(entries);
 * // Result: [
 * //   { id: "1", pageStart: 1, pageEnd: 5, ... },   // 5 pages
 * //   { id: "2", pageStart: 6, pageEnd: 8, ... }    // 3 pages (corrected)
 * // ]
 */
export function recalculatePageRanges(entries: IndexEntry[]): IndexEntry[] {
  if (entries.length === 0) return [];

  const result: IndexEntry[] = [];

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];

    // Calculate the page count from the original entry
    const pageCount = entry.pageEnd - entry.pageStart + 1;

    // First entry always starts at page 1
    // Otherwise, use the previous entry's NEW pageEnd from result array
    const pageStart = index === 0 ? 1 : result[index - 1].pageEnd + 1;

    // Calculate new pageEnd based on pageStart + pageCount
    const pageEnd = pageStart + pageCount - 1;

    result.push({
      ...entry,
      pageStart,
      pageEnd,
    });
  }

  return result;
}

/**
 * Recalculates tab numbers to match array indices (1-indexed).
 * Ensures tab numbers are sequential: 1, 2, 3, 4...
 *
 * @param entries - Array of index entries
 * @returns New array with updated tabNumber values
 *
 * @example
 * const entries = [
 *   { id: "1", tabNumber: 5, ... },
 *   { id: "2", tabNumber: 2, ... }
 * ];
 * const updated = recalculateTabNumbers(entries);
 * // Result: [
 * //   { id: "1", tabNumber: 1, ... },
 * //   { id: "2", tabNumber: 2, ... }
 * // ]
 */
export function recalculateTabNumbers(entries: IndexEntry[]): IndexEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    tabNumber: index + 1,
  }));
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
