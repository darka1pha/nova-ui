"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { createContext, forwardRef, useContext, useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { useActiveRect } from "../utils/use-active-rect.ts";
import { disabledState, focusRing, type Size } from "./shared.ts";

const SizeContext = createContext<Size>("md");

const itemSize: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
  md: "h-8 px-3 text-sm [&_svg]:size-4",
  lg: "h-10 px-4 text-md [&_svg]:size-4.5",
};

export interface SegmentedControlProps extends Omit<ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, "orientation" | "dir"> {
  size?: Size;
  /** Stretch to the container, splitting the width evenly. */
  fullWidth?: boolean;
}

/**
 * Picks one of a few options, e.g. a List / Grid / Board view switch. A radio
 * group underneath: arrow keys move and select, and it posts `name` with forms.
 * The highlight glides to the selected segment. Give it an aria-label.
 * Use Tabs instead when each option shows its own panel.
 */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(function SegmentedControl({ size = "md", fullWidth = false, className, children, ...props }, ref) {
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const composed = useComposedRefs(ref, setList);
  const rect = useActiveRect(list, '[role="radio"][data-state="checked"]', '[role="radio"]');
  // Place the indicator without a transition first, so it doesn't fly in from the corner.
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (!rect || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [rect, animate]);

  return (
    <SizeContext.Provider value={size}>
      <RadioGroupPrimitive.Root
        ref={composed}
        orientation="horizontal"
        data-indicator={rect ? "ready" : undefined}
        className={cn(
          "group/segmented relative gap-1 rounded-(--ks-button-radius) bg-surface-sunken p-1",
          fullWidth ? "flex w-full [&>[role=radio]]:flex-1" : "inline-flex w-fit",
          className,
        )}
        {...props}
      >
        {children}
        {rect ? (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-0 z-0 rounded-[calc(var(--ks-button-radius)-2px)] bg-surface shadow-sm",
              animate && "transition-[translate,width] duration-(--ks-duration-slow) ease-(--ks-ease-interactive) motion-reduce:transition-none",
            )}
            // Offsets are physical, so anchor to the physical left edge even in RTL.
            style={{ left: 0, width: rect.w, height: rect.h, translate: `${rect.x}px ${rect.y}px` }}
          />
        ) : null}
      </RadioGroupPrimitive.Root>
    </SizeContext.Provider>
  );
});

export interface SegmentedControlItemProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Icon before the label. For icon-only segments, pass an aria-label. */
  icon?: ReactNode;
}

export const SegmentedControlItem = forwardRef<HTMLButtonElement, SegmentedControlItemProps>(function SegmentedControlItem({ icon, className, children, ...props }, ref) {
  const size = useContext(SizeContext);
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--ks-button-radius)-2px)] font-medium text-foreground-muted",
        "transition-colors duration-(--ks-duration-fast) hover:text-foreground data-[state=checked]:text-foreground",
        // Until the indicator has measured itself (and without JavaScript), the checked item carries its own highlight.
        "data-[state=checked]:bg-surface data-[state=checked]:shadow-sm group-data-[indicator=ready]/segmented:data-[state=checked]:bg-transparent group-data-[indicator=ready]/segmented:data-[state=checked]:shadow-none",
        itemSize[size],
        focusRing,
        disabledState,
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </RadioGroupPrimitive.Item>
  );
});
