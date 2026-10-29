"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import { Slot } from "radix-ui";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn.ts";
import { buttonVariants } from "./button.tsx";
import { Separator, VisuallyHidden } from "./layout.tsx";
import { DialogDescription, DialogTitle, Sheet, SheetContent, Tooltip } from "./overlay.tsx";
import { focusRing, transition } from "./shared.ts";

/* ------------------------------------------------------------------ Context */

export interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean | ((value: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((value: boolean) => boolean)) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      state: "expanded",
      open: true,
      setOpen: () => {},
      openMobile: false,
      setOpenMobile: () => {},
      isMobile: false,
      toggleSidebar: () => {},
    };
  }
  return context;
}

/* ----------------------------------------------------------------- Provider */

export interface SidebarProviderProps extends HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpenMobile?: boolean;
  openMobile?: boolean;
  onOpenMobileChange?: (open: boolean) => void;
  mobileBreakpoint?: number;
  keyboardShortcut?: string | boolean;
}

export const SidebarProvider = forwardRef<HTMLDivElement, SidebarProviderProps>(function SidebarProvider(
  {
    defaultOpen = true,
    open: openProp,
    onOpenChange,
    defaultOpenMobile = false,
    openMobile: openMobileProp,
    onOpenMobileChange,
    mobileBreakpoint = 768,
    keyboardShortcut = "b",
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const [openUncontrolled, setOpenUncontrolled] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : openUncontrolled;

  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(open) : value;
      if (openProp === undefined) setOpenUncontrolled(next);
      onOpenChange?.(next);
    },
    [open, openProp, onOpenChange],
  );

  const [openMobileUncontrolled, setOpenMobileUncontrolled] = useState(defaultOpenMobile);
  const openMobile = openMobileProp !== undefined ? openMobileProp : openMobileUncontrolled;

  const setOpenMobile = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(openMobile) : value;
      if (openMobileProp === undefined) setOpenMobileUncontrolled(next);
      onOpenMobileChange?.(next);
    },
    [openMobile, openMobileProp, onOpenMobileChange],
  );

  // Responsive breakpoint tracking with SSR safety
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [mobileBreakpoint]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile, setOpen, setOpenMobile]);

  // Keyboard shortcut listener (Ctrl+B or Cmd+B by default)
  useEffect(() => {
    if (!keyboardShortcut || typeof window === "undefined") return;
    const targetKey = typeof keyboardShortcut === "string" ? keyboardShortcut.toLowerCase() : "b";
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === targetKey && (event.metaKey || event.ctrlKey) && !event.defaultPrevented) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler as never);
    return () => window.removeEventListener("keydown", handler as never);
  }, [keyboardShortcut, toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        ref={ref}
        data-state={state}
        data-mobile={isMobile ? "true" : "false"}
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3.5rem",
            "--sidebar-width-mobile": "18rem",
            ...style,
          } as CSSProperties
        }
        className={cn("group/sidebar-wrapper flex min-h-screen w-full has-[[data-variant=inset]]:bg-surface-sunken", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
});

/* ------------------------------------------------------------------ Sidebar */

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  side?: "left" | "right" | "start" | "end";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  label?: string;
  asChild?: boolean;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    side = "start",
    variant = "sidebar",
    collapsible = "icon",
    label = "Main",
    className,
    children,
    ...props
  },
  ref,
) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  const titleId = useId();

  // Mobile layout: render in a sliding responsive Sheet
  if (isMobile) {
    const sheetSide = side === "right" ? "right" : side === "end" ? "end" : side === "left" ? "left" : "start";
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={sheetSide}
          aria-labelledby={titleId}
          className="w-(--sidebar-width-mobile,18rem) max-w-[85vw] p-0 bg-surface text-foreground"
        >
          <VisuallyHidden>
            <DialogTitle id={titleId}>{label} Navigation</DialogTitle>
            <DialogDescription>Application navigation sidebar</DialogDescription>
          </VisuallyHidden>
          <nav aria-label={label} className="flex h-full w-full flex-col overflow-y-auto p-3">
            {children}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop layout: collapsible sidebar with optional icon rail or offcanvas
  const isCollapsed = state === "collapsed";
  const isRight = side === "right" || side === "end";

  const widthClass = collapsible === "none"
    ? "w-(--sidebar-width,16rem)"
    : collapsible === "icon"
      ? isCollapsed
        ? "w-(--sidebar-width-icon,3.5rem)"
        : "w-(--sidebar-width,16rem)"
      : isCollapsed
        ? "w-0 -translate-x-full overflow-hidden opacity-0"
        : "w-(--sidebar-width,16rem) translate-x-0 opacity-100";

  const variantClass = variant === "floating"
    ? "m-2.5 rounded-2xl border border-border bg-surface-raised shadow-md h-[calc(100vh-1.25rem)] sticky top-2.5"
    : variant === "inset"
      ? "bg-transparent border-0"
      : cn("bg-surface", isRight ? "border-s border-border" : "border-e border-border");

  return (
    <aside
      ref={ref}
      aria-label={label}
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      className={cn(
        "group/sidebar relative flex shrink-0 flex-col overflow-x-hidden transition-[width,transform,opacity,padding] duration-(--ks-duration-slow) ease-(--ks-ease-interactive)",
        widthClass,
        variantClass,
        isCollapsed && collapsible === "icon" ? "p-1.5" : "p-3",
        className,
      )}
      {...props}
    >
      <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </aside>
  );
});

