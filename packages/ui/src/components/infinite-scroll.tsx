"use client";

import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { Spinner } from "./spinner.tsx";

export interface InfiniteScrollLabels {
  loadMore?: string;
  loading?: string;
  end?: ReactNode;
}

export interface InfiniteScrollProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Called when the end comes into view (or the button is pressed). Not called while `loading`. */
  onLoadMore: () => void;
  /** More pages exist. When false, the end message shows instead. */
  hasMore: boolean;
  loading?: boolean;
  /** How far before the end to start loading, as an IntersectionObserver rootMargin. */
  rootMargin?: string;
  /** The scrolling ancestor, when it isn't the viewport. */
  root?: Element | null;
  /**
   * Load automatically when the end is near. Off, people press "Load more".
   * After `autoLoadPages` automatic loads, the button takes over so a footer stays reachable.
   */
  auto?: boolean;
  autoLoadPages?: number;
  /** Replaces the loading row. */
  loader?: ReactNode;
  labels?: InfiniteScrollLabels;
}

/**
 * Loads the next page as people near the end of a list. There's always a real
 * "Load more" button as the fallback (no IntersectionObserver, auto off, or after
 * `autoLoadPages` pages), loading sets aria-busy, and progress is announced.
 */
export const InfiniteScroll = forwardRef<HTMLDivElement, InfiniteScrollProps>(function InfiniteScroll(
  { children, onLoadMore, hasMore, loading = false, rootMargin = "320px", root, auto = true, autoLoadPages = Infinity, loader, labels, className, ...props },
  ref,
) {
  const sentinel = useRef<HTMLDivElement>(null);
  const autoLoads = useRef(0);
  const latest = useRef({ onLoadMore, loading, hasMore });
  latest.current = { onLoadMore, loading, hasMore };
  const observing = auto && hasMore && autoLoads.current < autoLoadPages && typeof IntersectionObserver !== "undefined";

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !observing) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const { onLoadMore: load, loading: busy, hasMore: more } = latest.current;
        if (entries.some((e) => e.isIntersecting) && !busy && more) {
          autoLoads.current++;
          load();
        }
      },
      { root, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // Re-observing after each load re-checks a sentinel that is still in view.
  }, [observing, root, rootMargin, loading]);

  return (
    <div ref={ref} aria-busy={loading || undefined} className={cn("flex flex-col", className)} {...props}>
      {children}
      <div ref={sentinel} aria-hidden className="h-px" />
      <div className="flex min-h-12 items-center justify-center py-3 text-sm text-foreground-muted">
        {loading ? (
          (loader ?? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" label={null} />
              {labels?.loading ?? "Loading more…"}
            </span>
          ))
        ) : hasMore ? (
          observing ? null : (
            <Button variant="outline" size="sm" onClick={onLoadMore}>
              {labels?.loadMore ?? "Load more"}
            </Button>
          )
        ) : (
          (labels?.end ?? "You've reached the end.")
        )}
      </div>
      <span role="status" className="sr-only">
        {loading ? (labels?.loading ?? "Loading more…") : ""}
      </span>
    </div>
  );
});
