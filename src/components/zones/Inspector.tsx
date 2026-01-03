/**
 * Inspector Component
 *
 * Switcher component that renders the appropriate inspector panel
 * based on selection source.
 */

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IndexEntry } from "@/lib/pagination";
import type { WorkbenchMode } from "@/types/domain";
import { FileInspector, type InspectorFile } from "./FileInspector";
import { EntryInspector } from "./EntryInspector";

export type SelectionSource = "repository" | "master-index";

// Re-export for consumers
export type { InspectorFile };

interface InspectorProps {
  mode: WorkbenchMode;
  selectedFile: InspectorFile | null;
  selectedEntry: IndexEntry | null;
  selectionSource: SelectionSource | null;
  onDescriptionChange?: (entryId: string, description: string) => void;
  onDateChange?: (entryId: string, date: string) => void;
  onDisputedChange?: (entryId: string, disputed: boolean) => void;
  onAddToBundle?: (fileId: string) => void;
  onRemoveFromBundle?: (entryId: string) => void;
  onClose?: () => void;
}

export function Inspector({
  mode,
  selectedFile,
  selectedEntry,
  selectionSource,
  onDescriptionChange,
  onDateChange,
  onDisputedChange,
  onAddToBundle,
  onRemoveFromBundle,
  onClose,
}: InspectorProps) {
  // Empty state
  if (!selectedFile && !selectedEntry) {
    return (
      <div className="flex flex-col h-full">
        <InspectorHeader onClose={onClose} />
        <div className="flex flex-col flex-1 items-center justify-center text-muted-foreground p-2">
          <FileText className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-[11px] text-center">Select a file to inspect</p>
          <p className="text-[10px] text-center mt-0.5 opacity-70">
            Click a file from Repository or Master Index
          </p>
        </div>
      </div>
    );
  }

  // Master Index entry selected
  if (selectionSource === "master-index" && selectedEntry) {
    return (
      <div className="flex flex-col h-full">
        <InspectorHeader onClose={onClose} />
        <EntryInspector
          mode={mode}
          entry={selectedEntry}
          onDescriptionChange={onDescriptionChange}
          onDateChange={onDateChange}
          onDisputedChange={onDisputedChange}
          onRemoveFromBundle={onRemoveFromBundle}
        />
      </div>
    );
  }

  // Repository file selected
  if (selectionSource === "repository" && selectedFile) {
    return (
      <div className="flex flex-col h-full">
        <InspectorHeader onClose={onClose} />
        <FileInspector
          mode={mode}
          file={selectedFile}
          onAddToBundle={onAddToBundle}
        />
      </div>
    );
  }

  return null;
}

// Internal header component - compact VS Code-like style
function InspectorHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Inspector
      </h2>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0"
        onClick={onClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
