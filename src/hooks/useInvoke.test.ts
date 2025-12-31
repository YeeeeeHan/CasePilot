import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useInvoke } from "./useInvoke";
import { mockCase, mockDocument } from "@/test/mocks/tauri";
import { invoke } from "@tauri-apps/api/core";

// Get the mocked invoke
const mockInvoke = vi.mocked(invoke);

describe("useInvoke", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe("listCases", () => {
    it("returns cases from backend", async () => {
      const cases = [
        mockCase({ name: "Smith v Jones" }),
        mockCase({ name: "Acme Corp Merger" }),
      ];
      mockInvoke.mockResolvedValueOnce(cases);

      const { result } = renderHook(() => useInvoke());

      let returnedCases;
      await act(async () => {
        returnedCases = await result.current.listCases();
      });

      expect(returnedCases).toEqual(cases);
      expect(mockInvoke).toHaveBeenCalledWith("list_cases");
    });

    it("sets loading state during fetch", async () => {
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      const { result } = renderHook(() => useInvoke());

      // Start the fetch
      let promise: Promise<unknown>;
      act(() => {
        promise = result.current.listCases();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Wait for completion
      await act(async () => {
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it("handles errors gracefully", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Database error"));

      const { result } = renderHook(() => useInvoke());

      let cases;
      await act(async () => {
        cases = await result.current.listCases();
      });

      expect(cases).toEqual([]);
      expect(result.current.error).toBe("Database error");
    });

    it("returns empty array on error", async () => {
      mockInvoke.mockRejectedValueOnce("String error");

      const { result } = renderHook(() => useInvoke());

      let cases;
      await act(async () => {
        cases = await result.current.listCases();
      });

      expect(cases).toEqual([]);
      expect(result.current.error).toBe("String error");
    });
  });

  describe("createCase", () => {
    it("creates a case and returns it", async () => {
      const newCase = mockCase({ name: "New Litigation" });
      mockInvoke.mockResolvedValueOnce(newCase);

      const { result } = renderHook(() => useInvoke());

      let createdCase;
      await act(async () => {
        createdCase = await result.current.createCase("New Litigation");
      });

      expect(createdCase).toEqual(newCase);
      expect(mockInvoke).toHaveBeenCalledWith("create_case", {
        request: { name: "New Litigation" },
      });
    });

    it("returns null on error", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Creation failed"));

      const { result } = renderHook(() => useInvoke());

      let createdCase;
      await act(async () => {
        createdCase = await result.current.createCase("Test");
      });

      expect(createdCase).toBeNull();
      expect(result.current.error).toBe("Creation failed");
    });
  });

  describe("listDocuments", () => {
    it("returns documents for a case", async () => {
      const caseId = "case-123";
      const docs = [
        mockDocument({ case_id: caseId, name: "AEIC" }),
        mockDocument({ case_id: caseId, name: "Bundle of Documents" }),
      ];
      mockInvoke.mockResolvedValueOnce(docs);

      const { result } = renderHook(() => useInvoke());

      let returnedDocs;
      await act(async () => {
        returnedDocs = await result.current.listDocuments(caseId);
      });

      expect(returnedDocs).toEqual(docs);
      expect(mockInvoke).toHaveBeenCalledWith("list_documents", {
        caseId: caseId,
      });
    });
  });

  describe("createDocument", () => {
    it("creates a document in a case", async () => {
      const caseId = "case-123";
      const newDoc = mockDocument({
        case_id: caseId,
        name: "AEIC of Plaintiff",
      });
      mockInvoke.mockResolvedValueOnce(newDoc);

      const { result } = renderHook(() => useInvoke());

      let createdDoc;
      await act(async () => {
        createdDoc = await result.current.createDocument(
          caseId,
          "AEIC of Plaintiff",
        );
      });

      expect(createdDoc).toEqual(newDoc);
      expect(mockInvoke).toHaveBeenCalledWith("create_document", {
        request: { case_id: caseId, name: "AEIC of Plaintiff" },
      });
    });
  });

  describe("loadDocument", () => {
    it("loads a document by ID", async () => {
      const doc = mockDocument({ content: "<p>Legal content here</p>" });
      mockInvoke.mockResolvedValueOnce(doc);

      const { result } = renderHook(() => useInvoke());

      let loadedDoc;
      await act(async () => {
        loadedDoc = await result.current.loadDocument(doc.id);
      });

      expect(loadedDoc).toEqual(doc);
      expect(mockInvoke).toHaveBeenCalledWith("load_document", { id: doc.id });
    });

    it("returns null when document not found", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Document not found"));

      const { result } = renderHook(() => useInvoke());

      let loadedDoc;
      await act(async () => {
        loadedDoc = await result.current.loadDocument("nonexistent");
      });

      expect(loadedDoc).toBeNull();
      expect(result.current.error).toBe("Document not found");
    });
  });

  describe("saveDocument", () => {
    it("saves document content", async () => {
      const doc = mockDocument({ content: "" });
      const updatedDoc = { ...doc, content: "<p>Updated content</p>" };
      mockInvoke.mockResolvedValueOnce(updatedDoc);

      const { result } = renderHook(() => useInvoke());

      let savedDoc;
      await act(async () => {
        savedDoc = await result.current.saveDocument(
          doc.id,
          "<p>Updated content</p>",
        );
      });

      expect(savedDoc).toEqual(updatedDoc);
      expect(mockInvoke).toHaveBeenCalledWith("save_document", {
        request: { id: doc.id, content: "<p>Updated content</p>" },
      });
    });
  });

  describe("deleteCase", () => {
    it("deletes a case and returns true", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useInvoke());

      let success;
      await act(async () => {
        success = await result.current.deleteCase("case-123");
      });

      expect(success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith("delete_case", {
        id: "case-123",
      });
    });

    it("returns false on error", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Delete failed"));

      const { result } = renderHook(() => useInvoke());

      let success;
      await act(async () => {
        success = await result.current.deleteCase("case-123");
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe("Delete failed");
    });
  });

  describe("deleteDocument", () => {
    it("deletes a document and returns true", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useInvoke());

      let success;
      await act(async () => {
        success = await result.current.deleteDocument("doc-123");
      });

      expect(success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith("delete_document", {
        id: "doc-123",
      });
    });
  });

  describe("error clearing", () => {
    it("clears error on new request", async () => {
      // First request fails
      mockInvoke.mockRejectedValueOnce(new Error("First error"));

      const { result } = renderHook(() => useInvoke());

      await act(async () => {
        await result.current.listCases();
      });

      expect(result.current.error).toBe("First error");

      // Second request succeeds
      mockInvoke.mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.listCases();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
