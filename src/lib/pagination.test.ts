import { describe, it, expect } from "vitest";
import {
  recalculatePageRanges,
  recalculateTabNumbers,
  reorderArray,
  type IndexEntry,
} from "./pagination";

describe("pagination utilities", () => {
  describe("recalculatePageRanges", () => {
    it("returns empty array for empty input", () => {
      const result = recalculatePageRanges([]);
      expect(result).toEqual([]);
    });

    it("handles single entry starting at page 1", () => {
      const entries: IndexEntry[] = [
        {
          id: "1",
          tabNumber: 1,
          description: "Email",
          status: "agreed",
          pageStart: 1,
          pageEnd: 5,
        },
      ];

      const result = recalculatePageRanges(entries);

      expect(result).toHaveLength(1);
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(5);
    });

    it("recalculates multiple entries with correct cumulative ranges", () => {
      const entries: IndexEntry[] = [
        {
          id: "1",
          tabNumber: 1,
          description: "Email 1",
          status: "agreed",
          pageStart: 1,
          pageEnd: 5, // 5 pages
        },
        {
          id: "2",
          tabNumber: 2,
          description: "Email 2",
          status: "agreed",
          pageStart: 10, // Wrong - should be 6
          pageEnd: 12, // 3 pages
        },
        {
          id: "3",
          tabNumber: 3,
          description: "Contract",
          status: "disputed",
          pageStart: 50, // Wrong - should be 9
          pageEnd: 69, // 20 pages
        },
      ];

      const result = recalculatePageRanges(entries);

      expect(result).toHaveLength(3);

      // Entry 1: pages 1-5 (5 pages)
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(5);

      // Entry 2: pages 6-8 (3 pages)
      expect(result[1].pageStart).toBe(6);
      expect(result[1].pageEnd).toBe(8);

      // Entry 3: pages 9-28 (20 pages)
      expect(result[2].pageStart).toBe(9);
      expect(result[2].pageEnd).toBe(28);
    });

    it("preserves page count when recalculating", () => {
      const entries: IndexEntry[] = [
        {
          id: "1",
          tabNumber: 1,
          description: "Doc 1",
          status: "agreed",
          pageStart: 100, // Wrong start
          pageEnd: 110, // 11 pages
        },
      ];

      const result = recalculatePageRanges(entries);

      // Should start at 1 but preserve 11-page count
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(11);
    });

    it("handles single-page documents correctly", () => {
      const entries: IndexEntry[] = [
        {
          id: "1",
          tabNumber: 1,
          description: "Page 1",
          status: "agreed",
          pageStart: 1,
          pageEnd: 1,
        },
        {
          id: "2",
          tabNumber: 2,
          description: "Page 2",
          status: "agreed",
          pageStart: 2,
          pageEnd: 2,
        },
      ];

      const result = recalculatePageRanges(entries);

      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(1);
      expect(result[1].pageStart).toBe(2);
      expect(result[1].pageEnd).toBe(2);
    });

    it("preserves all non-page-related fields", () => {
      const entries: IndexEntry[] = [
        {
          id: "abc-123",
          tabNumber: 5,
          description: "Important Email",
          status: "disputed",
          pageStart: 1,
          pageEnd: 3,
          fileId: "file-789",
        },
      ];

      const result = recalculatePageRanges(entries);

      expect(result[0].id).toBe("abc-123");
      expect(result[0].tabNumber).toBe(5); // Should be preserved (not recalculated here)
      expect(result[0].description).toBe("Important Email");
      expect(result[0].status).toBe("disputed");
      expect(result[0].fileId).toBe("file-789");
    });

    it("handles large bundles (500+ pages)", () => {
      // Create 100 documents with 5 pages each
      const entries: IndexEntry[] = Array.from({ length: 100 }, (_, i) => ({
        id: `doc-${i}`,
        tabNumber: i + 1,
        description: `Document ${i + 1}`,
        status: "agreed" as const,
        pageStart: i * 100, // Intentionally wrong
        pageEnd: i * 100 + 4, // 5 pages each
      }));

      const result = recalculatePageRanges(entries);

      expect(result).toHaveLength(100);
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(5);
      expect(result[99].pageStart).toBe(496); // (99 * 5) + 1
      expect(result[99].pageEnd).toBe(500); // 100 docs × 5 pages = 500 total
    });
  });

  describe("recalculateTabNumbers", () => {
    it("returns empty array for empty input", () => {
      const result = recalculateTabNumbers([]);
      expect(result).toEqual([]);
    });

    it("numbers entries sequentially from 1", () => {
      const entries: IndexEntry[] = [
        {
          id: "1",
          tabNumber: 99, // Wrong
          description: "First",
          status: "agreed",
          pageStart: 1,
          pageEnd: 5,
        },
        {
          id: "2",
          tabNumber: 5, // Wrong
          description: "Second",
          status: "agreed",
          pageStart: 6,
          pageEnd: 10,
        },
        {
          id: "3",
          tabNumber: 1, // Wrong
          description: "Third",
          status: "agreed",
          pageStart: 11,
          pageEnd: 15,
        },
      ];

      const result = recalculateTabNumbers(entries);

      expect(result).toHaveLength(3);
      expect(result[0].tabNumber).toBe(1);
      expect(result[1].tabNumber).toBe(2);
      expect(result[2].tabNumber).toBe(3);
    });

    it("preserves all other fields", () => {
      const entries: IndexEntry[] = [
        {
          id: "abc",
          tabNumber: 999,
          description: "Test Document",
          status: "disputed",
          pageStart: 10,
          pageEnd: 20,
          fileId: "file-1",
        },
      ];

      const result = recalculateTabNumbers(entries);

      expect(result[0].id).toBe("abc");
      expect(result[0].description).toBe("Test Document");
      expect(result[0].status).toBe("disputed");
      expect(result[0].pageStart).toBe(10);
      expect(result[0].pageEnd).toBe(20);
      expect(result[0].fileId).toBe("file-1");
      expect(result[0].tabNumber).toBe(1); // Only this changes
    });
  });

  describe("reorderArray", () => {
    it("moves item from start to middle", () => {
      const array = ["A", "B", "C", "D"];
      const result = reorderArray(array, 0, 2);

      expect(result).toEqual(["B", "C", "A", "D"]);
      expect(array).toEqual(["A", "B", "C", "D"]); // Original unchanged
    });

    it("moves item from middle to start", () => {
      const array = ["A", "B", "C", "D"];
      const result = reorderArray(array, 2, 0);

      expect(result).toEqual(["C", "A", "B", "D"]);
    });

    it("moves item from middle to end", () => {
      const array = ["A", "B", "C", "D"];
      const result = reorderArray(array, 1, 3);

      expect(result).toEqual(["A", "C", "D", "B"]);
    });

    it("moves item from end to start", () => {
      const array = ["A", "B", "C", "D"];
      const result = reorderArray(array, 3, 0);

      expect(result).toEqual(["D", "A", "B", "C"]);
    });

    it("handles same index (no-op)", () => {
      const array = ["A", "B", "C"];
      const result = reorderArray(array, 1, 1);

      expect(result).toEqual(["A", "B", "C"]);
    });

    it("handles single item array", () => {
      const array = ["A"];
      const result = reorderArray(array, 0, 0);

      expect(result).toEqual(["A"]);
    });

    it("does not mutate original array", () => {
      const array = ["A", "B", "C"];
      const result = reorderArray(array, 0, 2);

      expect(array).toEqual(["A", "B", "C"]); // Original unchanged
      expect(result).toEqual(["B", "C", "A"]); // New array modified
      expect(result).not.toBe(array); // Different reference
    });

    it("works with complex objects", () => {
      const array = [
        { id: 1, name: "First" },
        { id: 2, name: "Second" },
        { id: 3, name: "Third" },
      ];
      const result = reorderArray(array, 2, 0);

      expect(result).toEqual([
        { id: 3, name: "Third" },
        { id: 1, name: "First" },
        { id: 2, name: "Second" },
      ]);
    });
  });

  describe("integration: reorder + recalculate", () => {
    it("handles full reorder workflow", () => {
      // Initial state: 3 documents in order
      const initial: IndexEntry[] = [
        {
          id: "doc-1",
          tabNumber: 1,
          description: "Email",
          status: "agreed",
          pageStart: 1,
          pageEnd: 5,
        },
        {
          id: "doc-2",
          tabNumber: 2,
          description: "Contract",
          status: "agreed",
          pageStart: 6,
          pageEnd: 10,
        },
        {
          id: "doc-3",
          tabNumber: 3,
          description: "Invoice",
          status: "disputed",
          pageStart: 11,
          pageEnd: 15,
        },
      ];

      // User drags "Contract" (index 1) to top (index 0)
      let reordered = reorderArray(initial, 1, 0);

      // Recalculate tab numbers
      reordered = recalculateTabNumbers(reordered);

      // Recalculate page ranges
      reordered = recalculatePageRanges(reordered);

      // Expected result: Contract, Email, Invoice
      expect(reordered).toEqual([
        {
          id: "doc-2",
          tabNumber: 1, // Updated
          description: "Contract",
          status: "agreed",
          pageStart: 1, // Updated
          pageEnd: 5, // Updated (5 pages)
        },
        {
          id: "doc-1",
          tabNumber: 2, // Updated
          description: "Email",
          status: "agreed",
          pageStart: 6, // Updated
          pageEnd: 10, // Updated (5 pages)
        },
        {
          id: "doc-3",
          tabNumber: 3, // Unchanged
          description: "Invoice",
          status: "disputed",
          pageStart: 11, // Unchanged
          pageEnd: 15, // Unchanged (5 pages)
        },
      ]);
    });

    it("handles late insert scenario (insert at position 2)", () => {
      // Existing documents
      const existing: IndexEntry[] = [
        {
          id: "1",
          tabNumber: 1,
          description: "Doc 1",
          status: "agreed",
          pageStart: 1,
          pageEnd: 10,
        },
        {
          id: "2",
          tabNumber: 2,
          description: "Doc 2",
          status: "agreed",
          pageStart: 11,
          pageEnd: 20,
        },
        {
          id: "3",
          tabNumber: 3,
          description: "Doc 3",
          status: "agreed",
          pageStart: 21,
          pageEnd: 30,
        },
      ];

      // New document to insert at position 1 (between Doc 1 and Doc 2)
      const newDoc: IndexEntry = {
        id: "new",
        tabNumber: 999, // Will be recalculated
        description: "Late Insert",
        status: "agreed",
        pageStart: 999, // Will be recalculated
        pageEnd: 1003, // 5 pages
      };

      // Insert at position 1
      const withInsert = [existing[0], newDoc, existing[1], existing[2]];

      // Recalculate
      const result = recalculatePageRanges(recalculateTabNumbers(withInsert));

      expect(result).toEqual([
        {
          id: "1",
          tabNumber: 1,
          description: "Doc 1",
          status: "agreed",
          pageStart: 1,
          pageEnd: 10,
        },
        {
          id: "new",
          tabNumber: 2, // Updated
          description: "Late Insert",
          status: "agreed",
          pageStart: 11, // Updated
          pageEnd: 15, // Updated (5 pages preserved)
        },
        {
          id: "2",
          tabNumber: 3, // Updated
          description: "Doc 2",
          status: "agreed",
          pageStart: 16, // Updated (pushed down by 5 pages)
          pageEnd: 25, // Updated
        },
        {
          id: "3",
          tabNumber: 4, // Updated
          description: "Doc 3",
          status: "agreed",
          pageStart: 26, // Updated
          pageEnd: 35, // Updated
        },
      ]);
    });
  });
});
