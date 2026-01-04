/**
 * DragContext
 *
 * Provides a way to track dragged files across components without relying
 * on HTML5 dataTransfer which has cross-origin and MIME type restrictions.
 * This solves the issue where dragging from RepositoryItem to MasterIndex
 * fails silently due to dnd-kit interference.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface DraggedFile {
  id: string;
  name: string;
  path: string;
  pageCount?: number;
}

interface DragContextValue {
  draggedFile: DraggedFile | null;
  setDraggedFile: (file: DraggedFile | null) => void;
  startDrag: (file: DraggedFile) => void;
  endDrag: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedFile, setDraggedFile] = useState<DraggedFile | null>(null);

  const startDrag = useCallback((file: DraggedFile) => {
    setDraggedFile(file);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedFile(null);
  }, []);

  return (
    <DragContext.Provider
      value={{ draggedFile, setDraggedFile, startDrag, endDrag }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext(): DragContextValue {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDragContext must be used within a DragProvider");
  }
  return context;
}
