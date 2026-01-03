/**
 * EvidenceCanvas Component
 *
 * Renders imported PDF documents as immutable evidence in a continuous vertical scroll.
 * Uses react-pdf with virtualization for performance (only renders visible pages).
 *
 * Key features:
 * - All PDF pages rendered vertically (like Adobe Acrobat)
 * - Virtualized rendering via IntersectionObserver for performance
 * - Page stamp overlay that updates on reorder
 * - Collapsible sticky header with "Locked" indicator
 */

import { convertFileSrc } from "@tauri-apps/api/core";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Document, Page } from "react-pdf";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { A4_DIMENSIONS } from "@/types/canvas";
import { A4Page, A4PageContainer } from "./A4Page";
import { PageSkeleton } from "./PageSkeleton";
import { PageStampOverlay } from "./PageStampOverlay";
import { useVirtualWindow } from "./hooks/useVirtualWindow";

// Import PDF.js worker configuration
import "@/lib/pdfWorker";
// Note: CSS imports for AnnotationLayer and TextLayer are not needed
// since we disable both with renderTextLayer={false} and renderAnnotationLayer={false}

interface EvidenceCanvasProps {
  /** Path to the PDF file */
  filePath: string;
  /** First page number in the global bundle */
  globalPageStart: number;
  /** Total pages in the entire bundle */
  totalBundlePages: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when header is clicked to scroll to top of PDF */
  onScrollToTop?: () => void;
  /** Offset for sticky header to account for section header */
  stickyOffset?: number;
  /** Document description for the header */
  description?: string;
}

/**
 * VirtualizedPage Component
 *
 * Renders a single PDF page with lazy loading.
 * Only renders the heavy pdf.js <Page> when in viewport.
 */
interface VirtualizedPageProps {
  pageNumber: number;
  globalPageNumber: number;
  totalBundlePages: number;
}

/**
 * VirtualizedPage - Memoized for performance
 * Only re-renders when page numbers or visibility changes
 *
 * Uses CSS variable --page-width from PreviewPane for consistent scaling
 */
const VirtualizedPage = memo(function VirtualizedPage({
  pageNumber,
  globalPageNumber,
  totalBundlePages,
}: VirtualizedPageProps) {
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: false,
    rootMargin: "200px",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>(A4_DIMENSIONS.WIDTH_PX);

  // Combined ref callback
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof inViewRef === "function") {
        inViewRef(node);
      } else if (inViewRef) {
        (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
      }
    },
    [inViewRef],
  );

  // Read --page-width CSS variable (set by PreviewPane) for consistent scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const computed = getComputedStyle(container);
      const cssWidth = computed.getPropertyValue("--page-width");
      if (cssWidth) {
        const width = parseFloat(cssWidth);
        if (!isNaN(width) && width > 0) {
          setPageWidth(width);
        }
      }
    };

    updateWidth();

    // Re-check on resize (CSS variable changes when PreviewPane resizes)
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <A4Page ref={setRefs}>
      {inView ? (
        <>
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
          <PageStampOverlay
            pageNumber={globalPageNumber}
            totalPages={totalBundlePages}
          />
        </>
      ) : (
        <PageSkeleton />
      )}
    </A4Page>
  );
});

/**
 * VirtualizedPageList - Only creates React components for visible pages
 *
 * For a 1000-page PDF, instead of creating 1000 VirtualizedPage components,
 * this only creates ~20-30 components (visible + buffer) and uses padding
 * to maintain correct scroll height.
 */
interface VirtualizedPageListProps {
  numPages: number;
  globalPageStart: number;
  totalBundlePages: number;
}

