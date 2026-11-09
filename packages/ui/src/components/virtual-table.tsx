"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { Checkbox } from "./controls.tsx";
import { focusRing } from "./shared.ts";
import type { SortState } from "./table.tsx";

/* ------------------------------------------------------------ range math */

/** The slice of a fixed-size list that's in view, plus `overscan` items each side. */
export function virtualRange(scroll: number, viewport: number, itemSize: number, count: number, overscan: number): [first: number, last: number] {
  if (count === 0) return [0, -1];
  const start = Math.floor(Math.max(0, scroll) / itemSize);
  // Before the viewport is measured, render one screen's worth so there's something to see.
  const visible = Math.ceil((viewport || itemSize * 20) / itemSize);
  return [Math.max(0, start - overscan), Math.min(count - 1, start + visible + overscan)];
}

/** Like virtualRange, for items of different sizes given their start offsets (plus the total at the end). */
function variableRange(scroll: number, viewport: number, offsets: number[], overscan: number): [first: number, last: number] {
  const count = offsets.length - 1;
  if (count <= 0) return [0, -1];
  const end = scroll + (viewport || 1600);
  // Binary search for the first item whose end is past the scroll position.
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((offsets[mid + 1] as number) <= scroll) lo = mid + 1;
    else hi = mid;
  }
  let last = lo;
  while (last < count - 1 && (offsets[last + 1] as number) < end) last++;
  return [Math.max(0, lo - overscan), Math.min(count - 1, last + overscan)];
}

/* ----------------------------------------------------------- VirtualTable */

export interface VirtualTableColumn<T> {
  id: string;
  header: ReactNode;
  /** Cell content. Defaults to `row[id]`. */
  cell?: (row: T, index: number) => ReactNode;
  /** Width in px. Every column has a fixed width so off-screen ones can be skipped. Default 160. */
  width?: number;
  align?: "start" | "center" | "end";
  sortable?: boolean;
  /** The value sorted on. Defaults to `row[id]`. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Keep this column at the inline start while scrolling sideways. Only leading columns can be pinned. */
  pinned?: boolean;
}

export interface VirtualTableApi {
  /** Scroll so the row is visible. `auto` scrolls only if it isn't already. */
  scrollToRow: (index: number, align?: "start" | "center" | "end" | "auto") => void;
}

export interface VirtualTableProps<T> {
  /** All rows; only those in view are rendered. */
  data: readonly T[];
  columns: VirtualTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Fixed row height in px. Default 44 (36 when `density="compact"`). */
  rowHeight?: number;
  /** Viewport height: px or any CSS length. Default 480. */
  height?: number | string;
  density?: "compact" | "comfortable";
  /** Rows and columns rendered beyond each edge. Default 6 rows, 2 columns. */
  overscan?: { rows?: number; columns?: number };
  /** Render only the columns in view. Turn on for wide tables (dozens of columns). Default false. */
  virtualizeColumns?: boolean;
  /** Required: names the table for screen readers. */
  "aria-label": string;
  /** A checkbox column. Shift-click selects a range. */
  selectable?: boolean;
  selectedIds?: readonly string[];
  defaultSelectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Controlled sort. Without it, sortable columns sort client-side. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** Load more: called once per data length when the last rows come into view. */
  onEndReached?: () => void;
  /** Shown instead of rows when `data` is empty. */
  empty?: ReactNode;
  labels?: { selectAll?: string; selectRow?: (row: T) => string };
  locale?: string;
  apiRef?: Ref<VirtualTableApi>;
  className?: string;
}

const alignClass = { start: "text-start", center: "text-center", end: "text-end" } as const;
const SELECT_WIDTH = 44;
const DEFAULT_WIDTH = 160;
const valueOf = <T,>(row: T, id: string) => (row as Record<string, unknown>)[id];

/**
 * A table for very large data: only the rows (and, with `virtualizeColumns`,
 * the columns) in view are in the DOM, so 100,000 rows × 50 columns scroll
 * smoothly. It stays a real `<table>`: `aria-rowcount`/`aria-rowindex` and
 * `aria-colcount`/`aria-colindex` tell screen readers where they are, the
 * header sticks, and selection works across every row, not just the visible ones.
 * Use DataTable for paged lists with search and expandable rows.
 */
