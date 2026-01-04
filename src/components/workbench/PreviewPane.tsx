/**
 * PreviewPane Component
 *
 * Scrollable preview of the entire bundle.
 * Renders all entries from the master index in sequence.
 *
 * Features:
 * - Dual sticky headers: Section header (Tab) + Item header
 * - Section headers persist through all items until next section
 */

import { FileText, Layers, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IndexEntry } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { A4_DIMENSIONS } from "@/types/canvas";
import { EntryPreviewFactory } from "./EntryPreviewFactory";

/** Height of the section sticky header in pixels */
const SECTION_HEADER_HEIGHT = 32;

/** Groups entries by section for rendering with persistent section headers */
interface SectionGroup {
  id: string;
  label: string;
  pageNumber: number;
  entries: IndexEntry[];
}

/**
 * Groups entries by section breaks.
 * Entries before any section break belong to a "root" section.
 */
function groupEntriesBySections(entries: IndexEntry[]): SectionGroup[] {
  const sections: SectionGroup[] = [];
  let currentSection: SectionGroup = {
    id: "root",
    label: "",
    pageNumber: 0,
    entries: [],
  };

  for (const entry of entries) {
    if (entry.rowType === "section-break") {
      // Save current section if it has entries
      if (currentSection.entries.length > 0 || currentSection.id !== "root") {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        id: entry.id,
        label: entry.sectionLabel || "Section Break",
        pageNumber: entry.pageStart,
        entries: [entry], // Include the section break itself
      };
    } else {
      currentSection.entries.push(entry);
    }
  }

  // Add final section
  if (currentSection.entries.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

interface PreviewPaneProps {
  /** All entries in the master index */
  entries: IndexEntry[];
  /** Currently selected entry ID (for scroll-to and highlighting) */
  selectedEntryId?: string;
  /** Total pages in the entire bundle */
  totalBundlePages: number;
  /** Callback when TipTap content changes */
  onContentChange?: (
    entryId: string,
    content: string,
    pageCount: number,
  ) => void;
  /** Additional CSS classes */
  className?: string;
}

/** Zoom configuration */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;
const ZOOM_DEFAULT = 1;

export function PreviewPane({
  entries,
  selectedEntryId,
  totalBundlePages,
  onContentChange,
  className,
}: PreviewPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(ZOOM_DEFAULT);

  // Group entries by sections for persistent section headers
  const sections = useMemo(() => groupEntriesBySections(entries), [entries]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, ZOOM_MIN));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(ZOOM_DEFAULT);
  }, []);

  // Update CSS variables for dynamic page scaling based on container width and zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const containerWidth = container.offsetWidth;
      // Skip if container hasn't been laid out yet (prevents startup zoom bug)
      if (containerWidth <= 0) return;

      // Base scale from container width, multiplied by zoom level
      const baseScale = containerWidth / A4_DIMENSIONS.WIDTH_PX;
      const scale = baseScale * zoomLevel;

      // Apply zoom: page width scales with zoom, may exceed container (scrollable)
      const pageWidth = containerWidth * zoomLevel;
      container.style.setProperty("--page-width", `${pageWidth}px`);
      container.style.setProperty(
        "--page-height",
        `${A4_DIMENSIONS.HEIGHT_PX * scale}px`,
      );
      container.style.setProperty("--page-scale", `${scale}`);
      // Pass section header height for item headers to offset
      container.style.setProperty(
        "--section-header-height",
        `${SECTION_HEADER_HEIGHT}px`,
      );
    };

    // Use requestAnimationFrame to ensure layout is computed before first calculation
    requestAnimationFrame(updateDimensions);

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [zoomLevel]);

  // Scroll to selected entry when it changes
  useEffect(() => {
    if (selectedEntryId && entryRefs.current.has(selectedEntryId)) {
      const element = entryRefs.current.get(selectedEntryId);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedEntryId]);

  // Handler for scrolling to an entry
  const scrollToEntry = useCallback((entryId: string) => {
    const element = entryRefs.current.get(entryId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground",
          className,
        )}
      >
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No documents in bundle</p>
        <p className="text-xs mt-1 opacity-70">
          Add documents to see the preview
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("h-full flex flex-col bg-muted/20", className)}
    >
      {/* Zoom Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur-sm">
        <span className="text-xs text-muted-foreground font-medium">
          Preview
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={zoomLevel <= ZOOM_MIN}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            className="min-w-[3.5rem] text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            onClick={handleZoomReset}
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={zoomLevel >= ZOOM_MAX}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        {sections.map((section) => (
          <div key={section.id} className="relative">
            {/* Sticky Section Header (Tab) - persists through all items in section */}
            {section.id !== "root" && (
              <div
                className="sticky top-0 z-20 flex items-center gap-2 px-4 bg-primary/90 text-primary-foreground backdrop-blur-sm border-b cursor-pointer hover:bg-primary transition-colors"
                style={{ height: SECTION_HEADER_HEIGHT }}
                onClick={() => scrollToEntry(section.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    scrollToEntry(section.id);
                  }
                }}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">{section.label}</span>
              </div>
            )}

            {/* Items within section */}
            {section.entries.map((entry) => (
              <div
                key={entry.id}
                ref={(el) => {
                  if (el) entryRefs.current.set(entry.id, el);
                }}
                className="transition-all"
              >
                <EntryPreviewFactory
                  entry={entry}
                  totalBundlePages={totalBundlePages}
                  onContentChange={onContentChange}
                  onScrollToEntry={scrollToEntry}
                  stickyOffset={
                    section.id !== "root" ? SECTION_HEADER_HEIGHT : 0
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
