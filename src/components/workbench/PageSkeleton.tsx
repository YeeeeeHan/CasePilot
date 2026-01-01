/**
 * PageSkeleton Component
 *
 * A loading placeholder with exact A4 dimensions.
 * Used by virtualized PDF rendering to maintain scroll height
 * while pages are loading or out of viewport.
 *
 * Key features:
 * - Exact A4 aspect ratio (210mm x 297mm) prevents layout shift
 * - Subtle pulse animation indicates loading
 * - Muted icon provides visual context
 */

import { FileText } from "lucide-react";
import { A4_DIMENSIONS } from "@/types/canvas";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-muted/30 animate-pulse flex items-center justify-center",
        className,
      )}
      style={{
        width: A4_DIMENSIONS.WIDTH_PX,
        height: A4_DIMENSIONS.HEIGHT_PX,
      }}
    >
      <FileText className="h-12 w-12 text-muted-foreground/30" />
    </div>
  );
}

