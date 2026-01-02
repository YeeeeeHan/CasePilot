/**
 * Workbench Component
 *
 * The center zone of the application containing:
 * - Left: Master Index (the source of truth)
 * - Right: Preview Pane (scrollable bundle preview)
 *
 * Uses resizable panels for flexible layout.
 */

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { IndexEntry } from "@/lib/pagination";
import { PreviewPane } from "./PreviewPane";

interface WorkbenchProps {
  /** The Master Index component */
  masterIndex: React.ReactNode;
  /** All entries in the master index */
  entries: IndexEntry[];
  /** Currently selected entry from Master Index */
  selectedEntry: IndexEntry | null;
  /** Total pages in the entire bundle */
  totalBundlePages: number;
  /** Callback when TipTap content changes (for cover-page/divider) */
  onContentChange?: (
    entryId: string,
    content: string,
    pageCount: number,
  ) => void;
}

export function Workbench({
  masterIndex,
  entries,
  selectedEntry,
  totalBundlePages,
  onContentChange,
}: WorkbenchProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      {/* Left: Master Index */}
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="h-full bg-background p-4 overflow-auto">
          {masterIndex}
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {/* Right: Preview Pane (Scrollable Bundle Preview) */}
      <ResizablePanel defaultSize={50} minSize={30}>
        <PreviewPane
          entries={entries}
          selectedEntryId={selectedEntry?.id}
          totalBundlePages={totalBundlePages}
          onContentChange={onContentChange}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
