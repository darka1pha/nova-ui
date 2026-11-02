"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes } from "react";
import { cn } from "../utils/cn.ts";
import { focusRing, transition } from "./shared.ts";

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
      xl: "text-xl",
    },
    tone: {
      default: "text-foreground",
      secondary: "text-foreground-secondary",
      muted: "text-foreground-muted",
      primary: "text-primary-text",
      success: "text-success-text",
      warning: "text-warning-text",
      danger: "text-danger-text",
      info: "text-info-text",
      inherit: "",
    },
    /** Font weight. */
    weight: { regular: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" },
    /** Clip to one line with an ellipsis. */
    truncate: { true: "truncate", false: "" },
  },
  defaultVariants: { size: "md", tone: "default", weight: "regular" },
});

type TextElement = "p" | "span" | "div" | "label" | "small" | "strong" | "em";

export interface TextProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  /** The element to render. */
  as?: TextElement;
  asChild?: boolean;
}

/** Body copy, captions and inline text in the system's type scale. */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = "p", asChild, size, tone, weight, truncate, className, ...props },
  ref,
) {
  const Comp = (asChild ? Slot.Root : as) as "p";
  return <Comp ref={ref as never} className={cn(textVariants({ size, tone, weight, truncate }), className)} {...props} />;
});

const headingVariants = cva("font-display text-foreground text-balance", {
  variants: {
    size: {
      xs: "text-md font-semibold",
      sm: "text-lg font-semibold tracking-(--nv-tracking-tight)",
      md: "text-xl font-semibold tracking-(--nv-tracking-tight)",
      lg: "text-2xl font-bold tracking-(--nv-tracking-tight)",
      xl: "text-3xl font-bold tracking-(--nv-tracking-tight) sm:text-4xl",
      "2xl": "text-4xl font-extrabold tracking-(--nv-tracking-tighter) sm:text-5xl",
      display: "text-5xl font-extrabold tracking-(--nv-tracking-tighter) sm:text-6xl lg:text-7xl",
    },
    /** Fill the text with the theme's vivid gradient. */
    gradient: {
      true: "bg-(image:--nv-gradient-vivid) bg-clip-text text-transparent [-webkit-text-fill-color:transparent]",
      false: "",
    },
  },
  defaultVariants: { size: "lg", gradient: false },
});

const levelSize = { 1: "xl", 2: "lg", 3: "md", 4: "sm", 5: "xs", 6: "xs" } as const;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  /** Semantic level (h1–h6). Visual size defaults from it but can differ. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  asChild?: boolean;
}

/**
 * A heading whose semantic level and visual size are independent, so the
 * document outline stays correct whatever the design calls for.
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size, gradient, asChild, className, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : (`h${level}` as const);
  return <Comp ref={ref} className={cn(headingVariants({ size: size ?? levelSize[level], gradient }), className)} {...props} />;
});

const linkVariants = cva(`inline-flex items-center gap-1 rounded-xs font-medium underline-offset-4 ${focusRing} ${transition}`, {
  variants: {
    variant: {
      default: "text-primary-text underline decoration-primary-border hover:decoration-current",
      subtle: "text-foreground underline decoration-border-strong hover:decoration-current",
      plain: "text-primary-text no-underline hover:underline",
      /** Underline that grows from the start edge on hover and focus. */
      animated:
        "text-primary-text no-underline bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1.5px] bg-[position:0_100%] rtl:bg-[position:100%_100%] hover:bg-[length:100%_1.5px] focus-visible:bg-[length:100%_1.5px] [transition-property:background-size,color] duration-(--nv-duration-slow) ease-(--nv-ease-out)",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof linkVariants> {
  /** Use with router links: `<Link asChild><RouterLink to="/" /></Link>`. */
  asChild?: boolean;
  /** Adds rel="noopener noreferrer" and target="_blank". */
  external?: boolean;
}

/** An inline text link. Works with any router through `asChild`. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ asChild, external, variant, className, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "a";
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return <Comp ref={ref} className={cn(linkVariants({ variant }), className)} {...externalProps} {...props} />;
});

/** Inline code. */
export const Code = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Code({ className, ...props }, ref) {
  return (
    <code
      ref={ref}
      className={cn("rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.875em] text-foreground", className)}
      {...props}
    />
  );
});

/** A keyboard key, e.g. <Kbd>Ctrl</Kbd><Kbd>K</Kbd>. */
export const Kbd = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Kbd({ className, ...props }, ref) {
  return (
    <kbd
      ref={ref}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-b-2 border-border bg-surface px-1 font-mono text-2xs font-medium text-foreground-secondary",
        className,
      )}
      {...props}
    />
  );
});
