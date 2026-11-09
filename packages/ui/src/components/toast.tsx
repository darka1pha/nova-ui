"use client";

import { AlertTriangle, CheckCircle2, Info, LoaderCircle, X, XCircle } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { isValidElement, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useOptionalTheme } from "../theme/theme-provider.tsx";
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
  /**
   * Called once when the toast closes for any reason: its timer, the close button, a swipe,
   * `toast.dismiss()`, or being pushed out by newer toasts. Not called when a toast with the
   * same `id` replaces its content.
   */
  onDismiss?: (id: string) => void;
}

interface ToastRecord extends ToastOptions {
  id: string;
  open: boolean;
  /** Set while `toast.promise` waits: shows a spinner and never times out. */
  loading?: boolean;
}

/* A tiny external store, so `toast()` works from anywhere (event handlers, data layers). */
let toasts: ToastRecord[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let counter = 0;
/** At most this many toasts are open at once; the oldest make way for new ones. Set by `<Toaster max>`. */
const DEFAULT_MAX = 5;
let maxOpen = DEFAULT_MAX;

/** Closes toasts, then drops them once their exit animation has played (unless reopened). */
function close(shouldClose: (t: ToastRecord) => boolean) {
  const closing = toasts.filter((t) => t.open && shouldClose(t));
  if (closing.length === 0) return;
  const ids = new Set(closing.map((t) => t.id));
  toasts = toasts.map((t) => (ids.has(t.id) ? { ...t, open: false } : t));
  emit();
  // After the store update, so a callback that shows another toast sees a consistent stack.
  for (const t of closing) t.onDismiss?.(t.id);
  setTimeout(() => {
    toasts = toasts.filter((t) => !ids.has(t.id) || t.open);
    emit();
  }, 400);
}

/** Closes the oldest open toasts beyond the limit. Closing ones are still animating out and don't count. */
function enforceMax() {
  const overflow = new Set(
    toasts
      .filter((t) => t.open)
      .slice(0, -maxOpen)
      .map((t) => t.id),
  );
  close((t) => overflow.has(t.id));
}

function show(opts: ToastOptions, loading = false): string {
  const id = opts.id ?? `nv-toast-${++counter}`;
  const existing = toasts.some((t) => t.id === id);
  // Replacing a toast keeps its place in the stack; `loading` is reset unless set again.
  toasts = existing ? toasts.map((t) => (t.id === id ? { ...t, ...opts, id, open: true, loading } : t)) : [...toasts, { ...opts, id, open: true, loading }];
  emit();
  enforceMax();
  return id;
}

/**
 * Shows a toast. Requires one `<Toaster />` mounted inside your ThemeProvider.
 * Returns the toast id.
 */
export function toast(options: ToastOptions | string, rest: Omit<ToastOptions, "title"> = {}): string {
  return show(typeof options === "string" ? { ...rest, title: options } : options);
}
toast.success = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "success" });
toast.error = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "danger" });
toast.warning = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "warning" });
toast.info = (title: ReactNode, rest: Omit<ToastOptions, "title" | "variant"> = {}) => toast({ ...rest, title, variant: "info" });
toast.dismiss = (id?: string) => close((t) => id === undefined || t.id === id);

/** A message for one stage of `toast.promise`: a title, full options, or a function of the result. */
export type ToastPromiseMessage<V> = ReactNode | Omit<ToastOptions, "id"> | ((value: V) => ReactNode | Omit<ToastOptions, "id">);

export interface ToastPromiseOptions<T> extends Omit<ToastOptions, "title" | "variant" | "duration"> {
  /** Shown while the promise is pending, with a spinner. It doesn't time out. */
  loading: ReactNode | Omit<ToastOptions, "id">;
  /** Shown when it resolves (a success toast). A function receives the resolved value. */
  success: ToastPromiseMessage<T>;
  /** Shown when it rejects (a danger toast). A function receives the rejection reason. */
  error: ToastPromiseMessage<unknown>;
}

const isOptions = (m: unknown): m is Omit<ToastOptions, "id"> => typeof m === "object" && m !== null && !isValidElement(m) && "title" in m;

/**
 * Shows a loading toast for a promise, then turns the same toast into a success or error
 * toast when it settles. Returns the promise you passed in (or that the function returned),
 * so `await toast.promise(save(), ...)` still gives you the value or throws. If the person
 * dismisses the loading toast, the outcome isn't shown.
 *
 * A function that throws before returning a promise counts as a rejection: the error toast
 * shows and the returned promise rejects (it doesn't throw synchronously).
 */
