/**
 * EntryInspector Component
 *
 * Inspector panel content for master index entry selection.
 * Compact, VS Code-like density with PDF thumbnail preview.
 */

import { convertFileSrc } from "@tauri-apps/api/core";
import { AlertTriangle, Calendar, FileText, Tag } from "lucide-react";
import { useCallback, useState } from "react";
import { Document, Page } from "react-pdf";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IndexEntry } from "@/lib/pagination";
import type { WorkbenchMode } from "@/types/domain";

import "@/lib/pdfWorker";

interface EntryInspectorProps {
  mode: WorkbenchMode;
  entry: IndexEntry;
  onDescriptionChange?: (entryId: string, description: string) => void;
  onDateChange?: (entryId: string, date: string) => void;
  onDisputedChange?: (entryId: string, disputed: boolean) => void;
  onRemoveFromBundle?: (entryId: string) => void;
  onExhibitLabelChange?: (entryId: string, label: string) => void;
}

/**
 * Format date to "DD/month/YYYY" format (e.g., "10/october/2025")
 */
function formatDateString(input: string): string {
  // If already in correct format, return as-is
  const ddMonthYearPattern = /^\d{1,2}\/[a-z]+\/\d{4}$/i;
  if (ddMonthYearPattern.test(input)) {
    return input.toLowerCase();
  }

  // Try to parse common date formats
  const date = new Date(input);
  if (!isNaN(date.getTime())) {
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" }).toLowerCase();
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Return input as-is if we can't parse it
  return input;
}

export function EntryInspector({
  mode,
  entry,
  onDescriptionChange,
  onDateChange,
  onDisputedChange,
  onRemoveFromBundle,
  onExhibitLabelChange,
}: EntryInspectorProps) {
  const isSectionBreak = entry.rowType === "section-break";
  const isAffidavit = mode === "affidavit";
  const removeButtonLabel = isAffidavit
    ? "Unlink Exhibit"
    : "Remove from Bundle";

  const [thumbnailError, setThumbnailError] = useState(false);
  const [dateInput, setDateInput] = useState(entry.date || "");

  const formatPageRange = (start: number, end: number) => {
    if (start === end) return `${start}`;
    return `${start}–${end}`;
  };

  // Get PDF URL for thumbnail
  const pdfUrl = entry.filePath ? convertFileSrc(entry.filePath) : null;

  const handleDateBlur = useCallback(() => {
    if (dateInput.trim()) {
      const formatted = formatDateString(dateInput);
      setDateInput(formatted);
      onDateChange?.(entry.id, formatted);
    }
  }, [dateInput, entry.id, onDateChange]);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateInput(e.target.value);
    },
    [],
  );

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-2 space-y-2">
        {/* Primary Action - at the top */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => onRemoveFromBundle?.(entry.id)}
        >
          {removeButtonLabel}
        </Button>

        {/* PDF Thumbnail Preview */}
        {!isSectionBreak && pdfUrl && !thumbnailError && (
          <div className="rounded border border-border overflow-hidden bg-muted/30 flex items-center justify-center p-2">
            <Document
              file={pdfUrl}
              onLoadError={() => setThumbnailError(true)}
              loading={
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-30" />
                </div>
              }
              className="flex items-center justify-center"
            >
              <Page
                pageNumber={1}
                width={180}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-sm"
              />
            </Document>
          </div>
        )}

        {/* Metadata Section */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isSectionBreak ? "Section Break" : "Metadata"}
          </h3>

          {/* Description */}
          <div className="space-y-0.5">
            <Label
              htmlFor="description"
              className="text-[11px] flex items-center gap-1"
            >
              <Tag className="h-2.5 w-2.5" />
              {isSectionBreak ? "Title" : "Description"}
            </Label>
            <Input
              id="description"
              value={
                isSectionBreak ? entry.sectionLabel || "" : entry.description
              }
              onChange={(e) => onDescriptionChange?.(entry.id, e.target.value)}
              className="h-6 text-xs px-2"
              placeholder={
                isSectionBreak ? "e.g., TAB A" : "e.g., Statement of Claim"
              }
            />
          </div>

          {/* Exhibit Label (affidavit mode only) */}
          {isAffidavit && !isSectionBreak && (
            <div className="space-y-0.5">
              <Label
                htmlFor="exhibitLabel"
                className="text-[11px] flex items-center gap-1"
              >
                <Tag className="h-2.5 w-2.5" />
                Exhibit Label
              </Label>
              <Input
                id="exhibitLabel"
                value={entry.exhibitLabel || ""}
                onChange={(e) =>
                  onExhibitLabelChange?.(entry.id, e.target.value)
                }
                className="h-6 text-xs px-2"
                placeholder="e.g., TAK-1"
              />
            </div>
          )}

          {/* Date (bundle mode only, documents only) */}
          {!isAffidavit && !isSectionBreak && (
            <div className="space-y-0.5">
              <Label
                htmlFor="date"
                className="text-[11px] flex items-center gap-1"
              >
                <Calendar className="h-2.5 w-2.5" />
                Date
              </Label>
              <Input
                id="date"
                type="text"
                value={dateInput}
                onChange={handleDateChange}
                onBlur={handleDateBlur}
                className="h-6 text-xs px-2"
                placeholder="10/february/2025"
              />
            </div>
          )}

          {/* Disputed checkbox (bundle mode only, documents only) */}
          {!isAffidavit && !isSectionBreak && (
            <div className="flex items-center space-x-1.5 py-1">
              <Checkbox
                id="disputed"
                checked={entry.disputed}
                onCheckedChange={(checked) =>
                  onDisputedChange?.(entry.id, checked as boolean)
                }
                className="h-3.5 w-3.5"
              />
              <Label
                htmlFor="disputed"
                className="text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
                Disputed
              </Label>
            </div>
          )}

          {/* Page info (documents only) */}
          {!isSectionBreak && (
            <div className="text-[11px] text-muted-foreground py-0.5">
              <span className="font-medium">Pages:</span>{" "}
              {formatPageRange(entry.pageStart, entry.pageEnd)}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
