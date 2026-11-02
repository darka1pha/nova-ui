"use client";

import { GripVertical } from "lucide-react";
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useOptionalTheme } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";

/*
 * Resizable panels. Sizes are percentages of the group that always sum to 100.
 * A handle moves the boundary between the panel before it and the panel after
 * it; both stay within their min/max, and a collapsible panel snaps shut when
 * dragged below half its minimum.
 */

export interface ResizablePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Starting size, % of the group. Panels without one share what is left. */
  defaultSize?: number;
  /** Smallest size while open, %. Defaults to 10. */
  minSize?: number;
  /** Largest size, %. Defaults to 100. */
  maxSize?: number;
  /** Snap shut when dragged below half of minSize (or with Enter on its handle). */
  collapsible?: boolean;
  /** Size when collapsed, %. Defaults to 0. */
  collapsedSize?: number;
}

interface Constraints {
  min: number;
  max: number;
  collapsible: boolean;
  collapsed: number;
}

interface GroupContextValue {
  direction: "horizontal" | "vertical";
  sizes: number[];
  constraints: Constraints[];
  panelIds: string[];
  /** aria-label of each panel, used to name its handle. */
  panelLabels: (string | undefined)[];
  /** Move the boundary after panel `index` so that panel becomes `size` %. */
  /**
   * `origin` is the panel's size when the gesture began; if the panel ends up
   * collapsed, expanding it later returns there (not to wherever the drag passed).
   */
  resize: (index: number, size: number, origin?: number) => void;
  toggleCollapse: (index: number) => void;
  groupRef: React.RefObject<HTMLDivElement | null>;
  labels: { handle: (before: string | undefined) => string };
}

const GroupContext = createContext<GroupContextValue | null>(null);
const IndexContext = createContext<number>(-1);

const round = (n: number) => Math.round(n * 100) / 100;

export interface ResizablePanelGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Lay panels out side by side (`horizontal`) or stacked (`vertical`). */
  direction?: "horizontal" | "vertical";
  /** Called with the sizes (%) after every change. */
  onLayout?: (sizes: number[]) => void;
  /** Remembers the layout in localStorage under this key. */
  autoSaveId?: string;
  labels?: { handle?: (panelLabel: string | undefined) => string };
  children: ReactNode;
}

const isPanel = (node: ReactNode): node is ReactElement<ResizablePanelProps> => isValidElement(node) && node.type === ResizablePanel;

function readSaved(key: string | undefined, count: number): number[] | null {
  if (!key) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`nv-resizable:${key}`) ?? "null") as unknown;
    if (Array.isArray(parsed) && parsed.length === count && parsed.every((n) => typeof n === "number")) return parsed as number[];
  } catch {
    /* storage unavailable or corrupt: fall back to defaults */
  }
  return null;
}

