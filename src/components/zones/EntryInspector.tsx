/**
 * EntryInspector Component
 *
 * Inspector panel content for master index entry selection.
 */

import { Calendar, Tag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IndexEntry } from "@/lib/pagination";

interface EntryInspectorProps {
  entry: IndexEntry;
  onDescriptionChange?: (entryId: string, description: string) => void;
  onDateChange?: (entryId: string, date: string) => void;
  onDisputedChange?: (entryId: string, disputed: boolean) => void;
  onRemoveFromBundle?: (entryId: string) => void;
}

export function EntryInspector({
  entry,
  onDescriptionChange,
  onDateChange,
  onDisputedChange,
  onRemoveFromBundle,
}: EntryInspectorProps) {
  const isSectionBreak = entry.rowType === "section-break";

  const formatPageRange = (start: number, end: number) => {
    if (start === end) return `${start}`;
    return `${start} - ${end}`;
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-4 space-y-4">
        {/* Metadata Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isSectionBreak ? "Section Break" : "Document Metadata"}
          </h3>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs flex items-center gap-1.5"
            >
              <Tag className="h-3 w-3" />
              {isSectionBreak ? "Section Title" : "Description"}
            </Label>
            <Input
              id="description"
              value={
                isSectionBreak
                  ? entry.sectionLabel || ""
                  : entry.description
              }
              onChange={(e) =>
                onDescriptionChange?.(entry.id, e.target.value)
              }
              className="h-8 text-sm"
              placeholder={
                isSectionBreak
                  ? "e.g., TAB A - Pleadings"
                  : "e.g., Statement of Claim"
              }
            />
          </div>

          {/* Date (documents only) */}
          {!isSectionBreak && (
            <div className="space-y-1.5">
              <Label
                htmlFor="date"
                className="text-xs flex items-center gap-1.5"
              >
                <Calendar className="h-3 w-3" />
                Date
              </Label>
              <Input
                id="date"
                value={entry.date || ""}
                onChange={(e) => onDateChange?.(entry.id, e.target.value)}
                className="h-8 text-sm"
                placeholder="14 February 2025"
              />
            </div>
          )}

          {/* Disputed checkbox (documents only) */}
          {!isSectionBreak && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="disputed"
                checked={entry.disputed}
                onCheckedChange={(checked) =>
                  onDisputedChange?.(entry.id, checked as boolean)
                }
              />
              <Label
                htmlFor="disputed"
                className="text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                Disputed
              </Label>
            </div>
          )}

          {/* Page info (documents only) */}
          {!isSectionBreak && (
            <div className="pt-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Pages:</span>{" "}
                {formatPageRange(entry.pageStart, entry.pageEnd)}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onRemoveFromBundle?.(entry.id)}
          >
            Remove from Bundle
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

