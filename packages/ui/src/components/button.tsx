"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot, Toggle as TogglePrimitive, ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn.ts";
import { disabledState, focusRing, pressable, transition } from "./shared.ts";
import { Spinner } from "./spinner.tsx";

/**
 * Filled variants share one motion recipe: a soft top highlight for depth; on
 * hover they lift and pick up a glow in their own hue; on press they settle
 * and squash on the theme's spring. (Class names are literal so Tailwind sees them.)
 */
const lift = "hover:translate-y-(--ks-hover-lift) active:translate-y-0 motion-reduce:hover:translate-y-0";
const sheen = "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),var(--ks-shadow-xs)]";

export const buttonVariants = cva(
  `group/button relative isolate inline-flex shrink-0 select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-(--ks-button-radius) border border-transparent font-semibold [&_svg]:pointer-events-none [&_svg]:shrink-0 ${focusRing} ${transition} ${pressable} ${disabledState}`,
  {
    variants: {
      variant: {
        primary: `bg-primary text-primary-on-solid hover:bg-primary-solid-hover active:bg-primary-solid-active ${sheen} hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),var(--ks-shadow-glow-primary)] ${lift}`,
        secondary: `bg-secondary text-secondary-on-solid hover:bg-secondary-solid-hover active:bg-secondary-solid-active ${sheen} hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),var(--ks-shadow-glow-secondary)] ${lift}`,
        accent: `bg-accent text-accent-on-solid hover:bg-accent-solid-hover active:bg-accent-solid-active ${sheen} hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),var(--ks-shadow-glow-accent)] ${lift}`,
        neutral: `bg-neutral text-neutral-on-solid hover:bg-neutral-solid-hover active:bg-neutral-solid-active ${sheen} hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),var(--ks-shadow-glow-neutral)] ${lift}`,
        soft: "bg-primary-subtle text-primary-on-subtle hover:bg-primary-subtle-hover",
        outline: "border-input bg-surface text-foreground shadow-xs hover:border-foreground-muted hover:bg-surface-hover active:bg-surface-active",
        ghost: "text-foreground hover:bg-surface-hover active:bg-surface-active",
        danger: `bg-danger text-danger-on-solid hover:bg-danger-solid-hover active:bg-danger-solid-active ${sheen} hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),var(--ks-shadow-glow-danger)] ${lift}`,
        success: `bg-success text-success-on-solid hover:bg-success-solid-hover active:bg-success-solid-active ${sheen} hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),var(--ks-shadow-glow-success)] ${lift}`,
        // The gradient pans and a light sweep crosses the button on hover.
        gradient:
          `bg-(image:--ks-gradient-vivid) bg-[length:200%_100%] bg-[position:0%_50%] text-primary-on-solid hover:bg-[position:100%_50%] ${sheen} hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),var(--ks-shadow-glow-primary)] ${lift} ` +
          "[transition-property:background-position,box-shadow,translate,scale] [transition-duration:var(--ks-duration-slowest),var(--ks-duration-normal),var(--ks-duration-slow),var(--ks-duration-slow)] " +
          "after:pointer-events-none after:absolute after:inset-0 after:-translate-x-[110%] after:bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.32)_50%,transparent_70%)] after:transition-transform after:duration-(--ks-duration-slowest) after:ease-(--ks-ease-out) hover:after:translate-x-[110%] motion-reduce:after:hidden",
        link: "h-auto px-0 text-primary-text underline decoration-transparent underline-offset-4 hover:decoration-current active:scale-100",
      },
      size: {
        xs: "h-(--ks-control-h-xs) px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-(--ks-control-h-sm) px-(--ks-control-px-sm) text-sm [&_svg]:size-4",
        md: "h-(--ks-control-h-md) px-(--ks-control-px-md) text-sm [&_svg]:size-4",
        lg: "h-(--ks-control-h-lg) px-(--ks-control-px-lg) text-md [&_svg]:size-5",
        xl: "h-(--ks-control-h-xl) px-7 text-lg [&_svg]:size-5",
      },
      fullWidth: { true: "w-full", false: "" },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md", fullWidth: false },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

interface ButtonGroupContextValue {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
const ButtonGroupContext = createContext<ButtonGroupContextValue>({});

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/** Ink ripples that spread from the press point. Skipped under reduced motion. */
export function useRipple(enabled = true) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const counter = useRef(0);
  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const size = Math.hypot(rect.width, rect.height) * 2;
      const ripple = { id: ++counter.current, x: event.clientX - rect.left, y: event.clientY - rect.top, size };
      setRipples((current) => [...current.slice(-3), ripple]);
      // Remove by timer too, so ripples never linger if animations are disabled.
      setTimeout(() => setRipples((current) => current.filter((x) => x.id !== ripple.id)), 1000);
    },
    [enabled],
  );
  const layer = ripples.length ? (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {ripples.map((r) => (
        <span
          key={r.id}
          onAnimationEnd={() => setRipples((current) => current.filter((x) => x.id !== r.id))}
          className="absolute animate-ks-ripple rounded-full bg-current"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </span>
  ) : null;
  return { onPointerDown, layer };
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a router link) with button styling. */
  asChild?: boolean;
  /** Shows a spinner, sets `aria-busy` and prevents interaction. */
  loading?: boolean;
  /** Replaces the label while loading, e.g. "Saving…". */
  loadingText?: string;
  startIcon?: ReactNode;
  /** Nudges forward on hover — ideal for arrows ("Continue →"). */
  endIcon?: ReactNode;
  /** Ink ripple from the press point. */
  ripple?: boolean;
}

/** The primary action component. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild, variant, size, fullWidth, loading = false, loadingText, startIcon, endIcon, ripple = false, disabled, className, children, type, onPointerDown, ...props },
  ref,
) {
  const group = useContext(ButtonGroupContext);
  const classes = cn(buttonVariants({ variant: variant ?? group.variant, size: size ?? group.size, fullWidth }), className);
  const ink = useRipple(ripple);

  if (asChild) {
    return (
      <Slot.Root ref={ref} className={classes} aria-disabled={disabled || loading || undefined} onPointerDown={onPointerDown} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        ink.onPointerDown(e);
      }}
      {...props}
    >
      {ink.layer}
      {loading ? <Spinner size="sm" label={null} className="animate-ks-fade-in" /> : startIcon}
      {loading && loadingText ? loadingText : children}
      {!loading && endIcon ? (
        <span className="inline-flex transition-transform duration-(--ks-duration-slow) ease-(--ks-ease-interactive) group-hover/button:translate-x-0.5 rtl:group-hover/button:-translate-x-0.5 motion-reduce:transition-none">
          {endIcon}
        </span>
      ) : null}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, "startIcon" | "endIcon" | "loadingText" | "fullWidth"> {
  /** Required: icon-only buttons need an accessible name. */
  "aria-label": string;
}

const iconSizes: Record<ButtonSize, string> = {
  xs: "w-(--ks-control-h-xs) px-0",
  sm: "w-(--ks-control-h-sm) px-0",
  md: "w-(--ks-control-h-md) px-0",
  lg: "w-(--ks-control-h-lg) px-0",
  xl: "w-(--ks-control-h-xl) px-0",
};

/** A square, icon-only button. Requires `aria-label`. The icon grows slightly on hover. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ size, variant = "ghost", className, ...props }, ref) {
  const group = useContext(ButtonGroupContext);
  const s = size ?? group.size ?? "md";
  return (
    <Button
      ref={ref}
      size={s}
      variant={variant}
      className={cn(iconSizes[s], "[&_svg]:transition-transform [&_svg]:duration-(--ks-duration-slow) [&_svg]:ease-(--ks-ease-interactive) hover:[&_svg]:scale-115 motion-reduce:hover:[&_svg]:scale-100", className)}
      {...props}
    />
  );
});

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Default variant for buttons inside. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Join buttons into one segmented control. */
  attached?: boolean;
  orientation?: "horizontal" | "vertical";
}

/** Groups related buttons and shares variant/size with them. */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { variant, size, attached = false, orientation = "horizontal", className, ...props },
  ref,
) {
  return (
    <ButtonGroupContext.Provider value={{ variant, size }}>
      <div
        ref={ref}
        role="group"
        data-orientation={orientation}
        className={cn(
          "inline-flex",
          orientation === "vertical" ? "flex-col" : "flex-row",
          attached
            ? orientation === "vertical"
              ? "[&>*]:rounded-none [&>*]:hover:translate-y-0 [&>*:first-child]:rounded-t-(--ks-button-radius) [&>*:last-child]:rounded-b-(--ks-button-radius) [&>*:not(:first-child)]:-mt-px [&>*:focus-visible]:z-10"
              : "[&>*]:rounded-none [&>*]:hover:translate-y-0 [&>*:first-child]:rounded-s-(--ks-button-radius) [&>*:last-child]:rounded-e-(--ks-button-radius) [&>*:not(:first-child)]:-ms-px [&>*:focus-visible]:z-10"
            : "gap-2",
          className,
        )}
        {...props}
      />
    </ButtonGroupContext.Provider>
  );
});

