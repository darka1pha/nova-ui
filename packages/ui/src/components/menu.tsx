"use client";

import { Check, ChevronRight, Circle } from "lucide-react";
import { ContextMenu as ContextMenuPrimitive, DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes } from "react";
import { cn } from "../utils/cn.ts";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface, menuItem, menuItemInset } from "./shared.ts";

const content = `${floatingSurface} min-w-48 p-1 max-h-(--radix-dropdown-menu-content-available-height)`;
const label = "px-2 py-1.5 text-xs font-semibold text-foreground-muted";
const separator = "-mx-1 my-1 h-px bg-border";
const indicatorItem = `${menuItem} ${menuItemInset}`;
const indicator = "absolute start-2 flex size-4 items-center justify-center";

interface ItemExtras {
  /** Indents the item to align with checkbox/radio items. */
  inset?: boolean;
  /** Danger styling for destructive actions. */
  destructive?: boolean;
}

const itemClass = (inset?: boolean, destructive?: boolean) =>
  cn(menuItem, inset && menuItemInset, destructive && "text-danger-text data-[highlighted]:bg-danger-subtle data-[highlighted]:text-danger-on-subtle");

/** Keyboard shortcut hint aligned to the end of a menu item. Visual only. */
export function MenuShortcut({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ms-auto ps-4 font-mono text-xs tracking-(--nv-tracking-wide) text-foreground-muted", className)} {...props} />;
}

/* ---------------------------------------------------------------- Dropdown */

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(
  function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
    const container = usePortalContainer();
    return (
      <DropdownMenuPrimitive.Portal container={container}>
        <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(content, className)} {...props} />
      </DropdownMenuPrimitive.Portal>
    );
  },
);

export const DropdownMenuItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & ItemExtras>(
  function DropdownMenuItem({ className, inset, destructive, ...props }, ref) {
    return <DropdownMenuPrimitive.Item ref={ref} className={cn(itemClass(inset, destructive), className)} {...props} />;
  },
);

export const DropdownMenuCheckboxItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>>(
  function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
    return (
      <DropdownMenuPrimitive.CheckboxItem ref={ref} className={cn(indicatorItem, className)} {...props}>
        <span className={indicator}>
          <DropdownMenuPrimitive.ItemIndicator>
            <Check />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.CheckboxItem>
    );
  },
);

export const DropdownMenuRadioItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>>(
  function DropdownMenuRadioItem({ className, children, ...props }, ref) {
    return (
      <DropdownMenuPrimitive.RadioItem ref={ref} className={cn(indicatorItem, className)} {...props}>
        <span className={indicator}>
          <DropdownMenuPrimitive.ItemIndicator>
            <Circle className="size-2! fill-current" />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.RadioItem>
    );
  },
);

export const DropdownMenuLabel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }>(
  function DropdownMenuLabel({ className, inset, ...props }, ref) {
    return <DropdownMenuPrimitive.Label ref={ref} className={cn(label, inset && "ps-8", className)} {...props} />;
  },
);

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>>(
  function DropdownMenuSeparator({ className, ...props }, ref) {
    return <DropdownMenuPrimitive.Separator ref={ref} className={cn(separator, className)} {...props} />;
  },
);

export const DropdownMenuSubTrigger = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }>(
  function DropdownMenuSubTrigger({ className, inset, children, ...props }, ref) {
    return (
      <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(itemClass(inset), "data-[state=open]:bg-surface-hover", className)}
        {...props}
      >
        {children}
        <ChevronRight className="ms-auto rtl:-scale-x-100" />
      </DropdownMenuPrimitive.SubTrigger>
    );
  },
);

export const DropdownMenuSubContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>>(
  function DropdownMenuSubContent({ className, ...props }, ref) {
    const container = usePortalContainer();
    return (
      <DropdownMenuPrimitive.Portal container={container}>
        <DropdownMenuPrimitive.SubContent ref={ref} className={cn(content, className)} {...props} />
      </DropdownMenuPrimitive.Portal>
    );
  },
);

/* ------------------------------------------------------------ Context menu */

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

export const ContextMenuContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>>(
  function ContextMenuContent({ className, ...props }, ref) {
    const container = usePortalContainer();
    return (
      <ContextMenuPrimitive.Portal container={container}>
        <ContextMenuPrimitive.Content ref={ref} className={cn(content, "max-h-(--radix-context-menu-content-available-height)", className)} {...props} />
      </ContextMenuPrimitive.Portal>
    );
  },
);

export const ContextMenuItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & ItemExtras>(
  function ContextMenuItem({ className, inset, destructive, ...props }, ref) {
    return <ContextMenuPrimitive.Item ref={ref} className={cn(itemClass(inset, destructive), className)} {...props} />;
  },
);

export const ContextMenuCheckboxItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>>(
  function ContextMenuCheckboxItem({ className, children, ...props }, ref) {
    return (
      <ContextMenuPrimitive.CheckboxItem ref={ref} className={cn(indicatorItem, className)} {...props}>
        <span className={indicator}>
          <ContextMenuPrimitive.ItemIndicator>
            <Check />
          </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </ContextMenuPrimitive.CheckboxItem>
    );
  },
);

export const ContextMenuRadioItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>>(
  function ContextMenuRadioItem({ className, children, ...props }, ref) {
    return (
      <ContextMenuPrimitive.RadioItem ref={ref} className={cn(indicatorItem, className)} {...props}>
        <span className={indicator}>
          <ContextMenuPrimitive.ItemIndicator>
            <Circle className="size-2! fill-current" />
          </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </ContextMenuPrimitive.RadioItem>
    );
  },
);

export const ContextMenuLabel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }>(
  function ContextMenuLabel({ className, inset, ...props }, ref) {
    return <ContextMenuPrimitive.Label ref={ref} className={cn(label, inset && "ps-8", className)} {...props} />;
  },
);

export const ContextMenuSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>>(
  function ContextMenuSeparator({ className, ...props }, ref) {
    return <ContextMenuPrimitive.Separator ref={ref} className={cn(separator, className)} {...props} />;
  },
);

export const ContextMenuSubTrigger = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }>(
  function ContextMenuSubTrigger({ className, inset, children, ...props }, ref) {
    return (
      <ContextMenuPrimitive.SubTrigger ref={ref} className={cn(itemClass(inset), "data-[state=open]:bg-surface-hover", className)} {...props}>
        {children}
        <ChevronRight className="ms-auto rtl:-scale-x-100" />
      </ContextMenuPrimitive.SubTrigger>
    );
  },
);

export const ContextMenuSubContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>>(
  function ContextMenuSubContent({ className, ...props }, ref) {
    const container = usePortalContainer();
    return (
      <ContextMenuPrimitive.Portal container={container}>
        <ContextMenuPrimitive.SubContent ref={ref} className={cn(content, className)} {...props} />
      </ContextMenuPrimitive.Portal>
    );
  },
);
