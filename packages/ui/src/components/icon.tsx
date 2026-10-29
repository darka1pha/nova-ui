import type { LucideIcon, LucideProps } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "../utils/cn.ts";

const sizes = { xs: "size-3", sm: "size-4", md: "size-5", lg: "size-6", xl: "size-8" } as const;

export interface IconProps extends Omit<LucideProps, "size" | "ref"> {
  /** Any Lucide icon component, or your own with the same props. */
  icon: LucideIcon;
  size?: keyof typeof sizes;
  /** Accessible name. Omit for decorative icons (hidden from assistive tech). */
  label?: string;
  /** Mirror horizontally in right-to-left layouts (arrows, chevrons…). */
  flipInRtl?: boolean;
}

/** Consistent sizing and accessibility for icons. */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ icon: Glyph, size = "sm", label, flipInRtl, className, ...props }, ref) {
  return (
    <Glyph
      ref={ref}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      className={cn(sizes[size], "shrink-0", flipInRtl && "rtl:-scale-x-100", className)}
      {...props}
    />
  );
});
