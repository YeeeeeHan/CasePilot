/**
 * API Types
 *
 * Shared types for the API layer.
 */

export interface Case {
  id: string;
  name: string;
  case_type: string;
  content_json: string | null;
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

export interface CaseFile {
  id: string;
  case_id: string;
  path: string;
  original_name: string;
  page_count?: number;
  metadata_json?: string;
  created_at: string;
}

export interface ArtifactEntry {
  id: string;
  artifact_id: string;
  sequence_order: number;
  row_type: "file" | "component" | "artifact";
  file_id?: string;
  config_json?: string;
  ref_artifact_id?: string;
  label_override?: string;
  created_at: string;
}

export interface PdfMetadata {
  page_count: number;
  title?: string;
  file_size: number;
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

export interface ExtractedDocumentInfo {
  date?: string;
  sender?: string;
  recipient?: string;
  subject?: string;
  document_type?: string;
  first_page_text?: string;
}
