import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../utils/cn.ts";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: "rect" | "text" | "circle";
}

/**
 * A placeholder shown while content loads. Decorative: announce loading with
 * `aria-busy` on the region or a LoadingState instead.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton({ shape = "rect", className, ...props }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "animate-nv-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--nv-color-surface-sunken)_0%,var(--nv-color-surface-active)_50%,var(--nv-color-surface-sunken)_100%)]",
        shape === "circle" && "aspect-square rounded-full",
        shape === "text" && "h-[1em] w-full rounded-sm",
        shape === "rect" && "rounded-md",
        className,
      )}
      {...props}
    />
  );
});
