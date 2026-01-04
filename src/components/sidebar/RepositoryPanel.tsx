import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Upload,
  Pencil,
  Trash2,
  FileStack,
  FileText,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepositoryItem, type RepositoryFile } from "./RepositoryItem";
import type {
  RepositoryFolder,
  FileFolderAssignment,
} from "@/hooks/features/useFileRepository";
import type { WorkbenchMode } from "@/components/workbench";

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
  onFileSelect?: (
    fileId: string,
    modifiers?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean },
  ) => void;
  onFileDelete?: (fileId: string) => void;
  onFileDrop?: (filePaths: string[]) => void;
  onFileDoubleClick?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onCreateFolder?: (name: string, parentId: string | null) => void;
  onDeleteFolder?: (folderId: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  // Multi-select support
  selectedFileIds?: Set<string>;
  onKeyboardNavigation?: (
    direction: "up" | "down",
    modifiers?: { shiftKey?: boolean },
  ) => void;
  onAddMultipleToBundle?: (fileIds: string[]) => void;
  onDeleteMultiple?: (fileIds: string[]) => void;
  workbenchMode?: WorkbenchMode;
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
  selectedFileIds = new Set(),
  onKeyboardNavigation,
  onAddMultipleToBundle,
  onDeleteMultiple,
  workbenchMode = "bundle",
}: RepositoryPanelProps) {
  // Track expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  // Inline folder creation state (VSCode-style)
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingFolderParentId, setCreatingFolderParentId] = useState<
    string | null
  >(null);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Folder rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");

  // Folder delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  // Ref for keyboard focus
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        onKeyboardNavigation?.(e.key === "ArrowUp" ? "up" : "down", {
          shiftKey: e.shiftKey,
        });
      }
    },
    [onKeyboardNavigation],
  );

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

  // Start inline folder creation (VSCode-style)
  const startFolderCreation = useCallback((parentId: string | null) => {
    setCreatingFolderParentId(parentId);
    setNewFolderName("");
    setCreatingFolder(true);
    // If creating in a folder, expand it
    if (parentId) {
      setExpandedFolders((prev) => new Set([...prev, parentId]));
    }
  }, []);

  // Focus the input when it appears
  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolder]);

  // Handle folder creation confirmation
  const handleFolderCreate = useCallback(() => {
    const trimmedName = newFolderName.trim();
    if (trimmedName) {
      onCreateFolder?.(trimmedName, creatingFolderParentId);
    }
    setCreatingFolder(false);
    setNewFolderName("");
    setCreatingFolderParentId(null);
  }, [newFolderName, creatingFolderParentId, onCreateFolder]);

  // Cancel folder creation
  const cancelFolderCreation = useCallback(() => {
    setCreatingFolder(false);
    setNewFolderName("");
    setCreatingFolderParentId(null);
  }, []);

  // Handler for folder rename - open dialog
  const handleFolderRename = useCallback(
    (folderId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;
      setRenameFolderId(folderId);
      setRenameFolderName(folder.name);
      setRenameDialogOpen(true);
    },
    [folders],
  );

  // Handle rename dialog confirm
  const handleRenameDialogConfirm = useCallback(() => {
    const trimmedName = renameFolderName.trim();
    if (trimmedName && renameFolderId) {
      onRenameFolder?.(renameFolderId, trimmedName);
    }
    setRenameDialogOpen(false);
    setRenameFolderId(null);
    setRenameFolderName("");
  }, [renameFolderName, renameFolderId, onRenameFolder]);

  // Handler for folder delete - opens confirmation dialog
  const handleFolderDeleteClick = useCallback((folderId: string) => {
    setDeleteFolderId(folderId);
    setDeleteConfirmOpen(true);
  }, []);

  // Confirm folder deletion
  const handleFolderDeleteConfirm = useCallback(() => {
    if (deleteFolderId) {
      onDeleteFolder?.(deleteFolderId);
    }
    setDeleteFolderId(null);
  }, [deleteFolderId, onDeleteFolder]);

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
                  "w-full flex items-center gap-1 py-0.5 text-left text-xs hover:bg-accent transition-colors",
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
              <ContextMenuItem onClick={() => startFolderCreation(folder.id)}>
                <FolderPlus className="mr-2" />
                New Subfolder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleFolderDeleteClick(folder.id)}
                variant="destructive"
              >
                <Trash2 className="mr-2" />
                Delete Folder
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {isExpanded && (
            <div>
              {/* Inline folder creation input inside this folder */}
              {creatingFolder && creatingFolderParentId === folder.id && (
                <div
                  className="flex items-center gap-1 py-0.5"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
                >
                  <FolderOpen className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFolderCreate();
                      } else if (e.key === "Escape") {
                        cancelFolderCreation();
                      }
                    }}
                    onBlur={cancelFolderCreation}
                    placeholder="New folder name..."
                    className="flex-1 bg-transparent border-b border-primary text-xs outline-none py-0.5 mr-2"
                  />
                </div>
              )}
              {children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // It's a file
    return (
      <RepositoryItem
        key={node.file.id}
        file={node.file}
        isSelected={selectedFileIds.has(node.file.id)}
        depth={depth}
        onSelect={onFileSelect}
        onDoubleClick={onFileDoubleClick}
        onDelete={onFileDelete}
        onRename={onFileRename}
        onCreateFolder={() => startFolderCreation(null)}
        // Multi-select support
        selectedCount={selectedFileIds.size}
        onAddMultipleToBundle={() =>
          onAddMultipleToBundle?.(Array.from(selectedFileIds))
        }
        onDeleteMultiple={() => onDeleteMultiple?.(Array.from(selectedFileIds))}
        addActionLabel={
          workbenchMode === "affidavit" ? "Add to Affidavit" : "Add to Bundle"
        }
      />
    );
  };

  // Get the add action label based on workbench mode
  const addActionLabel =
    workbenchMode === "affidavit" ? "Add to Affidavit" : "Add to Bundle";
  const addActionIcon =
    workbenchMode === "affidavit" ? (
      <FileText className="mr-2 h-4 w-4" />
    ) : (
      <FileStack className="mr-2 h-4 w-4" />
    );

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="flex flex-col h-full outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Static Header */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Repository
            </span>
            {selectedFileIds.size > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                {selectedFileIds.size} selected
              </span>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => startFolderCreation(null)}
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

        {/* File Tree with background context menu */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex-1 min-h-0">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-2 border-2 border-dashed border-muted-foreground/25 rounded-lg mx-2 my-2">
                  <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Drop files here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="py-0.5">
                    {/* Inline folder creation input at root level */}
                    {creatingFolder && creatingFolderParentId === null && (
                      <div className="flex items-center gap-1 py-0.5 px-2">
                        <FolderOpen className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                        <input
                          ref={newFolderInputRef}
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleFolderCreate();
                            } else if (e.key === "Escape") {
                              cancelFolderCreation();
                            }
                          }}
                          onBlur={cancelFolderCreation}
                          placeholder="New folder name..."
                          className="flex-1 bg-transparent border-b border-primary text-xs outline-none py-0.5"
                        />
                      </div>
                    )}
                    {treeData.map((node) => renderNode(node, 0))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {/* Always show New Folder option */}
            <ContextMenuItem onClick={() => startFolderCreation(null)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
            {/* Multi-select options when multiple files selected */}
            {selectedFileIds.size > 1 && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() =>
                    onAddMultipleToBundle?.(Array.from(selectedFileIds))
                  }
                >
                  {addActionIcon}
                  {addActionLabel} ({selectedFileIds.size} files)
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  variant="destructive"
                  onClick={() =>
                    onDeleteMultiple?.(Array.from(selectedFileIds))
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedFileIds.size} files
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {/* Folder Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Rename Folder
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rename-folder">Folder Name</Label>
                <Input
                  id="rename-folder"
                  value={renameFolderName}
                  onChange={(e) => setRenameFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameDialogConfirm();
                    } else if (e.key === "Escape") {
                      setRenameDialogOpen(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameDialogConfirm}
                disabled={!renameFolderName.trim()}
              >
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Folder Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Folder"
          description="Delete this folder? Files inside will be moved to root."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleFolderDeleteConfirm}
        />
      </div>
    </TooltipProvider>
  );
}