/** Lays out ResizablePanels with ResizableHandles between them. */
export const ResizablePanelGroup = forwardRef<HTMLDivElement, ResizablePanelGroupProps>(function ResizablePanelGroup(
  { direction = "horizontal", onLayout, autoSaveId, labels, className, children, ...props },
  ref,
) {
  const panels = Children.toArray(children).filter(isPanel);
  const constraints: Constraints[] = panels.map((p) => ({
    min: p.props.minSize ?? 10,
    max: p.props.maxSize ?? 100,
    collapsible: !!p.props.collapsible,
    collapsed: p.props.collapsedSize ?? 0,
  }));
  const baseId = useId();
  const panelIds = panels.map((p, i) => p.props.id ?? `${baseId}-panel-${i}`);
  const panelLabels = panels.map((p) => p.props["aria-label"]);

  const [sizes, setSizes] = useState<number[]>(() => {
    const saved = typeof window === "undefined" ? null : readSaved(autoSaveId, panels.length);
    if (saved) return saved;
    const given = panels.map((p) => p.props.defaultSize);
    const fixed = given.reduce<number>((sum, s) => sum + (s ?? 0), 0);
    const open = given.filter((s) => s === undefined).length;
    return given.map((s) => round(s ?? Math.max(0, 100 - fixed) / Math.max(1, open)));
  });
  // Size before collapsing, so expanding returns to it.
  const beforeCollapse = useRef<Record<number, number>>({});
  const groupRef = useRef<HTMLDivElement>(null);
  // Drags fire faster than renders; every step builds on the newest layout.
  const latest = useRef(sizes);

  const commit = useCallback(
    (next: number[]) => {
      latest.current = next;
      setSizes(next);
      onLayout?.(next);
      if (autoSaveId) {
        try {
          window.localStorage.setItem(`nv-resizable:${autoSaveId}`, JSON.stringify(next));
        } catch {
          /* storage may be blocked; the layout still works for this visit */
        }
      }
    },
    [onLayout, autoSaveId],
  );

  // Move the boundary after `index`: that panel takes `target` %, the next panel gives or takes the difference.
  const resize = useCallback(
    (index: number, target: number, origin?: number) => {
      const current = latest.current;
      const a = constraints[index];
      const b = constraints[index + 1];
      if (!a || !b) return;
      const pair = (current[index] ?? 0) + (current[index + 1] ?? 0);
      // Collapsible panels snap shut below half their minimum, and open straight to it.
      const fit = (c: Constraints, size: number) => (c.collapsible && size < c.min / 2 ? c.collapsed : Math.min(c.max, Math.max(c.min, size)));
      let first = fit(a, target);
      const second = fit(b, pair - first);
      // If the second panel had to be clamped, the first gives way.
      first = pair - second;
      if (!(a.collapsible && first === a.collapsed)) first = Math.min(a.max, Math.max(a.min, first));
      if (round(first) === current[index]) return;
      // Remember where a panel was before it closed, so expanding it can go back there.
      const second2 = pair - first;
      if (a.collapsible && first === a.collapsed && (current[index] ?? 0) > a.collapsed) {
        beforeCollapse.current[index] = Math.max(a.min, origin ?? current[index] ?? a.min);
      }
      if (b.collapsible && second2 === b.collapsed && (current[index + 1] ?? 0) > b.collapsed) {
        beforeCollapse.current[index + 1] = Math.max(b.min, origin === undefined ? (current[index + 1] ?? b.min) : pair - origin);
      }
      const next = [...current];
      next[index] = round(first);
      next[index + 1] = round(pair - first);
      commit(next);
    },
    // Constraints come from props each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, JSON.stringify(constraints)],
  );

  const toggleCollapse = useCallback(
    (index: number) => {
      const c = constraints[index];
      if (!c?.collapsible) return;
      const size = latest.current[index] ?? 0;
      if (size <= c.collapsed) resize(index, beforeCollapse.current[index] ?? c.min);
      else {
        beforeCollapse.current[index] = size;
        resize(index, c.collapsed);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resize, JSON.stringify(constraints)],
  );

  const value = useMemo<GroupContextValue>(
    () => ({
      direction,
      sizes,
      constraints,
      panelIds,
      panelLabels,
      resize,
      toggleCollapse,
      groupRef,
      labels: { handle: labels?.handle ?? ((before) => (before ? `Resize ${before}` : "Resize panels")) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, sizes, JSON.stringify(constraints), panelIds.join(), panelLabels.join(), resize, toggleCollapse, labels?.handle],
  );

  // Give each panel and handle its position: panels count in order; a handle belongs to the panel before it.
  let panelIndex = -1;
  const laidOut = Children.map(children, (child) => {
    if (isPanel(child)) {
      panelIndex += 1;
      return <IndexContext.Provider value={panelIndex}>{child}</IndexContext.Provider>;
    }
    if (isValidElement(child) && child.type === ResizableHandle) {
      return <IndexContext.Provider value={panelIndex}>{cloneElement(child)}</IndexContext.Provider>;
    }
    return child;
  });

  return (
    <GroupContext.Provider value={value}>
      <div
        ref={(el) => {
          groupRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        data-direction={direction}
        className={cn("flex h-full w-full overflow-hidden", direction === "vertical" ? "flex-col" : "flex-row", className)}
        {...props}
      >
        {laidOut}
      </div>
    </GroupContext.Provider>
  );
});

/** One region of a ResizablePanelGroup. */
export const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(function ResizablePanel(
  // Constraint props are read by the group.
  { defaultSize: _d, minSize: _min, maxSize: _max, collapsible: _c, collapsedSize: _cs, className, style, ...props },
  ref,
) {
  const group = useContext(GroupContext);
  const index = useContext(IndexContext);
  const size = group?.sizes[index] ?? 100;
  const collapsed = !!group?.constraints[index]?.collapsible && size <= (group?.constraints[index]?.collapsed ?? 0);
  return (
    <div
      ref={ref}
      id={group?.panelIds[index]}
      data-panel-size={size}
      data-collapsed={collapsed || undefined}
      // flex-grow by percentage: the panels always fill the group exactly.
      style={{ flexGrow: size, flexShrink: 1, flexBasis: 0, ...style }}
      className={cn("min-h-0 min-w-0 overflow-auto", collapsed && "invisible", className)}
      {...props}
    />
  );
});

export interface ResizableHandleProps extends HTMLAttributes<HTMLDivElement> {
  /** Show a grip on the handle (recommended when the edge is not obvious). */
  withGrip?: boolean;
  /** Arrow-key step, % of the group. Shift moves five times as far. Defaults to 2. */
  keyboardStep?: number;
}

/** The draggable, focusable boundary between two panels (role="separator"). */
export const ResizableHandle = forwardRef<HTMLDivElement, ResizableHandleProps>(function ResizableHandle(
  { withGrip = false, keyboardStep = 2, className, ...props },
  ref,
) {
  const group = useContext(GroupContext);
  const index = useContext(IndexContext);
  const rtl = (useOptionalTheme()?.dir ?? "ltr") === "rtl";
  const drag = useRef<{ start: number; startSize: number; extent: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;
    // While dragging, the whole page shows the resize cursor and text doesn't get selected.
    const previous = document.body.style.cursor;
    document.body.style.cursor = group?.direction === "vertical" ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = previous;
      document.body.style.userSelect = "";
    };
  }, [dragging, group?.direction]);

  if (!group || index < 0) return null;
  const horizontal = group.direction === "horizontal";
  const size = group.sizes[index] ?? 0;
  const c = group.constraints[index];
  const panelLabel = group.panelLabels[index];

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const rect = group.groupRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { start: horizontal ? e.clientX : e.clientY, startSize: size, extent: horizontal ? rect.width : rect.height };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.extent === 0) return;
    let delta = ((horizontal ? e.clientX : e.clientY) - d.start) / d.extent * 100;
    // In RTL the first panel sits on the right, so dragging left grows it.
    if (horizontal && rtl) delta = -delta;
    group.resize(index, d.startSize + delta, d.startSize);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = keyboardStep * (e.shiftKey ? 5 : 1);
    const grow = horizontal ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
    const shrink = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
    const action = {
      [grow]: () => group.resize(index, size + step),
      [shrink]: () => group.resize(index, size - step),
      Home: () => group.resize(index, c?.collapsible ? c.collapsed : (c?.min ?? 0), size),
      End: () => group.resize(index, c?.max ?? 100),
      Enter: () => group.toggleCollapse(index),
    }[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      // A vertical line divides a horizontal group.
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-controls={group.panelIds[index]}
      aria-valuenow={Math.round(size)}
      aria-valuemin={Math.round(c?.collapsible ? (c.collapsed) : (c?.min ?? 0))}
      aria-valuemax={Math.round(c?.max ?? 100)}
      aria-label={group.labels.handle(panelLabel)}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={() => group.toggleCollapse(index)}
      className={cn(
        "group/handle relative flex shrink-0 touch-none items-center justify-center bg-border outline-none transition-colors duration-(--nv-duration-fast)",
        horizontal ? "w-px cursor-col-resize" : "h-px cursor-row-resize",
        // A wider invisible hit area than the 1px line.
        horizontal ? "after:absolute after:inset-y-0 after:-inset-x-1.5" : "after:absolute after:inset-x-0 after:-inset-y-1.5",
        "hover:bg-primary-solid data-[dragging]:bg-primary-solid focus-visible:bg-focus-ring focus-visible:ring-2 focus-visible:ring-focus-ring/40",
        className,
      )}
      {...props}
    >
      {withGrip ? (
        <span
          aria-hidden
          className={cn(
            "z-10 flex items-center justify-center rounded-sm border border-border bg-surface text-foreground-muted shadow-xs group-hover/handle:text-foreground",
            horizontal ? "h-6 w-3.5" : "h-3.5 w-6 [&_svg]:rotate-90",
          )}
        >
          <GripVertical className="size-3" />
        </span>
      ) : null}
    </div>
  );
});
