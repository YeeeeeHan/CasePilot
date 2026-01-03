/**
 * RepositoryItem Component
 *
 * Individual file row in the Repository panel.
 * VS Code-style: compact, context menu actions, dynamic icons.
 */

import { memo, useCallback, useRef } from "react";
import {
  Check,
  FileText,
  FileImage,
  FileCode,
  File,
  FileSpreadsheet,
  FileStack,
  Trash2,
  Pencil,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

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
  depth?: number;
  onSelect?: (
    fileId: string,
    modifiers?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean },
  ) => void;
  onDoubleClick?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onRename?: (fileId: string, newName: string) => void;
  onCreateFolder?: (parentId: string | null) => void;
  // Multi-select support
  selectedCount?: number;
  onAddMultipleToBundle?: () => void;
  onDeleteMultiple?: () => void;
  addActionLabel?: string;
}

// Get file extension from filename
function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

// Get appropriate icon based on file extension
function getFileIcon(filename: string) {
  const ext = getFileExtension(filename);

  switch (ext) {
    case "pdf":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "svg":
    case "bmp":
      return <FileImage className="h-3.5 w-3.5 shrink-0 text-purple-500" />;
    case "doc":
    case "docx":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return (
        <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-green-500" />
      );
    case "json":
    case "xml":
    case "html":
    case "js":
    case "ts":
    case "tsx":
    case "jsx":
      return <FileCode className="h-3.5 w-3.5 shrink-0 text-yellow-500" />;
    default:
      return <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
  }
}

// Create a transparent 1x1 pixel image for drag ghost
function createTransparentDragImage(): HTMLImageElement {
  const img = new Image();
  img.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  return img;
}

export const RepositoryItem = memo(function RepositoryItem({
  file,
  isSelected,
  depth = 0,
  onSelect,
  onDoubleClick,
  onDelete,
  onRename,
  onCreateFolder,
  selectedCount = 0,
  onAddMultipleToBundle,
  onDeleteMultiple,
  addActionLabel = "Add to Bundle",
}: RepositoryItemProps) {
  const dragImageRef = useRef<HTMLImageElement | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      // Set custom MIME type with file data
      const fileData = JSON.stringify({
        id: file.id,
        name: file.name,
        path: file.filePath,
        pageCount: file.pageCount,
      });

      // Set both custom MIME type and text fallback for maximum compatibility
      e.dataTransfer.setData("application/x-casepilot-file", fileData);
      e.dataTransfer.setData("text/plain", file.name); // Fallback
      e.dataTransfer.effectAllowed = "copyMove";

      // Use transparent 1x1 pixel to hide default drag ghost
      if (!dragImageRef.current) {
        dragImageRef.current = createTransparentDragImage();
      }
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    },
    [file],
  );

  const handleDelete = useCallback(() => {
    onDelete?.(file.id);
  }, [file.id, onDelete]);

  const handleRename = useCallback(() => {
    // TODO: Implement inline rename or dialog
    const newName = prompt("Rename file:", file.name);
    if (newName && newName !== file.name) {
      onRename?.(file.id, newName);
    }
  }, [file.id, file.name, onRename]);

  const handleCreateFolder = useCallback(() => {
    onCreateFolder?.(null);
  }, [onCreateFolder]);

  return (
    <ContextMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <ContextMenuTrigger asChild>
            <button
              draggable
              onClick={(e) =>
                onSelect?.(file.id, {
                  shiftKey: e.shiftKey,
                  metaKey: e.metaKey,
                  ctrlKey: e.ctrlKey,
                })
              }
              onDoubleClick={() => {
                if (!file.isLinked) {
                  onDoubleClick?.(file.id);
                }
              }}
              onDragStart={handleDragStart}
              className={cn(
                "w-full flex items-center gap-1.5 py-0.5 pr-2 text-left text-xs transition-colors cursor-grab active:cursor-grabbing",
                isSelected
                  ? "bg-neutral-200 dark:bg-neutral-700 text-foreground"
                  : "hover:bg-muted/80",
                file.isLinked && "opacity-50",
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {/* Linked indicator or file icon */}
              {file.isLinked ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
              ) : (
                getFileIcon(file.name)
              )}
              <span className="truncate flex-1">{file.name}</span>
            </button>
          </ContextMenuTrigger>
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

      <ContextMenuContent>
        {/* Show bulk options when multiple files are selected and this file is part of the selection */}
        {selectedCount > 1 && isSelected ? (
          <>
            <ContextMenuItem onClick={onAddMultipleToBundle}>
              <FileStack className="mr-2 h-4 w-4" />
              {addActionLabel} ({selectedCount} files)
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDeleteMultiple} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedCount} files
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onClick={handleRename}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCreateFolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});
