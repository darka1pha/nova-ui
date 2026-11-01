"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Separator as SeparatorPrimitive, Slot } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes } from "react";
import { cn } from "../utils/cn.ts";

interface AsChild {
  /** Render the child element instead, merging props (Radix Slot pattern). */
  asChild?: boolean;
}

/** A plain `div` that accepts `asChild`. The base for custom layout. */
export const Box = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & AsChild>(function Box({ asChild, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} {...props} />;
});

const gap = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
  16: "gap-16",
} as const;

const align = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch", baseline: "items-baseline" } as const;
const justify = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between", around: "justify-around" } as const;

const stackVariants = cva("flex flex-col", {
  variants: { gap, align, justify },
  defaultVariants: { gap: 4, align: "stretch" },
});

export interface StackProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof stackVariants>, AsChild {}

/** Vertical flow with consistent spacing. */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack({ asChild, gap, align, justify, className, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} className={cn(stackVariants({ gap, align, justify }), className)} {...props} />;
});

const inlineVariants = cva("flex flex-row", {
  variants: { gap, align, justify, wrap: { true: "flex-wrap", false: "flex-nowrap" } },
  defaultVariants: { gap: 2, align: "center", wrap: true },
});

export interface InlineProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof inlineVariants>, AsChild {}

/** Horizontal flow that wraps. Follows text direction automatically. */
export const Inline = forwardRef<HTMLDivElement, InlineProps>(function Inline({ asChild, gap, align, justify, wrap, className, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} className={cn(inlineVariants({ gap, align, justify, wrap }), className)} {...props} />;
});

const gridVariants = cva("grid", {
  variants: {
    gap,
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
      auto: "grid-cols-[repeat(auto-fill,minmax(min(100%,var(--nv-grid-min,16rem)),1fr))]",
    },
  },
  defaultVariants: { gap: 4, columns: "auto" },
});

export interface GridProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof gridVariants>, AsChild {
  /** Minimum column width for `columns="auto"`, e.g. "12rem". */
  minColumnWidth?: string;
}

/** Responsive grid. Numeric columns collapse on small screens; `auto` fills by min width. */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid({ asChild, gap, columns, minColumnWidth, className, style, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      ref={ref}
      className={cn(gridVariants({ gap, columns }), className)}
      style={minColumnWidth ? { ["--nv-grid-min" as string]: minColumnWidth, ...style } : style}
      {...props}
    />
  );
});

const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    size: { sm: "max-w-2xl", md: "max-w-4xl", lg: "max-w-6xl", xl: "max-w-7xl", prose: "max-w-prose", full: "max-w-none" },
  },
  defaultVariants: { size: "lg" },
});

export interface ContainerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants>, AsChild {}

/** Centers content with responsive gutters and a max width. */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container({ asChild, size, className, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} className={cn(containerVariants({ size }), className)} {...props} />;
});

export type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

/** A thin rule. Decorative by default; pass `decorative={false}` when it separates meaningfully. */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { className, orientation = "horizontal", decorative = true, ...props },
  ref,
) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px self-stretch", className)}
      {...props}
    />
  );
});

/** Alias of {@link Separator}. */
export const Divider = Separator;

/** Hides content visually while keeping it available to screen readers. */
export const VisuallyHidden = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(function VisuallyHidden({ className, ...props }, ref) {
  return <span ref={ref} className={cn("sr-only", className)} {...props} />;
});
