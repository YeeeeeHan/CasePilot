import { FileText, Calendar, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetadataPaneProps {
  selectedFile: {
    name: string;
    filePath?: string;
    pageCount?: number;
    date?: string;
  } | null;
  className?: string;
}

/**
 * A compact footer displaying metadata for the selected file.
 * Shows: name, path, page count, date.
 */
export function MetadataPane({ selectedFile, className }: MetadataPaneProps) {
  if (!selectedFile) {
    return (
      <div
        className={cn(
          "px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground",
          className,
        )}
      >
        No file selected
      </div>
    );
  }

  return (
    <div
      className={cn(
        "px-3 py-2 border-t border-border bg-muted/30 space-y-1",
        className,
      )}
    >
      {/* File name */}
      <div className="flex items-center gap-2 text-xs">
        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">{selectedFile.name}</span>
      </div>

      {/* Path (if different from name) */}
      {selectedFile.filePath && selectedFile.filePath !== selectedFile.name && (
        <div className="text-[10px] text-muted-foreground truncate pl-5">
          {selectedFile.filePath}
        </div>
      )}

      {/* Page count and date row */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pl-5">
        {selectedFile.pageCount && (
          <div className="flex items-center gap-1">
            <Hash className="h-2.5 w-2.5" />
            <span>{selectedFile.pageCount} pages</span>
          </div>
        )}
        {selectedFile.date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            <span>{selectedFile.date}</span>
          </div>
        )}
      </div>
    </div>
  );
}
