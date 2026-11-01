import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  /** `stacked`: term above value. `inline`: term beside value (stacks on narrow screens). */
  layout?: "stacked" | "inline";
  /** Columns from the `sm` breakpoint up (stacked layout). */
  columns?: 1 | 2 | 3;
  /** Rule lines between rows. */
  divided?: boolean;
}

const columnClass = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" } as const;

/**
 * Label–value pairs for detail pages: a real `<dl>` with each pair grouped in
 * a `<div>`, so screen readers announce "term, definition" together.
 */
export const DescriptionList = forwardRef<HTMLDListElement, DescriptionListProps>(function DescriptionList({ layout = "stacked", columns = 1, divided = false, className, ...props }, ref) {
  return (
    <dl
      ref={ref}
      data-layout={layout}
      data-divided={divided || undefined}
      className={cn(
        "group/dl grid text-sm",
        layout === "stacked" ? cn("gap-x-6", columnClass[columns], divided ? "gap-y-0" : "gap-y-4") : "gap-y-0",
        divided && "divide-y divide-border",
        className,
      )}
      {...props}
    />
  );
});

export interface DescriptionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  term: ReactNode;
  /** Span every column (long values like notes or addresses). */
  fullWidth?: boolean;
  /** Small action beside the value, e.g. a CopyButton or "Edit" link. */
  action?: ReactNode;
}

export const DescriptionItem = forwardRef<HTMLDivElement, DescriptionItemProps>(function DescriptionItem({ term, fullWidth = false, action, className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 flex-col gap-1",
        "group-data-[layout=inline]/dl:py-3 group-data-[layout=inline]/dl:sm:grid group-data-[layout=inline]/dl:sm:grid-cols-[minmax(8rem,1fr)_2fr] group-data-[layout=inline]/dl:sm:gap-4",
        "group-data-divided/dl:py-3",
        fullWidth && "col-span-full",
        className,
      )}
      {...props}
    >
      <dt className="text-foreground-muted">{term}</dt>
      <dd className="flex min-w-0 items-start justify-between gap-2 font-medium text-foreground">
        <span className="min-w-0 break-words">{children}</span>
        {action ? <span className="shrink-0">{action}</span> : null}
      </dd>
    </div>
  );
});
