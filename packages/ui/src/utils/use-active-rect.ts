import { useEffect, useLayoutEffect, useState } from "react";

export interface ActiveRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// useLayoutEffect warns during SSR on React 18; measuring only matters in the browser.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Measures the active item (relative to its list) and re-measures when an
 * item's `data-state` changes or anything resizes. Drives gliding indicators
 * (Tabs, SegmentedControl).
 */
export function useActiveRect(list: HTMLElement | null, activeSelector: string, itemSelector: string): ActiveRect | null {
  const [rect, setRect] = useState<ActiveRect | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>(activeSelector);
      if (!active) {
        setRect(null);
        return;
      }
      const listRect = list.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      if (listRect.width > 0 || listRect.height > 0) {
        setRect({
          x: activeRect.left - listRect.left + list.scrollLeft,
          y: activeRect.top - listRect.top + list.scrollTop,
          w: activeRect.width,
          h: activeRect.height,
        });
      } else {
        let top = 0;
        let left = 0;
        let curr: HTMLElement | null = active;
        while (curr && curr !== list) {
          top += curr.offsetTop;
          left += curr.offsetLeft;
          curr = curr.offsetParent as HTMLElement | null;
        }
        setRect({ x: left, y: top, w: active.offsetWidth, h: active.offsetHeight });
      }
    };
    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(list, { subtree: true, attributes: true, attributeFilter: ["data-state", "data-active", "aria-current"] });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(list);
    list.querySelectorAll(itemSelector).forEach((item) => resize?.observe(item));
    return () => {
      mutations.disconnect();
      resize?.disconnect();
    };
  }, [list, activeSelector, itemSelector]);
  return rect;
}