/* ------------------------------------------------------------------ Trigger */

export interface SidebarTriggerProps extends ComponentPropsWithoutRef<"button"> {
  icon?: ReactNode;
  label?: string;
}

export const SidebarTrigger = forwardRef<HTMLButtonElement, SidebarTriggerProps>(function SidebarTrigger(
  { className, onClick, icon, label = "Toggle sidebar", children, ...props },
  ref,
) {
  const { toggleSidebar, isMobile, open, openMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-expanded={isOpen}
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "group/trigger size-8 p-0 text-foreground-secondary hover:bg-surface-hover hover:text-foreground active:scale-95 transition-all duration-(--ks-duration-normal) ease-(--ks-ease-interactive)",
        focusRing,
        className,
      )}
      {...props}
    >
      {icon ?? (
        <PanelLeft
          className={cn(
            "size-4 transition-transform duration-(--ks-duration-slow) ease-(--ks-ease-interactive) group-hover/trigger:scale-110",
            !isOpen && "rotate-180",
          )}
        />
      )}
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </button>
  );
});

/* --------------------------------------------------------------------- Rail */

export const SidebarRail = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function SidebarRail(
  { className, ...props },
  ref,
) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      aria-label="Toggle Sidebar"
      title="Toggle Sidebar"
      onClick={toggleSidebar}
      className={cn(
        "absolute inset-y-0 end-0 z-20 hidden w-1.5 -translate-x-1/2 cursor-col-resize transition-all ease-linear group-hover/sidebar:w-2 hover:bg-primary/20 sm:flex",
        "after:absolute after:inset-y-0 after:start-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-border hover:after:bg-primary",
        className,
      )}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------- Inset */

export const SidebarInset = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarInset(
  { className, ...props },
  ref,
) {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-screen flex-1 flex-col overflow-y-auto bg-surface-raised transition-[margin] duration-(--ks-duration-slow) ease-(--ks-ease-interactive)",
        "md:m-2 md:rounded-2xl md:border md:border-border md:shadow-xs",
        className,
      )}
      {...props}
    />
  );
});

/* --------------------------------------------------------- Sections & Items */

export function SidebarHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 p-2 shrink-0", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden p-2", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex flex-col gap-2 p-2 border-t border-border shrink-0", className)} {...props} />;
}

