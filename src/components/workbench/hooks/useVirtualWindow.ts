/**
 * useVirtualWindow Hook
 *
 * Provides a simple virtualization strategy for large lists.
 * Instead of creating N React components, only creates components
 * for items within the visible window + buffer.
 *
 * This dramatically improves performance for 1000+ page PDFs.
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface UseVirtualWindowOptions {
  /** Total number of items */
  totalItems: number;
  /** Approximate height of each item in pixels */
  itemHeight: number;
  /** Number of items to render above/below viewport */
  overscan?: number;
  /** Container element for scroll detection */
  containerRef?: React.RefObject<HTMLElement>;
}

interface VirtualWindow {
  /** Start index of items to render */
  startIndex: number;
  /** End index of items to render (exclusive) */
  endIndex: number;
  /** Padding to add at the top for skipped items */
  topPadding: number;
  /** Padding to add at the bottom for skipped items */
  bottomPadding: number;
  /** Should this item index be rendered? */
  shouldRender: (index: number) => boolean;
}

export function useVirtualWindow({
  totalItems,
  itemHeight,
  overscan = 5,
  containerRef,
}: UseVirtualWindowOptions): VirtualWindow {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const rafRef = useRef<number | null>(null);

  const updateVisibleRange = useCallback(() => {
    // Cancel any pending update
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame to throttle updates
    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef?.current || document.documentElement;
      const scrollTop = container.scrollTop || window.scrollY;
      const viewportHeight = container.clientHeight || window.innerHeight;

      // Calculate visible range
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(viewportHeight / itemHeight);
      const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2);

      setVisibleRange((prev) => {
        // Only update if range actually changed
        if (prev.start !== startIndex || prev.end !== endIndex) {
          return { start: startIndex, end: endIndex };
        }
        return prev;
      });
    });
  }, [containerRef, itemHeight, overscan, totalItems]);

  useEffect(() => {
    const container = containerRef?.current;
    const target = container || window;

    // Initial calculation
    updateVisibleRange();

    // Listen for scroll and resize
    target.addEventListener("scroll", updateVisibleRange, { passive: true });
    window.addEventListener("resize", updateVisibleRange, { passive: true });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      target.removeEventListener("scroll", updateVisibleRange);
      window.removeEventListener("resize", updateVisibleRange);
    };
  }, [containerRef, updateVisibleRange]);

  const { start, end } = visibleRange;

  return {
    startIndex: start,
    endIndex: end,
    topPadding: start * itemHeight,
    bottomPadding: Math.max(0, (totalItems - end) * itemHeight),
    shouldRender: (index: number) => index >= start && index < end,
  };
}
