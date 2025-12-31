import { Upload, Circle, CircleDot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type TriageStatus = "unprocessed" | "processed" | "bundled";

export interface StagedFile {
  id: string;
  name: string;
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
  onFileDrop?: (files: FileList) => void;
  onFileSelect?: (fileId: string) => void;
  selectedFileId?: string | null;
}

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
  selectedFileId,
}: StagingAreaProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFileDrop && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  };

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
          <div
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              Drop files here to stage
            </p>
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto space-y-1"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {files.map((file) => {
              const config = statusConfig[file.status];
              const StatusIcon = config.icon;

              return (
                <Tooltip key={file.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onFileSelect?.(file.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors",
                        selectedFileId === file.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted",
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
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
