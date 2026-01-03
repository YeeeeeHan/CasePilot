/**
 * CreateArtifactDialog Component
 *
 * Dialog for creating new artifacts (affidavits or bundles).
 * Extracted from ProjectTree to reduce component complexity.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CreateArtifactDialogProps {
  open: boolean;
  type: "affidavit" | "bundle";
  onOpenChange: (open: boolean) => void;
  onCreate?: (
    type: "affidavit" | "bundle",
    name: string,
    initials?: string,
  ) => void;
}

export function CreateArtifactDialog({
  open,
  type,
  onOpenChange,
  onCreate,
}: CreateArtifactDialogProps) {
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setInitials("");
    }
  }, [open]);

  const handleCreate = () => {
    if (!name.trim()) return;

    onCreate?.(
      type,
      name.trim(),
      type === "affidavit" ? initials.trim() : undefined,
    );
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            New {type === "affidavit" ? "Affidavit" : "Bundle"}
          </DialogTitle>
          <DialogDescription>
            {type === "affidavit"
              ? "Create a new affidavit with exhibit references."
              : "Create a new document bundle."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder={
                type === "affidavit"
                  ? "Affidavit of Tan Ah Kow"
                  : "Agreed Bundle"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>
          {type === "affidavit" && (
            <div className="grid gap-2">
              <Label htmlFor="initials">
                Exhibit Initials
                <span className="text-muted-foreground font-normal ml-1">
                  (e.g., TAK-1, TAK-2)
                </span>
              </Label>
              <Input
                id="initials"
                placeholder="TAK"
                value={initials}
                onChange={(e) =>
                  setInitials(e.target.value.toUpperCase().slice(0, 5))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                className="uppercase"
                maxLength={5}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
