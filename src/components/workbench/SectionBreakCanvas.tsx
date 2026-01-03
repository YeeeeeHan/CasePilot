/**
 * SectionBreakCanvas Component
 *
 * Renders section breaks (tabs) as a single A4 page with:
 * - Collapsible sticky header showing the section label
 * - A4 page content displaying the section/tab label prominently
 *
 * Follows the same pattern as EvidenceCanvas for consistent UX.
 */

import { ChevronDown, Layers } from "lucide-react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { A4Page, A4PageContainer } from "./A4Page";
import { PageStampOverlay } from "./PageStampOverlay";

interface SectionBreakCanvasProps {
  /** The section/tab label (e.g., "TAB A - Pleadings") */
  sectionLabel: string;
  /** Page number in the global bundle */
  globalPageNumber: number;
  /** Total pages in the entire bundle */
  totalBundlePages: number;
  /** Additional CSS classes */
  className?: string;
  /** Offset for sticky header to account for section header */
  stickyOffset?: number;
  /** Hide the header (when section header is managed by parent) */
  hideHeader?: boolean;
}

/**
 * Extracts only the "Tab X" portion from a label like "Tab A - Pleadings"
 * Returns the full label if no delimiter is found.
 */
function extractTabLabel(label: string): string {
  // Match "Tab X" pattern (case-insensitive) and return just that portion
  const match = label.match(/^(Tab\s+[A-Z0-9]+)/i);
  return match ? match[1] : label;
}

export function SectionBreakCanvas({
  sectionLabel,
  globalPageNumber,
  totalBundlePages,
  className,
  stickyOffset = 0,
  hideHeader = false,
}: SectionBreakCanvasProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => setIsCollapsed(!open)}
      className={cn("flex flex-col", className)}
    >
      {/* Header with section label and collapse toggle - only show if not hidden */}
      {!hideHeader && (
        <div
          className="z-10 flex items-center justify-between px-4 py-2 border-b bg-muted/95 backdrop-blur-sm rounded-t-lg sticky"
          style={{ top: stickyOffset }}
        >
          {/* Section label indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span className="font-medium">
              {sectionLabel || "Section Break"}
            </span>
            <span className="text-xs opacity-70">- 1 page</span>
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
      )}

      {/* Section Break Page Content */}
      <CollapsibleContent>
        <A4PageContainer>
          <A4Page>
            {/* Centered tab label only (e.g., "Tab A" without description) */}
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-wide text-foreground">
                  {extractTabLabel(sectionLabel) || "Section Break"}
                </h1>
              </div>
            </div>
            <PageStampOverlay
              pageNumber={globalPageNumber}
              totalPages={totalBundlePages}
            />
          </A4Page>
        </A4PageContainer>
      </CollapsibleContent>
    </Collapsible>
  );
}
