/**
 * PreviewPane Component
 *
 * Scrollable preview of the entire bundle.
 * Renders all entries from the master index in sequence.
 */

import { FileText } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { IndexEntry } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { A4_DIMENSIONS } from "@/types/canvas";
import { EntryPreviewFactory } from "./EntryPreviewFactory";

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

  // Update CSS variables for dynamic page scaling based on container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const containerWidth = container.offsetWidth;
      // Use full container width (no padding subtraction) to maximize document space
      const scale = containerWidth / A4_DIMENSIONS.WIDTH_PX;

      container.style.setProperty("--page-width", `${containerWidth}px`);
      container.style.setProperty(
        "--page-height",
        `${A4_DIMENSIONS.HEIGHT_PX * scale}px`,
      );
      container.style.setProperty("--page-scale", `${scale}`);
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
      <ScrollArea className="flex-1" ref={scrollRef}>
        {entries.map((entry) => (
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
            />
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