toast.promise = <T,>(promise: Promise<T> | (() => Promise<T>), { loading, success, error, ...rest }: ToastPromiseOptions<T>): Promise<T> => {
  const id = show({ ...rest, ...(isOptions(loading) ? loading : { title: loading }), id: rest.id, duration: Infinity }, true);
  const settle = <V,>(message: ToastPromiseMessage<V>, value: V, variant: ToastVariant) => {
    // Dismissed while loading (or replaced by the caller): leave it closed.
    if (!toasts.some((t) => t.id === id && t.open && t.loading)) return;
    const resolved = typeof message === "function" ? message(value) : message;
    show({ ...rest, variant, duration: undefined, ...(isOptions(resolved) ? resolved : { title: resolved }), id });
  };
  // Every path must settle the toast, or the spinner never stops: a factory that throws
  // synchronously becomes a rejection, and Promise.resolve keeps a native promise as is
  // (so callers still get their own promise back) while adopting other thenables.
  let p: Promise<T>;
  try {
    p = Promise.resolve(typeof promise === "function" ? promise() : promise);
  } catch (reason) {
    p = Promise.reject(reason as Error);
  }
  p.then(
    (value) => {
      // A `success` function that throws is the caller's bug; show it as the error outcome.
      try {
        settle(success, value, "success");
      } catch (reason) {
        settleError(reason);
      }
    },
    (reason: unknown) => settleError(reason),
  );
  function settleError(reason: unknown) {
    try {
      settle(error, reason, "danger");
    } catch (formatError) {
      // The `error` function itself threw: close the spinner and report it. Rethrowing would
      // only become an unhandled rejection on this internal chain, which nothing can catch.
      close((t) => t.id === id && t.loading === true);
      console.error("toast.promise: the `error` option threw while formatting the rejection.", formatError);
    }
  }
  return p;
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => toasts;
// One shared empty list: React requires the server snapshot to be the same value on every call.
const noToasts: ToastRecord[] = [];
const getServerSnapshot = () => noToasts;

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
  /** Accessible name of each toast's close button. */
  closeLabel?: string;
  /** How many toasts can be open at once; the oldest close to make room. Default 5. */
  max?: number;
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
export function Toaster({ position = "bottom-end", label = "Notifications ({hotkey})", closeLabel = "Dismiss notification", max = DEFAULT_MAX }: ToasterProps) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The limit lives in the store, so `toast()` enforces it wherever it's called from.
  useEffect(() => {
    maxOpen = Math.max(1, Math.floor(max));
    enforceMax();
    return () => {
      maxOpen = DEFAULT_MAX;
    };
  }, [max]);
  const container = usePortalContainer();
  // "start" and "end" are logical: in RTL the start edge is on the right.
  const rtl = useOptionalTheme()?.dir === "rtl";
  const swipe = position.endsWith("center") ? (position.startsWith("top") ? "up" : "down") : position.endsWith("start") !== rtl ? "left" : "right";

  const viewport = (
    <ToastPrimitive.Viewport
      label={label}
      className={cn("fixed z-(--nv-z-toast) m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 outline-none", positions[position], position.startsWith("top") ? "flex-col-reverse" : "")}
    />
  );

  return (
    <ToastPrimitive.Provider swipeDirection={swipe}>
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} closeLabel={closeLabel} />
      ))}
      {container ? createPortal(viewport, container) : viewport}
    </ToastPrimitive.Provider>
  );
}

function ToastItem({ toast: t, closeLabel }: { toast: ToastRecord; closeLabel: string }) {
  const variant = t.variant ?? "default";
  const duration = t.loading ? Infinity : (t.duration ?? 5000);
  const icon = t.loading ? <LoaderCircle aria-hidden className="animate-nv-spin text-foreground-muted motion-reduce:animate-none" /> : icons[variant];
  // Radix pauses every toast's timer while the viewport is hovered or focused and
  // while the window is in the background; the countdown bar follows the same events.
  const [paused, setPaused] = useState(false);
  return (
    <ToastPrimitive.Root
      open={t.open}
      duration={duration}
      type={variant === "danger" ? "foreground" : "background"}
      onOpenChange={(open) => {
        if (!open) close((x) => x.id === t.id);
      }}
      onPause={() => setPaused(true)}
      onResume={() => setPaused(false)}
      data-paused={paused || undefined}
      className={cn(
        "group/toast relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-border bg-surface-raised p-4 ps-5 text-foreground shadow-lg",
        "before:absolute before:inset-y-0 before:start-0 before:w-1",
        accent[variant],
        "data-[state=open]:animate-nv-pop-in data-[state=closed]:animate-nv-fade-out",
        // Radix sets the x or the y offset depending on the swipe direction (centered positions swipe vertically).
        "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y) data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:translate-y-0 data-[swipe=end]:animate-nv-fade-out",
      )}
    >
      {/* Keyed so the icon pops in again when a promise toast settles. */}
      {icon ? (
        <span key={t.loading ? "loading" : variant} className="mt-0.5 shrink-0 animate-nv-bounce-in [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      {Number.isFinite(duration) ? (
        <span
          // Remount on settle so the countdown starts from full.
          key={`countdown-${variant}`}
          aria-hidden
          data-slot="toast-countdown"
          className={cn("absolute inset-x-0 bottom-0 h-0.5 origin-left animate-nv-countdown opacity-60 rtl:origin-right motion-reduce:hidden", countdown[variant])}
          style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? "paused" : "running" }}
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
}