export function SidebarSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Separator className={cn("my-2 shrink-0 bg-border", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative flex w-full min-w-0 flex-col gap-1 p-0", className)} {...props} />;
}

export function SidebarGroupLabel({
  className,
  asChild,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      className={cn(
        "flex h-7 shrink-0 items-center px-2 text-2xs font-semibold uppercase tracking-(--ks-tracking-wider) text-foreground-muted outline-none transition-[margin,opacity] duration-(--ks-duration-normal) ease-(--ks-ease-interactive)",
        "group-data-[collapsible=icon]/sidebar:hidden",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function SidebarGroupAction({
  className,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(
        "absolute end-2 top-1.5 flex size-5 items-center justify-center rounded-md p-0 text-foreground-muted hover:bg-surface-hover hover:text-foreground group-data-[collapsible=icon]/sidebar:hidden",
        focusRing,
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full text-sm", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("flex w-full min-w-0 flex-col gap-1 list-none p-0 m-0", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("group/menu-item relative list-none", className)} {...props} />;
}

const sidebarMenuButtonVariants = cva(
  `peer/menu-button group/menu-btn flex w-full items-center gap-2.5 rounded-md p-2 text-start font-medium outline-none ${transition} ${focusRing} [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:transition-transform [&>svg]:duration-(--ks-duration-normal) [&>svg]:ease-(--ks-ease-interactive) hover:[&>svg]:scale-110 hover:[&>svg]:translate-x-0.5 rtl:hover:[&>svg]:-translate-x-0.5 active:scale-(--ks-press-scale,0.98)`,
  {
    variants: {
      variant: {
        default: "text-foreground-secondary hover:bg-surface-hover hover:text-foreground active:bg-surface-sunken",
        outline: "border border-border bg-surface hover:bg-surface-hover hover:text-foreground",
      },
      size: {
        sm: "h-7 text-xs px-2",
        md: "h-9 text-sm px-2.5",
        lg: "h-11 text-base px-3 [&>svg]:size-5",
      },
      isActive: {
        true: "bg-primary-subtle text-primary-on-subtle font-semibold shadow-xs [&>svg]:text-primary-text before:absolute before:inset-y-1.5 before:start-0 before:w-1 before:rounded-full before:bg-primary before:shadow-glow-primary before:animate-ks-bounce-in",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      isActive: false,
    },
  },
);

export interface SidebarMenuButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  tooltip?: string | ReactNode;
}

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(function SidebarMenuButton(
  { asChild = false, isActive = false, variant = "default", size = "md", tooltip, className, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const button = (
    <Comp
      ref={ref}
      data-active={isActive ? "true" : "false"}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        sidebarMenuButtonVariants({ variant, size, isActive }),
        isCollapsed && "justify-center px-0 group-data-[collapsible=icon]/sidebar:size-9",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );

  if (!tooltip || !isCollapsed) {
    return button;
  }

  return (
    <Tooltip content={tooltip} side="right" align="center">
      {button}
    </Tooltip>
  );
});

export function SidebarMenuAction({
  className,
  asChild,
  showOnHover,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; showOnHover?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(
        "absolute end-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md p-0 text-foreground-muted hover:bg-surface-hover hover:text-foreground",
        showOnHover && "opacity-0 group-hover/menu-item:opacity-100 transition-opacity",
        "group-data-[collapsible=icon]/sidebar:hidden",
        focusRing,
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ms-auto flex items-center justify-center text-xs font-semibold text-foreground-muted group-data-[collapsible=icon]/sidebar:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSub({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn(
        "ms-4 flex flex-col gap-1 border-s border-border ps-2 pt-1 list-none group-data-[collapsible=icon]/sidebar:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem(props: HTMLAttributes<HTMLLIElement>) {
  return <li className="list-none" {...props} />;
}

export const SidebarMenuSubButton = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean; isActive?: boolean }
>(function SidebarMenuSubButton({ asChild, isActive, className, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all duration-(--ks-duration-fast) ease-(--ks-ease-interactive) active:scale-(--ks-press-scale,0.98)",
        isActive && "text-primary-text font-semibold bg-primary-subtle/70 shadow-xs before:size-1.5 before:rounded-full before:bg-primary before:animate-ks-bounce-in",
        focusRing,
        className,
      )}
      {...props}
    />
  );
});

// Backward-compatibility wrappers for legacy SidebarSection and SidebarItem
export function SidebarSection({ title, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { title?: ReactNode }) {
  return (
    <SidebarGroup className={className} {...props}>
      {title ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export interface SidebarItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  size?: "sm" | "md";
  asChild?: boolean;
}

export const SidebarItem = forwardRef<HTMLAnchorElement, SidebarItemProps>(function SidebarItem(
  { icon, badge, active, size = "md", asChild, className, children, ...props },
  ref,
) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} size={size} tooltip={typeof children === "string" ? children : undefined}>
        {asChild ? (
          children
        ) : (
          <a
            ref={ref}
            aria-current={active ? "page" : undefined}
            className={cn("flex w-full items-center gap-2.5", className)}
            {...props}
          >
            {icon}
            <span className="flex-1 truncate group-data-[collapsible=icon]/sidebar:hidden">{children}</span>
            {badge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
          </a>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

/* ==========================================================================
   READY-TO-USE PRE-COMPOSED RESPONSIVE SIDEBAR COMPONENTS
   ========================================================================== */

/* -------------------------------------------------- 1. ResponsiveSidebar -- */

export interface ResponsiveSidebarNavItem {
  title: string;
  href?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  subItems?: Array<{ title: string; href?: string; isActive?: boolean; onClick?: () => void }>;
}

export interface ResponsiveSidebarGroup {
  title?: string;
  action?: ReactNode;
  items: ResponsiveSidebarNavItem[];
}

export interface ResponsiveSidebarProps extends SidebarProps {
  brand?: {
    logo?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    href?: string;
  };
  groups?: ResponsiveSidebarGroup[];
  footerUser?: {
    name: string;
    email?: string;
    avatar?: ReactNode;
    action?: ReactNode;
  };
}

/**
 * ResponsiveSidebar: A complete, fully responsive sidebar with logo, navigation groups,
 * badge counters, submenus, user profile footer, and collapsible icon rail.
 */
export const ResponsiveSidebar = forwardRef<HTMLElement, ResponsiveSidebarProps>(function ResponsiveSidebar(
  { brand, groups, footerUser, children, ...props },
  ref,
) {
  return (
    <Sidebar ref={ref} {...props}>
      {brand ? (
        <SidebarHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-3">
            {brand.logo ? <div className="shrink-0">{brand.logo}</div> : null}
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]/sidebar:hidden">
              <span className="text-sm font-semibold truncate leading-tight text-foreground">{brand.title}</span>
              {brand.subtitle ? <span className="text-2xs text-foreground-muted truncate">{brand.subtitle}</span> : null}
            </div>
          </div>
        </SidebarHeader>
      ) : null}

      <SidebarContent>
        {groups?.map((group, idx) => (
          <SidebarGroup key={group.title ?? idx}>
            {group.title ? (
              <div className="flex items-center justify-between">
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                {group.action ? <SidebarGroupAction asChild>{group.action}</SidebarGroupAction> : null}
              </div>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={Boolean(item.href && !item.onClick)}
                      isActive={item.isActive}
                      tooltip={item.title}
                      onClick={item.onClick}
                    >
                      {item.href && !item.onClick ? (
                        <a href={item.href} className="flex w-full items-center gap-2.5">
                          {item.icon}
                          <span className="flex-1 truncate group-data-[collapsible=icon]/sidebar:hidden">{item.title}</span>
                          {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                        </a>
                      ) : (
                        <div className="flex w-full items-center gap-2.5">
                          {item.icon}
                          <span className="flex-1 truncate group-data-[collapsible=icon]/sidebar:hidden">{item.title}</span>
                          {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                        </div>
                      )}
                    </SidebarMenuButton>

                    {item.subItems && item.subItems.length > 0 ? (
                      <SidebarMenuSub>
                        {item.subItems.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton href={sub.href} isActive={sub.isActive} onClick={sub.onClick}>
                              {sub.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {children}
      </SidebarContent>

      {footerUser ? (
        <SidebarFooter>
          <div className="flex items-center gap-3 w-full">
            {footerUser.avatar ? <div className="shrink-0">{footerUser.avatar}</div> : null}
            <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]/sidebar:hidden">
              <span className="text-xs font-semibold text-foreground truncate">{footerUser.name}</span>
              {footerUser.email ? <span className="text-2xs text-foreground-muted truncate">{footerUser.email}</span> : null}
            </div>
            {footerUser.action ? <div className="shrink-0 group-data-[collapsible=icon]/sidebar:hidden">{footerUser.action}</div> : null}
          </div>
        </SidebarFooter>
      ) : null}

      <SidebarRail />
    </Sidebar>
  );
});

/* ------------------------------------------------------- 2. DualSidebar ---- */

export interface DualSidebarRailItem {
  id: string;
  icon: ReactNode;
  label: string;
  badge?: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export interface DualSidebarProps extends SidebarProps {
  railItems: DualSidebarRailItem[];
  railHeader?: ReactNode;
  railFooter?: ReactNode;
  panelHeader?: ReactNode;
  panelFooter?: ReactNode;
  title?: string;
}

/**
 * DualSidebar (RailSidebar): A multi-tier responsive sidebar featuring a primary icon rail
 * for high-level workspaces/apps paired with a secondary expandable drill-down panel.
 */
export const DualSidebar = forwardRef<HTMLElement, DualSidebarProps>(function DualSidebar(
  { railItems, railHeader, railFooter, panelHeader, panelFooter, title, children, className, ...props },
  ref,
) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const [activeRailId, setActiveRailId] = useState<string>(railItems[0]?.id ?? "");

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="start" className="w-(--sidebar-width-mobile,18rem) max-w-[85vw] p-0 bg-surface">
          <VisuallyHidden>
            <DialogTitle>Navigation Menu</DialogTitle>
            <DialogDescription>Mobile dual sidebar navigation</DialogDescription>
          </VisuallyHidden>
          <div className="flex h-full flex-col p-3">
            {/* Horizontal workspace switcher on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3 mb-3">
              {railItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveRailId(item.id);
                    item.onClick?.();
                  }}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                    activeRailId === item.id
                      ? "border-primary bg-primary text-primary-on-solid shadow-sm"
                      : "border-border bg-surface-raised text-foreground-secondary hover:bg-surface-hover",
                  )}
                  title={item.label}
                >
                  {item.icon}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div ref={ref as never} className={cn("flex h-full shrink-0", className)}>
      {/* Tier 1: Fixed primary icon rail */}
      <div className="flex w-16 flex-col items-center border-e border-border bg-surface-sunken py-3 px-2 shrink-0">
        {railHeader ? <div className="mb-4 shrink-0">{railHeader}</div> : null}
        <div className="flex flex-1 flex-col items-center gap-2 w-full">
          {railItems.map((item) => {
            const isSelected = activeRailId === item.id || item.isActive;
            return (
              <Tooltip key={item.id} content={item.label} side="right">
                <button
                  type="button"
                  aria-label={item.label}
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => {
                    setActiveRailId(item.id);
                    item.onClick?.();
                  }}
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-xl transition-all duration-(--ks-duration-normal) ease-(--ks-ease-interactive) active:scale-95",
                    focusRing,
                    isSelected
                      ? "bg-primary text-primary-on-solid shadow-glow-primary scale-105 animate-ks-pop-in"
                      : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground hover:scale-105",
                  )}
                >
                  {item.icon}
                  {item.badge ? (
                    <span className="absolute -top-1 -end-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-on-solid animate-ks-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              </Tooltip>
            );
          })}
        </div>
        {railFooter ? <div className="mt-auto shrink-0 pt-3">{railFooter}</div> : null}
      </div>

      {/* Tier 2: Secondary drill-down panel */}
      <Sidebar variant="sidebar" collapsible="icon" className="w-56 border-e border-border bg-surface" {...props}>
        {panelHeader ?? (title ? (
          <SidebarHeader className="border-b border-border pb-2">
            <span className="text-sm font-bold text-foreground truncate">{title}</span>
          </SidebarHeader>
        ) : null)}
        <SidebarContent>{children}</SidebarContent>
        {panelFooter ? <SidebarFooter>{panelFooter}</SidebarFooter> : null}
        <SidebarRail />
      </Sidebar>
    </div>
  );
});

export const RailSidebar = DualSidebar;

/* --------------------------------------------------- 3. FloatingSidebar ---- */

export interface FloatingSidebarProps extends SidebarProps {
  floatingTrigger?: boolean;
}

/**
 * FloatingSidebar: An elevated, floating island sidebar navigation
 * with rounded corners, subtle drop-shadow, and responsive sheet fallback.
 */
export const FloatingSidebar = forwardRef<HTMLElement, FloatingSidebarProps>(function FloatingSidebar(
  { className, floatingTrigger = true, children, ...props },
  ref,
) {
  return (
    <Sidebar
      ref={ref}
      variant="floating"
      collapsible="icon"
      className={cn("bg-surface-raised/95 backdrop-blur-md", className)}
      {...props}
    >
      {children}
      {floatingTrigger ? <SidebarRail /> : null}
    </Sidebar>
  );
});
