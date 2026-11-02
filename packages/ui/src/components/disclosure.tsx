"use client";

import { AspectRatio as AspectRatioPrimitive, Collapsible as CollapsiblePrimitive, HoverCard as HoverCardPrimitive, ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn.ts";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface } from "./shared.ts";

/* ------------------------------------------------------------- Collapsible */

/** Shows and hides one region. Use Accordion for several related sections. */
export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

/** Content that smoothly grows and shrinks to its natural height. */
export const CollapsibleContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>>(function CollapsibleContent(
  { className, ...props },
  ref,
) {
  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      className={cn("overflow-hidden data-[state=closed]:animate-nv-collapsible-up data-[state=open]:animate-nv-collapsible-down", className)}
      {...props}
    />
  );
});

/* --------------------------------------------------------------- HoverCard */

/**
 * A rich preview shown when hovering or focusing a link (profiles, references).
 * Supplementary only — the link itself must still work without it.
 */
export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export const HoverCardContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>>(function HoverCardContent(
  { className, sideOffset = 8, align = "center", ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <HoverCardPrimitive.Portal container={container}>
      <HoverCardPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(floatingSurface, "w-72 p-4 outline-none origin-(--radix-hover-card-content-transform-origin)", className)}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
});

/* -------------------------------------------------------------- ScrollArea */

export interface ScrollAreaProps extends ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Which scrollbars to render. */
  orientation?: "vertical" | "horizontal" | "both";
  /** Classes for the scrolling viewport inside the root. */
  viewportClassName?: string;
}

/**
 * Native scrolling with slim, themed scrollbars that fade in while you scroll
 * or hover. Keyboard and wheel scrolling work exactly like the platform.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { className, viewportClassName, orientation = "vertical", children, type = "hover", ...props },
  ref,
) {
  const bar = (o: "vertical" | "horizontal") => (
    <ScrollAreaPrimitive.Scrollbar
      orientation={o}
      className={cn(
        "flex touch-none select-none p-0.5 transition-opacity duration-(--nv-duration-normal) data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100",
        o === "vertical" ? "h-full w-2.5" : "h-2.5 flex-col",
      )}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border-strong transition-colors hover:bg-foreground-muted" />
    </ScrollAreaPrimitive.Scrollbar>
  );
  return (
    <ScrollAreaPrimitive.Root ref={ref} type={type} className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport tabIndex={0} className={cn("size-full rounded-[inherit] focus-visible:outline-2 focus-visible:outline-focus-ring", viewportClassName)}>
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" ? bar("vertical") : null}
      {orientation !== "vertical" ? bar("horizontal") : null}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});

/* ------------------------------------------------------------- AspectRatio */

/** Keeps media at a fixed ratio (`ratio={16 / 9}`) with rounded, clipped corners. */
export const AspectRatio = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>>(function AspectRatio({ className, ...props }, ref) {
  return <AspectRatioPrimitive.Root ref={ref} className={cn("overflow-hidden rounded-lg bg-surface-sunken [&>img]:size-full [&>img]:object-cover", className)} {...props} />;
});
