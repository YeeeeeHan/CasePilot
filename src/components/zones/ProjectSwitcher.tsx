import { useState } from "react";
import { Plus, Trash2, GitBranch, Files } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type SidebarView = "project-tree" | "files";

export interface ProjectCase {
  id: string;
  name: string;
  initials: string; // e.g., "JvS" for "Jones v Smith"
}

interface ProjectSwitcherProps {
  cases: ProjectCase[];
  activeCaseId?: string | null;
  onSelectCase?: (caseId: string) => void;
  onCreateCase?: () => void;
  onDeleteCase?: (caseId: string) => void;
  /** Current sidebar view */
  sidebarView?: SidebarView;
  /** Callback when sidebar view changes */
  onSidebarViewChange?: (view: SidebarView) => void;
}

function getInitials(name: string): string {
  // Handle "X v Y" format common in legal cases
  if (name.includes(" v ")) {
    const [plaintiff, defendant] = name.split(" v ");
    return `${plaintiff[0]}v${defendant[0]}`.toUpperCase();
  }
  // Fallback: first letters of first two words
  const words = name.split(" ").filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function ProjectSwitcher({
  cases,
  activeCaseId,
  onSelectCase,
  onCreateCase,
  onDeleteCase,
  sidebarView = "project-tree",
  onSidebarViewChange,
}: ProjectSwitcherProps) {
  const [caseToDelete, setCaseToDelete] = useState<ProjectCase | null>(null);

  const handleDeleteConfirm = () => {
    if (caseToDelete && onDeleteCase) {
      onDeleteCase(caseToDelete.id);
    }
    setCaseToDelete(null);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full items-center gap-1">
        {/* Case icons */}
        <div className="flex-1 flex flex-col gap-1 pt-1">
          {cases.map((caseItem) => {
            const initials = caseItem.initials || getInitials(caseItem.name);
            const isActive = activeCaseId === caseItem.id;

            return (
              <ContextMenu key={caseItem.id}>
                <ContextMenuTrigger asChild>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onSelectCase?.(caseItem.id)}
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {initials.slice(0, 3)}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{caseItem.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setCaseToDelete(caseItem)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Case
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

          {/* Add case button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCreateCase}
                className="w-9 h-9 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New Case</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* View toggle icons */}
        <div className="flex flex-col gap-1 pb-2 border-t border-border pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  sidebarView === "project-tree" &&
                    "bg-accent text-accent-foreground"
                )}
                onClick={() => onSidebarViewChange?.("project-tree")}
              >
                <GitBranch className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Project Tree</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  sidebarView === "files" && "bg-accent text-accent-foreground"
                )}
                onClick={() => onSidebarViewChange?.("files")}
              >
                <Files className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Files</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={caseToDelete !== null}
        onOpenChange={(open) => !open && setCaseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{caseToDelete?.name}"? This will
              permanently delete all documents and exhibits in this case. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
