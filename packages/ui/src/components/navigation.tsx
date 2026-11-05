"use client";

import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Accordion as AccordionPrimitive, NavigationMenu as NavigationMenuPrimitive, Slot, Tabs as TabsPrimitive } from "radix-ui";
import { createContext, forwardRef, useContext, useEffect, useState, type AnchorHTMLAttributes, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { useActiveRect } from "../utils/use-active-rect.ts";
import { buttonVariants } from "./button.tsx";
import { focusRing, transition } from "./shared.ts";

/* -------------------------------------------------------------------- Tabs */

type TabsVariant = "underline" | "pills" | "segmented";

/** A theme surface for the tab bar, or any CSS color (`"#fef3c7"`, `"var(--brand-bg)"`). */
export type TabsBackground = "none" | "surface" | "raised" | "sunken" | "primary" | (string & {});

const TabsVariantContext = createContext<{ variant: TabsVariant; background?: TabsBackground }>({ variant: "underline" });

export interface TabsProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant;
  /**
   * Fill behind the tab bar. Defaults to the variant's own look (sunken for `segmented`, none
   * otherwise). Pass `"none"` to remove it. TabsList's `background` overrides this.
   */
  background?: TabsBackground;
}

/** Switches between views. Arrow keys move between tabs; RTL aware. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs({ variant = "underline", background, className, ...props }, ref) {
  return (
    <TabsVariantContext.Provider value={{ variant, background }}>
      <TabsPrimitive.Root ref={ref} className={cn("flex flex-col gap-4 data-[orientation=vertical]:flex-row", className)} {...props} />
    </TabsVariantContext.Provider>
  );
});

const tabsBackground: Record<string, string> = {
  none: "bg-transparent",
  surface: "bg-surface",
  raised: "bg-surface-raised shadow-xs",
  sunken: "bg-surface-sunken",
  primary: "bg-primary-subtle",
};

// A filled bar needs a little room around the tabs and rounded corners; underline keeps its rule at the bottom.
const tabsFilled: Record<TabsVariant, string> = {
  underline: "rounded-t-(--nv-button-radius) px-1 pt-1 data-[orientation=vertical]:rounded-t-none data-[orientation=vertical]:rounded-s-(--nv-button-radius) data-[orientation=vertical]:py-1 data-[orientation=vertical]:ps-1 data-[orientation=vertical]:pe-0",
  pills: "rounded-(--nv-button-radius) p-1",
  segmented: "",
};

const tabsList = {
  underline: "relative flex gap-1 border-b border-border data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-e",
  pills: "relative flex flex-wrap gap-1 data-[orientation=vertical]:flex-col",
  segmented: "relative inline-flex w-fit gap-1 rounded-(--nv-button-radius) bg-surface-sunken p-1",
};

/** The highlight that glides to the active tab. */
const tabsIndicator = {
  underline: "h-0.5 rounded-full bg-primary",
  pills: "rounded-full bg-primary shadow-glow-primary",
  segmented: "rounded-[calc(var(--nv-button-radius)-2px)] bg-surface shadow-sm",
};

// Until the indicator has measured itself (and without JavaScript), the active
// tab carries its own highlight; once ready, the gliding indicator takes over.
const tabsTrigger = {
  underline:
    "relative z-10 -mb-px border-b-2 border-transparent px-3 py-2 text-foreground-muted hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground group-data-[indicator=ready]/tabslist:data-[state=active]:border-transparent data-[orientation=vertical]:mb-0 data-[orientation=vertical]:-me-px data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-e-2",
  pills:
    "relative z-10 rounded-full px-3.5 py-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-on-solid group-data-[indicator=ready]/tabslist:data-[state=active]:bg-transparent",
  segmented:
    "relative z-10 rounded-[calc(var(--nv-button-radius)-2px)] px-3 py-1.5 text-foreground-muted hover:text-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm group-data-[indicator=ready]/tabslist:data-[state=active]:bg-transparent group-data-[indicator=ready]/tabslist:data-[state=active]:shadow-none",
};

export interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Fill behind this tab bar; overrides the `background` set on Tabs. */
  background?: TabsBackground;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList({ background: backgroundProp, className, style: styleProp, children, ...props }, ref) {
  const { variant, background: inherited } = useContext(TabsVariantContext);
  const background = backgroundProp ?? inherited;
  const preset = background !== undefined ? tabsBackground[background] : undefined;
  const filled = background !== undefined && background !== "none";
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const composed = useComposedRefs(ref, setList);
  const rect = useActiveRect(list, '[role="tab"][data-state="active"]', '[role="tab"]');
  // Place the indicator without a transition first, so it doesn't fly in from the corner.
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (!rect || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [rect, animate]);

  // Offsets are physical (offsetLeft), so the indicator is positioned from the physical left edge.
  const style =
    rect &&
    (variant === "underline"
      ? list?.getAttribute("aria-orientation") === "vertical"
        ? { left: "auto", right: -1, top: 0, width: 2, height: rect.h, translate: `0 ${rect.y}px` }
        : { left: 0, bottom: -1, width: rect.w, translate: `${rect.x}px 0` }
      : { left: 0, top: 0, width: rect.w, height: rect.h, translate: `${rect.x}px ${rect.y}px` });

  return (
    <TabsPrimitive.List
      ref={composed}
      data-slot="tabs-list"
      data-variant={variant}
      data-background={background}
      data-indicator={rect ? "ready" : undefined}
      className={cn("group/tabslist", tabsList[variant], filled && tabsFilled[variant], preset, className)}
      // Anything that isn't a preset name is taken as a CSS color.
      style={background !== undefined && !preset ? { backgroundColor: background, ...styleProp } : styleProp}
      {...props}
    >
      {children}
      {style ? (
        <span
          aria-hidden
          data-tabs-indicator=""
          className={cn(
            "pointer-events-none absolute z-0",
            animate && "transition-[translate,width,height] duration-(--nv-duration-slow) ease-(--nv-ease-interactive) motion-reduce:transition-none",
            tabsIndicator[variant],
            // The segmented thumb is a surface; on a surface-colored bar it needs to sink instead.
            variant === "segmented" && (background === "surface" || background === "raised") && "bg-surface-sunken shadow-none",
          )}
          style={style}
        />
      ) : null}
    </TabsPrimitive.List>
  );
});

export const TabsTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(function TabsTrigger({ className, ...props }, ref) {
  const { variant } = useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        transition,
        focusRing,
        tabsTrigger[variant],
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn("flex-1 rounded-sm data-[state=active]:animate-nv-fade-in", focusRing, className)} {...props} />;
});

/* --------------------------------------------------------------- Accordion */

export const Accordion = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>>(function Accordion({ className, ...props }, ref) {
  return <AccordionPrimitive.Root ref={ref} className={cn("flex w-full flex-col", className)} {...props} />;
});

export const AccordionItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>>(function AccordionItem({ className, ...props }, ref) {
  return <AccordionPrimitive.Item ref={ref} className={cn("border-b border-border", className)} {...props} />;
});

export const AccordionTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>>(function AccordionTrigger(
  { className, children, ...props },
  ref,
) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 rounded-sm py-4 text-start text-md font-medium text-foreground hover:text-primary-text",
          transition,
          focusRing,
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-foreground-muted transition-[rotate,color] duration-(--nv-duration-slow) ease-(--nv-ease-interactive) group-hover:text-primary-text group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export const AccordionContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>>(function AccordionContent(
  { className, children, ...props },
  ref,
) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden text-sm text-foreground-secondary data-[state=closed]:animate-nv-accordion-up data-[state=open]:animate-nv-accordion-down"
      {...props}
    >
      <div className={cn("pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});

/* ------------------------------------------------------------- Breadcrumbs */

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  /** Accessible name for the landmark. */
  label?: string;
  /** Drawn between items. Defaults to a chevron that flips in RTL. */
  separator?: ReactNode;
}

const SeparatorContext = createContext<ReactNode>(null);

/** Shows the current page's place in a hierarchy. */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs({ label = "Breadcrumb", separator, className, children, ...props }, ref) {
  return (
    <nav ref={ref} aria-label={label} className={className} {...props}>
      <SeparatorContext.Provider value={separator ?? <ChevronRight className="size-3.5 rtl:-scale-x-100" />}>
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-foreground-muted">{children}</ol>
      </SeparatorContext.Provider>
    </nav>
  );
});

export interface BreadcrumbItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the current page (rendered as text with aria-current). */
  current?: boolean;
  asChild?: boolean;
}

export const BreadcrumbItem = forwardRef<HTMLAnchorElement, BreadcrumbItemProps>(function BreadcrumbItem({ current, asChild, className, children, ...props }, ref) {
  const separator = useContext(SeparatorContext);
  const Comp = asChild ? Slot.Root : "a";
  return (
    <li className="inline-flex items-center gap-1.5">
      {current ? (
        <span aria-current="page" className={cn("font-medium text-foreground", className)}>
          {children}
        </span>
      ) : (
        <>
          <Comp ref={ref} className={cn("rounded-xs hover:text-foreground hover:underline underline-offset-4", transition, focusRing, className)} {...props}>
            {children}
          </Comp>
          <span aria-hidden className="text-foreground-disabled">
            {separator}
          </span>
        </>
      )}
    </li>
  );
});

/* -------------------------------------------------------------- Pagination */

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  /** The current page, starting at 1. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Called with the page to show. */
  onPageChange: (page: number) => void;
  /** Pages shown on each side of the current one. */
  siblings?: number;
  label?: string;
  /** Accessible name of the previous button. */
  previousLabel?: string;
  /** Accessible name of the next button. */
  nextLabel?: string;
  /** Accessible label for a page button, e.g. (n) => `Page ${n}`. */
  pageLabel?: (page: number) => string;
  size?: "sm" | "md";
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

/** Computes the visible page list with ellipses. Exported for custom renderers. */
export function getPageItems(page: number, pageCount: number, siblings = 1): PageItem[] {
  const total = siblings * 2 + 5;
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, page - siblings);
  const end = Math.min(pageCount - 1, page + siblings);
  const items: PageItem[] = [1];
  if (start > 2) items.push("ellipsis-start");
  else for (let i = 2; i < start; i++) items.push(i);
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pageCount - 1) items.push("ellipsis-end");
  else for (let i = end + 1; i < pageCount; i++) items.push(i);
  items.push(pageCount);
  return items;
}

