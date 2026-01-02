/**
 * Workbench Component
 *
 * The center zone of the application containing:
 * - Bundle Mode: Master Index + Preview Pane
 * - Affidavit Mode: TipTap Editor + PDF Preview
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
import { AffidavitEditor } from "./AffidavitEditor";

export type WorkbenchMode = "bundle" | "affidavit";

interface ActiveArtifact {
  id: string;
  name: string;
  type: "affidavit" | "bundle";
  content?: string;
  initials?: string;
}

interface WorkbenchProps {
  /** Current mode (bundle or affidavit) */
  mode?: WorkbenchMode;
  /** The active artifact (for affidavit mode) */
  activeArtifact?: ActiveArtifact | null;
  /** The Master Index component (for bundle mode) */
  masterIndex?: React.ReactNode;
  /** All entries in the master index (for bundle mode) */
  entries?: IndexEntry[];
  /** Currently selected entry from Master Index (for bundle mode) */
  selectedEntry?: IndexEntry | null;
  /** Total pages in the entire bundle (for bundle mode) */
  totalBundlePages?: number;
  /** Callback when TipTap content changes (for cover-page/divider in bundle mode) */
  onContentChange?: (
    entryId: string,
    content: string,
    pageCount: number
  ) => void;
  /** Callback when affidavit content changes */
  onAffidavitContentChange?: (artifactId: string, content: string) => void;
  /** Callback when affidavit initials change */
  onAffidavitInitialsChange?: (artifactId: string, initials: string) => void;
}

export function Workbench({
  mode = "bundle",
  activeArtifact,
  masterIndex,
  entries = [],
  selectedEntry,
  totalBundlePages = 0,
  onContentChange,
  onAffidavitContentChange,
  onAffidavitInitialsChange,
}: WorkbenchProps) {
  // Affidavit Mode
  if (mode === "affidavit" && activeArtifact) {
    return (
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {/* Left: Affidavit Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <AffidavitEditor
            artifactId={activeArtifact.id}
            name={activeArtifact.name}
            initials={activeArtifact.initials || ""}
            content={activeArtifact.content || ""}
            onContentChange={onAffidavitContentChange}
            onInitialsChange={onAffidavitInitialsChange}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Right: Preview Pane (will show cursor-following PDF in Phase 4B) */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
            <div className="text-center p-4">
              <p className="font-medium">Exhibit Preview</p>
              <p className="text-xs mt-1">
                Drag files from the Files panel to insert exhibit references
              </p>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // Bundle Mode (default)
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
