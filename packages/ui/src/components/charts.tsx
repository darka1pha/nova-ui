"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useLocale, useOptionalTheme } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { chartColors } from "./chart.tsx";
import { focusRing } from "./shared.ts";

/*
 * Dependency-free SVG charts.
 *
 * Built to fixed mark specs so every chart reads as one system: 2px lines with
 * round joins, ≥8px markers ringed in the surface color, ~10% area washes, bars
 * ≤24px with a 4px rounded data end and a square baseline, a 2px surface gap
 * between touching marks, hairline solid gridlines, text in text tokens (never
 * the series color). Series take the validated categorical palette in fixed
 * order; a single series uses the brand primary. Every chart has a hover and
 * keyboard tooltip, a legend for two or more series, and a data table — the
 * table is always available to screen readers and one click away for everyone.
 */

/* ------------------------------------------------------------------ Types */

export interface ChartSeries<T> {
  /** Field of each row that holds this series' number. */
  key: keyof T & string;
  label: string;
  /** Override the color. Prefer the default so color follows series order. */
  color?: string;
}

interface BaseChartProps<T> extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Accessible name for the chart and its table, e.g. "Monthly TEU by terminal". */
  label: string;
  data: T[];
  /** Field of each row used for the category / x axis. */
  index: keyof T & string;
  series: ChartSeries<T>[];
  /** Plot height in px (axes included). */
  height?: number;
  /** Formats values in ticks, tooltips and the table. Defaults to locale-aware numbers. */
  formatValue?: (value: number) => string;
  /** Formats index values (dates, labels) on the axis, tooltip and table. */
  formatIndex?: (value: T[keyof T & string]) => string;
  /** Show the "Table" toggle. The table itself is always available to assistive tech. */
  tableToggle?: boolean;
  /** Labels for built-in text (table headers, toggle, donut center). */
  labels?: { table?: string; chart?: string; total?: string; category?: string; value?: string; share?: string };
}

/* -------------------------------------------------------------- Utilities */

/** Rounded tick values covering [min, max]. */
function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) max = min + 1;
  const span = max - min;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

