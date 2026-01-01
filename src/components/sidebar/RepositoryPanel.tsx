import { useEffect, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  FolderOpen,
  ChevronDown,
  Check,
  X,
  Upload,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface RepositoryFile {
  id: string;
  name: string;
  filePath: string;
  pageCount?: number;
  isLinked: boolean; // true if this file is in the Master Index
}

interface RepositoryPanelProps {
  files: RepositoryFile[];
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  onFileSelect?: (fileId: string) => void;
  onFileDelete?: (fileId: string) => void;
  onFileDrop?: (filePaths: string[]) => void;
  onFileDoubleClick?: (fileId: string) => void; // Add to Master Index
  selectedFileId?: string | null;
}

// Module-level flag to prevent duplicate drop processing
let isProcessingDrop = false;

export function RepositoryPanel({
  files,
  expanded,
  onToggle,
  onFileSelect,
  onFileDelete,
  onFileDrop,
  onFileDoubleClick,
  selectedFileId,
}: RepositoryPanelProps) {
  // Count files not yet linked to Master Index
  const availableCount = files.filter((f) => !f.isLinked).length;

  // Use ref to avoid re-running effect when callback changes
  const onFileDropRef = useRef(onFileDrop);
  onFileDropRef.current = onFileDrop;

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

  return (
    <TooltipProvider>
      <Collapsible
        open={expanded}
        onOpenChange={onToggle}
        className="space-y-1"
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-left font-medium">Repository</span>
          {availableCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {availableCount}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-2 border-2 border-dashed border-muted-foreground/25 rounded-lg mx-1 my-1">
              <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground text-center">
                Drop files here
              </p>
            </div>
          ) : (
            <ScrollArea>
              <div className="space-y-0.5 px-1 py-1">
                {files.map((file) => (
                  <div key={file.id} className="group relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onFileSelect?.(file.id)}
                          onDoubleClick={() => {
                            if (!file.isLinked) {
                              onFileDoubleClick?.(file.id);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors pr-7",
                            selectedFileId === file.id
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted",
                            file.isLinked && "opacity-50",
                          )}
                        >
                          {/* Linked indicator */}
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
                          <p className="text-muted-foreground">
                            {file.pageCount} pages
                          </p>
                        )}
                        {file.isLinked ? (
                          <p className="text-green-500">In Master Index</p>
                        ) : (
                          <p className="text-muted-foreground">
                            Double-click to add
                          </p>
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
                        onFileDelete?.(file.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Delete file</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
}
