/**
 * Files API
 *
 * Functions for file repository operations.
 */

import { invoke } from "@tauri-apps/api/core";
import type { CaseFile, PdfMetadata, ExtractedDocumentInfo } from "./types";

export async function listFiles(caseId: string): Promise<CaseFile[]> {
  try {
    return await invoke<CaseFile[]>("list_files", { caseId });
  } catch (e) {
    console.error("[API] Failed to list files:", e);
    return [];
  }
}

export async function createFile(
  caseId: string,
  path: string,
  originalName: string,
  pageCount?: number,
  metadataJson?: string,
): Promise<{ file: CaseFile | null; error: string | null }> {
  try {
    const file = await invoke<CaseFile>("create_file", {
      request: {
        case_id: caseId,
        path,
        original_name: originalName,
        page_count: pageCount,
        metadata_json: metadataJson,
      },
    });
    return { file, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[API] Failed to create file:", message);
    return { file: null, error: message };
  }
}

export async function updateFile(
  id: string,
  pageCount?: number,
  metadataJson?: string,
): Promise<CaseFile | null> {
  try {
    return await invoke<CaseFile>("update_file", {
      request: {
        id,
        page_count: pageCount,
        metadata_json: metadataJson,
      },
    });
  } catch (e) {
    console.error("[API] Failed to update file:", e);
    return null;
  }
}

export async function deleteFile(id: string): Promise<boolean> {
  try {
    await invoke("delete_file", { id });
    return true;
  } catch (e) {
    console.error("[API] Failed to delete file:", e);
    return false;
  }
}

export async function extractPdfMetadata(
  filePath: string,
): Promise<PdfMetadata | null> {
  try {
    return await invoke<PdfMetadata>("extract_pdf_metadata", { filePath });
  } catch (e) {
    console.error("[API] Failed to extract PDF metadata:", e);
    return null;
  }
}

export async function extractDocumentInfo(
  filePath: string,
): Promise<ExtractedDocumentInfo | null> {
  try {
    return await invoke<ExtractedDocumentInfo>("extract_document_info", {
      filePath,
    });
  } catch (e) {
    console.error("[API] Failed to extract document info:", e);
    return null;
  }
}

export async function generateAutoDescription(
  filePath: string,
): Promise<string | null> {
  try {
    return await invoke<string>("generate_auto_description", { filePath });
  } catch (e) {
    console.error("[API] Failed to generate description:", e);
    return null;
  }
}

