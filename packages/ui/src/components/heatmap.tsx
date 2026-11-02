"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useOptionalTheme } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";

export interface HeatmapDatum {
  date: Date | string;
  value: number;
}

export interface CalendarHeatmapProps {
  /** Values per day: `{ date, value }`. Missing days count as zero. */
  data: readonly HeatmapDatum[];
  /** Last day shown. Defaults to today. */
  end?: Date | string;
  /** First day shown. Defaults to 52 weeks before `end`. */
  start?: Date | string;
  /** 0 Sunday … 6 Saturday. */
  weekStartsOn?: 0 | 1 | 6;
  /** Number of color steps above zero. */
  levels?: 2 | 3 | 4;
  /** Value that gets the strongest color. Defaults to the largest value. */
  max?: number;
  tone?: "primary" | "success" | "accent";
  /** Text for each day, read by screen readers and shown on hover. */
  formatLabel?: (value: number, date: Date, formattedDate: string) => string;
  /** Legend words; `false` hides the legend. */
  legend?: { less: string; more: string } | false;
  locale?: string;
  /** Names the chart, e.g. "Contributions in the last year". */
  "aria-label": string;
  className?: string;
}

const toneSteps = {
  primary: ["bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"],
  success: ["bg-success/25", "bg-success/50", "bg-success/75", "bg-success"],
  accent: ["bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"],
} as const;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOfDay = (d: Date | string) => {
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};
const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

/**
 * A GitHub-style activity grid: one cell per day, a column per week. It is a
 * real grid for assistive tech: arrow keys move by day and week (mirrored in
 * RTL), Home/End jump along a weekday, and every cell has a full-date label.
 */
export function CalendarHeatmap({
  data,
  end: endProp,
  start: startProp,
  weekStartsOn,
  levels = 4,
  max: maxProp,
  tone = "primary",
  formatLabel = (value, _date, formatted) => `${value} on ${formatted}`,
  legend = { less: "Less", more: "More" },
  locale: localeProp,
  "aria-label": ariaLabel,
  className,
}: CalendarHeatmapProps) {
  const { locale } = useLocale(localeProp);
  const rtl = useOptionalTheme()?.dir === "rtl";
  const weekStart = weekStartsOn ?? (locale?.startsWith("fa") ? 6 : 0);

  const { weeks, max, months } = useMemo(() => {
    const end = startOfDay(endProp ?? new Date());
    const start = startProp ? startOfDay(startProp) : addDays(end, -7 * 52 + 1);
    const values = new Map<string, number>();
    for (const d of data) {
      const key = dayKey(startOfDay(d.date));
      values.set(key, (values.get(key) ?? 0) + d.value);
    }
    const first = addDays(start, -((start.getDay() - weekStart + 7) % 7));
    const weeks: ({ date: Date; value: number } | null)[][] = [];
    for (let day = first; day <= end; day = addDays(day, 7)) {
      weeks.push(
        Array.from({ length: 7 }, (_, i) => {
          const date = addDays(day, i);
          return date < start || date > end ? null : { date, value: values.get(dayKey(date)) ?? 0 };
        }),
      );
    }
    const max = maxProp ?? Math.max(1, ...values.values());
    // A month label sits above the first week that contains the 1st (or the first week shown).
    const monthName = new Intl.DateTimeFormat(locale, { month: "short" });
    const months = weeks.map((week, i) => {
      const firstOfMonth = week.find((c) => c && c.date.getDate() === 1);
      const cell = i === 0 ? week.find(Boolean) : firstOfMonth;
      return cell && (i === 0 ? cell.date.getDate() <= 21 : true) ? monthName.format(cell.date) : "";
    });
    return { weeks, max, months };
  }, [data, endProp, startProp, weekStart, maxProp, locale]);

  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }), [locale]);
  const weekdayFormat = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale]);
  const level = (value: number) => (value <= 0 ? 0 : Math.min(levels, Math.max(1, Math.ceil((value / max) * levels))));
  const steps = levels === 4 ? toneSteps[tone] : levels === 3 ? [toneSteps[tone][0], toneSteps[tone][2], toneSteps[tone][3]] : [toneSteps[tone][1], toneSteps[tone][3]];
  const cellColor = (lvl: number) => (lvl === 0 ? "bg-surface-active" : steps[lvl - 1]);

  // Roving focus: start on the most recent day.
  const lastWeek = weeks.length - 1;
  const lastRow = (weeks[lastWeek] ?? []).reduce((acc, c, i) => (c ? i : acc), 0);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [row, col] = focus ?? [lastRow, lastWeek];
  const grid = useRef<HTMLDivElement>(null);

  const moveTo = (r: number, c: number) => {
    // Skip padding cells outside the range.
    if (r < 0 || r > 6 || c < 0 || c > lastWeek || !weeks[c]?.[r]) return;
    setFocus([r, c]);
    grid.current?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const back = rtl ? 1 : -1;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col + back],
      ArrowRight: [row, col - back],
      Home: [row, weeks.findIndex((w) => w[row])],
      End: [row, weeks.reduce((acc, w, i) => (w[row] ? i : acc), 0)],
    };
    const target = moves[e.key];
    if (!target) return;
    e.preventDefault();
    moveTo(...target);
  };

  const weekdays = Array.from({ length: 7 }, (_, i) => addDays(new Date(2024, 0, 7 + weekStart), i));

  return (
    <div className={cn("flex max-w-full flex-col gap-2", className)}>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-[3px] text-[10px] leading-none text-foreground-muted">
          <div aria-hidden className="flex gap-[3px] ps-8">
            {months.map((m, i) => (
              <span key={i} className="w-2.5 overflow-visible whitespace-nowrap">
                {m}
              </span>
            ))}
          </div>
          <div ref={grid} role="grid" aria-label={ariaLabel} onKeyDown={onKeyDown} className="flex flex-col gap-[3px]">
            {weekdays.map((weekday, r) => (
              <div key={r} role="row" className="flex items-center gap-[3px]">
                <span role="rowheader" className="w-7.5 shrink-0 pe-1 text-end">
                  <span className="sr-only">{weekdayFormat.format(weekday)}</span>
                  {/* Show every other day to keep the column light, like most activity charts. */}
                  <span aria-hidden>{r % 2 === 1 ? weekdayFormat.format(weekday) : ""}</span>
                </span>
                {weeks.map((week, c) => {
                  const cell = week[r];
                  if (!cell) return <span key={c} role="gridcell" className="size-2.5 shrink-0" />;
                  const label = formatLabel(cell.value, cell.date, dateFormat.format(cell.date));
                  const active = r === row && c === col;
                  return (
                    <span
                      key={c}
                      role="gridcell"
                      data-cell={`${r}-${c}`}
                      data-level={level(cell.value)}
                      tabIndex={active ? 0 : -1}
                      aria-label={label}
                      title={label}
                      onFocus={() => !active && setFocus([r, c])}
                      className={cn(
                        "size-2.5 shrink-0 rounded-[2px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
                        cellColor(level(cell.value)),
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {legend ? (
        <div aria-hidden className="flex items-center justify-end gap-[3px] text-xs text-foreground-muted">
          <span className="me-1">{legend.less}</span>
          {Array.from({ length: levels + 1 }, (_, l) => (
            <span key={l} className={cn("size-2.5 rounded-[2px]", cellColor(l))} />
          ))}
          <span className="ms-1">{legend.more}</span>
        </div>
      ) : null}
    </div>
  );
}
