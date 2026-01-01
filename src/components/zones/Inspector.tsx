import { FileText, Calendar, Tag, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IndexEntry } from "./MasterIndex";

export type SelectionSource = "repository" | "master-index";

export interface InspectorFile {
  id: string;
  name: string;
  filePath: string;
  pageCount?: number;
  isLinked: boolean;
}

interface InspectorProps {
  // For repository file selection
  selectedFile: InspectorFile | null;
  // For master index entry selection
  selectedEntry: IndexEntry | null;
  selectionSource: SelectionSource | null;
  // Callbacks
  onDescriptionChange?: (entryId: string, description: string) => void;
  onDateChange?: (entryId: string, date: string) => void;
  onDisputedChange?: (entryId: string, disputed: boolean) => void;
  onAddToBundle?: (fileId: string) => void;
  onRemoveFromBundle?: (entryId: string) => void;
  onClose?: () => void;
}

export function Inspector({
  selectedFile,
  selectedEntry,
  selectionSource,
  onDescriptionChange,
  onDateChange,
  onDisputedChange,
  onAddToBundle,
  onRemoveFromBundle,
  onClose,
}: InspectorProps) {
  const formatPageRange = (start: number, end: number) => {
    if (start === end) return `${start}`;
    return `${start} - ${end}`;
  };

  // Empty state
  if (!selectedFile && !selectedEntry) {
    return (
      <div className="flex flex-col h-full">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Inspector</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col flex-1 items-center justify-center text-muted-foreground p-4">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm text-center">Select a file to inspect</p>
          <p className="text-xs text-center mt-1 opacity-70">
            Click a file from Repository or Master Index
          </p>
        </div>
      </div>
    );
  }

  // Master Index entry selected
  if (selectionSource === "master-index" && selectedEntry) {
    const isSectionBreak = selectedEntry.rowType === "section-break";

    return (
      <div className="flex flex-col h-full">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Inspector</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-full">
          <div className="flex flex-col p-4 space-y-4">
            {/* Metadata Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isSectionBreak ? "Section Break" : "Document Metadata"}
              </h3>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Tag className="h-3 w-3" />
                  {isSectionBreak ? "Section Title" : "Description"}
                </Label>
                <Input
                  id="description"
                  value={
                    isSectionBreak
                      ? selectedEntry.sectionLabel || ""
                      : selectedEntry.description
                  }
                  onChange={(e) =>
                    onDescriptionChange?.(selectedEntry.id, e.target.value)
                  }
                  className="h-8 text-sm"
                  placeholder={
                    isSectionBreak
                      ? "e.g., TAB A - Pleadings"
                      : "e.g., Statement of Claim"
                  }
                />
              </div>

              {/* Date (documents only) */}
              {!isSectionBreak && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="date"
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Calendar className="h-3 w-3" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    value={selectedEntry.date || ""}
                    onChange={(e) =>
                      onDateChange?.(selectedEntry.id, e.target.value)
                    }
                    className="h-8 text-sm"
                    placeholder="14 February 2025"
                  />
                </div>
              )}

              {/* Disputed checkbox (documents only) */}
              {!isSectionBreak && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="disputed"
                    checked={selectedEntry.disputed}
                    onCheckedChange={(checked) =>
                      onDisputedChange?.(selectedEntry.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="disputed"
                    className="text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    Disputed
                  </Label>
                </div>
              )}

              {/* Page info (documents only) */}
              {!isSectionBreak && (
                <div className="pt-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">Pages:</span>{" "}
                    {formatPageRange(
                      selectedEntry.pageStart,
                      selectedEntry.pageEnd,
                    )}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onRemoveFromBundle?.(selectedEntry.id)}
              >
                Remove from Bundle
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Repository file selected
  if (selectionSource === "repository" && selectedFile) {
    return (
      <div className="flex flex-col h-full">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Inspector</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-full">
          <div className="flex flex-col p-4 space-y-4">
            {/* File Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File Info
              </h3>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">
                    Name:
                  </span>{" "}
                  {selectedFile.name}
                </p>
                {selectedFile.pageCount && (
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Pages:
                    </span>{" "}
                    {selectedFile.pageCount}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <span className="font-medium text-muted-foreground">
                    Status:
                  </span>
                  {selectedFile.isLinked ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="h-3.5 w-3.5" /> In Bundle
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Available</span>
                  )}
                </p>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              {!selectedFile.isLinked && (
                <Button
                  className="w-full"
                  onClick={() => onAddToBundle?.(selectedFile.id)}
                >
                  Add to Bundle
                </Button>
              )}
            </div>

            {/* Path Footer */}
            <div className="mt-auto pt-4 text-xs text-muted-foreground">
              <p className="truncate" title={selectedFile.filePath}>
                <span className="font-medium">Path:</span>{" "}
                {selectedFile.filePath.split(/[\\/]/).pop()}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return null;
}