const toggleVariants = cva(
  `inline-flex items-center justify-center gap-2 rounded-(--ks-button-radius) text-sm font-medium [&_svg]:size-4 [&_svg]:shrink-0 ${focusRing} ${transition} ${pressable} ${disabledState} ` +
    "data-[state=on]:bg-primary-subtle data-[state=on]:text-primary-on-subtle data-[state=on]:[&_svg]:animate-ks-bounce-in",
  {
    variants: {
      variant: {
        ghost: "text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
        outline: "border border-input bg-surface text-foreground-secondary hover:bg-surface-hover data-[state=on]:border-primary-border",
      },
      size: {
        sm: "h-(--ks-control-h-sm) min-w-(--ks-control-h-sm) px-2",
        md: "h-(--ks-control-h-md) min-w-(--ks-control-h-md) px-2.5",
        lg: "h-(--ks-control-h-lg) min-w-(--ks-control-h-lg) px-3",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export type ToggleProps = ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>;

/** A two-state button (pressed / not pressed), e.g. bold in a toolbar. */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle({ variant, size, className, ...props }, ref) {
  return <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size }), className)} {...props} />;
});

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({});

export type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>;

/** A set of toggles with single or multiple selection and roving focus. */
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup({ variant, size, className, children, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn("inline-flex items-center gap-1 rounded-(--ks-button-radius) bg-surface-sunken p-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});

export type ToggleGroupItemProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>;

export const ToggleGroupItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(function ToggleGroupItem({ variant, size, className, ...props }, ref) {
  const ctx = useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({ variant: variant ?? ctx.variant, size: size ?? ctx.size ?? "sm" }),
        "data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
});
