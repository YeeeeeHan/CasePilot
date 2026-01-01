/**
 * Workbench Components
 *
 * The center zone of the application containing the Master Index and Preview Pane.
 */

export { Workbench } from "./Workbench";
export { PreviewPane } from "./PreviewPane";
export { CanvasContainer } from "./CanvasContainer";
export { DraftingCanvas, DraftingCanvasPlaceholder } from "./DraftingCanvas";
export { EvidenceCanvas, EvidenceCanvasPlaceholder } from "./EvidenceCanvas";
export { A4Page, A4PageContainer } from "./A4Page";
export { PageStampOverlay, PageStampPreview } from "./PageStampOverlay";
export { PageSkeleton } from "./PageSkeleton";
export { usePageBreakDetection } from "./hooks/usePageBreakDetection";
export {
  TemplateChooser,
  type Template,
  type TemplateType,
} from "./TemplateChooser";
