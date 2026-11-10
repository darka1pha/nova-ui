import { clsx, type ClassValue } from "clsx";
import { createTailwindMerge } from "tailwind-merge";
import { getNovaMergeConfig } from "./tw-merge-config.generated.ts";

/**
 * tailwind-merge with a config cut down to the class groups the components use and the
 * groups that conflict with them (scripts/generate-tw-merge.ts). A conflict always involves
 * a component class, so this resolves the same as the full config at a fraction of the size.
 * It also registers the library's `animate-nv-*` utilities, so a consumer's `animate-none`
 * replaces a component's entrance animation instead of stacking on it.
 */
const twMerge = createTailwindMerge(getNovaMergeConfig);

/**
 * Composes class names and resolves Tailwind conflicts so a consumer's
 * `className` predictably wins over a component's defaults.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
