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

import { convertFileSrc } from '@tauri-apps/api/core';
import { ChevronDown, Loader2, Lock } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Document, Page } from 'react-pdf';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { A4_DIMENSIONS } from '@/types/canvas';
import { A4Page, A4PageContainer } from './A4Page';
import { PageSkeleton } from './PageSkeleton';
import { PageStampOverlay } from './PageStampOverlay';
import { useVirtualWindow } from './hooks/useVirtualWindow';

// Import PDF.js worker configuration
import '@/lib/pdfWorker';
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

/**
 * VirtualizedPage - Memoized for performance
 * Only re-renders when page numbers or visibility changes
 */
const VirtualizedPage = memo(function VirtualizedPage({
  pageNumber,
  globalPageNumber,
  totalBundlePages,
}: VirtualizedPageProps) {
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: false, // Re-render when scrolling back
    rootMargin: '200px', // Pre-load pages 200px before visible
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);

  // Combined ref callback for intersection observer and width measurement
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof inViewRef === 'function') {
        inViewRef(node);
      } else if (inViewRef) {
        (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
      }
    },
    [inViewRef]
  );

  // Measure container width and update when it changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const width = container.offsetWidth;
      if (width > 0) {
        setPageWidth(width);
      }
    };

    // Initial measurement
    updateWidth();

    // Observe resize
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <A4Page ref={setRefs} className="w-full max-w-full">
      {inView ? (
        <>
          <Page
            pageNumber={pageNumber}
            width={pageWidth || A4_DIMENSIONS.WIDTH_PX}
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
  const [itemHeight, setItemHeight] = useState<number>(A4_DIMENSIONS.HEIGHT_PX);

  // Read dynamic page height from CSS variable
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateItemHeight = () => {
      const pageHeight =
        getComputedStyle(container).getPropertyValue('--page-height');
      if (pageHeight) {
        const height = parseInt(pageHeight, 10);
        if (!isNaN(height) && height > 0) {
          setItemHeight(height);
        }
      }
    };

    // Initial measurement
    updateItemHeight();

    // Observe for CSS variable changes (when container resizes)
    const resizeObserver = new ResizeObserver(updateItemHeight);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
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
        />
      );
    }
    return pages;
  }, [startIndex, endIndex, globalPageStart, totalBundlePages]);

  return (
    <A4Page>
      <div ref={containerRef} className="flex flex-col gap-6">
        {/* Top padding for pages above viewport */}
        {topPadding > 0 && <div style={{ height: topPadding }} aria-hidden />}

        {/* Only render visible pages */}
        {visiblePages}

        {/* Bottom padding for pages below viewport */}
        {bottomPadding > 0 && (
          <div style={{ height: bottomPadding }} aria-hidden />
        )}
      </div>
    </A4Page>
  );
});

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
      setNumPages(numPages);
      setLoading(false);
      setError(null);
    },
    []
  );

  const onDocumentLoadError = useCallback(
    (error: Error) => {
      console.error('PDF load error:', error);
      console.error('Attempted URL:', pdfUrl);
      console.error('Original file path:', filePath);
      setError(`Failed to load PDF file.`);
      setLoading(false);
    },
    [pdfUrl, filePath]
  );

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => setIsCollapsed(!open)}
      className={cn('flex flex-col', className)}
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
              - {numPages} page{numPages > 1 ? 's' : ''}
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
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                isCollapsed && '-rotate-90'
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
            className={cn(loading && 'hidden')}
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
