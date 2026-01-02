import * as React from "react";
import {
  Group as PanelGroupPrimitive,
  Panel as PanelPrimitive,
  Separator as PanelResizeHandlePrimitive,
  type Layout,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  onLayoutChange,
  ...props
}: React.ComponentProps<typeof PanelGroupPrimitive>) {
  const handleLayoutChange = React.useCallback(
    (layout: Layout) => {
      console.debug("[ResizablePanelGroup] layout change", { layout });
      onLayoutChange?.(layout);
    },
    [onLayoutChange],
  );
  return (
    <PanelGroupPrimitive
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[orientation=vertical]:flex-col",
        className,
      )}
      onLayoutChange={handleLayoutChange}
      {...props}
    />
  );
}

function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<typeof PanelPrimitive>) {
  return (
    <PanelPrimitive
      data-slot="resizable-panel"
      className={cn("h-full", className)}
      {...props}
    />
  );
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandlePrimitive> & {
  withHandle?: boolean;
}) {
  return (
    <PanelResizeHandlePrimitive
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:translate-x-0 data-[orientation=vertical]:after:-translate-y-1/2 [&[data-orientation=vertical]>div]:rotate-90",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border h-6 w-1 rounded-lg z-10 flex shrink-0" />
      )}
    </PanelResizeHandlePrimitive>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
