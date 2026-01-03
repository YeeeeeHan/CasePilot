import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";

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
}

export function AppLayout({
  projectSwitcher,
  sidebar,
  workbench,
  inspector,
  inspectorOpen = false,
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
            {inspectorOpen ? (
              <ResizablePanelGroup orientation="vertical" className="h-full">
                {/* Repository section - resizable when inspector is open */}
                <ResizablePanel defaultSize={50} minSize={15}>
                  <div className="h-full p-2 overflow-y-auto">{sidebar}</div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Inspector section - resizable */}
                <ResizablePanel defaultSize={50} minSize={20}>
                  <div className="h-full overflow-hidden border-t border-border">
                    {inspector}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full p-2 overflow-y-auto">{sidebar}</div>
            )}
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
