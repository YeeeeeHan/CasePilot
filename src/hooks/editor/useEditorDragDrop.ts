/**
 * useEditorDragDrop Hook
 *
 * Handles drag-and-drop for TipTap editors, including:
 * - Visual feedback state
 * - File drop parsing from custom MIME type
 */

import { useCallback, useState } from "react";
import type { AvailableFile } from "@/components/workbench/AffidavitEditor";

interface UseEditorDragDropOptions {
  /** Container ref for drag leave detection */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Called when a file is dropped */
  onFileDrop?: (file: AvailableFile) => void;
}

export function useEditorDragDrop(options: UseEditorDragDropOptions) {
  const { containerRef, onFileDrop } = options;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("application/x-casepilot-file")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    },
    [containerRef],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("application/x-casepilot-file")) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const data = e.dataTransfer.getData("application/x-casepilot-file");
      if (data && onFileDrop) {
        try {
          const file = JSON.parse(data) as AvailableFile;
          onFileDrop(file);
        } catch {
          console.error("Failed to parse dropped file data");
        }
      }
    },
    [onFileDrop],
  );

  // Create TipTap handleDOMEvents handlers
  const createTipTapDropHandlers = useCallback(
    (insertExhibit: (file: AvailableFile) => void) => ({
      dragover: (_view: unknown, event: DragEvent) => {
        if (
          event.dataTransfer?.types.includes("application/x-casepilot-file")
        ) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          return true;
        }
        return false;
      },
      drop: (_view: unknown, event: DragEvent) => {
        const data = event.dataTransfer?.getData(
          "application/x-casepilot-file",
        );
        if (data) {
          event.preventDefault();
          event.stopPropagation();
          try {
            const file = JSON.parse(data) as AvailableFile;
            insertExhibit(file);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      },
    }),
    [],
  );

  return {
    isDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    createTipTapDropHandlers,
  };
}
