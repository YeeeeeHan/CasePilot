import { useState } from "react";
import { GripVertical, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export type DocumentStatus = "agreed" | "disputed";

export interface IndexEntry {
  id: string;
  tabNumber: number;
  description: string;
  status: DocumentStatus;
  pageStart: number;
  pageEnd: number;
  fileId?: string; // Reference to staged file
}

interface MasterIndexProps {
  entries: IndexEntry[];
  selectedEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onDescriptionChange?: (entryId: string, description: string) => void;
  onStatusToggle?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
}

export function MasterIndex({
  entries,
  selectedEntryId,
  onSelectEntry,
  onReorder,
  onDescriptionChange,
  onStatusToggle,
  onDeleteEntry,
}: MasterIndexProps) {
  // Drag state
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const formatPageRange = (start: number, end: number) => {
    if (start === end) return `p. ${start}`;
    return `pp. ${start}-${end}`;
  };

  // Drag handlers
  const handleDragStart = (
    e: React.DragEvent,
    entryId: string,
    index: number,
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("entryId", entryId);
    e.dataTransfer.setData("fromIndex", String(index));
    setDraggedEntryId(entryId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("fromIndex"));

    if (fromIndex !== toIndex && !isNaN(fromIndex)) {
      onReorder?.(fromIndex, toIndex);
    }

    // Clear drag state
    setDraggedEntryId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedEntryId(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Master Index
        </h2>
        <span className="text-xs text-muted-foreground">
          {entries.length} document{entries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Drag files from staging to add to bundle
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[50px]">Tab</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Pages</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow
                  key={entry.id}
                  data-state={
                    selectedEntryId === entry.id ? "selected" : undefined
                  }
                  className={cn(
                    "cursor-pointer transition-opacity group",
                    selectedEntryId === entry.id && "bg-accent",
                    draggedEntryId === entry.id && "opacity-50",
                    dragOverIndex === index && "border-t-2 border-t-blue-500",
                  )}
                  onClick={() => onSelectEntry?.(entry.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <TableCell className="px-1">
                    <button
                      draggable
                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                      onDragStart={(e) => handleDragStart(e, entry.id, index)}
                      onDragEnd={handleDragEnd}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Reorder document ${entry.tabNumber}`}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.tabNumber}
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={entry.description}
                      onChange={(e) =>
                        onDescriptionChange?.(entry.id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-transparent border-none outline-none text-xs focus:ring-1 focus:ring-ring rounded px-1 -mx-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.status === "agreed" ? "default" : "destructive"
                      }
                      className="cursor-pointer text-[10px] px-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusToggle?.(entry.id);
                      }}
                    >
                      {entry.status === "agreed" ? "Agreed" : "Disputed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatPageRange(entry.pageStart, entry.pageEnd)}
                  </TableCell>
                  <TableCell className="px-1">
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {entries[entries.length - 1]?.pageEnd || 0} pages</span>
          <span>Click row to preview</span>
        </div>
      )}
    </div>
  );
}
