import { useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// Visual drag handle indicator (non-functional, just visual)
function DragHandleIcon() {
  return (
    <div className="p-1 text-muted-foreground">
      <GripVertical className="h-3 w-3" />
    </div>
  );
}

// Draggable row component
interface DraggableRowProps {
  entry: IndexEntry;
  index: number;
  displayNumber: string;
  isSelected: boolean;
  onSelectEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
}

function DraggableRow({
  entry,
  displayNumber,
  isSelected,
  onSelectEntry,
  onDeleteEntry,
}: DraggableRowProps) {
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

  const isSectionBreak = entry.rowType === "section-break";

  const formatPageRange = (start: number, end: number) => {
    if (start === end) return `${start}`;
    return `${start} - ${end}`;
  };

  return (
    <TableRow
      ref={setNodeRef}
      data-state={isSelected ? "selected" : undefined}
      data-dragging={isDragging}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-opacity group relative",
        isSelected && "bg-accent",
        isSectionBreak &&
          "bg-muted/50 font-semibold sticky top-[41px] z-[5] shadow-sm",
        "data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 data-[dragging=true]:bg-background data-[dragging=true]:shadow-lg data-[dragging=true]:cursor-grabbing",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={() => onSelectEntry?.(entry.id)}
      {...attributes}
      {...listeners}
    >
      <TableCell className="px-1 w-[40px]">
        <DragHandleIcon />
      </TableCell>

      <TableCell
        className={cn("font-medium w-[50px]", isSectionBreak && "font-bold")}
      >
        {displayNumber}
      </TableCell>

      <TableCell className="w-[100px] text-xs">
        {isSectionBreak ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <span className="text-muted-foreground">{entry.date || "-"}</span>
        )}
      </TableCell>

      <TableCell className={cn("text-xs", isSectionBreak && "font-bold")}>
        <span className="truncate block">
          {isSectionBreak
            ? entry.sectionLabel || "Section Break"
            : entry.description || "Untitled"}
        </span>
      </TableCell>

      <TableCell className="text-right text-muted-foreground w-[80px]">
        {formatPageRange(entry.pageStart, entry.pageEnd)}
      </TableCell>

      <TableCell className="px-1 w-[40px]">
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
      </TableCell>
    </TableRow>
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
  // Use the extracted DnD hook
  const dnd = useMasterIndexDnD({
    entries,
    onReorder,
    onFileDropped,
  });

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
          className={cn(
            "flex-1 overflow-auto border rounded-lg transition-colors relative",
            dnd.isDragOver && "ring-2 ring-primary ring-inset bg-primary/5",
          )}
          onDragOver={dnd.handleFileDragOver}
          onDragLeave={dnd.handleFileDragLeave}
          onDrop={dnd.handleFileDrop}
        >
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={dnd.handleDragEnd}
            sensors={dnd.sensors}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[50px]">No.</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px] text-right">Page</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={dnd.entryIds}
                  strategy={verticalListSortingStrategy}
                >
                  {entries.map((entry, index) => (
                    <DraggableRow
                      key={entry.id}
                      entry={entry}
                      index={index}
                      displayNumber={getDisplayNumber(entry, index, entries)}
                      isSelected={selectedEntryId === entry.id}
                      onSelectEntry={onSelectEntry}
                      onDeleteEntry={onDeleteEntry}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
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
