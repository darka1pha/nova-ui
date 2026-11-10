"use client";

import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, Columns3, GripVertical } from "lucide-react";
import {
  forwardRef,
  Fragment,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { useLocale, useOptionalTheme } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { Checkbox } from "./controls.tsx";
import { SearchInput } from "./input.tsx";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./menu.tsx";
import { Pagination } from "./navigation.tsx";
import { EmptyState } from "./feedback.tsx";
import { InlineEdit } from "./inline-edit.tsx";
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
  /** Edit the cell in place (with `onCellEdit` on the table). A function decides per row. */
  editable?: boolean | ((row: T) => boolean);
  /** The text being edited. Defaults to `row[id]`. */
  editValue?: (row: T) => string;
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
    /** Name of a column's resize handle. */
    resize?: (column: string) => string;
    /** Name of a column's move button. */
    move?: (column: string) => string;
    /** Announced after a move, e.g. (column, position, count) => `${column}, column ${position} of ${count}`. */
    moved?: (column: string, position: number, count: number) => string;
    /** Name of the toggle on a group's header row. */
    group?: (value: string, count: number) => string;
    /** Name of an editable cell, e.g. (column) => `Edit ${column}`. */
    edit?: (column: string) => string;
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

  /** Drag the edge of a header (or focus it and use the arrow keys) to resize the column. */
  resizableColumns?: boolean;
  /** Controlled column widths in px, by column id. */
  columnWidths?: Record<string, number>;
  /** Called with every column's width once one is resized. */
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  /** Drag a header, or use its grip button with the arrow keys, to move the column. */
  reorderableColumns?: boolean;
  /** Controlled column order (ids). Columns missing from it follow in their given order. */
  columnOrder?: string[];
  /** Called with the new order of column ids. */
  onColumnOrderChange?: (ids: string[]) => void;
  /**
   * Saves an edited cell (columns with `editable`). May be async; return or resolve a string
   * to reject the value with that message, or throw. Update `data` to show the new value.
   */
  onCellEdit?: (row: T, columnId: string, value: string) => unknown;
  /** Group rows by this column's value, under collapsible header rows with a count. */
  groupBy?: string;
  /** Renders a group's heading. Defaults to the value as text. */
  renderGroup?: (value: unknown, rows: T[]) => ReactNode;
}

