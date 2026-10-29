import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";

/** CSS colors for chart series, following the active theme. Decorative: pair with labels. */
export const chartColors = [1, 2, 3, 4, 5, 6].map((i) => `var(--ks-color-chart-${i})`);

export interface BarListItem {
  label: ReactNode;
  value: number;
  /** Override the bar color (any CSS color or `chartColors[i]`). */
  color?: string;
}

export interface BarListProps extends HTMLAttributes<HTMLDivElement> {
  data: BarListItem[];
  /** Formats values for display and screen readers. */
  formatValue?: (value: number) => string;
  /** Maximum for bar length; defaults to the largest value. */
  max?: number;
}

/**
 * A dependency-free horizontal bar chart. Rendered as a semantic list with
 * visible values, so it reads correctly without seeing the bars. For complex
 * charts, use any charting library with `chartColors`.
 */
export const BarList = forwardRef<HTMLDivElement, BarListProps>(function BarList({ data, formatValue = (v) => v.toLocaleString(), max, className, ...props }, ref) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
      <ul className="flex flex-col gap-2">
        {data.map((item, i) => (
          <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
            <div className="relative flex h-8 items-center overflow-hidden rounded-sm">
              <div
                aria-hidden
                className="absolute inset-y-0 start-0 rounded-sm opacity-25 transition-[width] duration-(--ks-duration-slow) ease-(--ks-ease-out)"
                style={{ width: `${Math.max(2, (item.value / top) * 100)}%`, background: item.color ?? chartColors[i % chartColors.length] }}
              />
              <div
                aria-hidden
                className="absolute inset-y-0 start-0 w-1 rounded-full"
                style={{ background: item.color ?? chartColors[i % chartColors.length] }}
              />
              <span className="relative truncate ps-3 font-medium text-foreground">{item.label}</span>
            </div>
            <span className="tabular-nums font-semibold text-foreground-secondary">{formatValue(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
