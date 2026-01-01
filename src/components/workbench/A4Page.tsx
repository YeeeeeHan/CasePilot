/**
 * A4Page Component
 *
 * A container that enforces A4 dimensions (210mm x 297mm) for content.
 * Used for both the DraftingCanvas (TipTap) and EvidenceCanvas (PDF) to
 * ensure consistent sizing and proper page break visualization.
 */

import { cn } from "@/lib/utils";
import { A4_DIMENSIONS } from "@/types/canvas";

interface A4PageProps {
  children: React.ReactNode;
  /** Optional page number for multi-page content */
  pageNumber?: number;
  /** Whether to show a visual page break indicator */
  showPageBreak?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function A4Page({
  children,
  pageNumber,
  showPageBreak = false,
  className,
}: A4PageProps) {
  return (
    <div
      className={cn(
        // A4 dimensions at 96 DPI
        "relative bg-white shadow-md",
        // Centered within parent
        "mx-auto",
        className,
      )}
      style={{
        width: A4_DIMENSIONS.WIDTH_PX,
        minHeight: A4_DIMENSIONS.HEIGHT_PX,
        // Keep consistent aspect ratio when scaling
        aspectRatio: `${A4_DIMENSIONS.WIDTH_MM} / ${A4_DIMENSIONS.HEIGHT_MM}`,
      }}
    >
      {/* Page content */}
      {children}

      {/* Page number indicator (optional) */}
      {pageNumber !== undefined && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground opacity-50">
          Page {pageNumber}
        </div>
      )}

      {/* Page break indicator (shown between pages) */}
      {showPageBreak && (
        <div className="absolute -bottom-4 left-0 right-0 flex items-center justify-center">
          <div className="h-px flex-1 bg-dashed border-t border-dashed border-muted-foreground/30" />
          <span className="px-2 text-xs text-muted-foreground/50">
            Page break
          </span>
          <div className="h-px flex-1 bg-dashed border-t border-dashed border-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

/**
 * A4PageContainer
 *
 * Wrapper for scrollable multi-page A4 content.
 * Provides proper spacing between pages and overflow handling.
 */
interface A4PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function A4PageContainer({ children, className }: A4PageContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-8 p-8",
        // Gray background to contrast white pages
        "bg-muted/50",
        // Allow scrolling for multi-page content
        "overflow-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
