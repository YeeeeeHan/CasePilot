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
import { useDragContext } from "@/contexts/DragContext";

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

  // Get dragged file from context (set by RepositoryItem)
  const { draggedFile, endDrag } = useDragContext();

  // State for drag-drop visual feedback
  const [isDragOver, setIsDragOver] = useState(false);

  // Sensors for dnd-kit
  // Use activation constraint to distinguish between clicks and drags
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag activates
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms delay for touch to avoid scroll conflicts
        tolerance: 8,
      },
    }),
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
  const handleFileDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check for our context-based drag, custom MIME type, or any file being dragged
      const hasContextDrag = !!draggedFile;
      const hasCustomType = e.dataTransfer.types.includes(
        "application/x-casepilot-file",
      );
      const hasFiles = e.dataTransfer.types.includes("Files");

      if (hasContextDrag || hasCustomType || hasFiles) {
        e.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      }
    },
    [draggedFile],
  );

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragOver to false if we're leaving the drop zone entirely
    // Check if the related target is still within the drop zone
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!onFileDropped) {
        return;
      }

      // First, try to get file data from React context (most reliable)
      if (draggedFile) {
        onFileDropped({
          id: draggedFile.id,
          name: draggedFile.name,
          path: draggedFile.path,
          pageCount: draggedFile.pageCount,
        });
        endDrag();
        return;
      }

      // Fallback: Try to get data from dataTransfer
      const data = e.dataTransfer.getData("application/x-casepilot-file");

      if (!data) {
        return;
      }

      try {
        const fileData = JSON.parse(data);
        if (fileData.id && fileData.name && fileData.path) {
          onFileDropped(fileData);
        }
      } catch {
        // Silently fail - file drop didn't contain valid data
      }
    },
    [onFileDropped, draggedFile, endDrag],
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
