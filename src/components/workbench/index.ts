/**
 * Workbench Components
 *
 * The center zone of the application containing the Master Index and Preview Pane.
 */

export { A4Page, A4PageContainer } from "./A4Page";
export { DraftingCanvas, DraftingCanvasPlaceholder } from "./DraftingCanvas";
export { EvidenceCanvas, EvidenceCanvasPlaceholder } from "./EvidenceCanvas";
export { usePageBreakDetection } from "./hooks/usePageBreakDetection";
export { PageSkeleton } from "./PageSkeleton";
export { PageStampOverlay, PageStampPreview } from "./PageStampOverlay";
export { PreviewPane } from "./PreviewPane";
export {
  TemplateChooser,
  type Template,
  type TemplateType,
} from "./TemplateChooser";
export { Workbench, type WorkbenchMode } from "./Workbench";
export {
  AffidavitEditor,
  type AffidavitEditorHandle,
  type AvailableFile,
} from "./AffidavitEditor";
export { ExhibitBuilder, type ExhibitEntry } from "./ExhibitBuilder";
