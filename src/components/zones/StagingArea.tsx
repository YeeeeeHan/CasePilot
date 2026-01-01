import { useEffect, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Upload, Circle, CircleDot, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export type TriageStatus = "unprocessed" | "processed" | "bundled";

export interface StagedFile {
  id: string;
  name: string;
  filePath: string;
  status: TriageStatus;
  pageCount?: number;
  metadata?: {
    date?: string;
    sender?: string;
    recipient?: string;
  };
}

interface StagingAreaProps {
  files: StagedFile[];
  onFileDrop?: (filePaths: string[]) => void;
  onFileSelect?: (fileId: string) => void;
  onFileDelete?: (fileId: string) => void;
  selectedFileId?: string | null;
}

// Module-level flag shared across all component instances
// This prevents duplicate processing when React StrictMode creates multiple listeners
let isProcessingDrop = false;

const statusConfig: Record<
  TriageStatus,
  { icon: typeof Circle; label: string; className: string }
> = {
  unprocessed: {
    icon: Circle,
    label: "Unprocessed",
    className: "text-muted-foreground",
  },
  processed: {
    icon: CircleDot,
    label: "Processed",
    className: "text-yellow-500",
  },
  bundled: {
    icon: CheckCircle2,
    label: "Bundled",
    className: "text-green-500",
  },
};

export function StagingArea({
  files,
  onFileDrop,
  onFileSelect,
  onFileDelete,
  selectedFileId,
}: StagingAreaProps) {
  // Use ref to avoid re-running effect when callback changes
  const onFileDropRef = useRef(onFileDrop);
  onFileDropRef.current = onFileDrop;

  // Listen for Tauri file drop events (Tauri v2 API)
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      console.log("[StagingArea] Setting up drag-drop listener (Tauri v2)...");
      const appWindow = getCurrentWebviewWindow();
      unlisten = await appWindow.onDragDropEvent((event) => {
        if (event.payload.type === "drop") {
          // Guard: prevent concurrent processing (module-level flag shared across all instances)
          if (isProcessingDrop) {
            console.log("[StagingArea] Already processing a drop, ignoring");
            return;
          }
          isProcessingDrop = true;

          const paths = event.payload.paths;
          console.log("[StagingArea] Drop event received:", paths);
          if (onFileDropRef.current && paths.length > 0) {
            console.log(
              "[StagingArea] Calling onFileDrop with",
              paths.length,
              "files",
            );
            onFileDropRef.current(paths);
          }

          // Reset flag after a short delay to allow next drop
          setTimeout(() => {
            isProcessingDrop = false;
            console.log("[StagingArea] Ready for next drop");
          }, 1000);
        }
      });
      console.log("[StagingArea] Drag-drop listener setup complete");
    };

    setupListener();

    return () => {
      if (unlisten) {
        console.log("[StagingArea] Cleaning up drag-drop listener");
        unlisten();
      }
    };
  }, []); // Empty deps - only run once on mount

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Staging Area
          </h2>
          <span className="text-xs text-muted-foreground">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </span>
        </div>

        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              Drop files here to stage
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1">
            {files.map((file) => {
              const config = statusConfig[file.status];
              const StatusIcon = config.icon;

              return (
                <div key={file.id} className="group relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onFileSelect?.(file.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors pr-7",
                          selectedFileId === file.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted",
                          file.status === "bundled" && "opacity-60",
                        )}
                      >
                        <StatusIcon
                          className={cn("h-3 w-3 shrink-0", config.className)}
                        />
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
                      <p className="text-muted-foreground">{config.label}</p>
                      {file.metadata?.date && (
                        <p className="text-muted-foreground">
                          Date: {file.metadata.date}
                        </p>
                      )}
                      {file.status === "bundled" && (
                        <p className="text-green-500">Already in bundle</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  {/* Delete button - show on hover */}
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
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
