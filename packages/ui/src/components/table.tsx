"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  forwardRef,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { cn } from "../utils/cn.ts";
import { Checkbox } from "./controls.tsx";
import { EmptyState } from "./feedback.tsx";
import { focusRing } from "./shared.ts";
import { Skeleton } from "./skeleton.tsx";

/* ------------------------------------------------------------- Table parts */

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Tighter rows for data-dense screens. */
  density?: "compact" | "comfortable";
  striped?: boolean;
  /** Keep the header visible while the container scrolls. */
  stickyHeader?: boolean;
  /** Classes for the scroll container. */
  containerClassName?: string;
}

/** Semantic HTML table with system styling. Scrolls horizontally on small screens. */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { density = "comfortable", striped, stickyHeader, className, containerClassName, ...props },
  ref,
) {
  return (
    <div className={cn("relative w-full overflow-auto rounded-lg border border-border bg-surface", containerClassName)}>
      <table
        ref={ref}
        data-density={density}
        className={cn(
          "w-full caption-bottom border-collapse text-sm",
          "[&_td]:px-4 [&_th]:px-4",
          density === "compact" ? "[&_td]:py-2 [&_th]:h-9" : "[&_td]:py-3 [&_th]:h-11",
          striped && "[&_tbody_tr:nth-child(even)]:bg-surface-sunken/60",
          stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10",
          className,
        )}
        {...props}
      />
    </div>
  );
});

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn("bg-surface-sunken [&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
});

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
});

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableFooter({ className, ...props }, ref) {
  return <tfoot ref={ref} className={cn("border-t border-border bg-surface-sunken font-medium", className)} {...props} />;
});

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow({ className, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn("border-b border-border transition-colors duration-(--ks-duration-fast) hover:bg-surface-hover/70 data-[state=selected]:bg-primary-subtle/70", className)}
      {...props}
    />
  );
});

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(function TableHead({ className, scope = "col", ...props }, ref) {
  return (
    <th
      ref={ref}
      scope={scope}
      className={cn("whitespace-nowrap text-start align-middle text-xs font-semibold uppercase tracking-(--ks-tracking-wide) text-foreground-muted", className)}
      {...props}
    />
  );
});

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn("align-middle text-foreground", className)} {...props} />;
});

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(function TableCaption({ className, ...props }, ref) {
  return <caption ref={ref} className={cn("py-3 text-sm text-foreground-muted", className)} {...props} />;
});

/* --------------------------------------------------------------- DataTable */

export interface DataTableColumn<T> {
  /** Unique id; also the default accessor key. */
  id: string;
  header: ReactNode;
  /** Renders the cell. Defaults to `row[id]`. */
  cell?: (row: T) => ReactNode;
  /** Value used for sorting. Defaults to `row[id]`. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  /** CSS width, e.g. "8rem" or "20%". */
  width?: string;
}

export interface SortState {
  id: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> extends Omit<TableProps, "children"> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Stable key per row. */
  getRowId: (row: T) => string;
  /** Controlled sort. Omit for built-in client-side sorting. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** Enables row selection checkboxes. */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  loading?: boolean;
  /** Shown when `data` is empty and not loading. */
  empty?: ReactNode;
  caption?: ReactNode;
  /** Accessible labels (for localization). */
  labels?: { selectAll?: string; selectRow?: (row: T) => string; loading?: string };
  locale?: string;
}

const alignClass = { start: "text-start", center: "text-center", end: "text-end" } as const;

function defaultValue<T>(row: T, id: string): unknown {
  return (row as Record<string, unknown>)[id];
}

/**
 * A ready-made table for record lists: sorting (with aria-sort), selection,
 * loading and empty states. For virtualized or server-driven grids, control
 * `sort` and pass the current page of `data`.
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  sort: sortProp,
  onSortChange,
  selectable,
  selectedIds: selectedProp,
  onSelectionChange,
  loading,
  empty,
  caption,
  labels,
  locale,
  ...tableProps
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const sort = sortProp !== undefined ? sortProp : internalSort;
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const selected = selectedProp ?? internalSelected;

  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }), [locale]);

  const rows = useMemo(() => {
    // When sort is controlled the consumer sorts (e.g. on the server).
    if (!sort || sortProp !== undefined) return data;
    const column = columns.find((c) => c.id === sort.id);
    if (!column) return data;
    const value = (row: T) => (column.sortValue ? column.sortValue(row) : defaultValue(row, column.id));
    const sorted = [...data].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      if (va instanceof Date && vb instanceof Date) return va.getTime() - vb.getTime();
      return collator.compare(String(va), String(vb));
    });
    return sort.direction === "desc" ? sorted.reverse() : sorted;
  }, [data, columns, sort, sortProp, collator]);

  const toggleSort = (id: string) => {
    const next: SortState | null = sort?.id !== id ? { id, direction: "asc" } : sort.direction === "asc" ? { id, direction: "desc" } : null;
    if (sortProp === undefined) setInternalSort(next);
    onSortChange?.(next);
  };

  const setSelected = (ids: string[]) => {
    if (selectedProp === undefined) setInternalSelected(ids);
    onSelectionChange?.(ids);
  };
  const allIds = rows.map(getRowId);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const someSelected = !allSelected && allIds.some((id) => selected.includes(id));
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <Table aria-busy={loading || undefined} {...tableProps}>
      {caption ? <TableCaption>{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {selectable ? (
            <TableHead className="w-10">
              <Checkbox
                size="sm"
                aria-label={labels?.selectAll ?? "Select all rows"}
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(v) => setSelected(v === true ? allIds : [])}
              />
            </TableHead>
          ) : null}
          {columns.map((column) => {
            const active = sort?.id === column.id;
            return (
              <TableHead
                key={column.id}
                style={column.width ? { width: column.width } : undefined}
                className={alignClass[column.align ?? "start"]}
                aria-sort={column.sortable ? (active ? (sort.direction === "asc" ? "ascending" : "descending") : "none") : undefined}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column.id)}
                    className={cn("-mx-1 inline-flex items-center gap-1 rounded-xs px-1 uppercase hover:text-foreground", active && "text-foreground", focusRing)}
                  >
                    {column.header}
                    {active ? (
                      sort.direction === "asc" ? (
                        <ArrowUp aria-hidden className="size-3.5" />
                      ) : (
                        <ArrowDown aria-hidden className="size-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown aria-hidden className="size-3.5 opacity-50" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <TableRow key={`loading-${i}`}>
              <TableCell colSpan={colSpan}>
                <Skeleton shape="text" className={i % 2 ? "w-2/3" : "w-full"} />
                {i === 0 ? <span className="sr-only">{labels?.loading ?? "Loading rows"}</span> : null}
              </TableCell>
            </TableRow>
          ))
        ) : rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan}>{empty ?? <EmptyState size="sm" title="No results" description="There is nothing to show here yet." />}</TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const id = getRowId(row);
            const isSelected = selected.includes(id);
            return (
              <TableRow key={id} data-state={isSelected ? "selected" : undefined} aria-selected={selectable ? isSelected : undefined}>
                {selectable ? (
                  <TableCell>
                    <Checkbox
                      size="sm"
                      aria-label={labels?.selectRow?.(row) ?? `Select row ${id}`}
                      checked={isSelected}
                      onCheckedChange={(v) => setSelected(v === true ? [...selected, id] : selected.filter((s) => s !== id))}
                    />
                  </TableCell>
                ) : null}
                {columns.map((column) => (
                  <TableCell key={column.id} className={alignClass[column.align ?? "start"]}>
                    {column.cell ? column.cell(row) : String(defaultValue(row, column.id) ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
