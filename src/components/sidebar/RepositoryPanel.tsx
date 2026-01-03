import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Upload,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { RepositoryItem, type RepositoryFile } from "./RepositoryItem";
import type {
  RepositoryFolder,
  FileFolderAssignment,
} from "@/hooks/features/useFileRepository";

export type { RepositoryFile };

// Tree node types for rendering
export type TreeNode =
  | { type: "folder"; folder: RepositoryFolder; children: TreeNode[] }
  | { type: "file"; file: RepositoryFile };

interface RepositoryPanelProps {
  files: RepositoryFile[];
  folders: RepositoryFolder[];
  fileFolderAssignments: FileFolderAssignment;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  onFileSelect?: (fileId: string) => void;
  onFileDelete?: (fileId: string) => void;
  onFileDrop?: (filePaths: string[]) => void;
  onFileDoubleClick?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onDeleteFolder?: (folderId: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  selectedFileId?: string | null;
}

// Module-level flag to prevent duplicate drop processing
let isProcessingDrop = false;

export function RepositoryPanel({
  files,
  folders,
  fileFolderAssignments,
  onFileSelect,
  onFileDelete,
  onFileDrop,
  onFileDoubleClick,
  onFileRename,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  selectedFileId,
}: RepositoryPanelProps) {
  // Track expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  // Use ref to avoid re-running effect when callback changes
  const onFileDropRef = useRef(onFileDrop);
  onFileDropRef.current = onFileDrop;

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Listen for Tauri file drop events
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      const appWindow = getCurrentWebviewWindow();
      unlisten = await appWindow.onDragDropEvent((event) => {
        if (event.payload.type === "drop") {
          if (isProcessingDrop) return;
          isProcessingDrop = true;

          const paths = event.payload.paths;
          if (onFileDropRef.current && paths.length > 0) {
            onFileDropRef.current(paths);
          }

          setTimeout(() => {
            isProcessingDrop = false;
          }, 1000);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Build tree structure from folders and file assignments
  const treeData = useMemo((): TreeNode[] => {
    // Helper to recursively build folder subtree
    const buildFolderSubtree = (parentId: string | null): TreeNode[] => {
      const result: TreeNode[] = [];

      // Add folders at this level
      const childFolders = folders.filter((f) => f.parentId === parentId);
      for (const folder of childFolders) {
        result.push({
          type: "folder",
          folder,
          children: buildFolderSubtree(folder.id),
        });
      }

      // Add files at this level
      const filesAtLevel = files.filter(
        (f) => (fileFolderAssignments[f.id] ?? null) === parentId,
      );
      for (const file of filesAtLevel) {
        result.push({ type: "file", file });
      }

      return result;
    };

    return buildFolderSubtree(null);
  }, [files, folders, fileFolderAssignments]);

  // Handler for folder rename
  const handleFolderRename = useCallback(
    (folderId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;
      const newName = prompt("Rename folder:", folder.name);
      if (newName && newName !== folder.name) {
        onRenameFolder?.(folderId, newName);
      }
    },
    [folders, onRenameFolder],
  );

  // Handler for folder delete
  const handleFolderDelete = useCallback(
    (folderId: string) => {
      if (confirm("Delete this folder? Files will be moved to root.")) {
        onDeleteFolder?.(folderId);
      }
    },
    [onDeleteFolder],
  );

  // Render a single tree node (file or folder)
  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    if (node.type === "folder") {
      const { folder, children } = node;
      const isExpanded = expandedFolders.has(folder.id);
      return (
        <div key={folder.id}>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button
                onClick={() => toggleFolder(folder.id)}
                className={cn(
                  "w-full flex items-center gap-1 py-0.5 text-left text-xs hover:bg-muted/50 transition-colors",
                )}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 text-muted-foreground shrink-0 transition-transform",
                    isExpanded && "rotate-90",
                  )}
                />
                <FolderOpen className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleFolderRename(folder.id)}>
                <Pencil className="mr-2" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onCreateFolder?.(folder.id)}>
                <FolderPlus className="mr-2" />
                New Subfolder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleFolderDelete(folder.id)}
                variant="destructive"
              >
                <Trash2 className="mr-2" />
                Delete Folder
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {isExpanded && (
            <div>{children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    // It's a file
    return (
      <RepositoryItem
        key={node.file.id}
        file={node.file}
        isSelected={selectedFileId === node.file.id}
        depth={depth}
        onSelect={onFileSelect}
        onDoubleClick={onFileDoubleClick}
        onDelete={onFileDelete}
        onRename={onFileRename}
        onCreateFolder={onCreateFolder}
      />
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Static Header */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50">
          <div className="flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Repository
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onCreateFolder?.(null)}
              >
                <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="sr-only">New Folder</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              New Folder
            </TooltipContent>
          </Tooltip>
        </div>

        {/* File Tree */}
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-2 border-2 border-dashed border-muted-foreground/25 rounded-lg mx-2 my-2">
            <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              Drop files here
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="py-0.5">
              {treeData.map((node) => renderNode(node, 0))}
            </div>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
}