const VirtualizedPageList = memo(function VirtualizedPageList({
  numPages,
  globalPageStart,
  totalBundlePages,
}: VirtualizedPageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Include gap (12px = gap-3) in item height for accurate virtualization
  const GAP_PX = 12;
  const [itemHeight, setItemHeight] = useState<number>(
    A4_DIMENSIONS.HEIGHT_PX + GAP_PX,
  );

  // Read dynamic page height from CSS variable
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateItemHeight = () => {
      const pageHeight =
        getComputedStyle(container).getPropertyValue("--page-height");
      if (pageHeight) {
        const height = parseFloat(pageHeight);
        if (!isNaN(height) && height > 0) {
          // Add gap to get total item height for virtualization
          setItemHeight(height + GAP_PX);
        }
      }
    };

    updateItemHeight();

    const resizeObserver = new ResizeObserver(updateItemHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const { startIndex, endIndex, topPadding, bottomPadding } = useVirtualWindow({
    totalItems: numPages,
    itemHeight,
    overscan: 3, // Render 3 pages above/below viewport
    containerRef: containerRef as React.RefObject<HTMLElement>,
  });

  // Only create page components for the visible range
  const visiblePages = useMemo(() => {
    const pages = [];
    for (let i = startIndex; i < endIndex; i++) {
      pages.push(
        <VirtualizedPage
          key={i}
          pageNumber={i + 1}
          globalPageNumber={globalPageStart + i}
          totalBundlePages={totalBundlePages}
        />,
      );
    }
    return pages;
  }, [startIndex, endIndex, globalPageStart, totalBundlePages]);

  // Return a simple flex container - no A4Page wrapper (each VirtualizedPage has its own)
  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      {/* Top padding for pages above viewport */}
      {topPadding > 0 && <div style={{ height: topPadding }} aria-hidden />}

      {/* Only render visible pages */}
      {visiblePages}

      {/* Bottom padding for pages below viewport */}
      {bottomPadding > 0 && (
        <div style={{ height: bottomPadding }} aria-hidden />
      )}
    </div>
  );
});

export function EvidenceCanvas({
  filePath,
  globalPageStart,
  totalBundlePages,
  className,
  onScrollToTop,
  stickyOffset = 0,
  description: _description,
}: EvidenceCanvasProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Convert file path to Tauri asset URL
  const pdfUrl = convertFileSrc(filePath);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      setError(null);
    },
    [],
  );

  const onDocumentLoadError = useCallback(
    (error: Error) => {
      console.error("PDF load error:", error);
      console.error("Attempted URL:", pdfUrl);
      console.error("Original file path:", filePath);
      setError(`Failed to load PDF file.`);
      setLoading(false);
    },
    [pdfUrl, filePath],
  );

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => setIsCollapsed(!open)}
      className={cn("flex flex-col", className)}
    >
      {/* Header with locked indicator and collapse toggle - sticky below section header */}
      <div
        className="z-10 flex items-center justify-between px-4 py-2 border-b bg-muted/95 backdrop-blur-sm rounded-t-lg sticky"
        style={{ top: stickyOffset }}
      >
        {/* Document info - click to scroll to top */}
        <div
          className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors"
          onClick={() => onScrollToTop?.()}
        >
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Description (Read-only)</span>
          {numPages && (
            <span className="text-xs text-muted-foreground opacity-70">
              - {numPages} page{numPages > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Collapse toggle */}
        <CollapsibleTrigger asChild>
          <button
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Toggle collapse"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isCollapsed && "-rotate-90",
              )}
            />
          </button>
        </CollapsibleTrigger>
      </div>

      {/* PDF Content */}
      <CollapsibleContent>
        <A4PageContainer>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 text-destructive">
              {error}
            </div>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className={cn(loading && "hidden")}
          >
            {numPages && (
              <VirtualizedPageList
                numPages={numPages}
                globalPageStart={globalPageStart}
                totalBundlePages={totalBundlePages}
              />
            )}
          </Document>
        </A4PageContainer>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * EvidenceCanvasPlaceholder
 *
 * Shown when no PDF is loaded or file path is invalid.
 */
export function EvidenceCanvasPlaceholder() {
  return (
    <A4PageContainer className="h-full">
      <A4Page className="flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Lock className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Select a document to preview</p>
        </div>
      </A4Page>
    </A4PageContainer>
  );
}
