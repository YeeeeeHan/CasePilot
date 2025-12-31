import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BundlePreviewProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onExport?: () => void;
  previewUrl?: string | null;
}

export function BundlePreview({
  currentPage,
  totalPages,
  onPageChange,
  onExport,
  previewUrl,
}: BundlePreviewProps) {
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Bundle Preview
          </h2>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ZoomOut className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onExport}
                  disabled={totalPages === 0}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export bundle</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 bg-muted/30 rounded-lg border overflow-hidden flex items-center justify-center relative">
          {totalPages === 0 ? (
            <div className="text-center text-muted-foreground">
              <p className="text-sm mb-1">No documents in bundle</p>
              <p className="text-xs">
                Add documents to the Master Index to preview
              </p>
            </div>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              {/* Placeholder A4 page representation */}
              <div className="w-48 h-64 bg-white rounded shadow-md border flex flex-col">
                {/* Page stamp indicator */}
                <div className="flex justify-end p-2">
                  <span className="text-[10px] font-mono text-muted-foreground border px-1 rounded">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                {/* Content placeholder */}
                <div className="flex-1 px-4 py-2 space-y-2">
                  <div className="h-2 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-full" />
                  <div className="h-2 bg-muted rounded w-5/6" />
                  <div className="h-2 bg-muted rounded w-2/3" />
                  <div className="h-4" />
                  <div className="h-2 bg-muted rounded w-full" />
                  <div className="h-2 bg-muted rounded w-4/5" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <div className="flex items-center gap-1 text-xs">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-12 text-center bg-muted rounded px-1 py-0.5 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-muted-foreground">of {totalPages}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
