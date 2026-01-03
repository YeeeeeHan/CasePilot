/**
 * EditorHeader Component
 *
 * Header area for the AffidavitEditor with editable initials badge.
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorHeaderProps {
  /** Artifact name (e.g., "Affidavit of Tan Ah Kow") */
  name: string;
  /** Exhibit initials (e.g., "TAK") */
  initials: string;
  /** Called when initials change */
  onInitialsChange?: (initials: string) => void;
}

export function EditorHeader({
  name,
  initials,
  onInitialsChange,
}: EditorHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInitials, setEditedInitials] = useState(initials);

  // Sync initials when prop changes
  useEffect(() => {
    setEditedInitials(initials);
  }, [initials]);

  const handleSave = () => {
    const trimmed = editedInitials.trim().toUpperCase();
    if (trimmed && trimmed !== initials) {
      onInitialsChange?.(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInitials(initials);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
      <h2 className="text-sm font-medium truncate">{name}</h2>

      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            value={editedInitials}
            onChange={(e) =>
              setEditedInitials(e.target.value.toUpperCase().slice(0, 5))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className="h-6 w-16 text-xs uppercase px-1"
            maxLength={5}
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleSave}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={cn(
            "group flex items-center gap-1 px-2 py-0.5 rounded text-xs",
            "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
          )}
        >
          <span className="font-mono font-medium">{initials || "---"}</span>
          <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}