/** Page navigation for lists and tables. */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    pageCount,
    onPageChange,
    siblings = 1,
    label = "Pagination",
    previousLabel = "Previous page",
    nextLabel = "Next page",
    pageLabel = (n) => `Page ${n}`,
    size = "md",
    className,
    ...props
  },
  ref,
) {
  const items = getPageItems(page, Math.max(1, pageCount), siblings);
  const btn = (active: boolean) => cn(buttonVariants({ variant: active ? "primary" : "ghost", size: size === "sm" ? "sm" : "md" }), size === "sm" ? "min-w-8 px-2" : "min-w-10 px-3");
  return (
    <nav ref={ref} aria-label={label} className={className} {...props}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <button type="button" className={btn(false)} aria-label={previousLabel} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="rtl:-scale-x-100" />
          </button>
        </li>
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                className={btn(item === page)}
                aria-label={pageLabel(item)}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden className="flex size-8 items-center justify-center text-foreground-muted">
              <MoreHorizontal className="size-4" />
            </li>
          ),
        )}
        <li>
          <button type="button" className={btn(false)} aria-label={nextLabel} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="rtl:-scale-x-100" />
          </button>
        </li>
      </ul>
    </nav>
  );
});

/* ---------------------------------------------------------- NavigationMenu */

export const NavigationMenu = forwardRef<HTMLElement, ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>>(function NavigationMenu(
  { className, children, ...props },
  ref,
) {
  return (
    <NavigationMenuPrimitive.Root ref={ref} className={cn("relative z-(--nv-z-dropdown) flex max-w-max flex-1 items-center justify-center", className)} {...props}>
      {children}
      <div className="absolute start-0 top-full flex justify-center">
        <NavigationMenuPrimitive.Viewport className="relative mt-2 h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-(--nv-popover-radius) border border-border bg-surface-raised text-foreground shadow-lg transition-[width,height] duration-(--nv-duration-normal) data-[state=open]:animate-nv-pop-in data-[state=closed]:animate-nv-pop-out sm:w-(--radix-navigation-menu-viewport-width)" />
      </div>
    </NavigationMenuPrimitive.Root>
  );
});

export const NavigationMenuList = forwardRef<HTMLUListElement, ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>>(function NavigationMenuList(
  { className, ...props },
  ref,
) {
  return <NavigationMenuPrimitive.List ref={ref} className={cn("flex flex-1 list-none items-center justify-center gap-1", className)} {...props} />;
});

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navTrigger = `inline-flex h-9 items-center justify-center gap-1 rounded-md px-3 text-sm font-medium text-foreground-secondary hover:bg-surface-hover hover:text-foreground data-[state=open]:bg-surface-hover data-[active]:text-primary-text ${transition} ${focusRing}`;

export const NavigationMenuTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>>(function NavigationMenuTrigger(
  { className, children, ...props },
  ref,
) {
  return (
    <NavigationMenuPrimitive.Trigger ref={ref} className={cn(navTrigger, "group", className)} {...props}>
      {children}
      <ChevronDown aria-hidden className="size-3.5 transition-transform duration-(--nv-duration-normal) group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  );
});

export const NavigationMenuContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>>(function NavigationMenuContent(
  { className, ...props },
  ref,
) {
  return <NavigationMenuPrimitive.Content ref={ref} className={cn("start-0 top-0 w-full p-3 sm:absolute sm:w-auto data-[motion^=from-]:animate-nv-fade-in data-[motion^=to-]:animate-nv-fade-out", className)} {...props} />;
});

export const NavigationMenuLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link> & { variant?: "trigger" | "card" }>(
  function NavigationMenuLink({ className, variant = "trigger", ...props }, ref) {
    return (
      <NavigationMenuPrimitive.Link
        ref={ref}
        className={cn(
          variant === "trigger" ? navTrigger : `flex flex-col gap-1 rounded-md p-3 text-sm hover:bg-surface-hover ${transition} ${focusRing}`,
          "data-[active]:text-primary-text",
          className,
        )}
        {...props}
      />
    );
  },
);

/* ----------------------------------------------------------------- Sidebar */

export * from "./sidebar.tsx";
