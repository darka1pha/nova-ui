"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState, useSyncExternalStore, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from "react";
import { useLocale, useOptionalTheme, type CalendarSystemName } from "../theme/theme-provider.tsx";
import { addDays, addMonths, calendars, sameDay, startOfDay, weekendFor, weekStartFor } from "../utils/calendar-math.ts";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { chartColors } from "./chart.tsx";
import { SegmentedControl, SegmentedControlItem } from "./segmented.tsx";
import { focusRing } from "./shared.ts";

export interface SchedulerEvent {
  id: string;
  title: string;
  start: Date;
  /** Exclusive end. For an all-day event, the day after its last day (or the same day). */
  end: Date;
  /** Shown in the all-day row (week and day views) and without a time. */
  allDay?: boolean;
  /** Any CSS color; defaults to a chart color by position in `events`. */
  color?: string;
}

export type SchedulerView = "month" | "week" | "day";

export interface SchedulerLabels {
  today?: string;
  previous?: string;
  next?: string;
  view?: string;
  month?: string;
  week?: string;
  day?: string;
  allDay?: string;
  /** The "+N more" button in a month cell. */
  more?: (n: number) => string;
  /** Added to a day's name for screen readers, e.g. (n) => `${n} events`. */
  events?: (n: number) => string;
}

export interface SchedulerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Accessible name, e.g. "Berth schedule". */
  label: string;
  events: SchedulerEvent[];
  view?: SchedulerView;
  defaultView?: SchedulerView;
  onViewChange?: (view: SchedulerView) => void;
  /** The day in focus; the view shows its month, week or day. */
  date?: Date;
  defaultDate?: Date;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: SchedulerEvent) => void;
  /** A day (month view, Enter on a day) or a half-hour slot (week and day views) was chosen. */
  onSlotClick?: (start: Date) => void;
  /** Defaults to the ThemeProvider's locale and calendar (Persian for fa). */
  locale?: string;
  calendar?: CalendarSystemName;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's. */
  weekStartsOn?: number;
  /** First and last hour of the time grid. Default 7 and 20. */
  dayStartHour?: number;
  dayEndHour?: number;
  /** Height of one hour in the time grid, px. Default 48. */
  hourHeight?: number;
  /** Most events listed in a month cell before "+N more". Default 3. */
  maxEventsPerDay?: number;
  labels?: SchedulerLabels;
}

const DAY_MS = 86_400_000;

// "Today" differs between a server render and the visit, so nothing that depends on the clock
// renders until hydration is done (as in Countdown).
const noopSubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/** Does the event touch the day [day, day + 1)? */
const onDay = (e: SchedulerEvent, day: Date) => {
  const start = startOfDay(day).getTime();
  const end = start + DAY_MS;
  const eEnd = Math.max(e.end.getTime(), e.start.getTime() + 1);
  return e.start.getTime() < end && eEnd > start;
};

/** Lays overlapping timed events side by side: each gets a column and the width of its cluster. */
function layoutDay(events: SchedulerEvent[]) {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());
  const out = new Map<string, { col: number; cols: number }>();
  let cluster: SchedulerEvent[] = [];
  let columnsEnd: number[] = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const cols = columnsEnd.length;
    for (const e of cluster) {
      const placed = out.get(e.id);
      if (placed) placed.cols = cols;
    }
    cluster = [];
    columnsEnd = [];
  };
  for (const e of sorted) {
    if (e.start.getTime() >= clusterEnd) flush();
    let col = columnsEnd.findIndex((end) => end <= e.start.getTime());
    if (col === -1) col = columnsEnd.length;
    columnsEnd[col] = e.end.getTime();
    out.set(e.id, { col, cols: 1 });
    cluster.push(e);
    clusterEnd = Math.max(clusterEnd, e.end.getTime());
  }
  flush();
  return out;
}

/**
 * A calendar of events with month, week and day views. Month view is a grid of days:
 * arrows move between days (mirrored in RTL), PageUp/PageDown change month, Enter
 * picks the day, and Tab reaches that day's events. Week and day views place timed
 * events on an hour grid, side by side when they overlap, with all-day events above.
 * Follows the locale's calendar (Persian in fa), week start and digits.
 */
