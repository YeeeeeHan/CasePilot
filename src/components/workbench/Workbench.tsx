/**
 * Workbench Component
 *
 * The center zone of the application containing:
 * - Bundle Mode: Master Index + Preview Pane
 * - Affidavit Mode: TipTap Editor + PDF Preview + Exhibit Builder
 *
 * Uses resizable panels for flexible layout.
 */

import type { RefObject } from "react";
import { useMemo, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { IndexEntry } from "@/lib/pagination";
import { PreviewPane } from "./PreviewPane";
import {
  AffidavitEditor,
  type AffidavitEditorHandle,
  type AvailableFile,
} from "./AffidavitEditor";
import { EvidenceCanvas } from "./EvidenceCanvas";
import { ExhibitBuilder, type ExhibitEntry } from "./ExhibitBuilder";
import { extractExhibits } from "@/components/editor/ExhibitNode";
import { FileText } from "lucide-react";

export type WorkbenchMode = "bundle" | "affidavit";

interface ActiveCase {
  id: string;
  name: string;
  type: "affidavit" | "bundle";
  content?: string;
  initials?: string;
}

interface WorkbenchProps {
  /** Current mode (bundle or affidavit) */
  mode?: WorkbenchMode;
  /** The active case (for affidavit mode) */
  activeCase?: ActiveCase | null;
  /** Available files for exhibit insertion */
  availableFiles?: AvailableFile[];
  /** Ref to affidavit editor (for external exhibit insertion) */
  editorRef?: RefObject<AffidavitEditorHandle | null>;
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
    pageCount: number,
  ) => void;
  /** Callback when affidavit content changes */
  onAffidavitContentChange?: (caseId: string, content: string) => void;
  /** Callback when affidavit initials change */
  onAffidavitInitialsChange?: (caseId: string, initials: string) => void;
  /** Callback when user wants to export affidavit to .docx */
  onExportDocx?: (artifactId: string) => void;
}

export function Workbench({
  mode = "bundle",
  activeCase,
  availableFiles = [],
  editorRef,
  masterIndex,
  entries = [],
  selectedEntry,
  totalBundlePages = 0,
  onContentChange,
  onAffidavitContentChange,
  onAffidavitInitialsChange,
  onExportDocx,
}: WorkbenchProps) {
  // Track focused exhibit for cursor-following preview
  const [focusedExhibitPath, setFocusedExhibitPath] = useState<string | null>(
    null,
  );

  // Extract exhibits from affidavit content for ExhibitBuilder
  const exhibitEntries: ExhibitEntry[] = useMemo(() => {
    if (!activeCase?.content) return [];

    const extracted = extractExhibits(activeCase.content);
    const initials = activeCase.initials || "EX";

    return extracted.map((ex, index) => ({
      label: ex.exhibitLabel || `${initials}-${index + 1}`,
      fileId: ex.fileId,
      description: ex.fileName,
      filePath: ex.filePath,
      // Try to get page count from availableFiles
      pageCount: availableFiles.find((f) => f.id === ex.fileId)?.pageCount,
    }));
  }, [activeCase?.content, activeCase?.initials, availableFiles]);

  // Affidavit Mode
  if (mode === "affidavit" && activeCase) {
    return (
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {/* Left: Affidavit Editor + Exhibit Builder (vertical split) */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup orientation="vertical" className="h-full">
            {/* Top: Editor */}
            <ResizablePanel defaultSize={70} minSize={40}>
              <AffidavitEditor
                ref={editorRef}
                artifactId={activeCase.id}
                name={activeCase.name}
                initials={activeCase.initials || ""}
                content={activeCase.content || ""}
                availableFiles={availableFiles}
                onContentChange={onAffidavitContentChange}
                onInitialsChange={onAffidavitInitialsChange}
                onExhibitFocus={setFocusedExhibitPath}
                onExportDocx={onExportDocx}
              />
            </ResizablePanel>

            <ResizableHandle />

            {/* Bottom: Exhibit Builder */}
            <ResizablePanel defaultSize={30} minSize={15}>
              <ExhibitBuilder
                exhibits={exhibitEntries}
                focusedExhibitPath={focusedExhibitPath}
                onExhibitClick={setFocusedExhibitPath}
                initials={activeCase.initials || "EX"}
                className="h-full border-t border-border"
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right: Cursor-following PDF Preview */}
        <ResizablePanel defaultSize={50} minSize={30}>
          {focusedExhibitPath ? (
            <div className="h-full overflow-auto bg-muted/20">
              <EvidenceCanvas
                filePath={focusedExhibitPath}
                globalPageStart={1}
                totalBundlePages={1}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
              <div className="text-center p-4">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Exhibit Preview</p>
                <p className="text-xs mt-1 max-w-[200px]">
                  Click on an exhibit reference in the editor to preview the PDF
                </p>
              </div>
            </div>
          )}
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
