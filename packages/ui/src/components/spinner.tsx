import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../utils/cn.ts";

const spinnerVariants = cva("inline-block shrink-0 animate-ks-spin rounded-full border-2 border-current border-e-transparent", {
  variants: {
    size: { xs: "size-3", sm: "size-4", md: "size-5", lg: "size-8" },
    tone: { current: "", primary: "text-primary-text", muted: "text-foreground-muted" },
  },
  defaultVariants: { size: "md", tone: "current" },
});

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof spinnerVariants> {
  /** Announced to screen readers. Pass `null` when a parent already announces loading. */
  label?: string | null;
}

/** An indeterminate loading indicator. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner({ size, tone, label = "Loading", className, ...props }, ref) {
  return (
    <span ref={ref} role={label ? "status" : undefined} className={cn("inline-flex", className)} {...props}>
      <span aria-hidden className={spinnerVariants({ size, tone })} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
});
