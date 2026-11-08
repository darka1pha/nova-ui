import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's built-in animation names. Registering the
 * library's `animate-nv-*` utilities lets a consumer's `animate-none` or
 * `animate-spin` replace a component's entrance animation instead of stacking on it.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      animate: [{ animate: [(value: string) => value.startsWith("nv-")] }],
    },
  },
});

/**
 * Composes class names and resolves Tailwind conflicts so a consumer's
 * `className` predictably wins over a component's defaults.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
