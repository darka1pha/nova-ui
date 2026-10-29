"use client";

import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn.ts";
import { useFormField } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface, menuItem } from "./shared.ts";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps extends ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  size?: "sm" | "md" | "lg";
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(function SelectTrigger({ className, size, children, ...props }, ref) {
  const fieldProps = useFormField(props);
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        fieldVariants({ size }),
        "flex items-center justify-between gap-2 text-start data-[placeholder]:text-foreground-muted [&>span]:truncate",
        className,
      )}
      {...fieldProps}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-foreground-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

const scrollButton = "flex cursor-default items-center justify-center py-1 text-foreground-muted [&_svg]:size-4";

export const SelectContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(function SelectContent(
  { className, children, position = "popper", sideOffset = 6, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={position === "popper" ? sideOffset : undefined}
        className={cn(
          floatingSurface,
          "relative max-h-(--radix-select-content-available-height) min-w-32",
          position === "popper" && "w-full min-w-(--radix-select-trigger-width)",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className={scrollButton}>
          <ChevronUp />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className={scrollButton}>
          <ChevronDown />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item ref={ref} className={cn(menuItem, "pe-8", className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute end-2 flex items-center text-primary-text">
        <Check />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

export const SelectLabel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(function SelectLabel({ className, ...props }, ref) {
  return <SelectPrimitive.Label ref={ref} className={cn("px-2 py-1.5 text-xs font-semibold text-foreground-muted", className)} {...props} />;
});

export const SelectSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(function SelectSeparator(
  { className, ...props },
  ref,
) {
  return <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
});
