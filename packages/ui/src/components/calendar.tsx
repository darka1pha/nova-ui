"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { forwardRef, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { useLocale, useOptionalTheme, type CalendarSystemName } from "../theme/theme-provider.tsx";
import { fromJalali, jalaliMonthLength, toJalali } from "../utils/jalali.ts";
import { useFormField } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./overlay.tsx";
import { focusRing, pressable, transition } from "./shared.ts";

/* Date helpers. Calendar dates are local dates at midnight. */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * How a calendar system names days and groups them into months. Dates stay
 * ordinary local Dates; only month boundaries and labels change.
 */
interface CalendarMath {
  parts: (d: Date) => { year: number; month: number; day: number };
  /** Month is 1-based and may overflow (13 → next year). */
  make: (year: number, month: number, day: number) => Date;
  monthLength: (year: number, month: number) => number;
}

const calendars: Record<CalendarSystemName, CalendarMath> = {
  gregory: {
    parts: (d) => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }),
    make: (y, m, d) => new Date(y, m - 1, d),
    monthLength: (y, m) => new Date(y, m, 0).getDate(),
  },
  persian: { parts: toJalali, make: fromJalali, monthLength: jalaliMonthLength },
};

function addMonths(cal: CalendarMath, d: Date, n: number) {
  const { year, month, day } = cal.parts(d);
  const index = month - 1 + n;
  const y = year + Math.floor(index / 12);
  const m = (((index % 12) + 12) % 12) + 1;
  return cal.make(y, m, Math.min(day, cal.monthLength(y, m)));
}
function sameMonth(cal: CalendarMath, a: Date, b: Date) {
  const pa = cal.parts(a);
  const pb = cal.parts(b);
  return pa.year === pb.year && pa.month === pb.month;
}

/** First day of the week for a locale (Intl.Locale weekInfo where available). */
function weekStartFor(locale?: string): number {
  try {
    const loc = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info) return info.firstDay % 7;
  } catch {
    /* fall through */
  }
  return 0;
}

/** Weekend days (0 = Sunday … 6 = Saturday) for a locale, e.g. Friday in Iran. */
function weekendFor(locale?: string): number[] {
  try {
    const loc = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
      weekInfo?: { weekend: number[] };
      getWeekInfo?: () => { weekend: number[] };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info) return info.weekend.map((d) => d % 7);
  } catch {
    /* fall through */
  }
  return [0, 6];
}

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date) => void;
  /** Month shown initially (uncontrolled). */
  defaultMonth?: Date;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  /** BCP 47 locale for month/weekday names and the first day of the week. */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's convention. */
  weekStartsOn?: number;
  /**
   * "persian" shows Jalali (Solar Hijri) months; "gregory" the Gregorian ones.
   * Defaults to the ThemeProvider's calendar, which follows its locale.
   * Values are always plain Dates either way.
   */
  calendar?: CalendarSystemName;
  /** Tint the locale's weekend days (Friday in Iran). Defaults to true for the Persian calendar. */
  highlightWeekends?: boolean;
  labels?: { previousMonth?: string; nextMonth?: string };
}

/** How one day looks and reads, decided by the selection model (single or range). */
interface DayState {
  selected: boolean;
  /** Range ends get the solid fill; days between get a continuous band. */
  rangeStart?: boolean;
  rangeEnd?: boolean;
  inRange?: boolean;
}

interface CalendarCoreProps extends Omit<CalendarProps, "value" | "defaultValue" | "onValueChange" | "defaultMonth"> {
  /** Months shown side by side. Days outside a month are blank when more than one. */
  months: number;
  initialFocus: Date;
  dayState: (d: Date) => DayState;
  onPick: (d: Date) => void;
  /** The day under the pointer or keyboard focus (null when the pointer leaves). */
  onActiveDay?: (d: Date | null) => void;
}

/**
 * The shared month grid (WAI-ARIA date grid pattern) behind Calendar and
 * RangeCalendar: arrows move by day and week, Home/End to week edges, Page
 * Up/Down by month (with Shift: by year). Months slide in from the direction
 * you travel.
 */
