import { describe, it, expect } from "vitest";
import {
  recalculatePageRanges,
  reorderArray,
  createDocumentEntry,
  createSectionBreak,
  getTotalPages,
  getDocumentCount,
  type IndexEntry,
} from "./pagination";

// Helper to create a document entry for tests
function makeDoc(
  id: string,
  description: string,
  pageStart: number,
  pageEnd: number,
  disputed = false,
): IndexEntry {
  return {
    id,
    rowType: "document",
    description,
    pageStart,
    pageEnd,
    disputed,
  };
}

// Helper to create a section break for tests
function makeSection(id: string, sectionLabel: string): IndexEntry {
  return {
    id,
    rowType: "section-break",
    sectionLabel,
    description: "",
    pageStart: 1,
    pageEnd: 1,
    disputed: false,
  };
}

describe("pagination utilities", () => {
  describe("recalculatePageRanges", () => {
    it("returns empty array for empty input", () => {
      const result = recalculatePageRanges([]);
      expect(result).toEqual([]);
    });

    it("handles single entry starting at page 1", () => {
      const entries: IndexEntry[] = [makeDoc("1", "Email", 1, 5)];

      const result = recalculatePageRanges(entries);

      expect(result).toHaveLength(1);
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(5);
    });

    it("recalculates multiple entries with correct cumulative ranges", () => {
      const entries: IndexEntry[] = [
        makeDoc("1", "Email 1", 1, 5), // 5 pages
        makeDoc("2", "Email 2", 10, 12), // 3 pages (wrong start)
        makeDoc("3", "Contract", 50, 69, true), // 20 pages, disputed (wrong start)
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
        makeDoc("1", "Doc 1", 100, 110), // 11 pages (wrong start)
      ];

      const result = recalculatePageRanges(entries);

      // Should start at 1 but preserve 11-page count
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(11);
    });

    it("handles single-page documents correctly", () => {
      const entries: IndexEntry[] = [
        makeDoc("1", "Page 1", 1, 1),
        makeDoc("2", "Page 2", 2, 2),
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
          rowType: "document",
          description: "Important Email",
          date: "14 February 2025",
          disputed: true,
          pageStart: 1,
          pageEnd: 3,
          fileId: "file-789",
        },
      ];

      const result = recalculatePageRanges(entries);

      expect(result[0].id).toBe("abc-123");
      expect(result[0].rowType).toBe("document");
      expect(result[0].description).toBe("Important Email");
      expect(result[0].date).toBe("14 February 2025");
      expect(result[0].disputed).toBe(true);
      expect(result[0].fileId).toBe("file-789");
    });

    it("handles large bundles (500+ pages)", () => {
      // Create 100 documents with 5 pages each
      const entries: IndexEntry[] = Array.from({ length: 100 }, (_, i) =>
        makeDoc(`doc-${i}`, `Document ${i + 1}`, i * 100, i * 100 + 4),
      );

      const result = recalculatePageRanges(entries);

      expect(result).toHaveLength(100);
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(5);
      expect(result[99].pageStart).toBe(496); // (99 * 5) + 1
      expect(result[99].pageEnd).toBe(500); // 100 docs × 5 pages = 500 total
    });

    it("assigns pages to section breaks", () => {
      const entries: IndexEntry[] = [
        makeSection("sec-1", "TAB A"),
        makeDoc("1", "Email 1", 1, 5), // 5 pages
        makeDoc("2", "Email 2", 6, 10), // 5 pages
        makeSection("sec-2", "TAB B"),
        makeDoc("3", "Contract", 11, 20), // 10 pages
      ];

      const result = recalculatePageRanges(entries);

      expect(result).toHaveLength(5);

      // First section break gets page 1
      expect(result[0].rowType).toBe("section-break");
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(1);

      // Documents calculated correctly (shifted by 1 for section break)
      expect(result[1].pageStart).toBe(2);
      expect(result[1].pageEnd).toBe(6);
      expect(result[2].pageStart).toBe(7);
      expect(result[2].pageEnd).toBe(11);

      // Second section break gets page 12
      expect(result[3].rowType).toBe("section-break");
      expect(result[3].pageStart).toBe(12);
      expect(result[3].pageEnd).toBe(12);

      // Continue page count after section break
      expect(result[4].pageStart).toBe(13);
      expect(result[4].pageEnd).toBe(22);
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

  describe("createDocumentEntry", () => {
    it("creates a document entry with correct defaults", () => {
      const entry = createDocumentEntry("file-123", "Test Document", 10);

      expect(entry.rowType).toBe("document");
      expect(entry.fileId).toBe("file-123");
      expect(entry.description).toBe("Test Document");
      expect(entry.pageStart).toBe(1);
      expect(entry.pageEnd).toBe(10);
      expect(entry.disputed).toBe(false);
      expect(entry.date).toBe("");
      expect(entry.id).toBeDefined();
    });
  });

  describe("createSectionBreak", () => {
    it("creates a section break with correct defaults", () => {
      const entry = createSectionBreak("TAB A - Pleadings");

      expect(entry.rowType).toBe("section-break");
      expect(entry.sectionLabel).toBe("TAB A - Pleadings");
      expect(entry.description).toBe("");
      expect(entry.pageStart).toBe(1);
      expect(entry.pageEnd).toBe(1);
      expect(entry.disputed).toBe(false);
      expect(entry.id).toBeDefined();
    });
  });

  describe("getTotalPages", () => {
    it("returns 0 for empty array", () => {
      expect(getTotalPages([])).toBe(0);
    });

    it("returns page end of last document", () => {
      const entries = [
        makeDoc("1", "Doc 1", 1, 10),
        makeDoc("2", "Doc 2", 11, 25),
      ];
      expect(getTotalPages(entries)).toBe(25);
    });

    it("includes section breaks at the end", () => {
      const entries: IndexEntry[] = [
        makeDoc("1", "Doc 1", 1, 10),
        makeSection("sec", "TAB A"), // Section break has pageEnd: 1 (from makeSection)
      ];
      // After recalculation, section break would be page 11
      // But this test uses raw entries, so it returns makeSection's pageEnd which is 1
      // Let's test with recalculated entries for accuracy
      const recalculated = recalculatePageRanges(entries);
      expect(getTotalPages(recalculated)).toBe(11); // Doc ends at 10, section break is page 11
    });
  });

  describe("getDocumentCount", () => {
    it("returns 0 for empty array", () => {
      expect(getDocumentCount([])).toBe(0);
    });

    it("counts only documents, not section breaks", () => {
      const entries: IndexEntry[] = [
        makeSection("sec-1", "TAB A"),
        makeDoc("1", "Doc 1", 1, 10),
        makeDoc("2", "Doc 2", 11, 25),
        makeSection("sec-2", "TAB B"),
        makeDoc("3", "Doc 3", 26, 30),
      ];
      expect(getDocumentCount(entries)).toBe(3);
    });
  });

  describe("integration: reorder + recalculate", () => {
    it("handles full reorder workflow", () => {
      // Initial state: 3 documents in order
      const initial: IndexEntry[] = [
        makeDoc("doc-1", "Email", 1, 5),
        makeDoc("doc-2", "Contract", 6, 10),
        makeDoc("doc-3", "Invoice", 11, 15, true), // disputed
      ];

      // User drags "Contract" (index 1) to top (index 0)
      let reordered = reorderArray(initial, 1, 0);

      // Recalculate page ranges
      reordered = recalculatePageRanges(reordered);

      // Expected result: Contract, Email, Invoice
      expect(reordered[0].id).toBe("doc-2");
      expect(reordered[0].description).toBe("Contract");
      expect(reordered[0].pageStart).toBe(1);
      expect(reordered[0].pageEnd).toBe(5);

      expect(reordered[1].id).toBe("doc-1");
      expect(reordered[1].description).toBe("Email");
      expect(reordered[1].pageStart).toBe(6);
      expect(reordered[1].pageEnd).toBe(10);

      expect(reordered[2].id).toBe("doc-3");
      expect(reordered[2].description).toBe("Invoice");
      expect(reordered[2].disputed).toBe(true);
      expect(reordered[2].pageStart).toBe(11);
      expect(reordered[2].pageEnd).toBe(15);
    });

    it("handles late insert scenario with section breaks", () => {
      // Existing documents with a section break
      const existing: IndexEntry[] = [
        makeSection("sec-1", "TAB A"),
        makeDoc("1", "Doc 1", 1, 10), // 10 pages
        makeDoc("2", "Doc 2", 11, 20), // 10 pages
        makeSection("sec-2", "TAB B"),
        makeDoc("3", "Doc 3", 21, 30), // 10 pages
      ];

      // New document to insert at position 2 (after Doc 1)
      const newDoc = makeDoc("new", "Late Insert", 999, 1003); // 5 pages

      // Insert at position 2 (after Doc 1, before Doc 2)
      const withInsert = [
        existing[0],
        existing[1],
        newDoc,
        existing[2],
        existing[3],
        existing[4],
      ];

      // Recalculate
      const result = recalculatePageRanges(withInsert);

      // Section break gets page 1
      expect(result[0].sectionLabel).toBe("TAB A");
      expect(result[0].pageStart).toBe(1);
      expect(result[0].pageEnd).toBe(1);

      // Doc 1 starts at page 2 (after section break)
      expect(result[1].id).toBe("1");
      expect(result[1].pageStart).toBe(2);
      expect(result[1].pageEnd).toBe(11); // 10 pages

      // New doc inserted after Doc 1
      expect(result[2].id).toBe("new");
      expect(result[2].pageStart).toBe(12);
      expect(result[2].pageEnd).toBe(16); // 5 pages

      // Doc 2 pushed down
      expect(result[3].id).toBe("2");
      expect(result[3].pageStart).toBe(17);
      expect(result[3].pageEnd).toBe(26); // 10 pages

      // Second section break gets page 27
      expect(result[4].sectionLabel).toBe("TAB B");
      expect(result[4].pageStart).toBe(27);
      expect(result[4].pageEnd).toBe(27);

      // Doc 3 pushed down
      expect(result[5].id).toBe("3");
      expect(result[5].pageStart).toBe(28);
      expect(result[5].pageEnd).toBe(37); // 10 pages
    });
  });
});
