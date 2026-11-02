"use client";

import { Children, forwardRef, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";
/** Columns: a fixed count, or one per container width (min-width, Tailwind's breakpoints). */
export type MasonryColumns = number | Partial<Record<Breakpoint, number>>;

const breakpoints: [Breakpoint, number][] = [
  ["xl", 1280],
  ["lg", 1024],
  ["md", 768],
  ["sm", 640],
  ["base", 0],
];

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** `list[i]` for an index known to be in range. */
const at = <V,>(list: readonly V[], i: number) => list[i] as V;

function resolveColumns(columns: MasonryColumns, width: number) {
  if (typeof columns === "number") return Math.max(1, columns);
  for (const [name, min] of breakpoints) {
    const n = columns[name];
    if (width >= min && n !== undefined) return Math.max(1, n);
  }
  return 1;
}

interface Layout {
  count: number;
  tops: number[];
  cols: number[];
  height: number;
}

export interface MasonryProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Defaults to 1 column, 2 from 640px wide, 3 from 1024px. Measured on the container. */
  columns?: MasonryColumns;
  /** Gap between items, in pixels. */
  gap?: number;
}

/**
 * Items of different heights packed into columns, each going into the currently
 * shortest one. Items stay in source order in the DOM (unlike CSS `columns`), so
 * Tab and screen-reader order match reading order. Renders as a plain grid on the
 * server and before heights are known, then packs.
 */
export const Masonry = forwardRef<HTMLDivElement, MasonryProps>(function Masonry(
  { children, columns = { base: 1, sm: 2, lg: 3 }, gap = 16, className, style, ...props },
  ref,
) {
  const items = Children.toArray(children);
  const root = useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(ref, root);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const [count, setCount] = useState(() => resolveColumns(columns, 0));
  const [layout, setLayout] = useState<Layout | null>(null);
  const columnsKey = JSON.stringify(columns);
  // Re-pack when children are added, removed, replaced or reordered, not only when the count changes.
  const order = items.map((item, i) => (item as { key?: string | null }).key ?? i).join("|");

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const pack = () => {
      const n = resolveColumns(columns, el.clientWidth);
      setCount(n);
      const totals = Array<number>(n).fill(0);
      const tops: number[] = [];
      const cols: number[] = [];
      cells.current.slice(0, items.length).forEach((cell, i) => {
        const col = totals.indexOf(Math.min(...totals));
        tops[i] = at(totals, col);
        cols[i] = col;
        totals[col] = at(totals, col) + (cell?.offsetHeight ?? 0) + gap;
      });
      setLayout({ count: n, tops, cols, height: Math.max(0, Math.max(...totals) - gap) });
    };
    pack();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(pack);
    observer.observe(el);
    cells.current.forEach((c) => c && observer.observe(c));
    return () => observer.disconnect();
  }, [columnsKey, order, gap]);

  // The packed layout is only valid for the column count it was made for.
  const packed = layout && layout.count === count ? layout : null;
  const width = `calc((100% - ${(count - 1) * gap}px) / ${count})`;
  const cellStyle = (i: number): CSSProperties | undefined =>
    packed ? { position: "absolute", width, top: packed.tops[i], insetInlineStart: `calc(${packed.cols[i]} * (${width} + ${gap}px))` } : undefined;

  return (
    <div
      ref={composed}
      className={cn(packed ? "relative" : "grid items-start", className)}
      style={packed ? { height: packed.height, ...style } : { gap, gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, ...style }}
      {...props}
    >
      {items.map((item, i) => (
        <div
          key={(item as { key?: string | null }).key ?? i}
          ref={(node) => {
            cells.current[i] = node;
          }}
          style={cellStyle(i)}
        >
          {item}
        </div>
      ))}
    </div>
  );
});
