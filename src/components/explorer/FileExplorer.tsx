import { useEffect, useRef } from "react";
import { Tree, NodeRendererProps } from "react-arborist";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  FileText,
  Check,
  X,
  Upload,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// TYPES
// ============================================================================

export interface ExplorerFile {
  id: string;
  name: string;
  filePath: string;
  pageCount?: number;
  isLinked: boolean;
}

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  data: {
    type: "file" | "folder";
    file?: ExplorerFile;
  };
}

interface FileExplorerProps {
  files: ExplorerFile[];
  selectedFileId?: string | null;
  onFileSelect?: (fileId: string) => void;
  onFileDelete?: (fileId: string) => void;
  onFileDrop?: (filePaths: string[]) => void;
  onFileDoubleClick?: (fileId: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert flat file list to tree structure.
 * Groups files by their parent directory.
 */
function buildTree(files: ExplorerFile[]): TreeNode[] {
  // For now, keep it flat - just wrap files as tree nodes
  // This can be extended to parse paths and create folder hierarchy
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    data: { type: "file" as const, file },
  }));
}

// Module-level flag to prevent duplicate drop processing
let isProcessingDrop = false;

// ============================================================================
// NODE RENDERER
// ============================================================================

interface NodeProps extends NodeRendererProps<TreeNode> {
  onDelete?: (fileId: string) => void;
}

function Node({ node, style, dragHandle, onDelete }: NodeProps) {
  const file = node.data.data.file;
  const isFolder = node.data.data.type === "folder";
  const isSelected = node.isSelected;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    node.select();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      node.toggle();
    }
    // File double-click is handled via tree's onActivate
  };

  // Custom drag handlers to set dataTransfer for HTML5 drop targets
  const handleDragStart = (e: React.DragEvent) => {
    if (file && !isFolder) {
      const fileData = {
        id: file.id,
        name: file.name,
        path: file.filePath,
        pageCount: file.pageCount,
      };
      e.dataTransfer.setData(
        "application/x-casepilot-file",
        JSON.stringify(fileData),
      );
      e.dataTransfer.effectAllowed = "copy";
    }
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      draggable={!isFolder}
      className={cn(
        "group flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer select-none",
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
        file?.isLinked && "opacity-50",
        !isFolder && "cursor-grab active:cursor-grabbing",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
    >
      {/* Expand/collapse for folders */}
      {isFolder ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
          className="w-4 h-4 flex items-center justify-center"
        >
          {node.isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
      ) : (
        <span className="w-4" /> // Spacer for alignment
      )}

      {/* Icon */}
      {isFolder ? (
        node.isOpen ? (
          <FolderOpen className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
        )
      ) : file?.isLinked ? (
        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}

      {/* Name */}
      <span className="truncate flex-1">{node.data.name}</span>

      {/* Page count */}
      {file?.pageCount && (
        <span className="text-muted-foreground shrink-0 text-[10px]">
          {file.pageCount}p
        </span>
      )}

      {/* Delete button (files only) */}
      {!isFolder && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            if (file) onDelete(file.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// FILE EXPLORER
// ============================================================================

export function FileExplorer({
  files,
  selectedFileId,
  onFileSelect,
  onFileDelete,
  onFileDrop,
  onFileDoubleClick,
}: FileExplorerProps) {
  const treeRef = useRef<any>(null);
  const onFileDropRef = useRef(onFileDrop);
  onFileDropRef.current = onFileDrop;

  // Build tree data from files
  const treeData = buildTree(files);

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

  // Handle selection change
  const handleSelect = (nodes: any[]) => {
    if (nodes.length > 0 && nodes[0].data.data.type === "file") {
      const file = nodes[0].data.data.file;
      if (file && onFileSelect) {
        onFileSelect(file.id);
      }
    }
  };

  // Handle double-click (activate)
  const handleActivate = (node: any) => {
    if (node.data.data.type === "file") {
      const file = node.data.data.file;
      if (file && !file.isLinked && onFileDoubleClick) {
        onFileDoubleClick(file.id);
      }
    }
  };

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-2 border-2 border-dashed border-muted-foreground/25 rounded-lg mx-1 my-1">
        <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
        <p className="text-xs text-muted-foreground text-center">
          Drop files here
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full">
        <Tree
          ref={treeRef}
          data={treeData}
          width="100%"
          height={400}
          indent={16}
          rowHeight={28}
          paddingBottom={20}
          selection={selectedFileId || undefined}
          onSelect={handleSelect}
          onActivate={handleActivate}
          disableDrag={true}
          disableDrop={true}
        >
          {(props) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Node {...props} onDelete={onFileDelete} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {props.node.data.data.file && (
                  <>
                    <p className="font-medium">{props.node.data.name}</p>
                    {props.node.data.data.file.pageCount && (
                      <p className="text-muted-foreground">
                        {props.node.data.data.file.pageCount} pages
                      </p>
                    )}
                    {props.node.data.data.file.isLinked ? (
                      <p className="text-green-500">In Master Index</p>
                    ) : (
                      <p className="text-muted-foreground">
                        Double-click to add
                      </p>
                    )}
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </Tree>
      </div>
    </TooltipProvider>
  );
}
