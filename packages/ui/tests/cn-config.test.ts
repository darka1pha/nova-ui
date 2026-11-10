import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { extendTailwindMerge } from "tailwind-merge";
import { describe, expect, it } from "vitest";
import { cn } from "../src/utils/cn.ts";

// The full default config with the same nv-* animation extension cn() had before it was trimmed.
const fullMerge = extendTailwindMerge({ extend: { classGroups: { animate: [{ animate: [(value: string) => value.startsWith("nv-")] }] } } });

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.tsx?$/.test(name) && !name.endsWith(".generated.ts")) yield path;
  }
}

/** Utility-looking words from the component sources: what cn() sees on the component side. */
const componentClasses = [
  ...new Set(
    [...files(join(__dirname, "..", "src"))].flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/["'`]([^"'`\n]+)["'`]/g)].flatMap((m) => (m[1] ?? "").split(/\s+/).filter((w) => /^[!@\-[(a-z0-9][\w\-:/.[\]()%#,!*@>&=]*$/i.test(w))),
    ),
  ),
];

/** What consumers typically pass as className, across the common utility families. */
const consumerClasses = [
  ...["p-0", "p-2", "px-3", "py-1", "pt-4", "ps-2", "pe-6", "m-0", "mx-auto", "my-2", "mt-4", "ms-2", "-mt-1", "gap-2", "gap-x-4", "space-y-2"],
  ...["w-full", "w-64", "max-w-sm", "min-w-0", "h-8", "h-auto", "size-6", "min-h-screen", "max-h-96", "basis-1/2"],
  ...["flex", "inline-flex", "grid", "block", "hidden", "contents", "flex-col", "flex-row", "flex-wrap", "flex-1", "grow", "shrink-0", "items-start", "justify-between", "self-center", "order-first"],
  ...["text-sm", "text-lg", "text-red-500", "text-foreground", "text-start", "font-bold", "font-mono", "leading-tight", "tracking-wide", "truncate", "uppercase", "italic", "underline", "whitespace-nowrap", "break-words", "line-clamp-2"],
  ...["bg-red-500", "bg-transparent", "bg-primary/10", "bg-gradient-to-r", "from-red-500", "border", "border-0", "border-2", "border-t", "border-red-500", "border-dashed", "rounded", "rounded-none", "rounded-full", "rounded-s-lg", "rounded-t-xl"],
  ...["shadow", "shadow-none", "shadow-lg", "ring-2", "ring-0", "ring-red-500", "outline-none", "outline-2", "opacity-50", "blur-sm", "backdrop-blur"],
  ...["relative", "absolute", "fixed", "sticky", "inset-0", "inset-x-0", "top-0", "start-0", "end-2", "z-10", "z-50", "overflow-hidden", "overflow-x-auto", "overscroll-contain"],
  ...["cursor-pointer", "pointer-events-none", "select-none", "transition-none", "transition-colors", "duration-300", "ease-out", "animate-none", "animate-spin", "transform-none", "scale-95", "rotate-45", "translate-y-1"],
  ...["hover:bg-red-500", "focus-visible:ring-0", "md:flex", "dark:bg-black", "data-[state=open]:bg-accent", "rtl:-scale-x-100", "[&>svg]:size-4", "aria-disabled:opacity-50", "!p-0"],
  ...["fill-current", "stroke-2", "object-cover", "aspect-square", "col-span-2", "row-start-1", "grid-cols-2", "table-fixed", "align-middle", "list-none", "sr-only", "not-sr-only", "appearance-none", "resize-none"],
];

// Tens of thousands of merges: slow when the whole suite shares the CPU.
describe("cn() with the trimmed tailwind-merge config", { timeout: 60_000 }, () => {
  it("found the component classes", () => {
    expect(componentClasses.length).toBeGreaterThan(500);
  });

  it("merges a component class with a consumer override exactly like the full config", () => {
    const mismatches: string[] = [];
    for (const component of componentClasses) {
      for (const consumer of consumerClasses) {
        const input = `${component} ${consumer}`;
        if (cn(input) !== fullMerge(input)) mismatches.push(`${input} → ${cn(input)} (full: ${fullMerge(input)})`);
      }
    }
    expect(mismatches.slice(0, 20)).toEqual([]);
  });

  it("merges component classes with each other exactly like the full config", () => {
    const mismatches: string[] = [];
    for (let i = 0; i < componentClasses.length; i++) {
      // Each class against its neighbours in the list (same file, often the same element).
      for (let j = Math.max(0, i - 40); j < Math.min(componentClasses.length, i + 40); j++) {
        const input = `${componentClasses[i]} ${componentClasses[j]}`;
        if (cn(input) !== fullMerge(input)) mismatches.push(`${input} → ${cn(input)} (full: ${fullMerge(input)})`);
      }
    }
    expect(mismatches.slice(0, 20)).toEqual([]);
  });

  it("lets a consumer's animation replace the library's nv-* animations", () => {
    expect(cn("animate-nv-fade-in", "animate-none")).toBe("animate-none");
  });
});
