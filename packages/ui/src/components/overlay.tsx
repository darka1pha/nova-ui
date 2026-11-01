"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { AlertDialog as AlertDialogPrimitive, Dialog as DialogPrimitive, Popover as PopoverPrimitive, Tooltip as TooltipPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { buttonVariants } from "./button.tsx";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface, focusRing } from "./shared.ts";

/* ----------------------------------------------------------------- Tooltip */

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(function TooltipContent(
  { className, sideOffset = 6, children, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-(--nv-z-tooltip) max-w-xs rounded-sm bg-neutral px-2.5 py-1.5 text-xs font-medium text-neutral-on-solid shadow-md",
          "data-[state=delayed-open]:animate-nv-pop-in data-[state=closed]:animate-nv-fade-out origin-(--radix-tooltip-content-transform-origin)",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-neutral" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});

export interface TooltipProps extends Omit<ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>, "children"> {
  /** Supplementary text. Never put essential information only in a tooltip. */
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

/**
 * Convenience tooltip: `<Tooltip content="Copy"><IconButton … /></Tooltip>`.
 * Includes its own provider, so no app-level setup is required.
 */
export function Tooltip({ content, children, side = "top", align = "center", delayDuration = 300, ...props }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root {...props}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/* ----------------------------------------------------------------- Popover */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export const PopoverContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>>(function PopoverContent(
  { className, sideOffset = 8, align = "center", ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content ref={ref} sideOffset={sideOffset} align={align} className={cn(floatingSurface, "w-72 p-4 outline-none", className)} {...props} />
    </PopoverPrimitive.Portal>
  );
});

/* ------------------------------------------------------- Dialog primitives */

const overlay =
  "fixed inset-0 z-(--nv-z-overlay) bg-overlay/60 backdrop-blur-[2px] data-[state=open]:animate-nv-fade-in data-[state=closed]:animate-nv-fade-out";

const closeButton = `absolute end-3 top-3 inline-flex size-8 items-center justify-center rounded-sm text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground ${focusRing} [&_svg]:size-4 [&_svg]:transition-transform [&_svg]:duration-(--nv-duration-slow) [&_svg]:ease-(--nv-ease-interactive) hover:[&_svg]:rotate-90 motion-reduce:hover:[&_svg]:rotate-0`;

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pe-8 text-start", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogTitle = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn("font-display text-lg font-semibold tracking-(--nv-tracking-tight) text-foreground", className)} {...props} />;
});

export const DialogDescription = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(function DialogDescription(
  { className, ...props },
  ref,
) {
  return <DialogPrimitive.Description ref={ref} className={cn("text-sm text-foreground-muted", className)} {...props} />;
});

const dialogContent = cva(
  "fixed left-1/2 top-1/2 z-(--nv-z-modal) flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-(--nv-dialog-radius) border border-border bg-surface-raised p-6 text-foreground shadow-(--nv-dialog-shadow) outline-none data-[state=open]:animate-nv-pop-in data-[state=closed]:animate-nv-pop-out",
  {
    variants: { size: { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-[calc(100vw-2rem)]" } },
    defaultVariants: { size: "md" },
  },
);

export interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, VariantProps<typeof dialogContent> {
  /** Hide the corner close button (Escape still closes). */
  hideClose?: boolean;
  /** Accessible label for the close button. */
  closeLabel?: string;
}

/** Modal dialog. Traps focus, restores it on close, closes on Escape. */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { className, size, hideClose, closeLabel = "Close", children, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className={overlay} />
      <DialogPrimitive.Content ref={ref} className={cn(dialogContent({ size }), className)} {...props}>
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close className={closeButton} aria-label={closeLabel}>
            <X />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

/* ------------------------------------------------------------ AlertDialog */

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogFooter = DialogFooter;

export const AlertDialogContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & VariantProps<typeof dialogContent>>(
  function AlertDialogContent({ className, size = "sm", ...props }, ref) {
    const container = usePortalContainer();
    return (
      <AlertDialogPrimitive.Portal container={container}>
        <AlertDialogPrimitive.Overlay className={overlay} />
        <AlertDialogPrimitive.Content ref={ref} className={cn(dialogContent({ size }), className)} {...props} />
      </AlertDialogPrimitive.Portal>
    );
  },
);

export const AlertDialogTitle = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>>(function AlertDialogTitle(
  { className, ...props },
  ref,
) {
  return <AlertDialogPrimitive.Title ref={ref} className={cn("font-display text-lg font-semibold text-foreground", className)} {...props} />;
});

export const AlertDialogDescription = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>>(
  function AlertDialogDescription({ className, ...props }, ref) {
    return <AlertDialogPrimitive.Description ref={ref} className={cn("text-sm text-foreground-muted", className)} {...props} />;
  },
);

export interface AlertDialogActionProps extends ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> {
  variant?: "primary" | "danger";
}

export const AlertDialogAction = forwardRef<HTMLButtonElement, AlertDialogActionProps>(function AlertDialogAction({ className, variant = "primary", ...props }, ref) {
  return <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />;
});

export const AlertDialogCancel = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>>(function AlertDialogCancel(
  { className, ...props },
  ref,
) {
  return <AlertDialogPrimitive.Cancel ref={ref} className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />;
});

/* ----------------------------------------------------------- Sheet/Drawer */

const sheetContent = cva(
  "fixed z-(--nv-z-modal) flex flex-col gap-4 overflow-y-auto border-border bg-surface-raised p-6 text-foreground shadow-xl outline-none",
  {
    variants: {
      side: {
        // Logical sides: "start"/"end" follow reading direction; left/right are physical.
        end: "inset-y-0 end-0 h-full w-[min(100vw-3rem,28rem)] border-s data-[state=open]:animate-nv-sheet-in-right data-[state=closed]:animate-nv-sheet-out-right rtl:data-[state=open]:animate-nv-sheet-in-left rtl:data-[state=closed]:animate-nv-sheet-out-left",
        start: "inset-y-0 start-0 h-full w-[min(100vw-3rem,28rem)] border-e data-[state=open]:animate-nv-sheet-in-left data-[state=closed]:animate-nv-sheet-out-left rtl:data-[state=open]:animate-nv-sheet-in-right rtl:data-[state=closed]:animate-nv-sheet-out-right",
        right: "inset-y-0 right-0 h-full w-[min(100vw-3rem,28rem)] border-l data-[state=open]:animate-nv-sheet-in-right data-[state=closed]:animate-nv-sheet-out-right",
        left: "inset-y-0 left-0 h-full w-[min(100vw-3rem,28rem)] border-r data-[state=open]:animate-nv-sheet-in-left data-[state=closed]:animate-nv-sheet-out-left",
        top: "inset-x-0 top-0 max-h-[85dvh] border-b data-[state=open]:animate-nv-sheet-in-top data-[state=closed]:animate-nv-sheet-out-top",
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-(--nv-dialog-radius) border-t data-[state=open]:animate-nv-sheet-in-bottom data-[state=closed]:animate-nv-sheet-out-bottom",
      },
    },
    defaultVariants: { side: "end" },
  },
);

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
export const SheetHeader = DialogHeader;
export const SheetFooter = DialogFooter;

export interface SheetContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, VariantProps<typeof sheetContent> {
  hideClose?: boolean;
  closeLabel?: string;
}

/** A panel that slides in from an edge. Modal, with focus trapping. */
export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(function SheetContent(
  { className, side, hideClose, closeLabel = "Close", children, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className={overlay} />
      <DialogPrimitive.Content ref={ref} className={cn(sheetContent({ side }), className)} {...props}>
        {side === "bottom" ? <div aria-hidden className="mx-auto -mt-2 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-border-strong" /> : null}
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close className={closeButton} aria-label={closeLabel}>
            <X />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

/** A bottom sheet, the mobile-friendly variant of Sheet. */
export const Drawer = Sheet;
export const DrawerTrigger = SheetTrigger;
export const DrawerClose = SheetClose;
export const DrawerTitle = SheetTitle;
export const DrawerDescription = SheetDescription;
export const DrawerHeader = SheetHeader;
export const DrawerFooter = SheetFooter;
export const DrawerContent = forwardRef<HTMLDivElement, Omit<SheetContentProps, "side">>(function DrawerContent(props, ref) {
  return <SheetContent ref={ref} side="bottom" {...props} />;
});