function useWidth<E extends HTMLElement>() {
  const ref = useRef<E>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function useFormatters<T>(formatValue?: (v: number) => string, formatIndex?: (v: T[keyof T & string]) => string) {
  const { locale } = useLocale();
  return useMemo(() => {
    const full = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
    return {
      value: formatValue ?? ((v: number) => full.format(v)),
      tick: formatValue ?? ((v: number) => (Math.abs(v) >= 1000 ? compact.format(v) : full.format(v))),
      index: formatIndex ?? ((v: T[keyof T & string]) => (v instanceof Date ? v.toLocaleDateString(locale) : String(v))),
    };
  }, [locale, formatValue, formatIndex]);
}

const seriesColor = (series: { color?: string }[], i: number) =>
  series[i]?.color ?? (series.length === 1 ? "var(--ks-color-primary-solid)" : (chartColors[i % chartColors.length] as string));

/** A vertical bar path: 4px rounded data end, square at the baseline. */
function barPath(x: number, w: number, yBase: number, yEnd: number, rounded = true) {
  const up = yEnd <= yBase;
  const h = Math.abs(yBase - yEnd);
  const r = rounded ? Math.min(4, w / 2, h) : 0;
  if (h === 0) return "";
  if (up) return `M${x},${yBase}V${yEnd + r}Q${x},${yEnd} ${x + r},${yEnd}H${x + w - r}Q${x + w},${yEnd} ${x + w},${yEnd + r}V${yBase}Z`;
  return `M${x},${yBase}V${yEnd - r}Q${x},${yEnd} ${x + r},${yEnd}H${x + w - r}Q${x + w},${yEnd} ${x + w},${yEnd - r}V${yBase}Z`;
}

/* -------------------------------------------------------------- Chrome */

function Legend({ items, kind }: { items: { label: string; color: string }[]; kind: "line" | "rect" | "dot" }) {
  return (
    <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-xs text-foreground-secondary">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("inline-block shrink-0", kind === "line" ? "h-0.5 w-3 rounded-full" : kind === "rect" ? "size-2.5 rounded-[3px]" : "size-2.5 rounded-full")}
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

interface FrameProps {
  label: string;
  legend: ReactNode;
  table: ReactNode;
  tableToggle: boolean;
  labels?: BaseChartProps<unknown>["labels"];
  className?: string;
  children: ReactNode;
  rest: HTMLAttributes<HTMLElement>;
}

/** Legend row, chart/table switch, and the always-present accessible table. */
const ChartFrame = forwardRef<HTMLElement, FrameProps>(function ChartFrame({ label, legend, table, tableToggle, labels, className, children, rest }, ref) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure ref={ref} aria-label={label} className={cn("m-0 flex w-full min-w-0 flex-col gap-3", className)} {...rest}>
      {legend || tableToggle ? (
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">{showTable ? null : legend}</div>
          {tableToggle ? (
            <button
              type="button"
              aria-pressed={showTable}
              onClick={() => setShowTable((v) => !v)}
              className={cn("rounded-md px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-hover hover:text-foreground", focusRing)}
            >
              {showTable ? (labels?.chart ?? "Chart") : (labels?.table ?? "Table")}
            </button>
          ) : null}
        </div>
      ) : null}
      {showTable ? <div className="overflow-x-auto">{table}</div> : (
        <>
          {children}
          <div className="sr-only">{table}</div>
        </>
      )}
    </figure>
  );
});

function DataTableView({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={i} scope="col" className="border-b border-border px-2 py-1.5 text-start text-xs font-semibold text-foreground-muted">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-b border-border last:border-0">
            {row.map((cell, c) =>
              c === 0 ? (
                <th key={c} scope="row" className="px-2 py-1.5 text-start font-medium text-foreground">
                  {cell}
                </th>
              ) : (
                <td key={c} className="px-2 py-1.5 text-end tabular-nums text-foreground-secondary">
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Tooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: { label: string; value: string; color: string; kind: "line" | "rect" | "dot" }[] }) {
  // Opens away from the nearer edge, offset from the crosshair so it never covers the point.
  const side = x > width / 2 ? { right: width - x + 12 } : { left: x + 12 };
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1 z-10 min-w-36 max-w-[min(16rem,calc(100%-1rem))] rounded-(--ks-popover-radius) border border-border bg-surface-raised px-3 py-2 text-xs shadow-(--ks-popover-shadow)"
      style={side}
    >
      <p className="mb-1.5 font-medium text-foreground-muted">{title}</p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn("shrink-0", row.kind === "line" ? "h-0.5 w-3 rounded-full" : row.kind === "rect" ? "size-2 rounded-[2px]" : "size-2 rounded-full")}
              style={{ background: row.color }}
            />
            <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
            <span className="truncate text-foreground-secondary">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------- Cartesian (x/y) */

const AXIS = { top: 12, bottom: 28, side: 44, gutter: 12 };

interface CartesianProps<T> extends BaseChartProps<T> {
  kind: "line" | "area" | "bar";
  stacked?: boolean;
  curve?: "linear" | "monotone";
}

function CartesianChart<T>({
  kind,
  stacked = false,
  curve = "monotone",
  label,
  data,
  index,
  series,
  height = 260,
  formatValue,
  formatIndex,
  tableToggle = true,
  labels,
  className,
  ...rest
}: CartesianProps<T>) {
  const [box, width] = useWidth<HTMLDivElement>();
  const rtl = (useOptionalTheme()?.dir ?? "ltr") === "rtl";
  const fmt = useFormatters(formatValue, formatIndex);
  const [active, setActive] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const liveId = useId();

  const values = (row: T, key: string) => Number(row[key as keyof T]) || 0;
  const stackTotals = data.map((row) => series.reduce((sum, s) => sum + Math.max(0, values(row, s.key)), 0));
  const all = stacked ? stackTotals : data.flatMap((row) => series.map((s) => values(row, s.key)));
  const ticks = niceTicks(Math.min(0, ...all), Math.max(0, ...all));
  const yMin = ticks[0] as number;
  const yMax = ticks[ticks.length - 1] as number;

  const plotW = Math.max(0, width - AXIS.side - AXIS.gutter);
  const plotH = height - AXIS.top - AXIS.bottom;
  const y = (v: number) => AXIS.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
  // The y axis sits on the reading-start side; categories flow in reading direction.
  const plotStart = rtl ? AXIS.gutter : AXIS.side;
  const band = data.length ? plotW / data.length : 0;
  const slot = (i: number) => (rtl ? data.length - 1 - i : i);
  const xCenter = (i: number) => (kind === "bar" ? plotStart + band * slot(i) + band / 2 : plotStart + (data.length <= 1 ? plotW / 2 : (plotW / (data.length - 1)) * slot(i)));

  const nearest = useCallback(
    (px: number) => {
      let best = 0;
      let dist = Infinity;
      data.forEach((_, i) => {
        const d = Math.abs(xCenter(i) - px);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      return best;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.length, width, rtl, kind],
  );

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setKeyboard(false);
    setActive(nearest(e.clientX - rect.left));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (step === undefined && e.key !== "Home" && e.key !== "End" && e.key !== "Escape") return;
    e.preventDefault();
    setKeyboard(true);
    if (e.key === "Escape") return setActive(null);
    if (e.key === "Home") return setActive(0);
    if (e.key === "End") return setActive(data.length - 1);
    const delta = step ?? 0;
    setActive((a) => Math.min(data.length - 1, Math.max(0, (a ?? (delta > 0 ? -1 : data.length)) + delta)));
  };

  // Marks
  const marks: ReactNode[] = [];
  if (kind === "bar") {
    const groupW = Math.min(band * 0.72, stacked ? 24 : 24 * series.length + 2 * (series.length - 1));
    const barW = stacked ? groupW : Math.max(2, Math.min(24, (groupW - 2 * (series.length - 1)) / series.length));
    data.forEach((row, i) => {
      const left = xCenter(i) - (stacked ? barW : barW * series.length + 2 * (series.length - 1)) / 2;
      let acc = 0;
      series.forEach((s, si) => {
        const v = values(row, s.key);
        const dim = active !== null && active !== i ? 0.45 : 1;
        if (stacked) {
          const base = acc;
          acc += Math.max(0, v);
          const isTop = series.slice(si + 1).every((n) => values(row, n.key) <= 0);
          // 2px surface gap between stacked segments.
          const yBase = y(base) - (base > 0 ? 1 : 0);
          const yEnd = y(acc) + (isTop ? 0 : 1);
          marks.push(<path key={`${i}-${si}`} d={barPath(left, barW, yBase, Math.min(yEnd, yBase), isTop)} fill={seriesColor(series, si)} opacity={dim} className="transition-opacity duration-(--ks-duration-fast)" />);
        } else {
          const order = rtl ? series.length - 1 - si : si;
          const x = left + order * (barW + 2);
          marks.push(<path key={`${i}-${si}`} d={barPath(x, barW, y(0), y(v))} fill={seriesColor(series, si)} opacity={dim} className="transition-opacity duration-(--ks-duration-fast)" />);
        }
      });
    });
  } else {
    // Each series' top edge, and the edge it sits on (the series below when stacked, else 0).
    const bases: number[][] = [];
    const tops: number[][] = [];
    let below = data.map(() => 0);
    for (const s of series) {
      const base = stacked ? below : data.map(() => 0);
      const top = data.map((row, i) => (base[i] ?? 0) + values(row, s.key));
      bases.push(base);
      tops.push(top);
      below = top;
    }
    type Pt = { x: number; y: number };
    const toPoints = (vals: number[] | undefined): Pt[] => (vals ?? []).map((v, i) => ({ x: xCenter(i), y: y(v) }));

    function path(points: Pt[], move = "M") {
      const [first] = points;
      if (!first) return "";
      if (curve === "linear" || points.length < 3) return points.map((p, i) => `${i ? "L" : move}${p.x},${p.y}`).join("");
      // Monotone cubic (Fritsch–Carlson): smooth without overshooting the data.
      const slopes = points.slice(1).map((p, i) => {
        const prev = points[i] ?? p;
        return (p.y - prev.y) / (p.x - prev.x || 1);
      });
      const tangent = (i: number) => {
        const before = slopes[i - 1];
        const after = slopes[i];
        if (before === undefined) return after ?? 0;
        if (after === undefined) return before;
        return before * after <= 0 ? 0 : (before + after) / 2;
      };
      let d = `${move}${first.x},${first.y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        if (!a || !b) continue;
        const h = (b.x - a.x) / 3;
        d += `C${a.x + h},${a.y + tangent(i) * h} ${b.x - h},${b.y - tangent(i + 1) * h} ${b.x},${b.y}`;
      }
      return d;
    }

    // Areas first so every line sits above every wash.
    if (kind === "area") {
      series.forEach((_, si) => {
        const top = toPoints(tops[si]);
        const floor = stacked ? toPoints(bases[si]) : data.map((__, i) => ({ x: xCenter(i), y: y(Math.max(0, yMin)) }));
        const back = [...floor].reverse();
        const bottom = stacked ? path(back, "L") : back.map((p) => `L${p.x},${p.y}`).join("");
        marks.push(<path key={`a-${si}`} d={`${path(top)}${bottom}Z`} fill={seriesColor(series, si)} opacity={stacked ? 0.22 : 0.1} />);
      });
    }
    series.forEach((_, si) => {
      const pts = toPoints(tops[si]);
      const color = seriesColor(series, si);
      marks.push(<path key={`l-${si}`} d={path(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />);
      // End marker on the last point (or the hovered one); a surface-colored ring keeps it legible over lines.
      const marker = active === null ? pts[pts.length - 1] : pts[active];
      if (marker) {
        marks.push(<circle key={`m-${si}`} cx={marker.x} cy={marker.y} r={active === null ? 4 : 4.5} fill={color} stroke="var(--ks-color-surface)" strokeWidth={2} />);
      }
    });
  }

  // Thin out category labels so they never collide.
  const labelEvery = Math.max(1, Math.ceil((data.length * 56) / Math.max(1, plotW)));
  const legendKind = kind === "line" ? "line" : "rect";
  const activeRow = active !== null ? data[active] : undefined;

  const table = (
    <DataTableView
      caption={label}
      head={[labels?.category ?? index, ...series.map((s) => s.label)]}
      rows={data.map((row) => [fmt.index(row[index]), ...series.map((s) => fmt.value(values(row, s.key)))])}
    />
  );

  return (
    <ChartFrame
      label={label}
      legend={series.length > 1 ? <Legend kind={legendKind} items={series.map((s, i) => ({ label: s.label, color: seriesColor(series, i) }))} /> : null}
      table={table}
      tableToggle={tableToggle}
      labels={labels}
      className={className}
      rest={rest}
    >
      <div
        ref={box}
        role="group"
        aria-roledescription="chart"
        aria-label={label}
        aria-describedby={liveId}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => keyboard && setActive(null)}
        className={cn("relative w-full touch-pan-y rounded-md", focusRing)}
        style={{ height }}
      >
        {width > 0 ? (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={plotStart} x2={plotStart + plotW} y1={y(t)} y2={y(t)} stroke="var(--ks-color-border)" strokeWidth={1} shapeRendering="crispEdges" />
                <text
                  x={rtl ? plotStart + plotW + 8 : plotStart - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor={rtl ? "start" : "end"}
                  className="fill-foreground-muted text-[11px] tabular-nums"
                >
                  {fmt.tick(t)}
                </text>
              </g>
            ))}
            {active !== null && kind !== "bar" ? (
              <line x1={xCenter(active)} x2={xCenter(active)} y1={AXIS.top} y2={AXIS.top + plotH} stroke="var(--ks-color-border-strong)" strokeWidth={1} shapeRendering="crispEdges" />
            ) : null}
            {active !== null && kind === "bar" ? (
              <rect x={xCenter(active) - band / 2} y={AXIS.top} width={band} height={plotH} fill="var(--ks-color-surface-hover)" opacity={0.6} />
            ) : null}
            <g>{marks}</g>
            {data.map((row, i) =>
              i % labelEvery === 0 ? (
                <text key={i} x={xCenter(i)} y={height - 8} textAnchor="middle" className="fill-foreground-muted text-[11px]">
                  {fmt.index(row[index])}
                </text>
              ) : null,
            )}
          </svg>
        ) : null}
        {activeRow && active !== null ? (
          <Tooltip
            x={xCenter(active)}
            width={width}
            title={fmt.index(activeRow[index])}
            rows={series.map((s, si) => ({ label: s.label, value: fmt.value(values(activeRow, s.key)), color: seriesColor(series, si), kind: legendKind }))}
          />
        ) : null}
        <p id={liveId} aria-live="polite" className="sr-only">
          {keyboard && activeRow
            ? `${fmt.index(activeRow[index])}: ${series.map((s) => `${s.label} ${fmt.value(values(activeRow, s.key))}`).join(", ")}`
            : "Use arrow keys to read values."}
        </p>
      </div>
    </ChartFrame>
  );
}

/* ----------------------------------------------------------------- Public */

export interface LineChartProps<T> extends BaseChartProps<T> {
  /** "monotone" smooths without overshooting the data; "linear" joins points directly. */
  curve?: "linear" | "monotone";
}

/** Change over time for one or more series. Crosshair tooltip; arrow keys step through points. */
export function LineChart<T>(props: LineChartProps<T>) {
  return <CartesianChart kind="line" {...props} />;
}

export interface AreaChartProps<T> extends LineChartProps<T> {
  /** Stack series to show how parts add up to a total. */
  stacked?: boolean;
}

/** A line chart with a soft wash under each line; stack it to show part-to-whole over time. */
export function AreaChart<T>(props: AreaChartProps<T>) {
  return <CartesianChart kind="area" {...props} />;
}

export interface BarChartProps<T> extends BaseChartProps<T> {
  /** Stack series in one column per category instead of grouping them side by side. */
  stacked?: boolean;
}

/** Compare magnitudes across categories. Grouped or stacked columns from a zero baseline. */
export function BarChart<T>(props: BarChartProps<T>) {
  return <CartesianChart kind="bar" {...props} />;
}

/* ------------------------------------------------------------------ Donut */

export interface DonutChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  label: string;
  data: DonutChartDatum[];
  /** Diameter in px. */
  size?: number;
  formatValue?: (value: number) => string;
  /** Text under the total in the center (defaults to "Total"). */
  centerLabel?: string;
  tableToggle?: boolean;
  labels?: BaseChartProps<unknown>["labels"];
}

/**
 * Part-to-whole for a handful of categories (fold the long tail into "Other").
 * Slices are separated by a surface gap; the total sits in the center.
 */
export const DonutChart = forwardRef<HTMLElement, DonutChartProps>(function DonutChart(
  { label, data, size = 200, formatValue, centerLabel, tableToggle = true, labels, className, ...rest },
  ref,
) {
  const fmt = useFormatters<Record<string, never>>(formatValue);
  const [active, setActive] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const liveId = useId();
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const { locale } = useLocale();
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const color = (i: number) => data[i]?.color ?? (chartColors[i % chartColors.length] as string);

  const r = size / 2;
  const thickness = Math.max(14, size * 0.14);
  const rMid = r - thickness / 2 - 4;
  const circumference = 2 * Math.PI * rMid;
  // 2px surface gap between slices, measured along the ring.
  const gap = data.length > 1 ? 2 : 0;
  let offset = 0;
  const slices = data.map((d, i) => {
    const len = total ? (Math.max(0, d.value) / total) * circumference : 0;
    const slice = { i, start: offset, len: Math.max(0, len - gap) };
    offset += len;
    return slice;
  });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step === undefined && e.key !== "Escape") return;
    e.preventDefault();
    setKeyboard(true);
    if (e.key === "Escape") return setActive(null);
    const delta = step ?? 0;
    setActive((a) => ((a ?? (delta > 0 ? -1 : 0)) + delta + data.length) % data.length);
  };

  const focused = active !== null ? data[active] : undefined;
  const table = (
    <DataTableView caption={label} head={[labels?.category ?? "Category", labels?.value ?? "Value", labels?.share ?? "Share"]} rows={data.map((d) => [d.label, fmt.value(d.value), total ? pct.format(d.value / total) : "–"])} />
  );

  return (
    <ChartFrame
      ref={ref}
      label={label}
      legend={null}
      table={table}
      tableToggle={tableToggle}
      labels={labels}
      className={className}
      rest={rest}
    >
      <div className="flex flex-wrap items-center gap-6">
        <div
          role="group"
          aria-roledescription="chart"
          aria-label={label}
          aria-describedby={liveId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => keyboard && setActive(null)}
          onPointerLeave={() => setActive(null)}
          className={cn("relative shrink-0 rounded-full", focusRing)}
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
            <circle cx={r} cy={r} r={rMid} fill="none" stroke="var(--ks-color-surface-sunken)" strokeWidth={thickness} />
            {slices.map((s) => (
              <circle
                key={s.i}
                cx={r}
                cy={r}
                r={rMid}
                fill="none"
                stroke={color(s.i)}
                strokeWidth={active === s.i ? thickness + 4 : thickness}
                strokeDasharray={`${s.len} ${circumference - s.len}`}
                strokeDashoffset={-s.start}
                opacity={active !== null && active !== s.i ? 0.45 : 1}
                onPointerEnter={() => {
                  setKeyboard(false);
                  setActive(s.i);
                }}
                className="cursor-default transition-[opacity,stroke-width] duration-(--ks-duration-fast)"
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl font-semibold text-foreground">{fmt.value(focused ? focused.value : total)}</span>
            <span className="max-w-[60%] truncate text-xs text-foreground-muted">{focused ? focused.label : (centerLabel ?? labels?.total ?? "Total")}</span>
          </div>
          <p id={liveId} aria-live="polite" className="sr-only">
            {keyboard && focused ? `${focused.label}: ${fmt.value(focused.value)} (${pct.format(total ? focused.value / total : 0)})` : "Use arrow keys to read values."}
          </p>
        </div>
        <ul className="m-0 flex min-w-40 flex-1 list-none flex-col gap-2 p-0 text-sm">
          {data.map((d, i) => (
            <li
              key={d.label}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              className={cn("flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors", active === i && "bg-surface-hover")}
            >
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color(i) }} />
              <span className="min-w-0 flex-1 truncate text-foreground-secondary">{d.label}</span>
              <span className="font-semibold tabular-nums text-foreground">{fmt.value(d.value)}</span>
              <span className="w-12 text-end text-xs tabular-nums text-foreground-muted">{total ? pct.format(d.value / total) : "–"}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
});
