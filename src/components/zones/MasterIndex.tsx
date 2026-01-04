import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  GripVertical,
  X,
  FileDown,
  Loader2,
  Layers,
  FileText,
  FilePlus,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IndexEntry, RowType } from "@/lib/pagination";
import { useMasterIndexDnD, getDisplayNumber } from "./hooks/useMasterIndexDnD";

// Re-export for consumers
export type { IndexEntry, RowType };

interface MasterIndexProps {
  entries: IndexEntry[];
  selectedEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onDeleteEntry?: (entryId: string) => void;
  onCompileBundle?: () => void;
  onInsertSectionBreak?: () => void;
  onInsertCoverPage?: () => void;
  onInsertDivider?: () => void;
  onInsertTableOfContents?: () => void;
  onFileDropped?: (fileData: {
    id: string;
    name: string;
    path: string;
    pageCount?: number;
  }) => void;
  isCompiling?: boolean;
}

// Visual drag handle indicator
function DragHandleIcon() {
  return (
    <div className="p-1 text-muted-foreground">
      <GripVertical className="h-3 w-3" />
    </div>
  );
}

// Sortable row component that wraps table row for dnd-kit
interface SortableRowProps {
  row: Row<IndexEntry>;
  isSelected: boolean;
  displayNumber: string;
  onSelectEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  rowRef?: (el: HTMLTableRowElement | null) => void;
}

function SortableRow({
  row,
  isSelected,
  displayNumber,
  onSelectEntry,
  onDeleteEntry,
  rowRef,
}: SortableRowProps) {
  const entry = row.original;
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: entry.id,
  });

  // Combine setNodeRef with rowRef for tracking section positions
  const combinedRef = useCallback(
    (el: HTMLTableRowElement | null) => {
      setNodeRef(el);
      rowRef?.(el);
    },
    [setNodeRef, rowRef],
  );

  const isSectionBreak = entry.rowType === "section-break";

  // Only apply transform when actually dragging
  const style: React.CSSProperties = isDragging
    ? {
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }
    : {};

  // Custom render function for special cells
  const renderCellContent = (
    columnId: string,
    cell: ReturnType<typeof row.getVisibleCells>[0],
  ) => {
    if (columnId === "displayNumber") {
      return displayNumber;
    }
    if (columnId === "actions") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteEntry?.(entry.id);
          }}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Delete entry</span>
        </Button>
      );
    }
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  return (
    <tr
      ref={combinedRef}
      data-state={isSelected ? "selected" : undefined}
      data-dragging={isDragging}
      className={cn(
        "cursor-grab active:cursor-grabbing group relative border-b",
        isSelected && "bg-accent",
        isSectionBreak && "bg-muted font-semibold",
        isDragging &&
          "z-50 bg-background shadow-md cursor-grabbing outline outline-2 outline-primary/50 opacity-95",
      )}
      style={style}
      onClick={() => onSelectEntry?.(entry.id)}
      {...attributes}
      {...listeners}
    >
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className={cn(
            "p-2 align-middle [&:has([role=checkbox])]:pr-0",
            cell.column.id === "drag" && "px-1 w-[40px]",
            cell.column.id === "displayNumber" &&
              cn("font-medium w-[50px]", isSectionBreak && "font-bold"),
            cell.column.id === "date" && "w-[100px] text-xs",
            cell.column.id === "description" &&
              cn("text-xs", isSectionBreak && "font-bold"),
            cell.column.id === "page" &&
              "text-right text-muted-foreground w-[80px]",
            cell.column.id === "actions" && "px-1 w-[40px]",
          )}
        >
          {renderCellContent(cell.column.id, cell)}
        </td>
      ))}
    </tr>
  );
}

// Virtualized row component
interface VirtualizedRowProps {
  row: Row<IndexEntry>;
  isSelected: boolean;
  displayNumber: string;
  onSelectEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  rowRef?: (el: HTMLTableRowElement | null) => void;
  virtualRow: { index: number; start: number; size: number };
}

function VirtualizedSortableRow({
  row,
  isSelected,
  displayNumber,
  onSelectEntry,
  onDeleteEntry,
  rowRef,
  virtualRow,
}: VirtualizedRowProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <table className="w-full table-fixed">
        <tbody>
          <SortableRow
            row={row}
            isSelected={isSelected}
            displayNumber={displayNumber}
            onSelectEntry={onSelectEntry}
            onDeleteEntry={onDeleteEntry}
            rowRef={rowRef}
          />
        </tbody>
      </table>
    </div>
  );
}

