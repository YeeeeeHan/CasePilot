/**
 * PageStampOverlay Component
 *
 * Renders the page number stamp overlay on PDF pages.
 * Positioned absolutely within the page container.
 * Updates instantly when documents are reordered.
 *
 * Follows ePD 2021 requirements for page numbering format.
 */

import { cn } from "@/lib/utils";
import type { PageStampConfig } from "@/types/canvas";

interface PageStampOverlayProps {
  /** The global page number in the bundle */
  pageNumber: number;
  /** Total pages in the entire bundle */
  totalPages: number;
  /** Stamp configuration (format and position) */
  config?: PageStampConfig;
  /** Additional CSS classes */
  className?: string;
}

const defaultConfig: PageStampConfig = {
  format: "Page X of Y",
  position: "top-right",
};

export function PageStampOverlay({
  pageNumber,
  totalPages,
  config = defaultConfig,
  className,
}: PageStampOverlayProps) {
  // Format the page number text
  const formatPageNumber = (): string => {
    switch (config.format) {
      case "Page X of Y":
        return `Page ${pageNumber} of ${totalPages}`;
      case "Page X":
        return `Page ${pageNumber}`;
      case "X":
        return `${pageNumber}`;
      default:
        return `Page ${pageNumber} of ${totalPages}`;
    }
  };

  // Position classes based on config
  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "absolute z-10",
        "px-2 py-1",
        "text-xs font-medium",
        // ePD 2021 style: subtle but readable
        "text-foreground/80",
        "pointer-events-none",
        // Position based on config
        positionClasses[config.position],
        className,
      )}
      aria-label={`Page ${pageNumber} of ${totalPages}`}
    >
      {formatPageNumber()}
    </div>
  );
}

/**
 * PageStampPreview
 *
 * A visual preview of how the page stamp will appear on the final PDF.
 * Used in the Inspector or settings to show stamp positioning.
 */
interface PageStampPreviewProps {
  config?: PageStampConfig;
  className?: string;
}

export function PageStampPreview({
  config = defaultConfig,
  className,
}: PageStampPreviewProps) {
  return (
    <div
      className={cn(
        "relative w-24 h-32 border border-border bg-white",
        className,
      )}
    >
      <PageStampOverlay
        pageNumber={1}
        totalPages={10}
        config={config}
        className="text-[8px]"
      />
    </div>
  );
}
