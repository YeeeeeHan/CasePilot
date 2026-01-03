/**
 * useAutoSave Hook
 *
 * Handles auto-save timer and content tracking for TipTap editors.
 * Debounces saves to avoid excessive API calls.
 */

import { useCallback, useEffect, useRef } from "react";

interface UseAutoSaveOptions {
  /** Content to watch for changes */
  content: string;
  /** Artifact ID to save to */
  artifactId: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Called when save is triggered */
  onSave?: (artifactId: string, content: string) => void;
}

export function useAutoSave(options: UseAutoSaveOptions) {
  const { content, artifactId, debounceMs = 2000, onSave } = options;

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(content);

  // Handle content change with debounce
  const handleContentChange = useCallback(
    (newContent: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        if (newContent !== lastSavedContentRef.current) {
          lastSavedContentRef.current = newContent;
          onSave?.(artifactId, newContent);
        }
      }, debounceMs);
    },
    [artifactId, debounceMs, onSave],
  );

  // Sync last saved content when artifactId or content changes
  useEffect(() => {
    lastSavedContentRef.current = content;
  }, [artifactId, content]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Force save (bypasses debounce)
  const forceSave = useCallback(
    (currentContent: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (currentContent !== lastSavedContentRef.current) {
        lastSavedContentRef.current = currentContent;
        onSave?.(artifactId, currentContent);
      }
    },
    [artifactId, onSave],
  );

  return {
    handleContentChange,
    forceSave,
    lastSavedContent: lastSavedContentRef.current,
  };
}
