/**
 * useMasterIndexDnD Hook
 *
 * Encapsulates drag-and-drop (dnd-kit) sensors, handlers, and state
 * for the Master Index table.
 */

import { useCallback, useMemo, useState } from "react";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import type { IndexEntry } from "@/lib/pagination";

interface UseMasterIndexDnDOptions {
  entries: IndexEntry[];
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onFileDropped?: (fileData: {
    id: string;
    name: string;
    path: string;
    pageCount?: number;
  }) => void;
}

export function useMasterIndexDnD(options: UseMasterIndexDnDOptions) {
  const { entries, onReorder, onFileDropped } = options;

  // State for drag-drop visual feedback
  const [isDragOver, setIsDragOver] = useState(false);

  // Sensors for dnd-kit
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

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active && over && active.id !== over.id) {
        const oldIndex = entryIds.indexOf(active.id);
        const newIndex = entryIds.indexOf(over.id);
        onReorder?.(oldIndex, newIndex);
      }
    },
    [entryIds, onReorder],
  );

  // Handle file drop from Repository (external drag)
  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("application/x-casepilot-file")) {
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const data = e.dataTransfer.getData("application/x-casepilot-file");
      if (data && onFileDropped) {
        try {
          const fileData = JSON.parse(data);
          onFileDropped(fileData);
        } catch (error) {
          console.error("Failed to parse dropped file data:", error);
        }
      }
    },
    [onFileDropped],
  );

  return {
    // State
    isDragOver,
    entryIds,
    sensors,
    // Handlers for dnd-kit reordering
    handleDragEnd,
    // Handlers for external file drops
    handleFileDragOver,
    handleFileDragLeave,
    handleFileDrop,
  };
}

/**
 * Generate alphabetical section labels: A, B, C, ... Z, AA, AB, etc.
 */
export function generateSectionLabel(index: number): string {
  let label = "";
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/**
 * Calculate display numbers for entries.
 * Section breaks get A., B., C.; documents get continuous 1., 2., 3.
 */
export function getDisplayNumber(
  entry: IndexEntry,
  index: number,
  entries: IndexEntry[],
): string {
  if (entry.rowType === "section-break") {
    let sectionCount = 0;
    for (let i = 0; i <= index; i++) {
      if (entries[i].rowType === "section-break") sectionCount++;
    }
    return `${generateSectionLabel(sectionCount - 1)}.`;
  } else {
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
}
