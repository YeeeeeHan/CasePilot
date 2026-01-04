/**
 * ExhibitBuilder Component
 *
 * A panel that lists all exhibits referenced in the affidavit editor.
 * Updates dynamically as exhibits are added/removed.
 * Follows ePD 2021 format for exhibit tables.
 *
 * Reference: https://epd2021-supremecourt.judiciary.gov.sg/
 */

import { FileText } from "lucide-react";
import { memo, useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface ExhibitEntry {
  /** Exhibit label (e.g., "TAK-1") */
  label: string;
  /** File ID */
  fileId: string;
  /** File name/description */
  description: string;
  /** File path for preview */
  filePath: string;
  /** Page count (if available) */
  pageCount?: number;
}

interface ExhibitBuilderProps {
  /** List of exhibits from the editor content */
  exhibits: ExhibitEntry[];
  /** Currently focused exhibit file path */
  focusedExhibitPath?: string | null;
  /** Callback when an exhibit row is clicked */
  onExhibitClick?: (filePath: string) => void;
  /** Deponent initials (e.g., "TAK") */
  initials?: string;
  /** Additional CSS classes */
  className?: string;
}

export const ExhibitBuilder = memo(function ExhibitBuilder({
  exhibits,
  focusedExhibitPath,
  onExhibitClick,
  initials = "EX",
  className,
}: ExhibitBuilderProps) {
  // Calculate page ranges for each exhibit
  const exhibitsWithPages = useMemo(() => {
    let currentPage = 1;
    return exhibits.map((exhibit, index) => {
      const pageStart = currentPage;
      const pageEnd = currentPage + (exhibit.pageCount || 1) - 1;
      currentPage = pageEnd + 1;

      return {
        ...exhibit,
        displayLabel: exhibit.label || `${initials}-${index + 1}`,
        pageStart,
        pageEnd,
      };
    });
  }, [exhibits, initials]);

  const totalPages = useMemo(() => {
    if (exhibitsWithPages.length === 0) return 0;
    const lastExhibit = exhibitsWithPages[exhibitsWithPages.length - 1];
    return lastExhibit.pageEnd;
  }, [exhibitsWithPages]);

  if (exhibits.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 text-muted-foreground",
          className,
        )}
      >
        <FileText className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">No exhibits referenced yet</p>
        <p className="text-xs mt-1 opacity-70">
          Drag files from the repository to add exhibits
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Exhibits ({exhibits.length})
        </h3>
        <span className="text-xs text-muted-foreground">
          Total: {totalPages} page{totalPages !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Exhibit Table - follows ePD 2021 format */}
      <div className="overflow-auto max-h-[200px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px]">Exhibit</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[80px] text-right">Page</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exhibitsWithPages.map((exhibit) => {
              const isSelected = focusedExhibitPath === exhibit.filePath;
              const pageRange =
                exhibit.pageStart === exhibit.pageEnd
                  ? `${exhibit.pageStart}`
                  : `${exhibit.pageStart}-${exhibit.pageEnd}`;

              return (
                <TableRow
                  key={exhibit.fileId}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-accent",
                  )}
                  onClick={() => onExhibitClick?.(exhibit.filePath)}
                >
                  <TableCell className="font-medium">
                    <span className="font-mono text-xs">
                      {exhibit.displayLabel}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="truncate block max-w-[200px]">
                      {exhibit.description}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {pageRange}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
