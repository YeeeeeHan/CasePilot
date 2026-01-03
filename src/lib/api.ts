/**
 * CasePilot v2.0 - Tauri API Layer
 *
 * Thin wrapper around Tauri invoke() calls.
 * Matches the new backend commands in src-tauri/src/lib.rs
 *
 * Usage:
 *   import { api } from './lib/api';
 *   const cases = await api.cases.list();
 */

import { invoke } from "@tauri-apps/api/core";
import type {
  Case,
  File,
  ArtifactEntry,
  PdfMetadata,
  ExtractedDocumentInfo,
  CreateCaseRequest,
  CreateFileRequest,
  UpdateFileRequest,
  CreateEntryRequest,
  UpdateEntryRequest,
  ReorderEntriesRequest,
} from "../types";

// ============================================================================
// CASE API
// ============================================================================

const cases = {
  list: (): Promise<Case[]> => invoke("list_cases"),

  create: (request: CreateCaseRequest): Promise<Case> =>
    invoke("create_case", { request }),

  delete: (id: string): Promise<void> => invoke("delete_case", { id }),
};

// ============================================================================
// FILE API
// ============================================================================

const files = {
  list: (caseId: string): Promise<File[]> => invoke("list_files", { caseId }),

  get: (id: string): Promise<File> => invoke("get_file", { id }),

  create: (request: CreateFileRequest): Promise<File> =>
    invoke("create_file", { request }),

  update: (request: UpdateFileRequest): Promise<File> =>
    invoke("update_file", { request }),

  delete: (id: string): Promise<void> => invoke("delete_file", { id }),
};

// ============================================================================
// ENTRY API
// ============================================================================

const entries = {
  list: (artifactId: string): Promise<ArtifactEntry[]> =>
    invoke("list_entries", { artifactId }),

  create: (request: CreateEntryRequest): Promise<ArtifactEntry> =>
    invoke("create_entry", { request }),

  update: (request: UpdateEntryRequest): Promise<ArtifactEntry> =>
    invoke("update_entry", { request }),

  delete: (id: string): Promise<void> => invoke("delete_entry", { id }),

  reorder: (request: ReorderEntriesRequest): Promise<ArtifactEntry[]> =>
    invoke("reorder_entries", { request }),
};

// ============================================================================
// PDF API
// ============================================================================

const pdf = {
  extractMetadata: (filePath: string): Promise<PdfMetadata> =>
    invoke("extract_pdf_metadata", { filePath }),

  extractDocumentInfo: (filePath: string): Promise<ExtractedDocumentInfo> =>
    invoke("extract_document_info", { filePath }),

  generateAutoDescription: (filePath: string): Promise<string> =>
    invoke("generate_auto_description", { filePath }),
};

// ============================================================================
// EXPORT
// ============================================================================

export const api = {
  cases,
  files,
  entries,
  pdf,
};
