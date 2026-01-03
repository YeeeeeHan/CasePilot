/**
 * FileInspector Component
 *
 * Inspector panel content for repository file selection.
 * Compact, VS Code-like density with PDF thumbnail preview.
 */

import { convertFileSrc } from "@tauri-apps/api/core";
import { Check, FileText } from "lucide-react";
import { useState } from "react";
import { Document, Page } from "react-pdf";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WorkbenchMode } from "@/types/domain";

import "@/lib/pdfWorker";

export interface InspectorFile {
  id: string;
  name: string;
  filePath: string;
  pageCount?: number;
  isLinked: boolean;
}

interface FileInspectorProps {
  mode: WorkbenchMode;
  file: InspectorFile;
  onAddToBundle?: (fileId: string) => void;
}

export function FileInspector({
  mode,
  file,
  onAddToBundle,
}: FileInspectorProps) {
  const isAffidavit = mode === "affidavit";
  const addButtonLabel = isAffidavit ? "Link Exhibit" : "Add to Bundle";
  const linkedStatusLabel = isAffidavit ? "Linked" : "In Bundle";

  const [thumbnailError, setThumbnailError] = useState(false);

  // Get PDF URL for thumbnail
  const pdfUrl = file.filePath ? convertFileSrc(file.filePath) : null;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-2 space-y-2">
        {/* Primary Action - at the top */}
        {!file.isLinked && (
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => onAddToBundle?.(file.id)}
          >
            {addButtonLabel}
          </Button>
        )}

        {/* PDF Thumbnail Preview */}
        {pdfUrl && !thumbnailError && (
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

        {/* File Info */}
        <div className="space-y-1.5">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            File Info
          </h3>

          <div className="space-y-1 text-[11px]">
            <p className="truncate" title={file.name}>
              <span className="font-medium text-muted-foreground">Name:</span>{" "}
              {file.name}
            </p>
            {file.pageCount && (
              <p>
                <span className="font-medium text-muted-foreground">
                  Pages:
                </span>{" "}
                {file.pageCount}
              </p>
            )}
            <p className="flex items-center gap-1">
              <span className="font-medium text-muted-foreground">Status:</span>
              {file.isLinked ? (
                <span className="flex items-center gap-0.5 text-green-600">
                  <Check className="h-3 w-3" /> {linkedStatusLabel}
                </span>
              ) : (
                <span className="text-muted-foreground">Available</span>
              )}
            </p>
          </div>
        </div>

        {/* Path Footer */}
        <div className="pt-1 text-[10px] text-muted-foreground border-t border-border/50 mt-2">
          <p className="truncate pt-1" title={file.filePath}>
            <span className="font-medium">Path:</span>{" "}
            {file.filePath.split(/[\\/]/).pop()}
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
