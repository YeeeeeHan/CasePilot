import { useState } from "react";
import { FileStack, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface CreateCaseDialogProps {
  open: boolean;
  caseType: "bundle" | "affidavit" | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
}

export function CreateCaseDialog({
  open,
  caseType,
  onOpenChange,
  onConfirm,
}: CreateCaseDialogProps) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      setName("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setName("");
    onOpenChange(false);
  };

  const typeLabel = caseType === "affidavit" ? "Affidavit" : "Bundle";
  const TypeIcon = caseType === "affidavit" ? FileText : FileStack;
  const defaultName = `New ${typeLabel}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5" />
            Create New {typeLabel}
          </DialogTitle>
          <DialogDescription>
            Enter a name for your new {typeLabel.toLowerCase()}. You can change
            this later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="case-name">Case Name</Label>
            <Input
              id="case-name"
              placeholder={defaultName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                } else if (e.key === "Escape") {
                  handleCancel();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>
            Create {typeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
