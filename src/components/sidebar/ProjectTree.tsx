/**
 * ProjectTree Component
 *
 * Shows artifacts (Affidavits and Bundles) in a tree structure.
 * Clicking an artifact switches the Workbench to that mode.
 */

import { useState } from "react";
import {
  ChevronDown,
  FileText,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export interface ProjectArtifact {
  id: string;
  name: string;
  type: "affidavit" | "bundle";
  /** Initials for affidavits (e.g., "TAK") */
  initials?: string;
}

interface ProjectTreeProps {
  artifacts: ProjectArtifact[];
  activeArtifactId?: string | null;
  onSelectArtifact?: (artifactId: string) => void;
  onCreateArtifact?: (
    type: "affidavit" | "bundle",
    name: string,
    initials?: string
  ) => void;
  onDeleteArtifact?: (artifactId: string) => void;
}

interface CreateArtifactDialogState {
  open: boolean;
  type: "affidavit" | "bundle";
}

export function ProjectTree({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onCreateArtifact,
  onDeleteArtifact,
}: ProjectTreeProps) {
  const [affidavitsExpanded, setAffidavitsExpanded] = useState(true);
  const [bundlesExpanded, setBundlesExpanded] = useState(true);
  const [createDialog, setCreateDialog] = useState<CreateArtifactDialogState>({
    open: false,
    type: "affidavit",
  });
  const [newName, setNewName] = useState("");
  const [newInitials, setNewInitials] = useState("");

  const affidavits = artifacts.filter((a) => a.type === "affidavit");
  const bundles = artifacts.filter((a) => a.type === "bundle");

  const handleCreateClick = (type: "affidavit" | "bundle") => {
    setNewName("");
    setNewInitials("");
    setCreateDialog({ open: true, type });
  };

  const handleCreateConfirm = () => {
    if (!newName.trim()) return;

    onCreateArtifact?.(
      createDialog.type,
      newName.trim(),
      createDialog.type === "affidavit" ? newInitials.trim() : undefined
    );
    setCreateDialog({ open: false, type: "affidavit" });
    setNewName("");
    setNewInitials("");
  };

  const renderArtifactItem = (artifact: ProjectArtifact) => {
    const isActive = activeArtifactId === artifact.id;
    const Icon = artifact.type === "affidavit" ? FileText : Package;

    return (
      <div key={artifact.id} className="group relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectArtifact?.(artifact.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors pr-7",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{artifact.name}</span>
              {artifact.initials && (
                <Badge variant="outline" className="h-4 px-1 text-[10px]">
                  {artifact.initials}
                </Badge>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p className="font-medium">{artifact.name}</p>
            <p className="text-muted-foreground capitalize">{artifact.type}</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete button on hover */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteArtifact?.(artifact.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Delete artifact</span>
        </Button>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Header with + button */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Project Tree
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreateClick("affidavit")}>
                <FileText className="h-4 w-4 mr-2" />
                New Affidavit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateClick("bundle")}>
                <Package className="h-4 w-4 mr-2" />
                New Bundle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Affidavits section */}
        <Collapsible
          open={affidavitsExpanded}
          onOpenChange={setAffidavitsExpanded}
          className="space-y-1"
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1 text-xs hover:bg-accent rounded-md transition-colors">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 text-left font-medium">Affidavits</span>
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {affidavits.length}
            </Badge>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                affidavitsExpanded && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-0.5 pl-2">
              {affidavits.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  No affidavits yet
                </p>
              ) : (
                affidavits.map(renderArtifactItem)
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Bundles section */}
        <Collapsible
          open={bundlesExpanded}
          onOpenChange={setBundlesExpanded}
          className="space-y-1"
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1 text-xs hover:bg-accent rounded-md transition-colors">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 text-left font-medium">Bundles</span>
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {bundles.length}
            </Badge>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                bundlesExpanded && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-0.5 pl-2">
              {bundles.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  No bundles yet
                </p>
              ) : (
                bundles.map(renderArtifactItem)
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Create artifact dialog */}
      <Dialog
        open={createDialog.open}
        onOpenChange={(open) =>
          setCreateDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              New {createDialog.type === "affidavit" ? "Affidavit" : "Bundle"}
            </DialogTitle>
            <DialogDescription>
              {createDialog.type === "affidavit"
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
                  createDialog.type === "affidavit"
                    ? "Affidavit of Tan Ah Kow"
                    : "Agreed Bundle"
                }
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateConfirm();
                }}
              />
            </div>
            {createDialog.type === "affidavit" && (
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
                  value={newInitials}
                  onChange={(e) =>
                    setNewInitials(e.target.value.toUpperCase().slice(0, 5))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateConfirm();
                  }}
                  className="uppercase"
                  maxLength={5}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialog({ open: false, type: "affidavit" })}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateConfirm} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
