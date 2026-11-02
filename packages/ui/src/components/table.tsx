"use client";

import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, Columns3 } from "lucide-react";
import {
  forwardRef,
  Fragment,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { Checkbox } from "./controls.tsx";
import { SearchInput } from "./input.tsx";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./menu.tsx";
import { Pagination } from "./navigation.tsx";
import { EmptyState } from "./feedback.tsx";
import { focusRing } from "./shared.ts";
import { Skeleton } from "./skeleton.tsx";

/* ------------------------------------------------------------- Table parts */

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Tighter rows for data-dense screens. */
  density?: "compact" | "comfortable";
  /** Shade every other row. */
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
      className={cn("border-b border-border transition-colors duration-(--nv-duration-fast) hover:bg-surface-hover/70 data-[state=selected]:bg-primary-subtle/70", className)}
      {...props}
    />
  );
});

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(function TableHead({ className, scope = "col", ...props }, ref) {
  return (
    <th
      ref={ref}
      scope={scope}
      className={cn("whitespace-nowrap text-start align-middle text-xs font-semibold uppercase tracking-(--nv-tracking-wide) text-foreground-muted", className)}
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
  /** Text matched by the search box. Defaults to `sortValue`, then `row[id]`. Return "" to exclude. */
  filterValue?: (row: T) => string | number | null | undefined;
  /** Allow hiding this column from the columns menu. Defaults to true. */
  hideable?: boolean;
  /** Label for the columns menu when `header` is not plain text. */
  menuLabel?: string;
}

export interface SortState {
  id: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> extends Omit<TableProps, "children"> {
  /** The rows. For server-driven tables, the current page only. */
  data: T[];
  /** Column definitions: id, header, cell renderer, and optional sortable, align and width. */
  columns: DataTableColumn<T>[];
  /** Stable key per row. */
  getRowId: (row: T) => string;
  /** Controlled sort. Omit for built-in client-side sorting. */
  sort?: SortState | null;
  /** Called with the new sort, or null when cleared. */
  onSortChange?: (sort: SortState | null) => void;
  /** Enables row selection checkboxes. */
  selectable?: boolean;
  /** Controlled selected row ids. */
  selectedIds?: string[];
  /** Called with the selected row ids. */
  onSelectionChange?: (ids: string[]) => void;
  /** Show skeleton rows instead of data. */
  loading?: boolean;
  /** Shown when `data` is empty and not loading. */
  empty?: ReactNode;
  /** A caption under the table, which also names it for screen readers. */
  caption?: ReactNode;
  /** Accessible labels (for localization). */
  labels?: {
    selectAll?: string;
    selectRow?: (row: T) => string;
    loading?: string;
    search?: string;
    columns?: string;
    expandRow?: (row: T) => string;
    /** e.g. (from, to, total) => `${from}–${to} of ${total}` */
    range?: (from: string, to: string, total: string) => string;
    noMatches?: string;
    /** Header of the expand-toggle column (screen readers only). */
    details?: string;
  };
  locale?: string;

  /** Show a search box that filters rows across columns (client-side). */
  searchable?: boolean;
  /** Controlled search text. */
  search?: string;
  /** Called with the search text as it's typed. */
  onSearchChange?: (search: string) => void;

  /** Rows per page. Enables pagination. */
  pageSize?: number;
  /** Controlled page (1-based). */
  page?: number;
  /** Called with the new page. */
  onPageChange?: (page: number) => void;
  /**
   * Total rows on the server. Pass it with controlled `page` and the current
   * page as `data` for server-side pagination.
   */
  rowCount?: number;

  /** Show the columns menu for hiding and showing columns. */
  columnToggle?: boolean;
  /** Controlled hidden column ids. */
  hiddenColumns?: string[];
  /** Ids of columns hidden on first render. */
  defaultHiddenColumns?: string[];
  /** Called with the hidden column ids. */
  onHiddenColumnsChange?: (ids: string[]) => void;

  /** Content shown under a row when it is expanded. Adds an expand toggle per row. */
  renderExpanded?: (row: T) => ReactNode;

  /** Extra toolbar content, e.g. filters or an export button. */
  toolbar?: ReactNode;
}

const alignClass = { start: "text-start", center: "text-center", end: "text-end" } as const;

function defaultValue<T>(row: T, id: string): unknown {
  return (row as Record<string, unknown>)[id];
}

/**
 * A ready-made table for record lists: sorting (with aria-sort), search,
 * pagination, column visibility, expandable rows, selection, loading and empty
 * states. Everything works client-side by default; for server-driven data,
 * control `sort`, `search` and `page`, pass the current page as `data` and the
 * total as `rowCount`.
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
  locale: localeProp,
  searchable,
  search: searchProp,
  onSearchChange,
  pageSize,
  page: pageProp,
  onPageChange,
  rowCount,
  columnToggle,
  hiddenColumns: hiddenProp,
  defaultHiddenColumns = [],
  onHiddenColumnsChange,
  renderExpanded,
  toolbar,
  ...tableProps
}: DataTableProps<T>) {
  const { locale } = useLocale(localeProp);
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchProp ?? internalSearch;
  const [internalPage, setInternalPage] = useState(1);
  const [internalHidden, setInternalHidden] = useState<string[]>(defaultHiddenColumns);
  const hidden = hiddenProp ?? internalHidden;
  const [expanded, setExpanded] = useState<string[]>([]);
  const visibleColumns = columns.filter((c) => !hidden.includes(c.id));
  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const sort = sortProp !== undefined ? sortProp : internalSort;
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const selected = selectedProp ?? internalSelected;

  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }), [locale]);

  const sortedRows = useMemo(() => {
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

  // Client-side search, unless the consumer controls it (server search).
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    if (!query || searchProp !== undefined) return sortedRows;
    const words = query.split(/\s+/);
    const text = (row: T) =>
      columns
        .map((c) => (c.filterValue ? c.filterValue(row) : c.sortValue ? c.sortValue(row) : defaultValue(row, c.id)))
        .map((v) => (v instanceof Date ? v.toLocaleDateString(locale) : v == null ? "" : String(v)))
        .join(" ")
        .toLocaleLowerCase(locale);
    return sortedRows.filter((row) => {
      const haystack = text(row);
      return words.every((w) => haystack.includes(w));
    });
  }, [sortedRows, search, searchProp, columns, locale]);

  const serverPaged = pageProp !== undefined && rowCount !== undefined;
  const total = serverPaged ? rowCount : filtered.length;
  const pageCount = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const page = Math.min(pageProp ?? internalPage, pageCount);
  const rows = pageSize && !serverPaged ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

  const setPage = (next: number) => {
    if (pageProp === undefined) setInternalPage(next);
    onPageChange?.(next);
  };
  const setSearch = (next: string) => {
    if (searchProp === undefined) setInternalSearch(next);
    onSearchChange?.(next);
    // New results start on the first page.
    if (page !== 1) setPage(1);
  };
  const setHidden = (ids: string[]) => {
    if (hiddenProp === undefined) setInternalHidden(ids);
    onHiddenColumnsChange?.(ids);
  };
  const number = new Intl.NumberFormat(locale);

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
  const colSpan = visibleColumns.length + (selectable ? 1 : 0) + (renderExpanded ? 1 : 0);
  const from = total === 0 ? 0 : pageSize ? (page - 1) * pageSize + 1 : 1;
  const to = pageSize ? Math.min(total, page * pageSize) : total;
  const columnName = (c: DataTableColumn<T>) => c.menuLabel ?? (typeof c.header === "string" ? c.header : c.id);
  const showToolbar = searchable || columnToggle || toolbar;

  const table = (
    <Table aria-busy={loading || undefined} {...tableProps}>
      {caption ? <TableCaption>{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {renderExpanded ? (
            <TableHead className="w-10">
              <span className="sr-only">{labels?.details ?? "Details"}</span>
            </TableHead>
          ) : null}
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
          {visibleColumns.map((column) => {
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
            <TableCell colSpan={colSpan}>
              {search && data.length > 0 ? (
                <EmptyState size="sm" title={labels?.noMatches ?? "No matching rows"} description={`“${search}”`} />
              ) : (
                (empty ?? <EmptyState size="sm" title="No results" description="There is nothing to show here yet." />)
              )}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const id = getRowId(row);
            const isSelected = selected.includes(id);
            const isExpanded = expanded.includes(id);
            const detailId = `nv-row-${id}-details`;
            return (
              <Fragment key={id}>
              <TableRow data-state={isSelected ? "selected" : undefined} aria-selected={selectable ? isSelected : undefined}>
                {renderExpanded ? (
                  <TableCell className="w-10">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={isExpanded ? detailId : undefined}
                      aria-label={labels?.expandRow?.(row) ?? `Show details for ${id}`}
                      onClick={() => setExpanded((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
                      className={cn("-m-1 inline-flex size-7 items-center justify-center rounded-md text-foreground-muted hover:bg-surface-hover hover:text-foreground", focusRing)}
                    >
                      <ChevronRight aria-hidden className={cn("size-4 transition-transform duration-(--nv-duration-normal) rtl:-scale-x-100", isExpanded && "rotate-90 rtl:-rotate-90")} />
                    </button>
                  </TableCell>
                ) : null}
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
                {visibleColumns.map((column) => (
                  <TableCell key={column.id} className={alignClass[column.align ?? "start"]}>
                    {column.cell ? column.cell(row) : String(defaultValue(row, column.id) ?? "")}
                  </TableCell>
                ))}
              </TableRow>
              {renderExpanded && isExpanded ? (
                <TableRow id={detailId} className="bg-surface-sunken/50 hover:bg-surface-sunken/50">
                  <TableCell colSpan={colSpan} className="animate-nv-slide-down">
                    {renderExpanded(row)}
                  </TableCell>
                </TableRow>
              ) : null}
              </Fragment>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  if (!showToolbar && !pageSize) return table;

  return (
    <div className="flex w-full flex-col gap-3">
      {showToolbar ? (
        <div className="flex flex-wrap items-center gap-2">
          {searchable ? (
            // SearchInput fills its container, so the container sets the width.
            <div className="w-full max-w-72 min-w-40 flex-1">
            <SearchInput
              aria-label={labels?.search ?? "Search rows"}
              placeholder={labels?.search ?? "Search…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              size="sm"
            />
            </div>
          ) : null}
          <div className="ms-auto flex items-center gap-2">
            {toolbar}
            {columnToggle ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" startIcon={<Columns3 />}>
                    {labels?.columns ?? "Columns"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuLabel>{labels?.columns ?? "Columns"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns
                    .filter((c) => c.hideable !== false)
                    .map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.id}
                        checked={!hidden.includes(c.id)}
                        // Keep at least one column on screen.
                        disabled={!hidden.includes(c.id) && visibleColumns.length === 1}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(on) => setHidden(on ? hidden.filter((h) => h !== c.id) : [...hidden, c.id])}
                      >
                        {columnName(c)}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      ) : null}
      {table}
      {pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-xs tabular-nums text-foreground-muted">
            {(labels?.range ?? ((f, t, n) => `${f}–${t} of ${n}`))(number.format(from), number.format(to), number.format(total))}
          </p>
          {pageCount > 1 ? <Pagination size="sm" page={page} pageCount={pageCount} onPageChange={setPage} /> : null}
        </div>
      ) : null}
    </div>
  );
}
