/**
 * RepositoryItem Component
 *
 * Individual file row in the Repository panel.
 * Handles drag-start logic and visual states.
 */

import { memo } from "react";
import { Check, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface RepositoryFile {
  id: string;
  name: string;
  filePath: string;
  pageCount?: number;
  isLinked: boolean;
}

interface RepositoryItemProps {
  file: RepositoryFile;
  isSelected: boolean;
  onSelect?: (fileId: string) => void;
  onDoubleClick?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
}

export const RepositoryItem = memo(function RepositoryItem({
  file,
  isSelected,
  onSelect,
  onDoubleClick,
  onDelete,
}: RepositoryItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    const fileData = JSON.stringify({
      id: file.id,
      name: file.name,
      path: file.filePath,
      pageCount: file.pageCount,
    });
    e.dataTransfer.setData("application/x-casepilot-file", fileData);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="group relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            draggable
            onClick={() => onSelect?.(file.id)}
            onDoubleClick={() => {
              if (!file.isLinked) {
                onDoubleClick?.(file.id);
              }
            }}
            onDragStart={handleDragStart}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors pr-7 cursor-grab active:cursor-grabbing",
              isSelected
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted",
              file.isLinked && "opacity-50",
            )}
          >
            {file.isLinked ? (
              <Check className="h-3 w-3 shrink-0 text-green-500" />
            ) : (
              <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate flex-1">{file.name}</span>
            {file.pageCount && (
              <span className="text-muted-foreground shrink-0">
                {file.pageCount}p
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <p className="font-medium">{file.name}</p>
          {file.pageCount && (
            <p className="text-muted-foreground">{file.pageCount} pages</p>
          )}
          {file.isLinked ? (
            <p className="text-green-500">In Master Index</p>
          ) : (
            <p className="text-muted-foreground">Double-click to add</p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Delete button on hover */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(file.id);
        }}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Delete file</span>
      </Button>
    </div>
  );
});

