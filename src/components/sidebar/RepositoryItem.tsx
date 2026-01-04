/**
 * RepositoryItem Component
 *
 * Individual file row in the Repository panel.
 * VS Code-style: compact, context menu actions, dynamic icons.
 */

import { memo, useCallback, useRef, useState } from "react";
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
import { useDragContext } from "@/contexts/DragContext";
import { InputDialog } from "@/components/ui/confirm-dialog";
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

// Create an exact clone of the dragged element for drag preview
function createDragPreviewFromElement(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  // Style the clone for drag preview
  clone.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    opacity: 0.9;
    max-width: 220px;
    display: flex;
    align-items: center;
    gap: 6px;
  `;

  document.body.appendChild(clone);
  return clone;
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
  const dragPreviewRef = useRef<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { startDrag, endDrag } = useDragContext();

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      // Store file data in context for cross-component access
      // This bypasses HTML5 dataTransfer limitations with dnd-kit
      const fileData = {
        id: file.id,
        name: file.name,
        path: file.filePath,
        pageCount: file.pageCount,
      };
      startDrag(fileData);

      // Also set dataTransfer for compatibility
      e.dataTransfer.setData(
        "application/x-casepilot-file",
        JSON.stringify(fileData),
      );
      e.dataTransfer.setData("text/plain", file.name);
      e.dataTransfer.effectAllowed = "copyMove";

      // Create exact clone of the element as drag preview
      if (dragPreviewRef.current && dragPreviewRef.current.parentNode) {
        document.body.removeChild(dragPreviewRef.current);
      }

      const targetElement =
        buttonRef.current || (e.currentTarget as HTMLElement);
      dragPreviewRef.current = createDragPreviewFromElement(targetElement);
      e.dataTransfer.setDragImage(dragPreviewRef.current, 10, 10);

      // Clean up the preview element after browser captures it
      requestAnimationFrame(() => {
        if (dragPreviewRef.current && dragPreviewRef.current.parentNode) {
          document.body.removeChild(dragPreviewRef.current);
          dragPreviewRef.current = null;
        }
      });
    },
    [file, startDrag],
  );

  const handleDragEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleDelete = useCallback(() => {
    onDelete?.(file.id);
  }, [file.id, onDelete]);

  const handleRenameClick = useCallback(() => {
    setRenameDialogOpen(true);
  }, []);

  const handleRenameConfirm = useCallback(
    (newName: string) => {
      if (newName && newName !== file.name) {
        onRename?.(file.id, newName);
      }
    },
    [file.id, file.name, onRename],
  );

  const handleCreateFolder = useCallback(() => {
    onCreateFolder?.(null);
  }, [onCreateFolder]);

  return (
    <ContextMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <ContextMenuTrigger asChild>
            <button
              ref={buttonRef}
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
              onDragEnd={handleDragEnd}
              className={cn(
                "w-full flex items-center gap-1.5 py-0.5 pr-2 text-left text-xs transition-colors cursor-grab active:cursor-grabbing",
                isSelected
                  ? "bg-primary/15 text-foreground ring-1 ring-inset ring-primary/30"
                  : "hover:bg-accent/50",
                file.isLinked && "opacity-60 bg-muted/50",
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
            <ContextMenuItem onClick={handleRenameClick}>
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

      {/* Rename Dialog */}
      <InputDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        title="Rename File"
        label="File Name"
        defaultValue={file.name}
        confirmLabel="Rename"
        onConfirm={handleRenameConfirm}
      />
    </ContextMenu>
  );
});
