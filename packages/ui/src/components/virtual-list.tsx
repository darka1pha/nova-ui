"use client";

import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { cn } from "../utils/cn.ts";
import { focusRing } from "./shared.ts";

export interface VirtualListApi {
  /** Scroll so the item is visible. `auto` scrolls only if it isn't already. */
  scrollToIndex: (index: number, align?: "start" | "center" | "end" | "auto") => void;
}

export interface VirtualListProps<T> {
  /** All items; only those in view are rendered. */
  items: readonly T[];
  /** Fixed row height in px. */
  itemHeight: number;
  /** Viewport height: px, or any CSS length (then measured). */
  height: number | string;
  /** Renders one row. */
  renderItem: (item: T, index: number) => ReactNode;
  /** A stable key per row. Defaults to the index. */
  getKey?: (item: T, index: number) => string | number;
  /** Rows rendered beyond each edge, so fast scrolling doesn't flash blank. */
  overscan?: number;
  /** Load more: called when the last `endReachedThreshold` rows come into view. Called once per list length. */
  onEndReached?: () => void;
  /** How many rows before the end onEndReached fires. */
  endReachedThreshold?: number;
  /** Shown after the last row, e.g. a Spinner while loading more. */
  footer?: ReactNode;
  /** Gives you `scrollToIndex(index, align)`. */
  apiRef?: Ref<VirtualListApi>;
  /** Names the list for screen readers. */
  "aria-label"?: string;
  className?: string;
  /** Classes for each row. */
  itemClassName?: string;
}

/**
 * Renders only the rows in view, so lists of 100,000 items scroll smoothly.
 * Rows keep list semantics with `aria-setsize`/`aria-posinset`, the viewport is
 * keyboard-scrollable, and `onEndReached` makes infinite scrolling a one-liner.
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  getKey = (_, index) => index,
  overscan = 6,
  onEndReached,
  endReachedThreshold = 5,
  footer,
  apiRef,
  "aria-label": ariaLabel,
  className,
  itemClassName,
}: VirtualListProps<T>) {
  const viewport = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [measured, setMeasured] = useState(typeof height === "number" ? height : 0);
  const viewportHeight = typeof height === "number" ? height : measured;
  const endReachedAt = useRef(-1);

  useEffect(() => {
    if (typeof height === "number" || !viewport.current || typeof ResizeObserver === "undefined") return;
    const el = viewport.current;
    const observer = new ResizeObserver(() => setMeasured(el.clientHeight));
    observer.observe(el);
    setMeasured(el.clientHeight);
    return () => observer.disconnect();
  }, [height]);

  const total = items.length;
  const first = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  // Before the viewport is measured, render one screen's worth so there's something to see.
  const visibleCount = Math.ceil((viewportHeight || itemHeight * 20) / itemHeight);
  const last = Math.min(total - 1, Math.floor(scrollTop / itemHeight) + visibleCount + overscan);

  useEffect(() => {
    if (!onEndReached || total === 0) return;
    const lastInView = Math.floor((scrollTop + (viewportHeight || 0)) / itemHeight);
    if (lastInView >= total - endReachedThreshold && endReachedAt.current !== total) {
      endReachedAt.current = total;
      onEndReached();
    }
  }, [scrollTop, viewportHeight, itemHeight, total, endReachedThreshold, onEndReached]);

  useImperativeHandle(
    apiRef,
    () => ({
      scrollToIndex(index, align = "auto") {
        const el = viewport.current;
        if (!el) return;
        const top = Math.max(0, Math.min(total - 1, index)) * itemHeight;
        const view = el.clientHeight || viewportHeight;
        const target =
          align === "start"
            ? top
            : align === "end"
              ? top - view + itemHeight
              : align === "center"
                ? top - view / 2 + itemHeight / 2
                : top < el.scrollTop
                  ? top
                  : top + itemHeight > el.scrollTop + view
                    ? top - view + itemHeight
                    : el.scrollTop;
        el.scrollTop = Math.max(0, target);
        setScrollTop(el.scrollTop);
      },
    }),
    [total, itemHeight, viewportHeight],
  );

  const rows: ReactNode[] = [];
  for (let index = first; index <= last; index++) {
    const item = items[index] as T;
    const style: CSSProperties = { position: "absolute", insetInline: 0, top: index * itemHeight, height: itemHeight };
    rows.push(
      <div key={getKey(item, index)} role="listitem" aria-setsize={total} aria-posinset={index + 1} style={style} className={cn("flex items-center", itemClassName)}>
        {renderItem(item, index)}
      </div>,
    );
  }

  return (
    <div
      ref={viewport}
      // A scrollable region must be reachable by keyboard so it can be scrolled with arrow keys.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable so keyboard users can scroll it
      tabIndex={0}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ height }}
      className={cn("relative overflow-y-auto overscroll-contain rounded-(--nv-card-radius)", focusRing, className)}
    >
      <div role="list" aria-label={ariaLabel} style={{ position: "relative", height: total * itemHeight }}>
        {rows}
      </div>
      {footer}
    </div>
  );
}
