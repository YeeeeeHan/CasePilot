import { FileText, Calendar, Tag, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // All entries for TOC preview
  entries: IndexEntry[];
  // Callbacks
  onDescriptionChange?: (entryId: string, description: string) => void;
  onDateChange?: (entryId: string, date: string) => void;
  onDisputedChange?: (entryId: string, disputed: boolean) => void;
  onAddToBundle?: (fileId: string) => void;
  onRemoveFromBundle?: (entryId: string) => void;
}

// Generate alphabetical section labels
function generateSectionLabel(index: number): string {
  let label = "";
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function Inspector({
  selectedFile,
  selectedEntry,
  selectionSource,
  entries,
  onDescriptionChange,
  onDateChange,
  onDisputedChange,
  onAddToBundle,
  onRemoveFromBundle,
}: InspectorProps) {
  // Calculate display numbers for TOC preview
  const getDisplayNumber = (entry: IndexEntry, index: number): string => {
    if (entry.rowType === "section-break") {
      let sectionCount = 0;
      for (let i = 0; i <= index; i++) {
        if (entries[i].rowType === "section-break") sectionCount++;
      }
      return `${generateSectionLabel(sectionCount - 1)}.`;
    } else {
      let docCount = 0;
      for (let i = 0; i <= index; i++) {
        if (entries[i].rowType === "document") docCount++;
      }
      return `${docCount}.`;
    }
  };

  const formatPageRange = (start: number, end: number) => {
    if (start === end) return `${start}`;
    return `${start} - ${end}`;
  };

  // Empty state
  if (!selectedFile && !selectedEntry) {
    return (
      <div className="flex flex-col h-full">
        <Tabs defaultValue="file" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="file">File</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="flex-1">
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-4">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm text-center">Select a file to inspect</p>
              <p className="text-xs text-center mt-1 opacity-70">
                Click a file from Repository or Master Index
              </p>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <TOCPreview
              entries={entries}
              getDisplayNumber={getDisplayNumber}
              formatPageRange={formatPageRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Master Index entry selected
  if (selectionSource === "master-index" && selectedEntry) {
    const isSectionBreak = selectedEntry.rowType === "section-break";

    return (
      <div className="flex flex-col h-full">
        <Tabs defaultValue="file" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="file">File</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col p-4 space-y-4">
                {/* Preview Section */}
                {!isSectionBreak && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Preview
                      </h3>
                      <div className="aspect-[3/4] bg-muted rounded-lg border border-border flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">PDF Preview</p>
                          <p className="text-xs opacity-70">
                            {formatPageRange(
                              selectedEntry.pageStart,
                              selectedEntry.pageEnd,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

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
                          onDisputedChange?.(
                            selectedEntry.id,
                            checked as boolean,
                          )
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
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <TOCPreview
              entries={entries}
              getDisplayNumber={getDisplayNumber}
              formatPageRange={formatPageRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Repository file selected
  if (selectionSource === "repository" && selectedFile) {
    return (
      <div className="flex flex-col h-full">
        <Tabs defaultValue="file" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="file">File</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col p-4 space-y-4">
                {/* Preview Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Preview
                  </h3>
                  <div className="aspect-[3/4] bg-muted rounded-lg border border-border flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">PDF Preview</p>
                      {selectedFile.pageCount && (
                        <p className="text-xs opacity-70">
                          {selectedFile.pageCount} pages
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

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
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <TOCPreview
              entries={entries}
              getDisplayNumber={getDisplayNumber}
              formatPageRange={formatPageRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}

// TOC Preview Component - shows live preview of the generated index
interface TOCPreviewProps {
  entries: IndexEntry[];
  getDisplayNumber: (entry: IndexEntry, index: number) => string;
  formatPageRange: (start: number, end: number) => string;
}

function TOCPreview({
  entries,
  getDisplayNumber,
  formatPageRange,
}: TOCPreviewProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-4">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm text-center">No documents in bundle</p>
        <p className="text-xs text-center mt-1 opacity-70">
          Add documents to see the Index preview
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div
          className="border rounded-lg bg-white p-4"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          {/* Header */}
          <h2 className="text-center font-bold text-sm mb-4">
            INDEX TO BUNDLE OF DOCUMENTS
          </h2>

          {/* Table */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 w-8">No.</th>
                <th className="text-left py-1 w-20">Date</th>
                <th className="text-left py-1">Description</th>
                <th className="text-right py-1 w-16">Page</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const isSectionBreak = entry.rowType === "section-break";
                const displayNumber = getDisplayNumber(entry, index);

                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b",
                      isSectionBreak && "font-bold bg-muted/30",
                    )}
                  >
                    <td className="py-1">{displayNumber}</td>
                    <td className="py-1">
                      {isSectionBreak ? "" : entry.date || ""}
                    </td>
                    <td className="py-1">
                      {isSectionBreak
                        ? entry.sectionLabel || ""
                        : entry.disputed
                          ? `${entry.description} (Disputed)`
                          : entry.description}
                    </td>
                    <td className="text-right py-1">
                      {isSectionBreak
                        ? ""
                        : formatPageRange(entry.pageStart, entry.pageEnd)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Live preview updates as you edit the Master Index
        </p>
      </div>
    </ScrollArea>
  );
}
