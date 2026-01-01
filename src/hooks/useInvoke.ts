import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";

export interface Case {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PdfMetadata {
  page_count: number;
  title?: string;
  file_size: number;
}

export interface Exhibit {
  id: string;
  case_id: string;
  status: "unprocessed" | "processed" | "bundled"; // NEW
  file_path: string; // NOT optional (required)
  label?: string; // Now optional
  sequence_index?: number; // Now optional
  page_count?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TOCEntry {
  label: string;
  description: string;
  start_page: number;
  end_page: number;
  page_count: number;
}

export interface CompileResult {
  success: boolean;
  pdf_path?: string;
  toc_entries: TOCEntry[];
  total_pages: number;
  errors: string[];
  warnings: string[];
}

export interface ValidationError {
  error_type: string;
  message: string;
  page?: number;
  expected?: number;
  actual?: number;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ExtractedDocumentInfo {
  date?: string;
  sender?: string;
  recipient?: string;
  subject?: string;
  document_type?: string;
  first_page_text?: string;
}

export function useInvoke() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listCases = useCallback(async (): Promise<Case[]> => {
    setLoading(true);
    setError(null);
    try {
      const cases = await invoke<Case[]>("list_cases");
      return cases;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCase = useCallback(async (name: string): Promise<Case | null> => {
    setLoading(true);
    setError(null);
    try {
      const newCase = await invoke<Case>("create_case", {
        request: { name },
      });
      return newCase;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const listDocuments = useCallback(
    async (caseId: string): Promise<Document[]> => {
      setLoading(true);
      setError(null);
      try {
        const docs = await invoke<Document[]>("list_documents", {
          caseId,
        });
        return docs;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createDocument = useCallback(
    async (caseId: string, name: string): Promise<Document | null> => {
      setLoading(true);
      setError(null);
      try {
        const doc = await invoke<Document>("create_document", {
          request: { case_id: caseId, name },
        });
        return doc;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadDocument = useCallback(
    async (id: string): Promise<Document | null> => {
      setLoading(true);
      setError(null);
      try {
        const doc = await invoke<Document>("load_document", { id });
        return doc;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const saveDocument = useCallback(
    async (id: string, content: string): Promise<Document | null> => {
      setLoading(true);
      setError(null);
      try {
        const doc = await invoke<Document>("save_document", {
          request: { id, content },
        });
        return doc;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteCase = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await invoke("delete_case", { id });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveMasterIndex = useCallback(
    async (caseId: string, masterIndexJson: string): Promise<boolean> => {
      try {
        await invoke("save_master_index", {
          caseId,
          masterIndexJson,
        });
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to save master index:", message);
        return false;
      }
    },
    [],
  );

  const loadMasterIndex = useCallback(
    async (caseId: string): Promise<string | null> => {
      try {
        const json = await invoke<string | null>("load_master_index", {
          caseId,
        });
        return json;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to load master index:", message);
        return null;
      }
    },
    [],
  );

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await invoke("delete_document", { id });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const extractPdfMetadata = useCallback(
    async (filePath: string): Promise<PdfMetadata | null> => {
      console.log("[useInvoke] extractPdfMetadata called for:", filePath);
      try {
        const metadata = await invoke<PdfMetadata>("extract_pdf_metadata", {
          filePath,
        });
        console.log("[useInvoke] Metadata received from backend:", metadata);
        return metadata;
      } catch (e) {
        console.error("[useInvoke] Failed to extract PDF metadata:", e);
        return null;
      }
    },
    [],
  );

  // Exhibit CRUD functions

  const listExhibits = useCallback(
    async (caseId: string): Promise<Exhibit[]> => {
      try {
        const exhibits = await invoke<Exhibit[]>("list_exhibits", { caseId });
        return exhibits;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to list exhibits:", message);
        return [];
      }
    },
    [],
  );

  const listStagingFiles = useCallback(
    async (caseId: string): Promise<Exhibit[]> => {
      try {
        const files = await invoke<Exhibit[]>("list_staging_files", { caseId });
        return files;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to list staging files:", message);
        return [];
      }
    },
    [],
  );

  const createExhibit = useCallback(
    async (
      caseId: string,
      filePath: string,
      status: "unprocessed" | "processed" | "bundled",
      label?: string,
      sequenceIndex?: number,
      pageCount?: number,
      description?: string,
    ): Promise<Exhibit | null> => {
      console.log("[useInvoke] createExhibit called with:", {
        caseId,
        filePath,
        status,
        label,
        sequenceIndex,
        pageCount,
        description,
      });
      try {
        const exhibit = await invoke<Exhibit>("create_exhibit", {
          request: {
            case_id: caseId,
            file_path: filePath,
            status,
            label,
            sequence_index: sequenceIndex,
            page_count: pageCount,
            description,
          },
        });
        console.log("[useInvoke] createExhibit success:", exhibit);
        return exhibit;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to create exhibit:", message, e);
        return null;
      }
    },
    [],
  );

  const updateExhibit = useCallback(
    async (
      id: string,
      status?: "unprocessed" | "processed" | "bundled",
      label?: string,
      sequenceIndex?: number,
      pageCount?: number,
      description?: string,
    ): Promise<Exhibit | null> => {
      try {
        const exhibit = await invoke<Exhibit>("update_exhibit", {
          request: {
            id,
            status,
            label,
            sequence_index: sequenceIndex,
            page_count: pageCount,
            description,
          },
        });
        return exhibit;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to update exhibit:", message);
        return null;
      }
    },
    [],
  );

  const updateExhibitStatus = useCallback(
    async (
      id: string,
      status: "unprocessed" | "processed" | "bundled",
    ): Promise<Exhibit | null> => {
      try {
        const exhibit = await invoke<Exhibit>("update_exhibit_status", {
          id,
          status,
        });
        return exhibit;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to update exhibit status:", message);
        return null;
      }
    },
    [],
  );

  const promoteToFundled = useCallback(
    async (
      id: string,
      label: string,
      sequenceIndex: number,
      description?: string,
    ): Promise<Exhibit | null> => {
      try {
        const exhibit = await invoke<Exhibit>("promote_to_bundled", {
          id,
          label,
          sequenceIndex,
          description,
        });
        return exhibit;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to promote to bundled:", message);
        return null;
      }
    },
    [],
  );

  const deleteExhibit = useCallback(async (id: string): Promise<boolean> => {
    try {
      await invoke("delete_exhibit", { id });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[useInvoke] Failed to delete exhibit:", message);
      return false;
    }
  }, []);

  const reorderExhibits = useCallback(
    async (caseId: string, exhibitIds: string[]): Promise<Exhibit[]> => {
      try {
        const exhibits = await invoke<Exhibit[]>("reorder_exhibits", {
          request: {
            case_id: caseId,
            exhibit_ids: exhibitIds,
          },
        });
        return exhibits;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to reorder exhibits:", message);
        return [];
      }
    },
    [],
  );

  // Bundle compilation functions

  const compileBundle = useCallback(
    async (
      caseId: string,
      bundleName: string,
      outputPath?: string,
    ): Promise<CompileResult | null> => {
      try {
        const result = await invoke<CompileResult>("compile_bundle", {
          request: {
            case_id: caseId,
            bundle_name: bundleName,
            output_path: outputPath,
          },
        });
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to compile bundle:", message);
        return null;
      }
    },
    [],
  );

  const previewToc = useCallback(
    async (caseId: string): Promise<TOCEntry[]> => {
      try {
        const entries = await invoke<TOCEntry[]>("preview_toc", {
          request: {
            case_id: caseId,
          },
        });
        return entries;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to preview TOC:", message);
        return [];
      }
    },
    [],
  );

  const validateBundle = useCallback(
    async (caseId: string): Promise<ValidationResult | null> => {
      try {
        const result = await invoke<ValidationResult>("validate_bundle", {
          request: {
            case_id: caseId,
          },
        });
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to validate bundle:", message);
        return null;
      }
    },
    [],
  );

  const extractDocumentInfo = useCallback(
    async (filePath: string): Promise<ExtractedDocumentInfo | null> => {
      try {
        const info = await invoke<ExtractedDocumentInfo>(
          "extract_document_info",
          {
            filePath,
          },
        );
        return info;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to extract document info:", message);
        return null;
      }
    },
    [],
  );

  const generateAutoDescription = useCallback(
    async (filePath: string): Promise<string | null> => {
      try {
        const description = await invoke<string>("generate_auto_description", {
          filePath,
        });
        return description;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[useInvoke] Failed to generate description:", message);
        return null;
      }
    },
    [],
  );

  return {
    loading,
    error,
    listCases,
    createCase,
    listDocuments,
    createDocument,
    loadDocument,
    saveDocument,
    deleteCase,
    deleteDocument,
    saveMasterIndex,
    loadMasterIndex,
    extractPdfMetadata,
    listExhibits,
    listStagingFiles,
    createExhibit,
    updateExhibit,
    updateExhibitStatus,
    promoteToFundled,
    deleteExhibit,
    reorderExhibits,
    compileBundle,
    previewToc,
    validateBundle,
    extractDocumentInfo,
    generateAutoDescription,
  };
}
