"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { usePortalContainer } from "./portal.tsx";
import { focusRing } from "./shared.ts";
import { createPortal } from "react-dom";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. `Infinity` keeps it open. Default 5000. */
  duration?: number;
  /** A single action. `altText` describes it for screen readers (required by Radix). */
  action?: { label: string; altText: string; onClick: () => void };
  id?: string;
}

interface ToastRecord extends ToastOptions {
  id: string;
  open: boolean;
}

/* A tiny external store, so `toast()` works from anywhere (event handlers, data layers). */
let toasts: ToastRecord[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let counter = 0;

function update(id: string, patch: Partial<ToastRecord>) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
}

/**
 * Shows a toast. Requires one `<Toaster />` mounted inside your ThemeProvider.
 * Returns the toast id.
 */
export function toast(options: ToastOptions | string, rest: Omit<ToastOptions, "title"> = {}): string {
  const opts = typeof options === "string" ? { ...rest, title: options } : options;
  const id = opts.id ?? `nv-toast-${++counter}`;
  const existing = toasts.some((t) => t.id === id);
  toasts = existing ? toasts.map((t) => (t.id === id ? { ...t, ...opts, id, open: true } : t)) : [...toasts, { ...opts, id, open: true }].slice(-5);
  emit();
  return id;
}
toast.success = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "success" });
toast.error = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "danger" });
toast.warning = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "warning" });
toast.info = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "info" });
toast.dismiss = (id?: string) => {
  toasts = toasts.map((t) => (id === undefined || t.id === id ? { ...t, open: false } : t));
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => toasts;
const getServerSnapshot = (): ToastRecord[] => [];

const icons: Record<ToastVariant, ReactNode> = {
  default: null,
  success: <CheckCircle2 className="text-success-text" />,
  warning: <AlertTriangle className="text-warning-text" />,
  danger: <XCircle className="text-danger-text" />,
  info: <Info className="text-info-text" />,
};

const countdown: Record<ToastVariant, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

const accent: Record<ToastVariant, string> = {
  default: "before:bg-(image:--nv-gradient-brand)",
  success: "before:bg-success",
  warning: "before:bg-warning",
  danger: "before:bg-danger",
  info: "before:bg-info",
};

export interface ToasterProps {
  /** Screen position. `bottom-end` follows reading direction. */
  position?: "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";
  /** Accessible label for the notification region. Use "{hotkey}" for the shortcut. */
  label?: string;
  closeLabel?: string;
}

const positions: Record<NonNullable<ToasterProps["position"]>, string> = {
  "top-start": "top-0 start-0",
  "top-center": "top-0 left-1/2 -translate-x-1/2",
  "top-end": "top-0 end-0",
  "bottom-start": "bottom-0 start-0",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  "bottom-end": "bottom-0 end-0",
};

/** Renders queued toasts. Mount once, inside ThemeProvider. */
export function Toaster({ position = "bottom-end", label = "Notifications ({hotkey})", closeLabel = "Dismiss notification" }: ToasterProps) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const container = usePortalContainer();
  const swipe = position.endsWith("start") ? "left" : position.endsWith("center") ? (position.startsWith("top") ? "up" : "down") : "right";

  const viewport = (
    <ToastPrimitive.Viewport
      label={label}
      className={cn("fixed z-(--nv-z-toast) m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 outline-none", positions[position], position.startsWith("top") ? "flex-col-reverse" : "")}
    />
  );

  return (
    <ToastPrimitive.Provider swipeDirection={swipe}>
      {items.map((t) => {
        const variant = t.variant ?? "default";
        return (
          <ToastPrimitive.Root
            key={t.id}
            open={t.open}
            duration={t.duration ?? 5000}
            type={variant === "danger" ? "foreground" : "background"}
            onOpenChange={(open) => {
              update(t.id, { open });
              if (!open) setTimeout(() => {
                toasts = toasts.filter((x) => x.id !== t.id || x.open);
                emit();
              }, 400);
            }}
            className={cn(
              "group/toast relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-border bg-surface-raised p-4 ps-5 text-foreground shadow-lg",
              "before:absolute before:inset-y-0 before:start-0 before:w-1",
              accent[variant],
              "data-[state=open]:animate-nv-pop-in data-[state=closed]:animate-nv-fade-out",
              "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-nv-fade-out",
            )}
          >
            {icons[variant] ? <span className="mt-0.5 shrink-0 animate-nv-bounce-in [&_svg]:size-5">{icons[variant]}</span> : null}
            {Number.isFinite(t.duration ?? 5000) ? (
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 bottom-0 h-0.5 origin-left animate-nv-countdown opacity-60 rtl:origin-right group-hover/toast:[animation-play-state:paused] group-focus-within/toast:[animation-play-state:paused] motion-reduce:hidden",
                  countdown[variant],
                )}
                style={{ animationDuration: `${t.duration ?? 5000}ms` }}
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>
              {t.description ? <ToastPrimitive.Description className="text-sm text-foreground-muted">{t.description}</ToastPrimitive.Description> : null}
              {t.action ? (
                <ToastPrimitive.Action
                  altText={t.action.altText}
                  onClick={t.action.onClick}
                  className={cn("mt-1 w-fit rounded-sm text-sm font-semibold text-primary-text hover:underline", focusRing)}
                >
                  {t.action.label}
                </ToastPrimitive.Action>
              ) : null}
            </div>
            <ToastPrimitive.Close
              aria-label={closeLabel}
              className={cn("-me-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-4", focusRing)}
            >
              <X />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      {container ? createPortal(viewport, container) : viewport}
    </ToastPrimitive.Provider>
  );
}
