"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive, Slot } from "radix-ui";
import { Children, forwardRef, isValidElement, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { transition } from "./shared.ts";

/* -------------------------------------------------------------------- Card */

const cardVariants = cva("relative flex flex-col overflow-hidden rounded-(--ks-card-radius) text-foreground", {
  variants: {
    variant: {
      elevated: "border border-border bg-surface shadow-sm",
      outline: "border border-border bg-surface",
      filled: "bg-surface-sunken",
      /** A tinted wash from the theme's brand colors. */
      tinted: "border border-primary-border bg-(image:--ks-gradient-subtle)",
      /** A gradient border that frames featured content. */
      featured:
        "border border-transparent [background:linear-gradient(var(--ks-color-surface),var(--ks-color-surface))_padding-box,var(--ks-gradient-vivid)_border-box] shadow-md",
      /** Frosted translucent glass with backdrop blur and specular rim highlight. */
      glass:
        "border border-(--ks-glass-border) bg-(--ks-glass-bg) backdrop-blur-(--ks-glass-blur) backdrop-saturate-150 shadow-(--ks-shadow-glass)",
      /** 3D tactile inflated clay aesthetic with dual highlights and floating shadow. */
      clay:
        "border-0 rounded-(--ks-radius-2xl) bg-(--ks-clay-bg) shadow-(--ks-shadow-clay)",
      /** Soft extruded material surface extruded from the background plane. */
      neomorphic:
        "border-0 bg-(--ks-neo-bg) shadow-(--ks-shadow-neomorph)",
    },
    interactive: {
      true: `cursor-pointer hover:translate-y-(--ks-hover-lift) hover:shadow-lg hover:border-border-strong active:translate-y-0 active:scale-(--ks-press-scale) ${transition} has-[:focus-visible]:translate-y-(--ks-hover-lift) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring motion-reduce:hover:translate-y-0`,
      false: "",
    },
  },
  compoundVariants: [
    {
      variant: "clay",
      interactive: true,
      className: "active:shadow-(--ks-shadow-clay-press) active:scale-(--ks-press-scale)",
    },
    {
      variant: "glass",
      interactive: true,
      className: "hover:bg-(--ks-glass-bg-hover)",
    },
    {
      variant: "neomorphic",
      interactive: true,
      className: "active:shadow-(--ks-shadow-neomorph-inset)",
    },
  ],
  defaultVariants: { variant: "elevated", interactive: false },
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

/**
 * A container for related content. Compose with CardHeader, CardTitle,
 * CardDescription, CardContent and CardFooter — or put anything inside.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ asChild, variant, interactive, className, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} data-slot="card" data-variant={variant ?? "elevated"} className={cn(cardVariants({ variant, interactive }), !hasSections(props.children) && "gap-4 p-(--ks-card-padding)", className)} {...props} />;
});

const SECTION = Symbol.for("ks.card.section");
type Section = { [SECTION]?: true };
function hasSections(children: ReactNode) {
  return Children.toArray(children).some((c) => isValidElement(c) && typeof c.type !== "string" && (c.type as Section)[SECTION]);
}
function section<T>(component: T): T {
  (component as Section)[SECTION] = true;
  return component;
}

export const CardHeader = section(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} data-card-header="" className={cn("flex flex-col gap-1.5 px-(--ks-card-padding) pt-(--ks-card-padding)", className)} {...props} />;
  }),
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement> & { level?: 2 | 3 | 4 }>(function CardTitle(
  { className, level = 3, ...props },
  ref,
) {
  const Tag = `h${level}` as const;
  return <Tag ref={ref} className={cn("font-display text-lg font-semibold leading-tight tracking-(--ks-tracking-tight)", className)} {...props} />;
});

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn("text-sm text-foreground-muted", className)} {...props} />;
});

export const CardContent = section(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("flex flex-col gap-4 p-(--ks-card-padding) [[data-card-header]+&]:pt-4", className)} {...props} />;
  }),
);

export const CardFooter = section(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn("mt-auto flex items-center gap-2 border-t border-border bg-surface-sunken/60 px-(--ks-card-padding) py-3", className)} {...props} />;
  }),
);

/* ------------------------------------------------------------------ Avatar */

const avatarVariants = cva("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-semibold", {
  variants: {
    size: {
      xs: "size-6 text-2xs",
      sm: "size-8 text-xs",
      md: "size-10 text-sm",
      lg: "size-12 text-md",
      xl: "size-16 text-lg",
    },
    shape: { circle: "rounded-full", square: "rounded-md" },
  },
  defaultVariants: { size: "md", shape: "circle" },
});

const avatarPalettes = [
  "bg-primary-subtle text-primary-on-subtle",
  "bg-secondary-subtle text-secondary-on-subtle",
  "bg-accent-subtle text-accent-on-subtle",
  "bg-info-subtle text-info-on-subtle",
  "bg-success-subtle text-success-on-subtle",
  "bg-warning-subtle text-warning-on-subtle",
];

/** Stable color for a name, so the same person always gets the same tint. */
function paletteFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarPalettes[h % avatarPalettes.length];
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toUpperCase() ?? "")
    .join("");

export interface AvatarProps extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>, VariantProps<typeof avatarVariants> {
  src?: string;
  /** Person or entity name: used for alt text, initials and the fallback color. */
  name: string;
  /** Custom fallback content instead of initials. */
  fallback?: ReactNode;
  /** Optional status dot. */
  status?: "online" | "away" | "busy" | "offline";
}

const statusColor = { online: "bg-success", away: "bg-warning", busy: "bg-danger", offline: "bg-foreground-disabled" };

/** A user or entity image with an initials fallback. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar({ src, name, fallback, size, shape, status, className, ...props }, ref) {
  return (
    <span className="relative inline-flex">
      {src ? (
        <AvatarPrimitive.Root ref={ref} className={cn(avatarVariants({ size, shape }), paletteFor(name), className)} {...props}>
          <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />
          {/* Delay avoids flashing initials while a fast image loads. */}
          <AvatarPrimitive.Fallback delayMs={400} role="img" aria-label={name}>
            {fallback ?? initialsOf(name)}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
      ) : (
        // Without an image, render initials immediately (also during SSR).
        <span ref={ref} role="img" aria-label={name} className={cn(avatarVariants({ size, shape }), paletteFor(name), className)} {...props}>
          <span aria-hidden>{fallback ?? initialsOf(name)}</span>
        </span>
      )}
      {status ? (
        <span
          role="img"
          aria-label={status}
          className={cn("absolute bottom-0 end-0 size-[28%] min-h-2 min-w-2 rounded-full ring-2 ring-surface", statusColor[status])}
        />
      ) : null}
    </span>
  );
});

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Show at most this many avatars, then a "+N" counter. */
  max?: number;
  size?: VariantProps<typeof avatarVariants>["size"];
  /** Accessible label for the overflow counter, e.g. (n) => `${n} more people`. */
  overflowLabel?: (count: number) => string;
}

/** Overlapping avatars for teams and participants. */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { max = 4, size = "md", overflowLabel = (n) => `${n} more`, className, children, ...props },
  ref,
) {
  const items = Children.toArray(children);
  const visible = items.slice(0, max);
  const extra = items.length - visible.length;
  return (
    <div
      ref={ref}
      role="group"
      className={cn(
        "flex items-center -space-x-2 rtl:space-x-reverse hover:-space-x-0.5 [&>*]:rounded-full [&>*]:ring-2 [&>*]:ring-surface [&>*]:transition-[margin,translate] [&>*]:duration-(--ks-duration-slow) [&>*]:ease-(--ks-ease-interactive) [&>*:hover]:-translate-y-1 [&>*:hover]:z-10 motion-reduce:[&>*]:transition-none",
        className,
      )}
      {...props}
    >
      {visible}
      {extra > 0 ? (
        <span role="img" aria-label={overflowLabel(extra)} className={cn(avatarVariants({ size }), "bg-surface-active text-foreground-secondary")}>
          +{extra}
        </span>
      ) : null}
    </div>
  );
});