const CalendarCore = forwardRef<HTMLDivElement, CalendarCoreProps>(function CalendarCore(
  { months, initialFocus, dayState, onPick, onActiveDay, min, max, isDateDisabled, locale: localeProp, weekStartsOn, calendar: calendarProp, highlightWeekends, labels, className, ...props },
  ref,
) {
  const dir = useOptionalTheme()?.dir ?? "ltr";
  const { locale, calendar: localeCalendar } = useLocale(localeProp);
  const calendar = calendarProp ?? localeCalendar;
  const cal = calendars[calendar];
  const today = useMemo(() => startOfDay(new Date()), []);
  const [focused, setFocused] = useState<Date>(() => startOfDay(initialFocus));
  const monthOf = (d: Date) => {
    const p = cal.parts(d);
    return cal.make(p.year, p.month, 1);
  };
  // First visible month. Moves only when focus leaves the visible months.
  const [viewStart, setViewStart] = useState<Date>(() => monthOf(focused));
  const [slide, setSlide] = useState<"next" | "prev" | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const composedRef = useComposedRefs(ref, root);
  const shouldFocus = useRef(false);
  const baseId = useId();

  const firstDay = weekStartsOn ?? weekStartFor(locale);
  const weekend = (highlightWeekends ?? calendar === "persian") ? weekendFor(locale) : [];
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const monthFmt = new Intl.DateTimeFormat(locale, { calendar, month: "long", year: "numeric" });
  const dayLabelFmt = new Intl.DateTimeFormat(locale, { calendar, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  // ICU orders Persian Jalali dates year-first ("۱۴۰۵ آبان ۹, شنبه"); readers expect
  // "شنبه ۹ آبان ۱۴۰۵" and "آبان ۱۴۰۵", so those are assembled from parts.
  const persianOrder = calendar === "persian" && /^fa\b/i.test(dayLabelFmt.resolvedOptions().locale);
  const parts = (fmt: Intl.DateTimeFormat, d: Date) => Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  const dayLabel = (d: Date) => {
    if (!persianOrder) return dayLabelFmt.format(d);
    const p = parts(dayLabelFmt, d);
    return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
  };
  const monthTitle = (d: Date) => {
    if (!persianOrder) return monthFmt.format(d);
    const p = parts(monthFmt, d);
    return `${p.month} ${p.year}`;
  };
  // Day numbers in the locale's digits (Persian ۱۲۳ for fa-IR).
  const dayNumber = new Intl.NumberFormat(locale, { useGrouping: false });

  const disabled = (d: Date) => (min && d < startOfDay(min)) || (max && d > startOfDay(max)) || !!isDateDisabled?.(d);
  const visibleMonths = Array.from({ length: months }, (_, i) => addMonths(cal, viewStart, i));
  const lastVisible = visibleMonths[visibleMonths.length - 1] ?? viewStart;

  const move = (next: Date) => {
    // Keep the view still while focus stays inside it; otherwise shift just enough.
    if (next < viewStart) {
      setSlide("prev");
      setViewStart(monthOf(next));
    } else if (next >= addMonths(cal, lastVisible, 1)) {
      setSlide("next");
      setViewStart(addMonths(cal, monthOf(next), -(months - 1)));
    }
    shouldFocus.current = true;
    setFocused(next);
    onActiveDay?.(next);
  };
  const shiftView = (n: number) => {
    setSlide(n > 0 ? "next" : "prev");
    setViewStart(addMonths(cal, viewStart, n));
    setFocused(addMonths(cal, focused, n));
  };
  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    root.current?.querySelector<HTMLButtonElement>('[role="grid"] [tabindex="0"]')?.focus();
  }, [focused]);

  const pick = (d: Date) => {
    if (disabled(d)) return;
    onPick(d);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const rtl = dir === "rtl" ? -1 : 1;
    const keys: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1 * rtl),
      ArrowRight: () => addDays(focused, 1 * rtl),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -((focused.getDay() - firstDay + 7) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() - firstDay + 7) % 7)),
      PageUp: () => addMonths(cal, focused, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(cal, focused, e.shiftKey ? 12 : 1),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      move(action());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focused);
    }
  };

  const navButton = cn("inline-flex size-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-surface-hover hover:text-foreground [&_svg]:size-4", focusRing, pressable, transition);
  const slideClass = slide === null ? "" : (slide === "next") === (dir === "ltr") ? "animate-nv-slide-from-right" : "animate-nv-slide-from-left";
  // The focused day must be visible; otherwise the first day of the first month takes the tab stop.
  const focusVisible = visibleMonths.some((m) => sameMonth(cal, m, focused));
  const tabStop = focusVisible ? focused : viewStart;

  const renderMonth = (month: Date, mi: number) => {
    const gridStart = addDays(month, -((month.getDay() - firstDay + 7) % 7));
    const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)));
    const titleId = `${baseId}-title-${mi}`;
    const p = cal.parts(month);
    return (
      <div key={`${calendar}-${p.year}-${p.month}`} className="flex flex-col gap-3">
        <p id={titleId} aria-live="polite" className="flex h-8 items-center justify-center font-display text-sm font-semibold capitalize">
          {monthTitle(month)}
        </p>
        <div role="grid" aria-labelledby={titleId} className="flex flex-col gap-1">
          <div role="row" className="grid grid-cols-7">
            {weeks[0]?.map((d) => (
              <span
                key={d.getDay()}
                role="columnheader"
                aria-label={weekdayLong.format(d)}
                className={cn("flex h-8 w-10 items-center justify-center text-xs font-medium", weekend.includes(d.getDay()) ? "text-danger-text" : "text-foreground-muted")}
              >
                {weekdayFmt.format(d)}
              </span>
            ))}
          </div>
          <div className={cn("flex flex-col gap-1", slideClass)} onPointerLeave={() => onActiveDay?.(null)}>
            {weeks.map((week, w) => (
              <div role="row" key={w} className="grid grid-cols-7">
                {week.map((d) => {
                  const outside = !sameMonth(cal, d, month);
                  // With several months, a day belongs to exactly one grid.
                  if (outside && months > 1) return <div role="gridcell" key={d.toISOString()} className="h-9 w-10" />;
                  const state = dayState(d);
                  const isWeekend = weekend.includes(d.getDay());
                  const isToday = sameDay(d, today);
                  const isDisabled = disabled(d);
                  const isEnd = state.selected || state.rangeStart || state.rangeEnd;
                  const band = state.inRange || ((state.rangeStart || state.rangeEnd) && !(state.rangeStart && state.rangeEnd));
                  return (
                    <div
                      role="gridcell"
                      key={d.toISOString()}
                      aria-selected={isEnd || state.inRange || undefined}
                      className={cn(
                        "flex h-9 w-10 items-center justify-center",
                        // A continuous band joins the range; it rounds off at the range ends.
                        band && "bg-primary-subtle",
                        state.rangeStart && !state.rangeEnd && "rounded-s-full",
                        state.rangeEnd && !state.rangeStart && "rounded-e-full",
                      )}
                    >
                      <button
                        type="button"
                        tabIndex={sameDay(d, tabStop) ? 0 : -1}
                        aria-label={dayLabel(d)}
                        aria-current={isToday ? "date" : undefined}
                        aria-disabled={isDisabled || undefined}
                        onPointerEnter={() => onActiveDay?.(d)}
                        // Focus can arrive without a key press (screen reader cursor, Tab); keys move from here.
                        onFocus={() => {
                          if (!sameDay(d, focused)) setFocused(d);
                        }}
                        onClick={() => {
                          setFocused(d);
                          pick(d);
                        }}
                        className={cn(
                          "relative inline-flex size-9 items-center justify-center rounded-md text-sm tabular-nums",
                          focusRing,
                          transition,
                          pressable,
                          outside ? "text-foreground-muted" : isWeekend ? "text-danger-text" : "text-foreground",
                          !isEnd && !isDisabled && "hover:bg-primary-subtle hover:text-primary-on-subtle",
                          state.inRange && !isEnd && "text-primary-on-subtle",
                          isEnd && "bg-primary font-semibold text-primary-on-solid shadow-glow-primary animate-nv-bounce-in",
                          isToday && !isEnd && "font-semibold text-primary-text after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
                          isDisabled && "cursor-not-allowed text-foreground-disabled line-through opacity-60",
                        )}
                      >
                        {dayNumber.format(cal.parts(d).day)}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={composedRef} onKeyDown={onKeyDown} className={cn("relative inline-flex w-fit flex-col p-1", className)} {...props}>
      {/* Month buttons sit over the outer months' titles. */}
      <button type="button" className={cn(navButton, "absolute start-1 top-1 z-10")} aria-label={labels?.previousMonth ?? "Previous month"} onClick={() => shiftView(-1)}>
        <ChevronLeft className="rtl:-scale-x-100" />
      </button>
      <button type="button" className={cn(navButton, "absolute end-1 top-1 z-10")} aria-label={labels?.nextMonth ?? "Next month"} onClick={() => shiftView(1)}>
        <ChevronRight className="rtl:-scale-x-100" />
      </button>
      <div className="flex flex-wrap gap-x-6 gap-y-4">{visibleMonths.map(renderMonth)}</div>
    </div>
  );
});

/** A single-date month grid. */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar({ value, defaultValue = null, onValueChange, defaultMonth, ...props }, ref) {
  const [internal, setInternal] = useState<Date | null>(defaultValue);
  const selected = value !== undefined ? value : internal;
  return (
    <CalendarCore
      ref={ref}
      {...props}
      months={1}
      initialFocus={selected ?? defaultMonth ?? new Date()}
      dayState={(d) => ({ selected: sameDay(d, selected) })}
      onPick={(d) => {
        if (value === undefined) setInternal(d);
        onValueChange?.(d);
      }}
    />
  );
});

/* ----------------------------------------------------------- RangeCalendar */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RangeCalendarProps extends Omit<CalendarProps, "value" | "defaultValue" | "onValueChange"> {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  /** Fires once both ends are chosen. The start is never after the end. */
  onValueChange?: (range: DateRange) => void;
  /** Months side by side. Defaults to 2. */
  numberOfMonths?: number;
}

/**
 * Pick a start and an end day. The first click sets one end, the second the
 * other (in either order); while choosing, the range previews under the pointer
 * or keyboard focus.
 */
export const RangeCalendar = forwardRef<HTMLDivElement, RangeCalendarProps>(function RangeCalendar(
  { value, defaultValue = null, onValueChange, numberOfMonths = 2, defaultMonth, ...props },
  ref,
) {
  const [internal, setInternal] = useState<DateRange | null>(defaultValue);
  const range = value !== undefined ? value : internal;
  // The first end picked, waiting for the second.
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [active, setActive] = useState<Date | null>(null);

  const ends = anchor ? ([anchor, active ?? anchor].sort((a, b) => a.getTime() - b.getTime()) as [Date, Date]) : range ? ([range.start, range.end] as const) : null;

  return (
    <CalendarCore
      ref={ref}
      {...props}
      months={numberOfMonths}
      initialFocus={range?.start ?? defaultMonth ?? new Date()}
      onActiveDay={setActive}
      dayState={(d) => {
        if (!ends) return { selected: false };
        const [start, end] = ends;
        const rangeStart = sameDay(d, start);
        const rangeEnd = sameDay(d, end);
        return { selected: false, rangeStart, rangeEnd, inRange: d > start && d < end };
      }}
      onPick={(d) => {
        if (!anchor) {
          setAnchor(d);
          return;
        }
        const [start, end] = [anchor, d].sort((a, b) => a.getTime() - b.getTime()) as [Date, Date];
        setAnchor(null);
        if (value === undefined) setInternal({ start, end });
        onValueChange?.({ start, end });
      }}
    />
  );
});

/* -------------------------------------------------------------- DatePicker */

export interface DatePickerProps extends Omit<CalendarProps, "className" | "defaultMonth"> {
  placeholder?: string;
  /** Intl date format for the field. */
  format?: Intl.DateTimeFormatOptions;
  /** Show a button that clears the date. */
  clearable?: boolean;
  onClear?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
  /** Submits the date (YYYY-MM-DD) with native forms via a hidden input. */
  name?: string;
  /** Fires when focus leaves the field (marks it "touched" in form libraries). */
  onBlur?: () => void;
}

/** Local calendar date as YYYY-MM-DD (no time-zone shift). */
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * A field that opens a Calendar in a popover. Choosing a day closes it and
 * returns focus to the field. Wires itself to a surrounding FormField.
 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  {
    value,
    defaultValue = null,
    onValueChange,
    placeholder = "Pick a date",
    format = { dateStyle: "medium" },
    clearable = false,
    onClear,
    size,
    className,
    locale: localeProp,
    calendar: calendarProp,
    disabled,
    id,
    "aria-label": ariaLabel,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    required,
    name,
    onBlur,
    ...calendarProps
  },
  ref,
) {
  const field = useFormField({ id, "aria-describedby": describedBy, "aria-invalid": invalid, disabled, required });
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<Date | null>(defaultValue);
  const current = value !== undefined ? value : internal;
  const { locale, calendar: localeCalendar } = useLocale(localeProp);
  const calendar = calendarProp ?? localeCalendar;
  const text = current ? new Intl.DateTimeFormat(locale, { calendar, ...format }).format(current) : null;

  return (
    <div className={cn("relative w-full", className)}>
      {name ? <input type="hidden" name={name} value={current ? isoDate(current) : ""} /> : null}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onBlur?.();
        }}
      >
        <PopoverTrigger asChild disabled={field.disabled}>
          <button
            ref={ref}
            type="button"
            id={field.id}
            aria-label={ariaLabel}
            aria-describedby={field["aria-describedby"]}
            aria-invalid={field["aria-invalid"]}
            aria-required={field.required}
            // A field that opens a picker: combobox allows invalid/required states (a plain button does not).
            role="combobox"
            aria-haspopup="dialog"
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            className={cn(fieldVariants({ size }), "group/date flex items-center gap-2 text-start", clearable && current && "pe-9", !current && "text-foreground-muted")}
          >
            <CalendarDays aria-hidden className="size-4 shrink-0 text-foreground-muted transition-transform duration-(--nv-duration-slow) ease-(--nv-ease-interactive) group-hover/date:scale-110 group-hover/date:text-primary-text" />
            <span className="truncate">{text ?? placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          align="start"
          aria-label={ariaLabel ?? placeholder}
          // Land on the selected (or today's) day instead of the month buttons.
          onOpenAutoFocus={(e) => {
            const day = (e.target as HTMLElement | null)?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]');
            if (day) {
              e.preventDefault();
              day.focus();
            }
          }}
        >
          <Calendar
            {...calendarProps}
            locale={locale}
            calendar={calendar}
            value={current}
            defaultMonth={current ?? undefined}
            onValueChange={(d) => {
              if (value === undefined) setInternal(d);
              onValueChange?.(d);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && current && !field.disabled ? (
        <button
          type="button"
          aria-label="Clear date"
          onClick={() => {
            if (value === undefined) setInternal(null);
            onClear?.();
            onBlur?.();
          }}
          className={cn("absolute end-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-3.5", focusRing)}
        >
          <X />
        </button>
      ) : null}
    </div>
  );
});

/* --------------------------------------------------------- DateRangePicker */

export interface DateRangePreset {
  label: string;
  /** Computed when chosen, so "Last 7 days" stays relative to today. */
  range: () => DateRange;
}

export interface DateRangePresetLabels {
  today?: string;
  last7?: string;
  last30?: string;
  thisMonth?: string;
  lastMonth?: string;
}

/**
 * The common presets, in the active calendar system ("This month" is the
 * current Jalali month under a Persian locale).
 */
export function defaultDateRangePresets(calendar: CalendarSystemName = "gregory", labels: DateRangePresetLabels = {}): DateRangePreset[] {
  const cal = calendars[calendar];
  const today = () => startOfDay(new Date());
  const monthBounds = (offset: number) => {
    const p = cal.parts(today());
    const first = addMonths(cal, cal.make(p.year, p.month, 1), offset);
    const fp = cal.parts(first);
    return { start: first, end: cal.make(fp.year, fp.month, cal.monthLength(fp.year, fp.month)) };
  };
  return [
    { label: labels.today ?? "Today", range: () => ({ start: today(), end: today() }) },
    { label: labels.last7 ?? "Last 7 days", range: () => ({ start: addDays(today(), -6), end: today() }) },
    { label: labels.last30 ?? "Last 30 days", range: () => ({ start: addDays(today(), -29), end: today() }) },
    { label: labels.thisMonth ?? "This month", range: () => monthBounds(0) },
    { label: labels.lastMonth ?? "Last month", range: () => monthBounds(-1) },
  ];
}

export interface DateRangePickerProps extends Omit<RangeCalendarProps, "className" | "defaultMonth"> {
  placeholder?: string;
  /** Intl date format for each end in the field. */
  format?: Intl.DateTimeFormatOptions;
  /**
   * Quick ranges listed beside the calendar. Defaults to Today, Last 7 / 30 days,
   * This month and Last month; pass your own, or `false` to hide them.
   */
  presets?: DateRangePreset[] | false;
  clearable?: boolean;
  onClear?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
  /** Submits the range with native forms as `${name}Start` and `${name}End` (YYYY-MM-DD). */
  name?: string;
  onBlur?: () => void;
  labels?: RangeCalendarProps["labels"] & { presets?: string; clear?: string };
}

/**
 * A field that opens presets and a two-month RangeCalendar. Choosing a preset,
 * or both ends of a range, closes it. Wires itself to a surrounding FormField.
 */
export const DateRangePicker = forwardRef<HTMLButtonElement, DateRangePickerProps>(function DateRangePicker(
  {
    value,
    defaultValue = null,
    onValueChange,
    placeholder = "Pick a date range",
    format = { dateStyle: "medium" },
    presets,
    clearable = false,
    onClear,
    size,
    className,
    locale: localeProp,
    calendar: calendarProp,
    disabled,
    id,
    "aria-label": ariaLabel,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    required,
    name,
    onBlur,
    labels,
    numberOfMonths = 2,
    ...calendarProps
  },
  ref,
) {
  const field = useFormField({ id, "aria-describedby": describedBy, "aria-invalid": invalid, disabled, required });
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<DateRange | null>(defaultValue);
  const current = value !== undefined ? value : internal;
  const { locale, calendar: localeCalendar } = useLocale(localeProp);
  const calendar = calendarProp ?? localeCalendar;
  const fmt = new Intl.DateTimeFormat(locale, { calendar, ...format });
  // formatRange collapses shared parts ("Oct 1 – 31, 2026").
  const text = current ? fmt.formatRange(current.start, current.end) : null;
  const presetList = presets === false ? [] : (presets ?? defaultDateRangePresets(calendar));

  const commit = (range: DateRange) => {
    if (value === undefined) setInternal(range);
    onValueChange?.(range);
    setOpen(false);
  };
  const isPreset = (p: DateRangePreset) => {
    if (!current) return false;
    const r = p.range();
    return sameDay(r.start, current.start) && sameDay(r.end, current.end);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {name ? (
        <>
          <input type="hidden" name={`${name}Start`} value={current ? isoDate(current.start) : ""} />
          <input type="hidden" name={`${name}End`} value={current ? isoDate(current.end) : ""} />
        </>
      ) : null}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onBlur?.();
        }}
      >
        <PopoverTrigger asChild disabled={field.disabled}>
          <button
            ref={ref}
            type="button"
            id={field.id}
            aria-label={ariaLabel}
            aria-describedby={field["aria-describedby"]}
            aria-invalid={field["aria-invalid"]}
            aria-required={field.required}
            role="combobox"
            aria-haspopup="dialog"
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            className={cn(fieldVariants({ size }), "group/date flex items-center gap-2 text-start", clearable && current && "pe-9", !current && "text-foreground-muted")}
          >
            <CalendarDays aria-hidden className="size-4 shrink-0 text-foreground-muted transition-transform duration-(--nv-duration-slow) ease-(--nv-ease-interactive) group-hover/date:scale-110 group-hover/date:text-primary-text" />
            <span className="truncate">{text ?? placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-[calc(100vw-1rem)] p-2"
          align="start"
          aria-label={ariaLabel ?? placeholder}
          onOpenAutoFocus={(e) => {
            const day = (e.target as HTMLElement | null)?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]');
            if (day) {
              e.preventDefault();
              day.focus();
            }
          }}
        >
          {/* Side by side, wrapping under when narrow. (No breakpoint override: an app's own
              Tailwind build can re-emit base classes after ours and win.) */}
          <div className="flex flex-wrap gap-2">
            {presetList.length ? (
              // Presets as rows: nobody fights a calendar grid for "last 30 days".
              <ul aria-label={labels?.presets ?? "Presets"} className="m-0 flex w-36 list-none flex-col gap-1 border-e border-border p-0 pe-2">
                {presetList.map((p) => {
                  const active = isPreset(p);
                  return (
                    <li key={p.label}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => commit(p.range())}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-start text-sm text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
                          active && "font-semibold text-foreground",
                          focusRing,
                        )}
                      >
                        {p.label}
                        {active ? <Check aria-hidden className="size-4 shrink-0 text-primary-text" strokeWidth={2.5} /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <RangeCalendar
              {...calendarProps}
              locale={locale}
              calendar={calendar}
              numberOfMonths={numberOfMonths}
              labels={labels}
              value={current}
              defaultMonth={current?.start}
              onValueChange={commit}
            />
          </div>
        </PopoverContent>
      </Popover>
      {clearable && current && !field.disabled ? (
        <button
          type="button"
          aria-label={labels?.clear ?? "Clear dates"}
          onClick={() => {
            if (value === undefined) setInternal(null);
            onClear?.();
            onBlur?.();
          }}
          className={cn("absolute end-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-3.5", focusRing)}
        >
          <X />
        </button>
      ) : null}
    </div>
  );
});
