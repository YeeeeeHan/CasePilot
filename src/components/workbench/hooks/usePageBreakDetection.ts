/**
 * usePageBreakDetection Hook
 *
 * Monitors TipTap editor content height and calculates page count.
 * Uses debouncing to avoid excessive updates during typing.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import { A4_DIMENSIONS } from "@/types/canvas";

interface UsePageBreakDetectionOptions {
  /** The TipTap editor instance */
  editor: Editor | null;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Callback when page count changes */
  onPageCountChange?: (pageCount: number) => void;
}

interface UsePageBreakDetectionResult {
  /** Current calculated page count */
  pageCount: number;
  /** Whether the content overflows the first page */
  hasOverflow: boolean;
}

export function usePageBreakDetection({
  editor,
  debounceMs = 500,
  onPageCountChange,
}: UsePageBreakDetectionOptions): UsePageBreakDetectionResult {
  const [pageCount, setPageCount] = useState(1);
  const [hasOverflow, setHasOverflow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPageCountRef = useRef(1);

  const calculatePageCount = useCallback(() => {
    if (!editor?.view?.dom) return 1;

    // Get the content height from the editor DOM
    const contentHeight = editor.view.dom.scrollHeight;

    // Calculate page count based on A4 height
    // Account for some padding (e.g., 40px top/bottom margins)
    const usableHeight = A4_DIMENSIONS.HEIGHT_PX - 80;

    // Minimum threshold: only consider overflow if content actually exceeds
    // the first page. Empty editors have ~40-60px scrollHeight from default
    // paragraph styling, so we need content to actually fill the page first.
    if (contentHeight <= usableHeight) {
      return 1;
    }

    const calculatedPages = Math.ceil(contentHeight / usableHeight);

    return calculatedPages;
  }, [editor]);

  const debouncedUpdate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const newPageCount = calculatePageCount();
      const newHasOverflow = newPageCount > 1;

      setPageCount(newPageCount);
      setHasOverflow(newHasOverflow);

      // Only call callback if page count actually changed
      if (newPageCount !== lastPageCountRef.current) {
        lastPageCountRef.current = newPageCount;
        onPageCountChange?.(newPageCount);
      }
    }, debounceMs);
  }, [calculatePageCount, debounceMs, onPageCountChange]);

  useEffect(() => {
    if (!editor) return;

    // Initial calculation
    const initialCount = calculatePageCount();
    setPageCount(initialCount);
    setHasOverflow(initialCount > 1);
    lastPageCountRef.current = initialCount;

    // Listen for content changes
    const handleUpdate = () => {
      debouncedUpdate();
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, calculatePageCount, debouncedUpdate]);

  return { pageCount, hasOverflow };
}
