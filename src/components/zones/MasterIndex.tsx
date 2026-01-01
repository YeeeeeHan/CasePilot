import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
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
  isCompiling?: boolean;
}

// Generate alphabetical section labels: A, B, C, ... Z, AA, AB, etc.
function generateSectionLabel(index: number): string {
  let label = "";
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

// Drag handle component using useSortable
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <button
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground"
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-3 w-3" />
    </button>
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
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: entry.id,
  });

  const isSectionBreak = entry.rowType === "section-break";

  // Format page range like "6 - 98" or single page
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
        "cursor-pointer transition-opacity group relative",
        isSelected && "bg-accent",
        isSectionBreak && "bg-muted/50 font-semibold",
        "data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 data-[dragging=true]:bg-background data-[dragging=true]:shadow-lg",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={() => onSelectEntry?.(entry.id)}
    >
      {/* Grip Handle */}
      <TableCell className="px-1 w-[40px]">
        <DragHandle id={entry.id} />
      </TableCell>

      {/* No. Column */}
      <TableCell
        className={cn("font-medium w-[50px]", isSectionBreak && "font-bold")}
      >
        {displayNumber}
      </TableCell>

      {/* Date Column (read-only display) */}
      <TableCell className="w-[100px] text-xs">
        {isSectionBreak ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="text-muted-foreground">{entry.date || "—"}</span>
        )}
      </TableCell>

      {/* Description Column (read-only display) */}
      <TableCell className={cn("text-xs", isSectionBreak && "font-bold")}>
        <span className="truncate block">
          {isSectionBreak
            ? entry.sectionLabel || "Section Break"
            : entry.description || "Untitled"}
        </span>
      </TableCell>

      {/* Page Column */}
      <TableCell className="text-right text-muted-foreground w-[80px]">
        {formatPageRange(entry.pageStart, entry.pageEnd)}
      </TableCell>

      {/* Delete Button */}
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
  isCompiling = false,
}: MasterIndexProps) {
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  // Memoize the list of IDs for SortableContext
  const entryIds = useMemo<UniqueIdentifier[]>(
    () => entries.map((entry) => entry.id),
    [entries],
  );

  // Calculate display numbers: section breaks get A., B., C.; documents get continuous 1., 2., 3.
  const getDisplayNumber = (entry: IndexEntry, index: number): string => {
    if (entry.rowType === "section-break") {
      // Count section breaks up to this point
      let sectionCount = 0;
      for (let i = 0; i <= index; i++) {
        if (entries[i].rowType === "section-break") sectionCount++;
      }
      return `${generateSectionLabel(sectionCount - 1)}.`;
    } else {
      // Count all numbered entries (documents, cover pages, dividers) up to this point
      let docCount = 0;
      for (let i = 0; i <= index; i++) {
        const rowType = entries[i].rowType;
        if (
          rowType === "document" ||
          rowType === "cover-page" ||
          rowType === "divider"
        ) {
          docCount++;
        }
      }
      return `${docCount}.`;
    }
  };

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = entryIds.indexOf(active.id);
      const newIndex = entryIds.indexOf(over.id);
      onReorder?.(oldIndex, newIndex);
    }
  }

  // Calculate total pages from last entry (all entry types now have pages)
  const getTotalPages = (): number => {
    if (entries.length === 0) return 0;
    return entries[entries.length - 1].pageEnd;
  };

  // Count all entries with page content (documents, cover pages, dividers)
  const documentCount = entries.filter(
    (e) =>
      e.rowType === "document" ||
      e.rowType === "cover-page" ||
      e.rowType === "divider",
  ).length;

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
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <p className="text-xs text-muted-foreground text-center px-4">
            Use the toolbar below to add documents
            <br />
            or drag files from the Repository
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
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
                  items={entryIds}
                  strategy={verticalListSortingStrategy}
                >
                  {entries.map((entry, index) => (
                    <DraggableRow
                      key={entry.id}
                      entry={entry}
                      index={index}
                      displayNumber={getDisplayNumber(entry, index)}
                      isSelected={selectedEntryId === entry.id}
                      onSelectEntry={onSelectEntry}
                      onDeleteEntry={onDeleteEntry}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
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
