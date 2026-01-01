/**
 * PreviewPane Component
 *
 * Scrollable preview of the entire bundle.
 * Renders all entries from the master index in sequence.
 */

import { useRef, useEffect } from "react";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { IndexEntry } from "@/lib/pagination";
import { isEvidenceEntry, isEditableEntry } from "@/lib/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EvidenceCanvas } from "./EvidenceCanvas";
import { DraftingCanvas } from "./DraftingCanvas";
import { SectionBreakCanvas } from "./SectionBreakCanvas";
import { A4Page, A4PageContainer } from "./A4Page";

interface PreviewPaneProps {
  /** All entries in the master index */
  entries: IndexEntry[];
  /** Currently selected entry ID (for scroll-to and highlighting) */
  selectedEntryId?: string;
  /** Total pages in the entire bundle */
  totalBundlePages: number;
  /** Callback when TipTap content changes */
  onContentChange?: (
    entryId: string,
    content: string,
    pageCount: number,
  ) => void;
  /** Additional CSS classes */
  className?: string;
}

export function PreviewPane({
  entries,
  selectedEntryId,
  totalBundlePages,
  onContentChange,
  className,
}: PreviewPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to selected entry when it changes
  useEffect(() => {
    if (selectedEntryId && entryRefs.current.has(selectedEntryId)) {
      const element = entryRefs.current.get(selectedEntryId);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedEntryId]);

  // Handler for scrolling to an entry
  const scrollToEntry = (entryId: string) => {
    const element = entryRefs.current.get(entryId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground",
          className,
        )}
      >
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No documents in bundle</p>
        <p className="text-xs mt-1 opacity-70">
          Add documents to see the preview
        </p>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-muted/20", className)}>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-2 space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              ref={(el) => {
                if (el) entryRefs.current.set(entry.id, el);
              }}
              className={cn(
                "transition-all",
                selectedEntryId === entry.id &&
                  "ring-2 ring-primary ring-offset-2 rounded-lg",
              )}
            >
              <EntryPreview
                entry={entry}
                totalBundlePages={totalBundlePages}
                onContentChange={onContentChange}
                onScrollToEntry={scrollToEntry}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface EntryPreviewProps {
  entry: IndexEntry;
  totalBundlePages: number;
  onContentChange?: (
    entryId: string,
    content: string,
    pageCount: number,
  ) => void;
  onScrollToEntry: (entryId: string) => void;
}

function EntryPreview({
  entry,
  totalBundlePages,
  onContentChange,
  onScrollToEntry,
}: EntryPreviewProps) {
  const handleContentChange = (content: string, pageCount: number) => {
    onContentChange?.(entry.id, content, pageCount);
  };

  // Section break - render as full page with sticky header
  if (entry.rowType === "section-break") {
    return (
      <SectionBreakCanvas
        sectionLabel={entry.sectionLabel || "Section Break"}
        globalPageNumber={entry.pageStart}
        totalBundlePages={totalBundlePages}
        className="border rounded-lg bg-white"
      />
    );
  }

  // Document (PDF) - render embedded preview
  // Note: No overflow-hidden here - it breaks sticky positioning on the header
  if (isEvidenceEntry(entry) && entry.fileId) {
    return (
      <EvidenceCanvas
        filePath={entry.fileId}
        globalPageStart={entry.pageStart}
        totalBundlePages={totalBundlePages}
        className="border rounded-lg bg-white"
        onScrollToTop={() => onScrollToEntry(entry.id)}
      />
    );
  }

  // Cover page or Divider - render TipTap editor
  if (isEditableEntry(entry)) {
    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <DraftingCanvas
          content={entry.tiptapContent}
          entryType={entry.rowType as "cover-page" | "divider"}
          onContentChange={handleContentChange}
        />
      </div>
    );
  }

  // Fallback for documents without file path
  return (
    <A4PageContainer>
      <A4Page className="flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{entry.description || "Document"}</p>
          <p className="text-xs opacity-70">
            Pages {entry.pageStart} - {entry.pageEnd}
          </p>
        </div>
      </A4Page>
    </A4PageContainer>
  );
}
