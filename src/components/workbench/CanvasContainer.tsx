/**
 * CanvasContainer Component
 *
 * Mode switcher that renders the appropriate canvas based on entry type:
 * - "document" → EvidenceCanvas (react-pdf, immutable)
 * - "cover-page" / "divider" → DraftingCanvas (TipTap, editable)
 * - "section-break" / null → Empty state
 */

import { useMemo } from "react";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { IndexEntry } from "@/lib/pagination";
import { isEditableEntry, isEvidenceEntry } from "@/lib/pagination";
import { EvidenceCanvas, EvidenceCanvasPlaceholder } from "./EvidenceCanvas";
import { DraftingCanvas } from "./DraftingCanvas";
import { A4PageContainer, A4Page } from "./A4Page";

interface CanvasContainerProps {
  /** The selected index entry (or null if nothing selected) */
  entry: IndexEntry | null;
  /** File path for evidence PDFs */
  filePath?: string;
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

type CanvasMode = "evidence" | "drafting" | "empty";

function getCanvasMode(entry: IndexEntry | null): CanvasMode {
  if (!entry) return "empty";
  if (entry.rowType === "section-break") return "empty";
  if (isEvidenceEntry(entry)) return "evidence";
  if (isEditableEntry(entry)) return "drafting";
  return "empty";
}

export function CanvasContainer({
  entry,
  filePath,
  totalBundlePages,
  onContentChange,
  className,
}: CanvasContainerProps) {
  const mode = useMemo(() => getCanvasMode(entry), [entry]);

  const handleContentChange = (content: string, pageCount: number) => {
    if (entry && onContentChange) {
      onContentChange(entry.id, content, pageCount);
    }
  };

  return (
    <div className={cn("h-full", className)}>
      {mode === "empty" && <EmptyCanvas entry={entry} />}

      {mode === "evidence" && entry && filePath && (
        <EvidenceCanvas
          filePath={filePath}
          globalPageStart={entry.pageStart}
          totalBundlePages={totalBundlePages}
        />
      )}

      {mode === "evidence" && entry && !filePath && (
        <EvidenceCanvasPlaceholder />
      )}

      {mode === "drafting" && entry && (
        <DraftingCanvas
          content={entry.tiptapContent}
          entryType={entry.rowType as "cover-page" | "divider"}
          onContentChange={handleContentChange}
        />
      )}
    </div>
  );
}

/**
 * EmptyCanvas
 *
 * Shown when nothing is selected or a section break is selected.
 */
interface EmptyCanvasProps {
  entry: IndexEntry | null;
}

function EmptyCanvas({ entry }: EmptyCanvasProps) {
  const isSectionBreak = entry?.rowType === "section-break";

  return (
    <A4PageContainer className="h-full">
      <A4Page className="flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          {isSectionBreak ? (
            <>
              <p className="text-sm font-medium">{entry?.sectionLabel}</p>
              <p className="text-xs mt-1">
                Section breaks don't have page content
              </p>
            </>
          ) : (
            <p className="text-sm">Select a document to preview</p>
          )}
        </div>
      </A4Page>
    </A4PageContainer>
  );
}
