/**
 * Domain Types
 *
 * Core domain types used across the application.
 * Extracted from pagination.ts and other sources for better organization.
 */

/**
 * Row types for the Master Index
 * - document: Imported PDF file
 * - section-break: Visual separator (tab)
 * - cover-page: TipTap-editable cover page
 * - divider: TipTap-editable divider page
 */
export type RowType = "document" | "section-break" | "cover-page" | "divider";

/**
 * Index Entry
 *
 * Represents a single row in the Master Index table.
 * Can be a document, section break, cover page, or divider.
 */
export interface IndexEntry {
  id: string;
  rowType: RowType;
  // For section breaks:
  sectionLabel?: string;
  // For documents (imported PDFs):
  fileId?: string;
  filePath?: string;
  // For cover-page and divider (TipTap-editable):
  tiptapContent?: string;
  generatedPageCount?: number;
  // Common fields:
  description: string;
  date?: string;
  pageStart: number;
  pageEnd: number;
  disputed: boolean;
  // For affidavit mode:
  exhibitLabel?: string;
}

/**
 * Project Case
 *
 * Represents a case in the project switcher.
 */
export interface ProjectCase {
  id: string;
  name: string;
  initials?: string;
}

/**
 * Selection Source
 *
 * Indicates where a selection originated from.
 */
export type SelectionSource = "repository" | "master-index";

/**
 * Workbench Mode
 *
 * The current mode of the workbench.
 */
export type WorkbenchMode = "bundle" | "affidavit";

/**
 * Available File
 *
 * Represents a file available for insertion.
 */
export interface AvailableFile {
  id: string;
  name: string;
  path: string;
  pageCount?: number;
}
