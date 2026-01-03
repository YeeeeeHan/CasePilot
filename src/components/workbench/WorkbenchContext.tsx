/**
 * WorkbenchContext
 *
 * Context for sharing workbench state across components without prop drilling.
 * Provides access to available files, active case, and shared handlers.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { AvailableFile, WorkbenchMode } from "@/types/domain";
import type { IndexEntry } from "@/lib/pagination";

interface ActiveCase {
  id: string;
  name: string;
  type: "affidavit" | "bundle";
  content?: string;
  initials?: string;
}

interface WorkbenchContextValue {
  /** Current workbench mode */
  mode: WorkbenchMode;
  /** Active case data */
  activeCase: ActiveCase | null;
  /** Available files for exhibit insertion */
  availableFiles: AvailableFile[];
  /** Index entries for bundle mode */
  entries: IndexEntry[];
  /** Selected entry from Master Index */
  selectedEntry: IndexEntry | null;
  /** Total pages in the bundle */
  totalBundlePages: number;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

interface WorkbenchProviderProps {
  children: ReactNode;
  value: WorkbenchContextValue;
}

export function WorkbenchProvider({ children, value }: WorkbenchProviderProps) {
  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbenchContext(): WorkbenchContextValue {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error(
      "useWorkbenchContext must be used within a WorkbenchProvider",
    );
  }
  return context;
}

/**
 * Optional hook that returns null if not in a WorkbenchProvider.
 * Useful for components that can be used both inside and outside the workbench.
 */
export function useOptionalWorkbenchContext(): WorkbenchContextValue | null {
  return useContext(WorkbenchContext);
}