export function VirtualTable<T>({
  data,
  columns,
  getRowId,
  density = "comfortable",
  rowHeight = density === "compact" ? 36 : 44,
  height = 480,
  overscan,
  virtualizeColumns = false,
  "aria-label": ariaLabel,
  selectable,
  selectedIds: selectedProp,
  defaultSelectedIds = [],
  onSelectionChange,
  sort: sortProp,
  onSortChange,
  onEndReached,
  empty,
  labels,
  locale: localeProp,
  apiRef,
  className,
}: VirtualTableProps<T>) {
  const { locale } = useLocale(localeProp);
  const viewport = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const [size, setSize] = useState({ width: 0, height: typeof height === "number" ? height : 0 });
  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const sort = sortProp !== undefined ? sortProp : internalSort;
  const [internalSelected, setInternalSelected] = useState<readonly string[]>(defaultSelectedIds);
  const selected = selectedProp ?? internalSelected;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const anchor = useRef<number | null>(null);
  const shiftHeld = useRef(false);
  const endReachedAt = useRef(-1);

  useEffect(() => {
    const el = viewport.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);

  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }), [locale]);
  const rows = useMemo(() => {
    if (!sort || sortProp !== undefined) return data;
    const column = columns.find((c) => c.id === sort.id);
    if (!column) return data;
    const value = (row: T) => (column.sortValue ? column.sortValue(row) : (valueOf(row, column.id) as string | number | Date | null | undefined));
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

  // Column geometry: pinned leading columns, then the scrollable rest.
  const pinnedCount = columns.findIndex((c) => !c.pinned) === -1 ? columns.length : columns.findIndex((c) => !c.pinned);
  const offsets = useMemo(() => {
    const out = [0];
    for (const c of columns) out.push((out.at(-1) as number) + (c.width ?? DEFAULT_WIDTH));
    return out;
  }, [columns]);
  const lead = selectable ? SELECT_WIDTH : 0;
  const totalWidth = lead + (offsets.at(-1) as number);

  const total = rows.length;
  const viewportHeight = size.height || (typeof height === "number" ? height : 0);
  const headerHeight = rowHeight;
  const [firstRow, lastRow] = virtualRange(scroll.top, Math.max(0, viewportHeight - headerHeight), rowHeight, total, overscan?.rows ?? 6);
  const pinnedWidth = offsets[pinnedCount] as number;
  const [firstCol, lastCol] =
    virtualizeColumns && columns.length > pinnedCount
      ? (() => {
          const rest = offsets.slice(pinnedCount).map((o) => o - pinnedWidth);
          const [a, b] = variableRange(scroll.left, Math.max(0, size.width - lead - pinnedWidth), rest, overscan?.columns ?? 2);
          return [a + pinnedCount, b + pinnedCount];
        })()
      : [pinnedCount, columns.length - 1];
  const visibleColumns = [...columns.slice(0, pinnedCount).map((c, i) => [c, i] as const), ...columns.slice(firstCol, lastCol + 1).map((c, i) => [c, firstCol + i] as const)];
  const before = (offsets[firstCol] as number) - pinnedWidth;
  const after = (offsets.at(-1) as number) - (offsets[lastCol + 1] as number);

  useEffect(() => {
    if (!onEndReached || total === 0) return;
    if (lastRow >= total - 3 && endReachedAt.current !== total) {
      endReachedAt.current = total;
      onEndReached();
    }
  }, [lastRow, total, onEndReached]);

  useImperativeHandle(
    apiRef,
    () => ({
      scrollToRow(index, align = "auto") {
        const el = viewport.current;
        if (!el) return;
        const top = Math.max(0, Math.min(total - 1, index)) * rowHeight;
        const view = el.clientHeight - headerHeight;
        const target =
          align === "start"
            ? top
            : align === "end"
              ? top - view + rowHeight
              : align === "center"
                ? top - view / 2 + rowHeight / 2
                : top < el.scrollTop
                  ? top
                  : top + rowHeight > el.scrollTop + view
                    ? top - view + rowHeight
                    : el.scrollTop;
        el.scrollTop = Math.max(0, target);
        setScroll((s) => ({ ...s, top: el.scrollTop }));
      },
    }),
    [total, rowHeight, headerHeight],
  );

  const setSelected = (ids: string[]) => {
    if (selectedProp === undefined) setInternalSelected(ids);
    onSelectionChange?.(ids);
  };
  const toggleRow = (index: number, on: boolean) => {
    const from = shiftHeld.current && anchor.current !== null ? Math.min(anchor.current, index) : index;
    const to = shiftHeld.current && anchor.current !== null ? Math.max(anchor.current, index) : index;
    const ids = rows.slice(from, to + 1).map(getRowId);
    const next = new Set(selectedSet);
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    anchor.current = index;
    setSelected([...next]);
  };
  const selectedCount = selectable ? rows.reduce((n, row) => n + (selectedSet.has(getRowId(row)) ? 1 : 0), 0) : 0;
  const allSelected = total > 0 && selectedCount === total;

  const toggleSort = (id: string) => {
    const next: SortState | null = sort?.id !== id ? { id, direction: "asc" } : sort.direction === "asc" ? { id, direction: "desc" } : null;
    if (sortProp === undefined) setInternalSort(next);
    onSortChange?.(next);
  };

  const colCount = columns.length + (selectable ? 1 : 0);
  const colIndex = (i: number) => i + 1 + (selectable ? 1 : 0);
  // Sticky cells: the checkbox column, then pinned columns, at the inline start.
  const stickyStyle = (i: number): CSSProperties | undefined => (i < pinnedCount ? { position: "sticky", insetInlineStart: lead + (offsets[i] as number) } : undefined);
  const cellBase = "overflow-hidden text-ellipsis whitespace-nowrap px-4";
  const stickyBg = "z-[1] bg-surface";
  const spacer = (width: number, header: boolean) =>
    width > 0 ? (header ? <th aria-hidden style={{ width, padding: 0 }} /> : <td aria-hidden style={{ width, padding: 0 }} />) : null;

  const body: ReactNode[] = [];
  for (let index = firstRow; index <= lastRow; index++) {
    const row = rows[index] as T;
    const id = getRowId(row);
    const isSelected = selectedSet.has(id);
    body.push(
      <tr
        key={id}
        aria-rowindex={index + 2}
        data-state={isSelected ? "selected" : undefined}
        style={{ height: rowHeight }}
        className="group/row border-b border-border hover:bg-surface-hover data-[state=selected]:bg-primary-subtle/60"
      >
        {selectable ? (
          <td aria-colindex={1} style={{ position: "sticky", insetInlineStart: 0, width: SELECT_WIDTH }} className={cn("px-3", stickyBg, "group-hover/row:bg-surface-hover group-data-[state=selected]/row:bg-primary-subtle")}>
            <Checkbox
              size="sm"
              aria-label={labels?.selectRow?.(row) ?? `Select row ${id}`}
              checked={isSelected}
              onClick={(e) => {
                shiftHeld.current = e.shiftKey;
              }}
              onCheckedChange={(v) => toggleRow(index, v === true)}
            />
          </td>
        ) : null}
        {visibleColumns.map(([column, i], n) => (
          <FragmentCell key={column.id} spacerBefore={n === pinnedCount ? spacer(before, false) : null}>
            <td
              aria-colindex={colIndex(i)}
              style={stickyStyle(i)}
              className={cn(cellBase, alignClass[column.align ?? "start"], i < pinnedCount && cn(stickyBg, "group-hover/row:bg-surface-hover group-data-[state=selected]/row:bg-primary-subtle"))}
            >
              {column.cell ? column.cell(row, index) : String(valueOf(row, column.id) ?? "")}
            </td>
          </FragmentCell>
        ))}
        {visibleColumns.length === pinnedCount ? spacer(before, false) : null}
        {spacer(after, false)}
      </tr>,
    );
  }

  return (
    <div
      ref={viewport}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable so keyboard users can scroll it
      tabIndex={0}
      onScroll={(e) => {
        const el = e.currentTarget;
        // scrollLeft is negative in RTL; the math works in distances from the start.
        setScroll({ top: el.scrollTop, left: Math.abs(el.scrollLeft) });
      }}
      style={{ height }}
      className={cn("relative overflow-auto overscroll-contain rounded-lg border border-border bg-surface", focusRing, className)}
    >
      <table
        aria-label={ariaLabel}
        aria-rowcount={total + 1}
        aria-colcount={colCount}
        data-density={density}
        style={{ width: totalWidth, tableLayout: "fixed" }}
        className="border-separate border-spacing-0 text-sm"
      >
        <thead className="sticky top-0 z-[2] bg-surface">
          <tr aria-rowindex={1} style={{ height: headerHeight }}>
            {selectable ? (
              <th aria-colindex={1} scope="col" style={{ position: "sticky", insetInlineStart: 0, width: SELECT_WIDTH }} className={cn("border-b border-border px-3", stickyBg)}>
                <Checkbox
                  size="sm"
                  aria-label={labels?.selectAll ?? "Select all rows"}
                  checked={allSelected ? true : selectedCount > 0 ? "indeterminate" : false}
                  onCheckedChange={(v) => setSelected(v === true ? rows.map(getRowId) : [])}
                />
              </th>
            ) : null}
            {visibleColumns.map(([column, i], n) => {
              const active = sort?.id === column.id;
              return (
                <FragmentCell key={column.id} spacerBefore={n === pinnedCount ? spacer(before, true) : null}>
                  <th
                    scope="col"
                    aria-colindex={colIndex(i)}
                    aria-sort={column.sortable ? (active ? (sort.direction === "asc" ? "ascending" : "descending") : "none") : undefined}
                    style={{ width: columns[i]?.width ?? DEFAULT_WIDTH, ...stickyStyle(i) }}
                    className={cn(
                      cellBase,
                      "border-b border-border text-xs font-semibold uppercase tracking-wide text-foreground-muted",
                      alignClass[column.align ?? "start"],
                      i < pinnedCount && stickyBg,
                    )}
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
                  </th>
                </FragmentCell>
              );
            })}
            {visibleColumns.length === pinnedCount ? spacer(before, true) : null}
            {spacer(after, true)}
          </tr>
        </thead>
        <tbody>
          {total === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-10 text-center text-foreground-muted">
                {empty ?? "No rows"}
              </td>
            </tr>
          ) : (
            <>
              {firstRow > 0 ? <tr aria-hidden style={{ height: firstRow * rowHeight }} /> : null}
              {body}
              {lastRow < total - 1 ? <tr aria-hidden style={{ height: (total - 1 - lastRow) * rowHeight }} /> : null}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** A cell with an optional spacer before it (where skipped columns would be). */
function FragmentCell({ spacerBefore, children }: { spacerBefore: ReactNode; children: ReactNode }) {
  return (
    <>
      {spacerBefore}
      {children}
    </>
  );
}
