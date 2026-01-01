/**
 * Canvas Types
 *
 * Type definitions for the Hybrid Renderer architecture.
 * The PreviewPane switches between DraftingCanvas (TipTap) and EvidenceCanvas (react-pdf)
 * based on the entry type.
 */

/**
 * The rendering mode for the preview canvas.
 * - "drafting": TipTap editor for cover pages and dividers (editable)
 * - "evidence": PDF viewer for imported documents (immutable with overlays)
 */
export type CanvasMode = "drafting" | "evidence";

/**
 * Configuration for page stamp overlays on evidence PDFs.
 */
export interface PageStampConfig {
  /** Format of the page number display */
  format: "Page X of Y" | "Page X" | "X";
  /** Position on the page (ePD 2021 default: top-right) */
  position: "top-right" | "bottom-center" | "top-center";
}

/**
 * A4 page dimensions at 96 DPI (browser standard).
 * Used for constraining TipTap editor and PDF overlay positioning.
 */
export const A4_DIMENSIONS = {
  /** Width in CSS pixels (210mm at 96 DPI) */
  WIDTH_PX: 794,
  /** Height in CSS pixels (297mm at 96 DPI) */
  HEIGHT_PX: 1123,
  /** Width in millimeters */
  WIDTH_MM: 210,
  /** Height in millimeters */
  HEIGHT_MM: 297,
} as const;

/**
 * State for the canvas container.
 */
export interface CanvasState {
  mode: CanvasMode;
  /** Currently selected entry ID */
  entryId: string | null;
  /** File path for evidence PDFs */
  pdfFilePath?: string;
  /** Serialized TipTap content for drafting mode */
  tiptapContent?: string;
  /** Current page being viewed (1-indexed) */
  currentPage: number;
  /** Total pages in this entry */
  totalPages: number;
  /** This entry's first page number in the full bundle */
  globalPageStart: number;
}

/**
 * Props for the PageStampOverlay component.
 */
export interface PageStampOverlayProps {
  /** The global page number in the bundle */
  pageNumber: number;
  /** Total pages in the entire bundle */
  totalPages: number;
  /** Stamp configuration */
  config?: PageStampConfig;
}
