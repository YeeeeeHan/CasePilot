import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../ui/resizable';
import { ScrollArea } from '../ui/scroll-area';

interface AppLayoutProps {
  /** Zone A: Project switcher icons */
  projectSwitcher: React.ReactNode;
  /** Sidebar content: Inbox + File tree */
  sidebar: React.ReactNode;
  /** Zone C: Workbench (Master Index + Preview Pane) */
  workbench: React.ReactNode;
  /** Zone D: Inspector panel */
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

      {/* Main Content Area: 3-Column Layout */}
      <div className="flex-1 min-w-0">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Left Column: Sidebar (Inbox + File Tree) */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <ScrollArea className="h-full">
              <div className="p-2">{sidebar}</div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Column: Workbench (Master Index + Preview Pane) */}
          <ResizablePanel defaultSize={inspectorOpen ? 50 : 80} minSize={30}>
            <div className="h-full bg-background overflow-hidden">
              {workbench}
            </div>
          </ResizablePanel>

          {/* Only show handle and inspector when inspector is open */}
          {inspectorOpen && (
            <>
              <ResizableHandle />

              {/* Right Column: Inspector */}
              <ResizablePanel defaultSize={15} minSize={20}>
                <div className="h-full border-l border-border bg-background">
                  {inspector}
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
