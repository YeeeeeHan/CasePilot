/**
 * A4Page Component
 *
 * A container that enforces A4 dimensions (210mm x 297mm) for content.
 * Used for both the DraftingCanvas (TipTap) and EvidenceCanvas (PDF) to
 * ensure consistent sizing and proper page break visualization.
 *
 * Supports forwardRef for intersection observer integration.
 */

import { cn } from "@/lib/utils";
import { A4_DIMENSIONS } from "@/types/canvas";
import { forwardRef } from "react";

interface A4PageProps {
  children: React.ReactNode;
  /** Optional page number for multi-page content */
  pageNumber?: number;
  /** Whether to show a visual page break indicator */
  showPageBreak?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const A4Page = forwardRef<HTMLDivElement, A4PageProps>(
  ({ children, pageNumber, showPageBreak = false, className }, ref) => {
    return (
      <div
        ref={ref}
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
          // Performance: defer rendering of off-screen pages
          contentVisibility: "auto",
          containIntrinsicSize: `${A4_DIMENSIONS.WIDTH_PX}px ${A4_DIMENSIONS.HEIGHT_PX}px`,
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
  },
);

A4Page.displayName = "A4Page";

/**
 * A4PageContainer
 *
 * Wrapper for multi-page A4 content in a continuous scroll layout.
 * Provides proper spacing between pages (like Adobe Acrobat).
 *
 * Note: No overflow property here - scrolling is handled by the parent
 * ScrollArea in PreviewPane to allow sticky headers to work properly.
 */
interface A4PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function A4PageContainer({ children, className }: A4PageContainerProps) {
  return (
    <div
      className={cn(
        // Vertical stacking with consistent gap (like PDF readers)
        // Balanced padding: py-3 for top/bottom, px-3 for left/right
        "flex flex-col items-center gap-3 py-3 px-3",
        // Gray background to contrast white pages
        "bg-muted/50",
        className,
      )}
    >
      {children}
    </div>
  );
}
