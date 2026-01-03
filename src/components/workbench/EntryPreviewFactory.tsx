/**
 * EntryPreviewFactory Component
 *
 * Pure component that renders the appropriate preview for an IndexEntry.
 * Extracted from PreviewPane to separate rendering logic from scroll management.
 */

import { FileText } from "lucide-react";
import type { IndexEntry } from "@/lib/pagination";
import { isEditableEntry, isEvidenceEntry } from "@/lib/pagination";
import { A4Page, A4PageContainer } from "./A4Page";
import { DraftingCanvas } from "./DraftingCanvas";
import { EvidenceCanvas } from "./EvidenceCanvas";
import { SectionBreakCanvas } from "./SectionBreakCanvas";

interface EntryPreviewFactoryProps {
  entry: IndexEntry;
  totalBundlePages: number;
  onContentChange?: (
    entryId: string,
    content: string,
    pageCount: number,
  ) => void;
  onScrollToEntry: (entryId: string) => void;
}

export function EntryPreviewFactory({
  entry,
  totalBundlePages,
  onContentChange,
  onScrollToEntry,
}: EntryPreviewFactoryProps) {
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
  if (isEvidenceEntry(entry) && entry.filePath) {
    return (
      <EvidenceCanvas
        filePath={entry.filePath}
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
