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
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Document, Page } from "react-pdf";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { A4Page, A4PageContainer } from "./A4Page";
import { PageSkeleton } from "./PageSkeleton";
import { PageStampOverlay } from "./PageStampOverlay";

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

function VirtualizedPage({
  pageNumber,
  globalPageNumber,
  totalBundlePages,
}: VirtualizedPageProps) {
  const { ref, inView } = useInView({
    triggerOnce: false, // Re-render when scrolling back
    rootMargin: "200px", // Pre-load pages 200px before visible
  });

  useEffect(() => {
    console.debug("[VirtualizedPage] visibility change", {
      pageNumber,
      inView,
    });
  }, [inView, pageNumber]);

  return (
    <A4Page ref={ref}>
      {inView ? (
        <>
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto"
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
}

export function EvidenceCanvas({
  filePath,
  globalPageStart,
  totalBundlePages,
  className,
  onScrollToTop,
}: EvidenceCanvasProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Convert file path to Tauri asset URL
  const pdfUrl = convertFileSrc(filePath);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      console.debug("[EvidenceCanvas] document load success", { numPages });
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
      {/* Header with locked indicator and collapse toggle - sticky for scroll tracking */}
      <div className="z-10 flex items-center justify-between px-4 py-2 border-b bg-muted/95 backdrop-blur-sm rounded-t-lg sticky top-0">
        {/* Locked indicator - click to scroll to top */}
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          onClick={() => onScrollToTop?.()}
        >
          <Lock className="h-4 w-4" />
          <span>Evidence (Read-only)</span>
          {numPages && (
            <span className="text-xs opacity-70">
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
            className={cn("flex flex-col gap-6", loading && "hidden")}
          >
            {numPages &&
              Array.from({ length: numPages }, (_, i) => (
                <VirtualizedPage
                  key={i}
                  pageNumber={i + 1}
                  globalPageNumber={globalPageStart + i}
                  totalBundlePages={totalBundlePages}
                />
              ))}
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
