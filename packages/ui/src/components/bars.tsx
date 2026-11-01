"use client";

import { Check, ChevronRight, Circle } from "lucide-react";
import { Menubar as MenubarPrimitive, Toolbar as ToolbarPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn.ts";
import { toggleVariants } from "./button.tsx";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface, focusRing, menuItem, transition } from "./shared.ts";

/*
 * Menubar (application menus: File, Edit, View…) and Toolbar (a row of
 * actions and toggles). Both keep a single tab stop with arrow-key roving,
 * follow reading direction, and reuse the menu and toggle styles so they read
 * as part of the same system as DropdownMenu and ToggleGroup.
 */

const menuContent = `${floatingSurface} min-w-52 p-1`;
const indicatorItem = `${menuItem} ps-8`;
const indicator = "absolute start-2 flex size-4 items-center justify-center";

/* ----------------------------------------------------------------- Menubar */

/** A horizontal bar of menus. Left/Right move between menus (mirrored in RTL); Down opens one. */
export const Menubar = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>>(function Menubar({ className, ...props }, ref) {
  return (
    <MenubarPrimitive.Root
      ref={ref}
      className={cn("flex h-10 w-fit items-center gap-0.5 rounded-(--nv-button-radius) border border-border bg-surface p-1 shadow-xs", className)}
      {...props}
    />
  );
});

export const MenubarMenu: typeof MenubarPrimitive.Menu = MenubarPrimitive.Menu;
export const MenubarGroup = MenubarPrimitive.Group;
export const MenubarSub = MenubarPrimitive.Sub;
export const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

export const MenubarTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>>(function MenubarTrigger(
  { className, ...props },
  ref,
) {
  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-8 select-none items-center rounded-sm px-2.5 text-sm font-medium text-foreground-secondary outline-none",
        "hover:bg-surface-hover hover:text-foreground focus-visible:bg-surface-hover focus-visible:text-foreground",
        "data-[state=open]:bg-primary-subtle data-[state=open]:text-primary-on-subtle",
        transition,
        className,
      )}
      {...props}
    />
  );
});

export const MenubarContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>>(function MenubarContent(
  { className, align = "start", sideOffset = 6, alignOffset = -4, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <MenubarPrimitive.Portal container={container}>
      <MenubarPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} alignOffset={alignOffset} className={cn(menuContent, className)} {...props} />
    </MenubarPrimitive.Portal>
  );
});

export const MenubarItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & { inset?: boolean; destructive?: boolean }>(
  function MenubarItem({ className, inset, destructive, ...props }, ref) {
    return (
      <MenubarPrimitive.Item
        ref={ref}
        className={cn(menuItem, inset && "ps-8", destructive && "text-danger-text data-[highlighted]:bg-danger-subtle data-[highlighted]:text-danger-on-subtle", className)}
        {...props}
      />
    );
  },
);

export const MenubarCheckboxItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>>(function MenubarCheckboxItem(
  { className, children, ...props },
  ref,
) {
  return (
    <MenubarPrimitive.CheckboxItem ref={ref} className={cn(indicatorItem, className)} {...props}>
      <span className={indicator}>
        <MenubarPrimitive.ItemIndicator>
          <Check />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
});

export const MenubarRadioItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>>(function MenubarRadioItem(
  { className, children, ...props },
  ref,
) {
  return (
    <MenubarPrimitive.RadioItem ref={ref} className={cn(indicatorItem, className)} {...props}>
      <span className={indicator}>
        <MenubarPrimitive.ItemIndicator>
          <Circle className="size-2! fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
});

export const MenubarLabel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & { inset?: boolean }>(function MenubarLabel(
  { className, inset, ...props },
  ref,
) {
  return <MenubarPrimitive.Label ref={ref} className={cn("px-2 py-1.5 text-xs font-semibold text-foreground-muted", inset && "ps-8", className)} {...props} />;
});

export const MenubarSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>>(function MenubarSeparator(
  { className, ...props },
  ref,
) {
  return <MenubarPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
});

export const MenubarSubTrigger = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }>(
  function MenubarSubTrigger({ className, inset, children, ...props }, ref) {
    return (
      <MenubarPrimitive.SubTrigger ref={ref} className={cn(menuItem, "data-[state=open]:bg-surface-hover", inset && "ps-8", className)} {...props}>
        {children}
        <ChevronRight className="ms-auto text-foreground-muted rtl:-scale-x-100" />
      </MenubarPrimitive.SubTrigger>
    );
  },
);

export const MenubarSubContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>>(function MenubarSubContent(
  { className, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <MenubarPrimitive.Portal container={container}>
      <MenubarPrimitive.SubContent ref={ref} className={cn(menuContent, className)} {...props} />
    </MenubarPrimitive.Portal>
  );
});

/* ----------------------------------------------------------------- Toolbar */

/**
 * A row of controls with one tab stop (role="toolbar"). Arrow keys move
 * between controls in reading direction. Give it an aria-label.
 */
export const Toolbar = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ToolbarPrimitive.Root>>(function Toolbar(
  { className, orientation = "horizontal", ...props },
  ref,
) {
  return (
    <ToolbarPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex w-fit gap-1 rounded-(--nv-button-radius) border border-border bg-surface p-1 shadow-xs",
        orientation === "vertical" ? "flex-col items-stretch" : "flex-wrap items-center",
        className,
      )}
      {...props}
    />
  );
});

const toolbarControl = cn(toggleVariants({ variant: "ghost", size: "sm" }), "shrink-0");

/** A button in a Toolbar. For icon-only buttons, pass aria-label. */
export const ToolbarButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof ToolbarPrimitive.Button>>(function ToolbarButton(
  { className, ...props },
  ref,
) {
  return <ToolbarPrimitive.Button ref={ref} className={cn(toolbarControl, className)} {...props} />;
});

export const ToolbarLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<typeof ToolbarPrimitive.Link>>(function ToolbarLink({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.Link
      ref={ref}
      className={cn("inline-flex h-(--nv-control-h-sm) items-center rounded-(--nv-button-radius) px-2 text-sm font-medium text-primary-text underline-offset-4 hover:underline", focusRing, className)}
      {...props}
    />
  );
});

export const ToolbarSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ToolbarPrimitive.Separator>>(function ToolbarSeparator(
  { className, ...props },
  ref,
) {
  return (
    <ToolbarPrimitive.Separator
      ref={ref}
      className={cn("shrink-0 bg-border data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-5 data-[orientation=vertical]:w-px data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full", className)}
      {...props}
    />
  );
});

/** Grouped toggles in a Toolbar (bold/italic, alignment). Single or multiple selection. */
export const ToolbarToggleGroup = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ToolbarPrimitive.ToggleGroup>>(function ToolbarToggleGroup(
  { className, ...props },
  ref,
) {
  return <ToolbarPrimitive.ToggleGroup ref={ref} className={cn("flex items-center gap-0.5", className)} {...props} />;
});

export const ToolbarToggleItem = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof ToolbarPrimitive.ToggleItem>>(function ToolbarToggleItem(
  { className, ...props },
  ref,
) {
  return <ToolbarPrimitive.ToggleItem ref={ref} className={cn(toolbarControl, className)} {...props} />;
});
