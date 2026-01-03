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
  Artifact,
  ArtifactEntry,
  PdfMetadata,
  ExtractedDocumentInfo,
  CreateCaseRequest,
  CreateFileRequest,
  UpdateFileRequest,
  CreateArtifactRequest,
  UpdateArtifactRequest,
  CreateEntryRequest,
  UpdateEntryRequest,
  ReorderEntriesRequest,
} from "../types";

// ============================================================================
// CASE API
// ============================================================================

const cases = {
  list: (): Promise<Case[]> => invoke("list_cases"),

  create: (name: string): Promise<Case> =>
    invoke("create_case", { request: { name } satisfies CreateCaseRequest }),

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
// ARTIFACT API
// ============================================================================

const artifacts = {
  list: (caseId: string): Promise<Artifact[]> =>
    invoke("list_artifacts", { caseId }),

  listByType: (caseId: string, artifactType: string): Promise<Artifact[]> =>
    invoke("list_artifacts_by_type", { caseId, artifactType }),

  get: (id: string): Promise<Artifact> => invoke("get_artifact", { id }),

  create: (request: CreateArtifactRequest): Promise<Artifact> =>
    invoke("create_artifact", { request }),

  update: (request: UpdateArtifactRequest): Promise<Artifact> =>
    invoke("update_artifact", { request }),

  delete: (id: string): Promise<void> => invoke("delete_artifact", { id }),
};

// ============================================================================
// ARTIFACT ENTRY API
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
  artifacts,
  entries,
  pdf,
};
