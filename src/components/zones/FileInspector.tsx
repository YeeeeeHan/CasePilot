/**
 * FileInspector Component
 *
 * Inspector panel content for repository file selection.
 */

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WorkbenchMode } from "@/types/domain";

export interface InspectorFile {
  id: string;
  name: string;
  filePath: string;
  pageCount?: number;
  isLinked: boolean;
}

interface FileInspectorProps {
  mode: WorkbenchMode;
  file: InspectorFile;
  onAddToBundle?: (fileId: string) => void;
}

export function FileInspector({
  mode,
  file,
  onAddToBundle,
}: FileInspectorProps) {
  const isAffidavit = mode === "affidavit";
  const addButtonLabel = isAffidavit ? "Link Exhibit" : "Add to Bundle";
  const linkedStatusLabel = isAffidavit ? "Linked" : "In Bundle";
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-4 space-y-4">
        {/* File Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            File Info
          </h3>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-muted-foreground">Name:</span>{" "}
              {file.name}
            </p>
            {file.pageCount && (
              <p>
                <span className="font-medium text-muted-foreground">
                  Pages:
                </span>{" "}
                {file.pageCount}
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <span className="font-medium text-muted-foreground">Status:</span>
              {file.isLinked ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-3.5 w-3.5" /> {linkedStatusLabel}
                </span>
              ) : (
                <span className="text-muted-foreground">Available</span>
              )}
            </p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          {!file.isLinked && (
            <Button className="w-full" onClick={() => onAddToBundle?.(file.id)}>
              {addButtonLabel}
            </Button>
          )}
        </div>

        {/* Path Footer */}
        <div className="mt-auto pt-4 text-xs text-muted-foreground">
          <p className="truncate" title={file.filePath}>
            <span className="font-medium">Path:</span>{" "}
            {file.filePath.split(/[\\/]/).pop()}
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
