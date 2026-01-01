/**
 * EvidenceCanvas Component
 *
 * Renders imported PDF documents as immutable evidence.
 * Uses react-pdf to display PDF pages with page stamp overlays.
 *
 * Key features:
 * - PDF pages rendered on white A4 canvas
 * - Page stamp overlay that updates on reorder
 * - Page navigation controls
 * - "Locked" indicator (read-only)
 */

import { useState, useCallback } from "react";
import { Document, Page } from "react-pdf";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Lock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { A4Page, A4PageContainer } from "./A4Page";
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
  /** Optional: specific page to display (1-indexed) */
  currentPage?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export function EvidenceCanvas({
  filePath,
  globalPageStart,
  totalBundlePages,
  currentPage = 1,
  onPageChange,
  className,
}: EvidenceCanvasProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(currentPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  };

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  };

  // Calculate global page number for the current page
  const globalPageNumber = globalPageStart + pageNumber - 1;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with locked indicator and navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        {/* Locked indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Evidence (Read-only)</span>
        </div>

        {/* Page navigation */}
        {numPages && numPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* PDF Content */}
      <A4PageContainer className="flex-1">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full text-destructive">
            {error}
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className={loading ? "hidden" : ""}
        >
          <A4Page>
            {/* The PDF page */}
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mx-auto"
            />

            {/* Page stamp overlay - updates on reorder */}
            <PageStampOverlay
              pageNumber={globalPageNumber}
              totalPages={totalBundlePages}
            />
          </A4Page>
        </Document>
      </A4PageContainer>
    </div>
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
