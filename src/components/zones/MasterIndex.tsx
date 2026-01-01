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
import { GripVertical, X, FileDown, Loader2, Plus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RowType = "document" | "section-break";

export interface IndexEntry {
  id: string;
  rowType: RowType;
  // For section breaks:
  sectionLabel?: string; // "TAB A", "Orders of Court", etc.
  // For documents:
  fileId?: string;
  description: string;
  date?: string; // "14 February 2025"
  pageStart: number;
  pageEnd: number;
  disputed: boolean;
}

interface MasterIndexProps {
  entries: IndexEntry[];
  selectedEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onDescriptionChange?: (entryId: string, description: string) => void;
  onDateChange?: (entryId: string, date: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  onCompileBundle?: () => void;
  onAddDocument?: () => void;
  onInsertSectionBreak?: () => void;
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
  onDescriptionChange?: (entryId: string, description: string) => void;
  onDateChange?: (entryId: string, date: string) => void;
  onDeleteEntry?: (entryId: string) => void;
}

function DraggableRow({
  entry,
  displayNumber,
  isSelected,
  onSelectEntry,
  onDescriptionChange,
  onDateChange,
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

      {/* Date Column */}
      <TableCell className="w-[100px]">
        {isSectionBreak ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <input
            type="text"
            value={entry.date || ""}
            onChange={(e) => onDateChange?.(entry.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="dd Mon yyyy"
            className="w-full bg-transparent border-none outline-none text-xs focus:ring-1 focus:ring-ring rounded px-1 -mx-1"
          />
        )}
      </TableCell>

      {/* Description Column */}
      <TableCell className={cn(isSectionBreak && "font-bold")}>
        <input
          type="text"
          value={isSectionBreak ? entry.sectionLabel || "" : entry.description}
          onChange={(e) => onDescriptionChange?.(entry.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder={
            isSectionBreak
              ? "Section title (e.g., TAB A)"
              : "Document description"
          }
          className={cn(
            "w-full bg-transparent border-none outline-none text-xs focus:ring-1 focus:ring-ring rounded px-1 -mx-1",
            isSectionBreak && "font-bold",
          )}
        />
      </TableCell>

      {/* Page Column */}
      <TableCell className="text-right text-muted-foreground w-[80px]">
        {isSectionBreak ? (
          <span>—</span>
        ) : (
          formatPageRange(entry.pageStart, entry.pageEnd)
        )}
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
  onDescriptionChange,
  onDateChange,
  onDeleteEntry,
  onCompileBundle,
  onAddDocument,
  onInsertSectionBreak,
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
      // Count documents (not section breaks) up to this point
      let docCount = 0;
      for (let i = 0; i <= index; i++) {
        if (entries[i].rowType === "document") docCount++;
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

  // Calculate total pages from last document entry
  const getTotalPages = (): number => {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].rowType === "document") {
        return entries[i].pageEnd;
      }
    }
    return 0;
  };

  const documentCount = entries.filter((e) => e.rowType === "document").length;

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
              <TableHeader>
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
                      onDescriptionChange={onDescriptionChange}
                      onDateChange={onDateChange}
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddDocument}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Document
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onInsertSectionBreak}
            className="gap-1.5 text-xs"
          >
            <Layers className="h-3.5 w-3.5" />
            Insert Section Break
          </Button>
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