export const Scheduler = forwardRef<HTMLDivElement, SchedulerProps>(function Scheduler(
  {
    label,
    events,
    view: viewProp,
    defaultView = "month",
    onViewChange,
    date: dateProp,
    defaultDate,
    onDateChange,
    onEventClick,
    onSlotClick,
    locale: localeProp,
    calendar: calendarProp,
    weekStartsOn,
    dayStartHour = 7,
    dayEndHour = 20,
    hourHeight = 48,
    maxEventsPerDay = 3,
    labels,
    className,
    ...props
  },
  ref,
) {
  const theme = useLocale(localeProp);
  const locale = theme.locale;
  const calendar = calendarProp ?? theme.calendar;
  const cal = calendars[calendar];
  const rtl = (useOptionalTheme()?.dir ?? "ltr") === "rtl";

  const [internalView, setInternalView] = useState<SchedulerView>(defaultView);
  const view = viewProp ?? internalView;
  const setView = (next: SchedulerView) => {
    if (viewProp === undefined) setInternalView(next);
    onViewChange?.(next);
  };
  const hydrated = useHydrated();
  const [internalDate, setInternalDate] = useState<Date | null>(() => (defaultDate ? startOfDay(defaultDate) : null));
  const today = hydrated ? startOfDay(new Date()) : null;
  // Without a date or defaultDate, the view opens on today once it is known.
  const known = dateProp ?? internalDate ?? today;
  // Placeholder only for the calculations below; nothing date-based renders until `known`.
  const date = startOfDay(known ?? new Date(2000, 0, 1));
  // Set when the keyboard moved the day, so focus follows it after the render.
  const [focusPending, setFocusPending] = useState(false);
  const setDate = (next: Date, focus = false) => {
    setFocusPending(focus);
    if (dateProp === undefined) setInternalDate(startOfDay(next));
    onDateChange?.(startOfDay(next));
  };

  const l = {
    today: labels?.today ?? "Today",
    previous: labels?.previous ?? "Previous",
    next: labels?.next ?? "Next",
    view: labels?.view ?? "View",
    month: labels?.month ?? "Month",
    week: labels?.week ?? "Week",
    day: labels?.day ?? "Day",
    allDay: labels?.allDay ?? "All day",
    more: labels?.more ?? ((n: number) => `+${n} more`),
    events: labels?.events ?? ((n: number) => (n === 1 ? "1 event" : `${n} events`)),
  };

  // Formatting, with Persian dates assembled in reading order as Calendar does.
  const fmt = useMemo(() => {
    const monthFmt = new Intl.DateTimeFormat(locale, { calendar, month: "long", year: "numeric" });
    const dayFmt = new Intl.DateTimeFormat(locale, { calendar, weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const shortDayFmt = new Intl.DateTimeFormat(locale, { calendar, day: "numeric", month: "short" });
    const persian = calendar === "persian" && /^fa\b/i.test(dayFmt.resolvedOptions().locale);
    const parts = (f: Intl.DateTimeFormat, d: Date) => Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
    return {
      month: (d: Date) => {
        if (!persian) return monthFmt.format(d);
        const p = parts(monthFmt, d);
        return `${p.month} ${p.year}`;
      },
      day: (d: Date) => {
        if (!persian) return dayFmt.format(d);
        const p = parts(dayFmt, d);
        return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
      },
      shortDay: (d: Date) => {
        if (!persian) return shortDayFmt.format(d);
        const p = parts(shortDayFmt, d);
        return `${p.day} ${p.month}`;
      },
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      time: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
      hour: new Intl.DateTimeFormat(locale, { hour: "numeric" }),
      number: new Intl.NumberFormat(locale, { useGrouping: false }),
    };
  }, [locale, calendar]);

  const firstDay = weekStartsOn ?? weekStartFor(locale);
  const weekend = calendar === "persian" ? weekendFor(locale) : [];
  const weekStart = (d: Date) => addDays(d, -((d.getDay() - firstDay + 7) % 7));
  const colorOf = (e: SchedulerEvent) => e.color ?? chartColors[Math.max(0, events.indexOf(e)) % chartColors.length] ?? "var(--nv-color-primary-solid)";
  const sorted = useMemo(() => [...events].sort((a, b) => Number(!a.allDay) - Number(!b.allDay) || a.start.getTime() - b.start.getTime()), [events]);
  const eventsOn = (day: Date) => sorted.filter((e) => onDay(e, day));
  const timeRange = (e: SchedulerEvent) => (e.allDay ? l.allDay : `${fmt.time.format(e.start)}–${fmt.time.format(e.end)}`);

  const { year, month } = cal.parts(date);
  const monthStart = cal.make(year, month, 1);
  const shift = (n: number) => setDate(view === "month" ? addMonths(cal, date, n) : addDays(date, n * (view === "week" ? 7 : 1)));
  const days = view === "month" ? [] : view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(weekStart(date), i)) : [date];
  const title = view === "month" ? fmt.month(monthStart) : view === "week" ? `${fmt.shortDay(days[0] ?? date)} – ${fmt.shortDay(days[6] ?? date)}` : fmt.day(date);

  // After keyboard moves in the month grid, focus follows the day.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focusPending) return;
    gridRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-shot flag consumed after the DOM update it waited for
    setFocusPending(false);
  }, [focusPending, known]);

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).getAttribute("role") !== "gridcell") return;
    const forward = rtl ? -1 : 1;
    const moves: Record<string, () => Date> = {
      ArrowRight: () => addDays(date, forward),
      ArrowLeft: () => addDays(date, -forward),
      ArrowDown: () => addDays(date, 7),
      ArrowUp: () => addDays(date, -7),
      Home: () => weekStart(date),
      End: () => addDays(weekStart(date), 6),
      PageDown: () => addMonths(cal, date, 1),
      PageUp: () => addMonths(cal, date, -1),
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      setDate(move(), true);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSlotClick?.(date);
    }
  };

  const chip = (event: SchedulerEvent, focusable: boolean) => (
    <button
      key={event.id}
      type="button"
      tabIndex={focusable ? 0 : -1}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick?.(event);
      }}
      className={cn("flex min-h-6 w-full min-w-0 items-center gap-1 rounded-sm px-1 text-start text-xs hover:bg-surface-hover", focusRing)}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: colorOf(event) }} />
      {!event.allDay ? (
        <span aria-hidden className="shrink-0 tabular-nums text-foreground-muted">
          {fmt.time.format(event.start)}
        </span>
      ) : null}
      <span className="truncate text-foreground">{event.title}</span>
      {/* The name reads "title, time range"; the start time above is the short visual form. */}
      <span className="sr-only">, {timeRange(event)}</span>
    </button>
  );

  const monthView = () => {
    const gridStart = weekStart(monthStart);
    const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (__, d) => addDays(gridStart, w * 7 + d)));
    return (
      // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the focused day cell is the grid's tab stop
      <div ref={gridRef} role="grid" aria-label={`${label}, ${fmt.month(monthStart)}`} onKeyDown={onGridKeyDown} className="flex flex-col">
        <div role="row" className="grid grid-cols-7 border-b border-border">
          {(weeks[0] ?? []).map((d) => (
            <div key={d.getDay()} role="columnheader" aria-label={fmt.weekdayLong.format(d)} className="px-2 py-1.5 text-xs font-medium text-foreground-muted">
              {fmt.weekdayShort.format(d)}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]?.getTime()} role="row" className="grid grid-cols-7">
            {week.map((d) => {
              const list = eventsOn(d);
              const inMonth = cal.parts(d).month === month;
              const isCursor = sameDay(d, date);
              const shown = list.length > maxEventsPerDay ? list.slice(0, maxEventsPerDay - 1) : list;
              return (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Enter on the grid does the same
                <div
                  key={d.getTime()}
                  role="gridcell"
                  tabIndex={isCursor ? 0 : -1}
                  aria-selected={isCursor}
                  aria-current={sameDay(d, today) ? "date" : undefined}
                  onClick={() => {
                    setDate(d);
                    onSlotClick?.(d);
                  }}
                  className={cn(
                    "flex min-h-24 min-w-0 flex-col gap-0.5 border-b border-e border-border p-1 outline-none [&:nth-child(7n)]:border-e-0",
                    !inMonth && "bg-surface-sunken/50",
                    weekend.includes(d.getDay()) && inMonth && "bg-surface-sunken/30",
                    isCursor && "ring-2 ring-inset ring-focus-ring/0 focus-visible:ring-focus-ring",
                  )}
                >
                  <span className="sr-only">{`${fmt.day(d)}${list.length ? `, ${l.events(list.length)}` : ""}`}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-6 items-center justify-center self-start rounded-full text-xs tabular-nums",
                      !inMonth && "text-foreground-muted",
                      sameDay(d, today) && "bg-primary font-semibold text-primary-on-solid",
                      isCursor && !sameDay(d, today) && "bg-primary-subtle text-primary-on-subtle",
                    )}
                  >
                    {fmt.number.format(cal.parts(d).day)}
                  </span>
                  {shown.map((ev) => chip(ev, isCursor))}
                  {list.length > shown.length ? (
                    <button
                      type="button"
                      tabIndex={isCursor ? 0 : -1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDate(d);
                        setView("day");
                      }}
                      className={cn("inline-flex min-h-6 items-center self-start rounded-sm px-1 text-xs font-medium text-foreground-secondary hover:bg-surface-hover", focusRing)}
                    >
                      {l.more(list.length - shown.length)}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const timeView = () => {
    const hours = Array.from({ length: Math.max(1, dayEndHour - dayStartHour) }, (_, i) => dayStartHour + i);
    const gridHeight = hours.length * hourHeight;
    const cols = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;
    const slotAt = (day: Date, e: MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const minutes = Math.floor((((e.clientY - rect.top) / hourHeight) * 60) / 30) * 30;
      const at = new Date(day);
      at.setHours(dayStartHour, minutes, 0, 0);
      return at;
    };
    return (
      <div className="flex flex-col">
        <div className="grid border-b border-border" style={{ gridTemplateColumns: cols }}>
          <span />
          {days.map((d) => (
            <div key={d.getTime()} className={cn("px-2 py-1.5 text-center text-xs", sameDay(d, today) ? "font-semibold text-primary-text" : "text-foreground-muted")}>
              <span className="block">{fmt.weekdayShort.format(d)}</span>
              <span className="text-base tabular-nums">{fmt.number.format(cal.parts(d).day)}</span>
            </div>
          ))}
        </div>
        <div className="grid border-b border-border" style={{ gridTemplateColumns: cols }}>
          <span className="px-1 py-1 text-end text-[11px] text-foreground-muted">{l.allDay}</span>
          {days.map((d) => (
            <div key={d.getTime()} role="group" aria-label={`${fmt.day(d)}, ${l.allDay}`} className="flex min-w-0 flex-col gap-0.5 border-s border-border p-0.5">
              {eventsOn(d)
                .filter((e) => e.allDay)
                .map((e) => chip(e, true))}
            </div>
          ))}
        </div>
        <div className="max-h-[32rem] overflow-y-auto">
          <div className="relative grid" style={{ gridTemplateColumns: cols, height: gridHeight }}>
            <div aria-hidden className="relative">
              {hours.map((h, i) => (
                <span key={h} className="absolute end-1 -translate-y-1/2 text-[11px] tabular-nums text-foreground-muted" style={{ top: i * hourHeight }}>
                  {i === 0 ? null : fmt.hour.format(new Date(2000, 0, 1, h))}
                </span>
              ))}
            </div>
            {days.map((d) => {
              const timed = eventsOn(d).filter((e) => !e.allDay);
              const layout = layoutDay(timed);
              const dayStart = new Date(d);
              dayStart.setHours(dayStartHour, 0, 0, 0);
              const toY = (t: Date) => Math.min(gridHeight, Math.max(0, ((t.getTime() - dayStart.getTime()) / 3_600_000) * hourHeight));
              const now = new Date();
              return (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- picking a time slot with the mouse; keyboard users pick days in month view
                <div
                  key={d.getTime()}
                  role="group"
                  aria-label={`${fmt.day(d)}${timed.length ? `, ${l.events(timed.length)}` : ""}`}
                  onClick={(e) => onSlotClick?.(slotAt(d, e))}
                  className="relative border-s border-border"
                  style={{ backgroundImage: `repeating-linear-gradient(to bottom, var(--nv-color-border) 0 1px, transparent 1px ${hourHeight}px)` }}
                >
                  {timed.map((e) => {
                    const place = layout.get(e.id) ?? { col: 0, cols: 1 };
                    const top = toY(e.start);
                    const height = Math.max(24, toY(e.end) - top);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEventClick?.(e);
                        }}
                        className={cn("absolute overflow-hidden rounded-md border-s-4 bg-surface-raised px-1.5 py-0.5 text-start text-xs shadow-xs hover:bg-surface-hover", focusRing)}
                        style={{
                          top,
                          height,
                          insetInlineStart: `calc(${(place.col / place.cols) * 100}% + 2px)`,
                          width: `calc(${100 / place.cols}% - 4px)`,
                          borderInlineStartColor: colorOf(e),
                        }}
                      >
                        <span className="block truncate font-medium text-foreground">{e.title}</span>
                        <span className="sr-only">, </span>
                        <span className="block truncate tabular-nums text-foreground-muted">{timeRange(e)}</span>
                      </button>
                    );
                  })}
                  {hydrated && sameDay(d, now) && now.getHours() >= dayStartHour && now.getHours() < dayEndHour ? (
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 h-0.5 bg-danger-solid" style={{ top: toY(now) }} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={ref} role="region" aria-label={label} className={cn("flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface", className)} {...props}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
        <Button variant="outline" size="sm" disabled={!today} onClick={() => today && setDate(today)}>
          {l.today}
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="sm" aria-label={l.previous} onClick={() => shift(-1)}>
            <ChevronLeft aria-hidden className="rtl:-scale-x-100" />
          </Button>
          <Button variant="ghost" size="sm" aria-label={l.next} onClick={() => shift(1)}>
            <ChevronRight aria-hidden className="rtl:-scale-x-100" />
          </Button>
        </div>
        <h2 aria-live="polite" className="me-auto min-w-0 truncate text-sm font-semibold text-foreground">
          {known ? title : ""}
        </h2>
        <SegmentedControl size="sm" aria-label={l.view} value={view} onValueChange={(v) => setView(v as SchedulerView)}>
          <SegmentedControlItem value="month">{l.month}</SegmentedControlItem>
          <SegmentedControlItem value="week">{l.week}</SegmentedControlItem>
          <SegmentedControlItem value="day">{l.day}</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {!known ? <div aria-busy="true" className="min-h-96" /> : view === "month" ? monthView() : timeView()}
    </div>
  );
});
