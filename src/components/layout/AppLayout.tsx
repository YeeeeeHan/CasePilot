import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";

interface AppLayoutProps {
  sidebar: React.ReactNode;
  staging: React.ReactNode;
  masterIndex: React.ReactNode;
  preview: React.ReactNode;
}

export function AppLayout({
  sidebar,
  staging,
  masterIndex,
  preview,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Zone A: Fixed Sidebar */}
      <div className="w-[48px] border-r border-border bg-muted flex flex-col items-center py-2 z-10">
        {sidebar}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Left Pane: Staging + Index */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="flex flex-col h-full">
              {/* Zone B: Staging Area */}
              <div className="h-[200px] border-b border-border bg-background p-4 overflow-hidden flex flex-col">
                {staging}
              </div>

              {/* Zone C: Master Index */}
              <div className="flex-1 bg-background p-4 overflow-auto">
                {masterIndex}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Pane: Bundle Preview */}
          <ResizablePanel defaultSize={60} minSize={25}>
            <div className="h-full bg-muted/20 p-4 overflow-hidden">
              {preview}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
