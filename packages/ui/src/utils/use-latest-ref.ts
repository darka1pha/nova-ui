import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

// useLayoutEffect warns during SSR on React 18; the ref only matters in the browser.
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A ref that always holds the latest `value`, for callbacks that outlive the
 * render that created them (window listeners, editor plugins, timers).
 * It's updated in a layout effect, not during render, so it stays correct
 * under concurrent rendering and the React Compiler.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