export function MasterIndex({
  entries,
  selectedEntryId,
  onSelectEntry,
  onReorder,
  onDeleteEntry,
  onCompileBundle,
  onInsertSectionBreak,
  onInsertCoverPage,
  onInsertDivider,
  onInsertTableOfContents,
  onFileDropped,
  isCompiling = false,
}: MasterIndexProps) {
  // Define columns with @tanstack/react-table
  const columns = useMemo<ColumnDef<IndexEntry>[]>(
    () => [
      {
        id: "drag",
        header: "",
        cell: () => <DragHandleIcon />,
        size: 40,
      },
      {
        id: "displayNumber",
        header: "No.",
        // Cell content rendered manually in SortableRow to include displayNumber
        cell: () => null,
        size: 50,
      },
      {
        id: "date",
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          const entry = row.original;
          const isSectionBreak = entry.rowType === "section-break";
          return isSectionBreak ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <span className="text-muted-foreground">{entry.date || "-"}</span>
          );
        },
        size: 100,
      },
      {
        id: "description",
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const entry = row.original;
          const isSectionBreak = entry.rowType === "section-break";
          return (
            <span className="truncate block">
              {isSectionBreak
                ? entry.sectionLabel || "Section Break"
                : entry.description || "Untitled"}
            </span>
          );
        },
      },
      {
        id: "page",
        header: "Page",
        accessorFn: (row) => {
          if (row.pageStart === row.pageEnd) return `${row.pageStart}`;
          return `${row.pageStart} - ${row.pageEnd}`;
        },
        size: 80,
      },
      {
        id: "actions",
        header: "",
        // Cell content rendered manually in SortableRow to include onDeleteEntry
        cell: () => null,
        size: 40,
      },
    ],
    [],
  );

  // Create table instance
  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  // Use the extracted DnD hook
  const dnd = useMasterIndexDnD({
    entries,
    onReorder,
    onFileDropped,
  });

  // Refs for scroll container and row elements
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Track the current sticky section label
  const [currentStickySection, setCurrentStickySection] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 40, // Estimated row height
    overscan: 5, // Render 5 extra rows above/below viewport
  });

  // Only use virtualization for large datasets (100+ entries)
  const useVirtualization = entries.length > 100;

  // Get all section breaks for tracking
  const sectionBreaks = useMemo(
    () => entries.filter((e) => e.rowType === "section-break"),
    [entries],
  );

  // Track which section should be sticky based on scroll position
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || sectionBreaks.length === 0) {
      setCurrentStickySection(null);
      return;
    }

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      // Account for the table header height (approximately 41px)
      const headerOffset = 41;

      let activeSection: { id: string; label: string } | null = null;

      // Find the section whose row has scrolled past the header
      for (const section of sectionBreaks) {
        const rowEl = rowRefs.current.get(section.id);
        if (!rowEl) continue;

        const rowRect = rowEl.getBoundingClientRect();
        // If the row's top is above or at the container's top + header offset, this section is active
        if (rowRect.top <= containerRect.top + headerOffset) {
          activeSection = {
            id: section.id,
            label: section.sectionLabel || "Section Break",
          };
        }
      }

      setCurrentStickySection(activeSection);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [sectionBreaks]);

  // Calculate total pages from last entry
  const getTotalPages = (): number => {
    if (entries.length === 0) return 0;
    return entries[entries.length - 1].pageEnd;
  };

  // Count all entries with page content
  const documentCount = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.rowType === "document" ||
          e.rowType === "cover-page" ||
          e.rowType === "divider",
      ).length,
    [entries],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Master Index
        </h2>
        <span className="text-xs text-muted-foreground">
          {documentCount} document{documentCount !== 1 ? "s" : ""}
        </span>
      </div>

      {entries.length === 0 ? (
        <div
          className={cn(
            "flex-1 flex items-center justify-center border-2 border-dashed rounded-lg transition-colors relative",
            dnd.isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
          )}
          onDragOver={dnd.handleFileDragOver}
          onDragLeave={dnd.handleFileDragLeave}
          onDrop={dnd.handleFileDrop}
        >
          <p className="text-xs text-muted-foreground text-center px-4">
            Use the toolbar below to add documents
            <br />
            or drag files from the Repository
          </p>
          {dnd.isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 pointer-events-none">
              <div className="bg-background rounded-lg px-4 py-2 shadow-lg border border-primary">
                <p className="text-sm font-medium text-primary">
                  Drop to add document
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex-1 overflow-auto border rounded-lg transition-colors relative",
            dnd.isDragOver && "ring-2 ring-primary ring-inset bg-primary/5",
          )}
          onDragOver={dnd.handleFileDragOver}
          onDragLeave={dnd.handleFileDragLeave}
          onDrop={dnd.handleFileDrop}
        >
          {/* Floating Sticky Section Header - appears when a section is scrolled past */}
          {currentStickySection && (
            <div
              className="sticky top-[41px] z-20 flex items-center gap-2 px-3 h-8 bg-primary/90 text-primary-foreground backdrop-blur-sm border-b cursor-pointer hover:bg-primary transition-colors"
              onClick={() => {
                const rowEl = rowRefs.current.get(currentStickySection.id);
                if (rowEl) {
                  rowEl.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const rowEl = rowRefs.current.get(currentStickySection.id);
                  if (rowEl) {
                    rowEl.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }
              }}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="font-medium text-xs">
                {currentStickySection.label}
              </span>
            </div>
          )}

          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={dnd.handleDragEnd}
            sensors={dnd.sensors}
          >
            <SortableContext
              items={dnd.entryIds}
              strategy={verticalListSortingStrategy}
            >
              {useVirtualization ? (
                // Virtualized rendering for large datasets
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {/* Sticky header for virtualized table */}
                  <table className="w-full table-fixed">
                    <thead className="sticky top-0 bg-background z-30">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr
                          key={headerGroup.id}
                          className="hover:bg-transparent"
                        >
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className={cn(
                                "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                                header.id === "drag" && "w-[40px]",
                                header.id === "displayNumber" && "w-[50px]",
                                header.id === "date" && "w-[100px]",
                                header.id === "page" && "w-[80px] text-right",
                                header.id === "actions" && "w-[40px]",
                              )}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                  </table>

                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = table.getRowModel().rows[virtualRow.index];
                    if (!row) return null;
                    const entry = row.original;
                    return (
                      <VirtualizedSortableRow
                        key={row.id}
                        row={row}
                        virtualRow={virtualRow}
                        isSelected={selectedEntryId === entry.id}
                        displayNumber={getDisplayNumber(
                          entry,
                          virtualRow.index,
                          entries,
                        )}
                        onSelectEntry={onSelectEntry}
                        onDeleteEntry={onDeleteEntry}
                        rowRef={(el) => {
                          if (el) {
                            rowRefs.current.set(entry.id, el);
                          } else {
                            rowRefs.current.delete(entry.id);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                // Standard rendering for small datasets
                <table className="w-full caption-bottom text-sm table-fixed">
                  <thead className="sticky top-0 bg-background z-30 [&_tr]:border-b">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="border-b transition-colors hover:bg-transparent"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className={cn(
                              "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                              header.id === "drag" && "w-[40px]",
                              header.id === "displayNumber" && "w-[50px]",
                              header.id === "date" && "w-[100px]",
                              header.id === "page" && "w-[80px] text-right",
                              header.id === "actions" && "w-[40px]",
                            )}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {table.getRowModel().rows.map((row, index) => {
                      const entry = row.original;
                      return (
                        <SortableRow
                          key={row.id}
                          row={row}
                          isSelected={selectedEntryId === entry.id}
                          displayNumber={getDisplayNumber(
                            entry,
                            index,
                            entries,
                          )}
                          onSelectEntry={onSelectEntry}
                          onDeleteEntry={onDeleteEntry}
                          rowRef={(el) => {
                            if (el) {
                              rowRefs.current.set(entry.id, el);
                            } else {
                              rowRefs.current.delete(entry.id);
                            }
                          }}
                        />
                      );
                    })}
                  </tbody>
                </table>
              )}
            </SortableContext>
          </DndContext>

          {dnd.isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 pointer-events-none">
              <div className="bg-background rounded-lg px-4 py-2 shadow-lg border border-primary">
                <p className="text-sm font-medium text-primary">
                  Drop to add document
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Toolbar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* Structure Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={onInsertSectionBreak}
            className="gap-1.5 text-xs"
          >
            <Layers className="h-3.5 w-3.5" />
            Tabs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onInsertDivider}
            className="gap-1.5 text-xs"
          >
            <FilePlus className="h-3.5 w-3.5" />
            Blank Page
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                Templates
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onInsertCoverPage}>
                <FileText className="h-4 w-4 mr-2" />
                Cover Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onInsertTableOfContents}>
                <BookOpen className="h-4 w-4 mr-2" />
                Table of Contents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Total: {getTotalPages()} pages
            </span>
          )}
          <Button
            size="sm"
            onClick={onCompileBundle}
            disabled={isCompiling || documentCount === 0}
            className="gap-2"
          >
            {isCompiling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Compile Bundle
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
