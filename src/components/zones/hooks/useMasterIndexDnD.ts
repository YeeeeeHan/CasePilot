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
  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for our custom MIME type or any file being dragged
    const hasCustomType = e.dataTransfer.types.includes(
      "application/x-casepilot-file",
    );
    const hasFiles = e.dataTransfer.types.includes("Files");

    if (hasCustomType || hasFiles) {
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

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

      // Debug: log all available data types
      console.log(
        "[MasterIndex Drop] Available types:",
        Array.from(e.dataTransfer.types),
      );

      // Try to get our custom data
      const data = e.dataTransfer.getData("application/x-casepilot-file");
      console.log("[MasterIndex Drop] Raw data:", data);

      if (!data) {
        console.warn(
          "[MasterIndex Drop] No data found for application/x-casepilot-file",
        );
        return;
      }

      if (!onFileDropped) {
        console.warn("[MasterIndex Drop] No onFileDropped handler provided");
        return;
      }

      try {
        const fileData = JSON.parse(data);
        console.log("[MasterIndex Drop] Parsed data:", fileData);

        if (fileData.id && fileData.name && fileData.path) {
          console.log(
            "[MasterIndex Drop] Calling onFileDropped with:",
            fileData,
          );
          onFileDropped(fileData);
        } else {
          console.error(
            "[MasterIndex Drop] Invalid file data structure:",
            fileData,
          );
        }
      } catch (error) {
        console.error(
          "[MasterIndex Drop] Failed to parse dropped file data:",
          error,
        );
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
