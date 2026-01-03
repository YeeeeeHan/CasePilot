import { GitBranch, Files } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";

export type SidebarView = "project-tree" | "files";

interface AppLayoutProps {
  /** Zone A: Project switcher icons */
  projectSwitcher: React.ReactNode;
  /** Sidebar content: Repository file tree */
  sidebar: React.ReactNode;
  /** Zone C: Workbench (Master Index + Preview Pane) */
  workbench: React.ReactNode;
  /** Zone D: Inspector panel (now in left sidebar) */
  inspector: React.ReactNode;
  /** Whether the inspector panel is open */
  inspectorOpen?: boolean;
  /** Current sidebar view */
  sidebarView?: SidebarView;
  /** Callback when sidebar view changes */
  onSidebarViewChange?: (view: SidebarView) => void;
}

export function AppLayout({
  projectSwitcher,
  sidebar,
  workbench,
  inspector,
  inspectorOpen = false,
  sidebarView = "project-tree",
  onSidebarViewChange,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Zone A: Fixed Project Switcher */}
      <div className="w-[48px] border-r border-border bg-muted flex flex-col items-center py-2 z-10">
        {projectSwitcher}
      </div>

      {/* Main Content Area: 2-Column Layout */}
      <div className="flex-1 min-w-0">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Left Column: Sidebar (Repository + Inspector stacked vertically) */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Horizontal view toggle bar */}
              <div className="h-10 border-b border-border bg-muted/30 flex items-center px-2 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 gap-2",
                    sidebarView === "project-tree" &&
                      "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onSidebarViewChange?.("project-tree")}
                >
                  <GitBranch className="h-4 w-4" />
                  <span className="text-sm">Project</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 gap-2",
                    sidebarView === "files" && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onSidebarViewChange?.("files")}
                >
                  <Files className="h-4 w-4" />
                  <span className="text-sm">Files</span>
                </Button>
              </div>

              {/* Repository section - shares space with Inspector, scrolls internally */}
              <div className="flex-1 min-h-[80px] p-2 border-b border-border overflow-y-auto">
                {sidebar}
              </div>

              {/* Inspector section - takes priority with larger min height */}
              {inspectorOpen && (
                <div className="flex-1 min-h-[280px] overflow-hidden">
                  {inspector}
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Column: Workbench (Master Index + Preview Pane) */}
          <ResizablePanel defaultSize={80} minSize={50}>
            <div className="h-full bg-background overflow-hidden">
              {workbench}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
