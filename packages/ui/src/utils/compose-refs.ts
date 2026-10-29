import { useCallback, type Ref, type RefCallback } from "react";

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** Merges several refs into one callback ref. */
export function useComposedRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((node: T | null) => refs.forEach((ref) => setRef(ref, node)), refs);
}
