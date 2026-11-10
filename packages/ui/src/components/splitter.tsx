import { forwardRef, type ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizablePanelGroupProps, type ResizablePanelProps } from "./resizable.tsx";

export interface SplitterPane extends Pick<ResizablePanelProps, "defaultSize" | "minSize" | "maxSize" | "collapsible" | "collapsedSize" | "className"> {
  /** Stable key for the pane. */
  id: string;
  /** Names the pane and the handle after it ("Resize Sidebar"). */
  label: string;
  content: ReactNode;
}

export interface SplitterProps extends Omit<ResizablePanelGroupProps, "children"> {
  /** Two or more panes, in reading order. */
  panes: SplitterPane[];
  /** Show a grip on each handle. Default true. */
  withGrip?: boolean;
  /** Arrow-key step for the handles, % of the group. Default 2. */
  keyboardStep?: number;
}

/**
 * Resizable panes from a list: the common case of ResizablePanelGroup without
 * writing the handles. Each pane gets an accessible name, and so does the handle
 * after it. Use the panel components directly for anything this doesn't cover.
 */
export const Splitter = forwardRef<HTMLDivElement, SplitterProps>(function Splitter({ panes, withGrip = true, keyboardStep, ...props }, ref) {
  return (
    <ResizablePanelGroup ref={ref} {...props}>
      {/* A flat list: the group finds its panels and handles among direct children, not inside fragments. */}
      {panes.flatMap(({ id, label, content, ...pane }, i) => [
        ...(i > 0 ? [<ResizableHandle key={`${id}-handle`} withGrip={withGrip} keyboardStep={keyboardStep} />] : []),
        <ResizablePanel key={id} aria-label={label} {...pane}>
          {content}
        </ResizablePanel>,
      ])}
    </ResizablePanelGroup>
  );
});
