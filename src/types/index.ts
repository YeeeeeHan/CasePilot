/**
 * CasePilot v2.0 Domain Types
 *
 * These types mirror the Rust backend schema exactly.
 * Source of truth: src-tauri/src/lib.rs
 */

// ============================================================================
// CORE ENTITIES (match Rust structs exactly)
// ============================================================================

export interface Case {
  id: string;
  name: string;
  case_type: ArtifactType; // "affidavit" | "bundle"
  content_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: string;
  case_id: string;
  path: string;
  original_name: string;
  page_count: number | null;
  metadata_json: string | null;
  created_at: string;
}

export interface ArtifactEntry {
  id: string;
  case_id: string;
  sequence_order: number;
  row_type: RowType;
  file_id: string | null;
  config_json: string | null; // For components (cover, divider)
  label_override: string | null; // e.g., "TAK-1"
  created_at: string;
}

// ============================================================================
// TYPE LITERALS
// ============================================================================

export type ArtifactType = "affidavit" | "bundle";
export type RowType = "file" | "component";

// ============================================================================
// REQUEST TYPES (for Tauri commands)
// ============================================================================

export interface CreateCaseRequest {
  name: string;
  case_type: ArtifactType;
  content_json?: string;
}

export interface CreateFileRequest {
  case_id: string;
  path: string;
  original_name: string;
  page_count?: number;
  metadata_json?: string;
}

export interface UpdateFileRequest {
  id: string;
  page_count?: number;
  metadata_json?: string;
}

export interface CreateEntryRequest {
  case_id: string;
  sequence_order: number;
  row_type: RowType;
  file_id?: string;
  config_json?: string;
  label_override?: string;
}

export interface UpdateEntryRequest {
  id: string;
  sequence_order?: number;
  config_json?: string;
  label_override?: string;
}

export interface ReorderEntriesRequest {
  case_id: string;
  entry_ids: string[];
}

// ============================================================================
// PDF TYPES
// ============================================================================

export interface PdfMetadata {
  page_count: number;
  title: string | null;
  file_size: number;
}

export interface ExtractedDocumentInfo {
  date?: string;
  sender?: string;
  recipient?: string;
  subject?: string;
  document_type?: string;
  first_page_text?: string;
}

// ============================================================================
// COMPONENT CONFIG TYPES (stored in config_json)
// ============================================================================

export interface CoverPageConfig {
  template: string;
  title: string;
  party?: string;
}

export interface DividerConfig {
  text: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type SelectionSource = "files" | "entries" | null;

export interface Selection {
  id: string | null;
  source: SelectionSource;
}
