"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle, X, type LucideIcon } from "lucide-react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { forwardRef, useId, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { focusRing } from "./shared.ts";
import { Spinner } from "./spinner.tsx";

type Tone = "neutral" | "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "info";

/* ------------------------------------------------------------------- Badge */

const toneSolid: Record<Tone, string> = {
  neutral: "bg-neutral text-neutral-on-solid",
  primary: "bg-primary text-primary-on-solid",
  secondary: "bg-secondary text-secondary-on-solid",
  accent: "bg-accent text-accent-on-solid",
  success: "bg-success text-success-on-solid",
  warning: "bg-warning text-warning-on-solid",
  danger: "bg-danger text-danger-on-solid",
  info: "bg-info text-info-on-solid",
};
const toneSoft: Record<Tone, string> = {
  neutral: "bg-neutral-subtle text-neutral-on-subtle",
  primary: "bg-primary-subtle text-primary-on-subtle",
  secondary: "bg-secondary-subtle text-secondary-on-subtle",
  accent: "bg-accent-subtle text-accent-on-subtle",
  success: "bg-success-subtle text-success-on-subtle",
  warning: "bg-warning-subtle text-warning-on-subtle",
  danger: "bg-danger-subtle text-danger-on-subtle",
  info: "bg-info-subtle text-info-on-subtle",
};
const toneOutline: Record<Tone, string> = {
  neutral: "border-neutral-border text-foreground-secondary",
  primary: "border-primary-border text-primary-text",
  secondary: "border-secondary-border text-secondary-text",
  accent: "border-accent-border text-accent-text",
  success: "border-success-border text-success-text",
  warning: "border-warning-border text-warning-text",
  danger: "border-danger-border text-danger-text",
  info: "border-info-border text-info-text",
};
const toneDot: Record<Tone, string> = {
  neutral: "bg-foreground-muted",
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

const badgeBase = cva("inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-(--nv-badge-radius) border border-transparent font-semibold [&_svg]:size-3", {
  variants: {
    size: { sm: "h-5 px-2 text-2xs", md: "h-6 px-2.5 text-xs", lg: "h-7 px-3 text-sm" },
  },
  defaultVariants: { size: "md" },
});

export type BadgeVariant = Tone | "outline" | "gradient";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeBase> {
  /** A semantic tone, or "outline"/"gradient". */
  variant?: BadgeVariant;
  /** For tones: soft (tinted, default), solid (filled), outline, glass or clay. */
  appearance?: "soft" | "solid" | "outline" | "glass" | "clay";
  /** Leading status dot. */
  dot?: boolean;
  /** Pulse the dot to signal something live (disabled under reduced motion). */
  pulse?: boolean;
}

/** A compact label for status, counts and categories. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ variant = "neutral", appearance = "soft", size, dot, pulse, className, children, ...props }, ref) {
  const tone: Tone = variant === "outline" ? "neutral" : variant === "gradient" ? "primary" : variant;
  const look =
    variant === "gradient"
      ? "bg-(image:--nv-gradient-brand) text-primary-on-solid"
      : appearance === "glass"
        ? "bg-(--nv-glass-bg) backdrop-blur-sm border border-(--nv-glass-border) text-foreground shadow-(--nv-shadow-glass)"
        : appearance === "clay"
          ? "rounded-full border-0 bg-surface text-foreground shadow-(--nv-shadow-clay)"
          : variant === "outline" || appearance === "outline"
            ? toneOutline[tone]
            : appearance === "solid"
              ? toneSolid[tone]
              : toneSoft[tone];
  return (
    <span ref={ref} className={cn(badgeBase({ size }), look, className)} {...props}>
      {dot || pulse ? (
        <span aria-hidden className="relative flex size-1.5">
          {pulse ? <span className={cn("absolute inset-0 rounded-full opacity-70 motion-safe:animate-ping", appearance === "solid" ? "bg-current" : toneDot[tone])} /> : null}
          <span className={cn("relative size-1.5 rounded-full", appearance === "solid" ? "bg-current" : toneDot[tone])} />
        </span>
      ) : null}
      {children}
    </span>
  );
});

/* ------------------------------------------------------------------- Alert */

const alertIcons: Record<Tone, LucideIcon> = {
  neutral: Info,
  primary: Sparkles,
  secondary: Sparkles,
  accent: Sparkles,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

const alertTone: Record<Tone, string> = {
  neutral: "bg-surface-sunken border-border [&_[data-alert-icon]]:text-foreground-muted",
  primary: "bg-primary-subtle border-primary-border [&_[data-alert-icon]]:text-primary-text",
  secondary: "bg-secondary-subtle border-secondary-border [&_[data-alert-icon]]:text-secondary-text",
  accent: "bg-accent-subtle border-accent-border [&_[data-alert-icon]]:text-accent-text",
  success: "bg-success-subtle border-success-border [&_[data-alert-icon]]:text-success-text",
  warning: "bg-warning-subtle border-warning-border [&_[data-alert-icon]]:text-warning-text",
  danger: "bg-danger-subtle border-danger-border [&_[data-alert-icon]]:text-danger-text",
  info: "bg-info-subtle border-info-border [&_[data-alert-icon]]:text-info-text",
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: Tone;
  title?: ReactNode;
  /** Replace the default icon, or pass `null` to hide it. */
  icon?: ReactNode | null;
  /** Action area (buttons/links) shown at the end. */
  action?: ReactNode;
  /** Shows a dismiss button. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * An inline message. Danger and warning alerts use `role="alert"` so they are
 * announced; others use `role="status"`. Every tone has an icon and text, so
 * meaning never depends on color alone.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = "info", title, icon, action, onDismiss, dismissLabel = "Dismiss", className, children, role, ...props },
  ref,
) {
  const IconGlyph = alertIcons[variant];
  const titleId = useId();
  return (
    <div
      ref={ref}
      role={role ?? (variant === "danger" || variant === "warning" ? "alert" : "status")}
      // The title names the region, so "Payment failed" is what assistive tech announces first.
      aria-labelledby={title ? titleId : undefined}
      className={cn("relative flex gap-3 rounded-lg border p-4 text-sm text-foreground animate-nv-slide-down", alertTone[variant], className)}
      {...props}
    >
      {icon === null ? null : <span data-alert-icon="" className="mt-px shrink-0 animate-nv-bounce-in [&_svg]:size-5">{icon ?? <IconGlyph aria-hidden />}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? (
          <p id={titleId} className="font-semibold leading-snug">
            {title}
          </p>
        ) : null}
        {children ? <div className="text-foreground-secondary [&_a]:font-medium [&_a]:underline">{children}</div> : null}
        {action ? <div className="mt-2 flex flex-wrap gap-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn("-me-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-4", focusRing)}
        >
          <X />
        </button>
      ) : null}
    </div>
  );
});

/* ---------------------------------------------------------------- Progress */

const progressTone: Record<"primary" | "success" | "warning" | "danger" | "gradient", string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  gradient: "bg-(image:--nv-gradient-vivid)",
};

export interface ProgressProps extends Omit<ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, "value"> {
  /** 0–max. `null` or omitted renders an indeterminate bar. */
  value?: number | null;
  tone?: keyof typeof progressTone;
  size?: "sm" | "md" | "lg";
}

/** A determinate or indeterminate progress bar. Give it an aria-label. */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress({ value = null, max = 100, tone = "gradient", size = "md", className, ...props }, ref) {
  const pct = value === null ? null : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      max={max}
      className={cn("relative w-full overflow-hidden rounded-full bg-surface-active", size === "sm" ? "h-1" : size === "lg" ? "h-3" : "h-2", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full transition-[width] duration-(--nv-duration-slow) ease-(--nv-ease-out)",
          progressTone[tone],
          pct === null && "w-full origin-left animate-nv-indeterminate",
        )}
        style={pct === null ? undefined : { width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  );
});

/* ---------------------------------------------------------- StatusIndicator */

export interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  status: "online" | "away" | "busy" | "offline" | "success" | "warning" | "danger" | "info";
  /** Visible text. Always provide it, or an aria-label, so status is not color-only. */
  label?: ReactNode;
  /** Gently pulse to draw attention (disabled under reduced motion). */
  pulse?: boolean;
}

const statusDot: Record<StatusIndicatorProps["status"], string> = {
  online: "bg-success",
  success: "bg-success",
  away: "bg-warning",
  warning: "bg-warning",
  busy: "bg-danger",
  danger: "bg-danger",
  offline: "bg-foreground-disabled",
  info: "bg-info",
};

/** A colored dot plus text describing live status. */
export const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(function StatusIndicator({ status, label, pulse, className, ...props }, ref) {
  return (
    <span ref={ref} className={cn("inline-flex items-center gap-2 text-sm text-foreground-secondary", className)} {...props}>
      <span aria-hidden className="relative flex size-2.5">
        {pulse ? <span className={cn("absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping", statusDot[status])} /> : null}
        <span className={cn("relative size-2.5 rounded-full ring-2 ring-surface", statusDot[status])} />
      </span>
      {label}
    </span>
  );
});

/* ------------------------------------------------------- Empty/Error/Loading */

export interface StateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Primary and secondary actions. */
  actions?: ReactNode;
  size?: "sm" | "md";
}

function StateLayout({ icon, title, description, actions, size = "md", className, iconClass, ...props }: StateProps & { iconClass: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", size === "sm" ? "gap-2 p-6" : "gap-3 p-10", className)} {...props}>
      {icon ? (
        <div aria-hidden className={cn("relative mb-1 flex items-center justify-center rounded-2xl [&_svg]:size-6", size === "sm" ? "size-10" : "size-14", iconClass)}>
          {icon}
        </div>
      ) : null}
      <p className={cn("font-display font-semibold text-foreground", size === "sm" ? "text-md" : "text-lg")}>{title}</p>
      {description ? <p className="max-w-sm text-sm text-foreground-muted">{description}</p> : null}
      {actions ? <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Shown when there is nothing to display yet. Explain why and what to do next. */
export const EmptyState = forwardRef<HTMLDivElement, StateProps>(function EmptyState({ icon = <Sparkles />, ...props }, ref) {
  return (
    <div ref={ref}>
      <StateLayout icon={icon} iconClass="bg-(image:--nv-gradient-subtle) text-primary-text ring-1 ring-primary-border motion-safe:animate-nv-float" {...props} />
    </div>
  );
});

/** Shown when content failed to load. Offer a retry. Announced as an alert. */
export const ErrorState = forwardRef<HTMLDivElement, StateProps>(function ErrorState({ icon = <XCircle />, ...props }, ref) {
  return (
    <div ref={ref} role="alert">
      <StateLayout icon={icon} iconClass="bg-danger-subtle text-danger-text ring-1 ring-danger-border" {...props} />
    </div>
  );
});

export interface LoadingStateProps extends Omit<StateProps, "title" | "icon"> {
  title?: ReactNode;
}

/** A centered loading message for whole regions. Sets aria-busy and announces politely. */
export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(function LoadingState({ title = "Loading…", ...props }, ref) {
  return (
    <div ref={ref} role="status" aria-busy="true" aria-live="polite">
      <StateLayout icon={<Spinner size="lg" tone="primary" label={null} />} iconClass="" title={title} {...props} />
    </div>
  );
});