const alignClass = { start: "text-start", center: "text-center", end: "text-end" } as const;
const MIN_COLUMN_WIDTH = 48;

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
  resizableColumns,
  columnWidths: widthsProp,
  onColumnWidthsChange,
  reorderableColumns,
  columnOrder: orderProp,
  onColumnOrderChange,
  onCellEdit,
  groupBy,
  renderGroup,
  ...tableProps
}: DataTableProps<T>) {
  const { locale } = useLocale(localeProp);
  const rtl = (useOptionalTheme()?.dir ?? "ltr") === "rtl";
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchProp ?? internalSearch;
  const [internalPage, setInternalPage] = useState(1);
  const [internalHidden, setInternalHidden] = useState<string[]>(defaultHiddenColumns);
  const hidden = hiddenProp ?? internalHidden;
  const [expanded, setExpanded] = useState<string[]>([]);
  const [internalOrder, setInternalOrder] = useState<string[]>([]);
  const order = orderProp ?? internalOrder;
  const orderedColumns = useMemo(() => {
    const rank = (id: string) => {
      const i = order.indexOf(id);
      return i === -1 ? order.length + columns.findIndex((c) => c.id === id) : i;
    };
    return [...columns].sort((a, b) => rank(a.id) - rank(b.id));
  }, [columns, order]);
  const visibleColumns = orderedColumns.filter((c) => !hidden.includes(c.id));
  const [internalWidths, setInternalWidths] = useState<Record<string, number>>({});
  const widths = widthsProp ?? internalWidths;
  const fixedLayout = Object.keys(widths).length > 0;
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const headRefs = useRef(new Map<string, HTMLTableCellElement>());
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
  const moveLabel = labels?.move ?? ((name: string) => `Move ${name}`);

  /* Column order */
  const moveColumn = (id: string, toIndex: number) => {
    const visibleIds = visibleColumns.map((c) => c.id);
    const from = visibleIds.indexOf(id);
    const to = Math.max(0, Math.min(visibleIds.length - 1, toIndex));
    const target = visibleIds[to];
    if (from === -1 || from === to || !target) return;
    const ids = orderedColumns.map((c) => c.id).filter((x) => x !== id);
    ids.splice(ids.indexOf(target) + (to > from ? 1 : 0), 0, id);
    if (orderProp === undefined) setInternalOrder(ids);
    onColumnOrderChange?.(ids);
    const column = columns.find((c) => c.id === id);
    if (column) setAnnouncement((labels?.moved ?? ((name, pos, count) => `${name}, column ${pos} of ${count}`))(columnName(column), to + 1, visibleIds.length));
  };
  const dragged = useRef<string | null>(null);
  const onHeadDragStart = (id: string) => (e: DragEvent<HTMLTableCellElement>) => {
    dragged.current = id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onHeadDrop = (id: string) => (e: DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    const source = dragged.current;
    dragged.current = null;
    if (source && source !== id) moveColumn(source, visibleColumns.findIndex((c) => c.id === id));
  };
  const onMoveKey = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    moveColumn(id, visibleColumns.findIndex((c) => c.id === id) + step);
  };

  /* Column widths: the first resize freezes every visible column at its rendered width. */
  const measured = (id: string) => Math.round(headRefs.current.get(id)?.getBoundingClientRect().width || 120);
  const currentWidth = (id: string) => widths[id] ?? measured(id);
  const setWidth = (id: string, width: number) => {
    const base: Record<string, number> = {};
    for (const c of visibleColumns) base[c.id] = currentWidth(c.id);
    const next = { ...base, ...widths, [id]: Math.max(MIN_COLUMN_WIDTH, Math.round(width)) };
    if (widthsProp === undefined) setInternalWidths(next);
    onColumnWidthsChange?.(next);
  };
  const onResizePointerDown = (id: string) => (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);
    const startX = e.clientX;
    const startWidth = currentWidth(id);
    const move = (ev: globalThis.PointerEvent) => setWidth(id, startWidth + (ev.clientX - startX) * (rtl ? -1 : 1));
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };
  const onResizeKey = (id: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    // The handle sits on the column's end edge: the key toward the end widens it.
    const grow = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (grow === undefined) return;
    e.preventDefault();
    setWidth(id, currentWidth(id) + grow * (e.shiftKey ? 50 : 10));
  };
  const tableWidth = fixedLayout
    ? visibleColumns.reduce((sum, c) => sum + (widths[c.id] ?? 120), 0) + (selectable ? 40 : 0) + (renderExpanded ? 40 : 0)
    : undefined;

  /* Groups */
  const groupColumn = groupBy ? columns.find((c) => c.id === groupBy) : undefined;
  const groups = groupBy
    ? (() => {
        const map = new Map<string, { value: unknown; rows: T[] }>();
        for (const row of rows) {
          const value = groupColumn?.sortValue ? groupColumn.sortValue(row) : defaultValue(row, groupBy);
          const key = value instanceof Date ? value.toISOString() : String(value ?? "");
          const group = map.get(key) ?? { value, rows: [] };
          group.rows.push(row);
          map.set(key, group);
        }
        return [...map.entries()];
      })()
    : null;

  const renderRow = (row: T) => {
            const id = getRowId(row);
            const isSelected = selected.includes(id);
            const isExpanded = expanded.includes(id);
            const detailId = `nv-row-${id}-details`;
            return (
              <Fragment key={id}>
              <TableRow data-state={isSelected ? "selected" : undefined}>
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
                {visibleColumns.map((column) => {
                  const content = column.cell ? column.cell(row) : String(defaultValue(row, column.id) ?? "");
                  const editable = !!onCellEdit && (typeof column.editable === "function" ? column.editable(row) : !!column.editable);
                  return (
                    <TableCell key={column.id} className={cn(alignClass[column.align ?? "start"], fixedLayout && "truncate")}>
                      {editable && onCellEdit ? (
                        <InlineEdit
                          size="sm"
                          label={(labels?.edit ?? ((name: string) => name))(columnName(column))}
                          value={column.editValue ? column.editValue(row) : String(defaultValue(row, column.id) ?? "")}
                          renderValue={() => content}
                          onSave={(value) => onCellEdit(row, column.id, value)}
                        />
                      ) : (
                        content
                      )}
                    </TableCell>
                  );
                })}
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
  };

  const table = (
    <Table
      aria-busy={loading || undefined}
      {...tableProps}
      className={cn(fixedLayout && "table-fixed", tableProps.className)}
      style={tableWidth ? { width: tableWidth, ...tableProps.style } : tableProps.style}
    >
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
                ref={(el: HTMLTableCellElement | null) => {
                  if (el) headRefs.current.set(column.id, el);
                  else headRefs.current.delete(column.id);
                }}
                style={widths[column.id] ? { width: widths[column.id] } : column.width ? { width: column.width } : undefined}
                className={cn(alignClass[column.align ?? "start"], (resizableColumns || reorderableColumns) && "relative")}
                aria-sort={column.sortable ? (active ? (sort.direction === "asc" ? "ascending" : "descending") : "none") : undefined}
                draggable={reorderableColumns || undefined}
                onDragStart={reorderableColumns ? onHeadDragStart(column.id) : undefined}
                onDragOver={reorderableColumns ? (e: DragEvent<HTMLTableCellElement>) => e.preventDefault() : undefined}
                onDrop={reorderableColumns ? onHeadDrop(column.id) : undefined}
              >
                {reorderableColumns ? (
                  <button
                    type="button"
                    aria-label={moveLabel(columnName(column))}
                    title={moveLabel(columnName(column))}
                    onKeyDown={onMoveKey(column.id)}
                    className={cn("-ms-1 me-0.5 inline-flex cursor-grab rounded-xs align-middle text-foreground-muted hover:text-foreground", focusRing)}
                  >
                    <GripVertical aria-hidden className="size-3.5" />
                  </button>
                ) : null}
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
                {resizableColumns ? (
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a focusable separator is a widget (WAI-ARIA window splitter pattern)
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={(labels?.resize ?? ((name: string) => `Resize ${name}`))(columnName(column))}
                    aria-valuenow={widths[column.id]}
                    aria-valuemin={MIN_COLUMN_WIDTH}
                    tabIndex={0}
                    onPointerDown={onResizePointerDown(column.id)}
                    onKeyDown={onResizeKey(column.id)}
                    className={cn(
                      "absolute inset-y-1 -end-1 z-10 w-2 cursor-col-resize touch-none rounded-full after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-border hover:after:bg-foreground-muted",
                      focusRing,
                    )}
                  />
                ) : null}
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
          groups
            ? groups.map(([key, group]) => {
                const collapsed = collapsedGroups.includes(key);
                const name = String(group.value ?? "");
                return (
                  <Fragment key={`group-${key}`}>
                    <TableRow className="bg-surface-sunken/60 hover:bg-surface-sunken/60">
                      <TableCell colSpan={colSpan} className="py-1.5">
                        <button
                          type="button"
                          aria-expanded={!collapsed}
                          aria-label={(labels?.group ?? ((value: string, count: number) => `${value}, ${count === 1 ? "1 row" : `${count} rows`}`))(name, group.rows.length)}
                          onClick={() => setCollapsedGroups((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]))}
                          className={cn("-mx-1 inline-flex items-center gap-1.5 rounded-xs px-1 text-sm font-medium text-foreground", focusRing)}
                        >
                          <ChevronRight aria-hidden className={cn("size-4 transition-transform duration-(--nv-duration-normal) rtl:-scale-x-100", !collapsed && "rotate-90 rtl:-rotate-90")} />
                          {renderGroup ? renderGroup(group.value, group.rows) : name}
                          <span className="rounded-full bg-surface-hover px-1.5 text-xs tabular-nums text-foreground-muted">{number.format(group.rows.length)}</span>
                        </button>
                      </TableCell>
                    </TableRow>
                    {collapsed ? null : group.rows.map(renderRow)}
                  </Fragment>
                );
              })
            : rows.map(renderRow)
        )}
      </TableBody>
    </Table>
  );

  if (!showToolbar && !pageSize && !reorderableColumns) return table;

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
      {reorderableColumns ? (
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      ) : null}
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
