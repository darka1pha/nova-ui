"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { forwardRef, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react";
import { cn } from "../utils/cn.ts";
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

/**
 * An accessible month grid (WAI-ARIA date grid pattern): arrows move by day and
 * week, Home/End to week edges, Page Up/Down by month (with Shift: by year).
 * Months slide in from the direction you travel; the selected day springs in.
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  { value, defaultValue = null, onValueChange, defaultMonth, min, max, isDateDisabled, locale: localeProp, weekStartsOn, calendar: calendarProp, highlightWeekends, labels, className, ...props },
  ref,
) {
  const dir = useOptionalTheme()?.dir ?? "ltr";
  const { locale, calendar: localeCalendar } = useLocale(localeProp);
  const calendar = calendarProp ?? localeCalendar;
  const cal = calendars[calendar];
  const [internal, setInternal] = useState<Date | null>(defaultValue);
  const selected = value !== undefined ? value : internal;
  const today = useMemo(() => startOfDay(new Date()), []);
  const [focused, setFocused] = useState<Date>(() => startOfDay(selected ?? defaultMonth ?? today));
  const [slide, setSlide] = useState<"next" | "prev" | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const titleId = useId();

  const firstDay = weekStartsOn ?? weekStartFor(locale);
  const weekend = (highlightWeekends ?? calendar === "persian") ? weekendFor(locale) : [];
  const focusedParts = cal.parts(focused);
  const monthStart = cal.make(focusedParts.year, focusedParts.month, 1);
  const gridStart = addDays(monthStart, -((monthStart.getDay() - firstDay + 7) % 7));
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)));
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

  const move = (next: Date) => {
    if (!sameMonth(cal, next, focused)) setSlide(next > focused ? "next" : "prev");
    shouldFocus.current = true;
    setFocused(next);
  };
  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [focused]);

  const select = (d: Date) => {
    if (disabled(d)) return;
    if (value === undefined) setInternal(d);
    onValueChange?.(d);
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
      select(focused);
    }
  };

  const navButton = cn("inline-flex size-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-surface-hover hover:text-foreground [&_svg]:size-4", focusRing, pressable, transition);
  const slideClass = slide === null ? "" : (slide === "next") === (dir === "ltr") ? "animate-ks-slide-from-right" : "animate-ks-slide-from-left";

  return (
    <div ref={ref} className={cn("inline-flex w-fit flex-col gap-3 p-1", className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={navButton} aria-label={labels?.previousMonth ?? "Previous month"} onClick={() => move(addMonths(cal, focused, -1))}>
          <ChevronLeft className="rtl:-scale-x-100" />
        </button>
        <p id={titleId} aria-live="polite" className="font-display text-sm font-semibold capitalize">
          {monthTitle(focused)}
        </p>
        <button type="button" className={navButton} aria-label={labels?.nextMonth ?? "Next month"} onClick={() => move(addMonths(cal, focused, 1))}>
          <ChevronRight className="rtl:-scale-x-100" />
        </button>
      </div>
      <div ref={grid} role="grid" aria-labelledby={titleId} onKeyDown={onKeyDown} className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-7 gap-1">
          {weeks[0]?.map((d) => (
            <span
              key={d.getDay()}
              role="columnheader"
              aria-label={weekdayLong.format(d)}
              className={cn("flex h-8 items-center justify-center text-xs font-medium", weekend.includes(d.getDay()) ? "text-danger-text" : "text-foreground-muted")}
            >
              {weekdayFmt.format(d)}
            </span>
          ))}
        </div>
        <div key={`${calendar}-${focusedParts.year}-${focusedParts.month}`} className={cn("flex flex-col gap-1", slideClass)}>
          {weeks.map((week, w) => (
            <div role="row" key={w} className="grid grid-cols-7 gap-1">
              {week.map((d) => {
                const outside = !sameMonth(cal, d, focused);
                const isWeekend = weekend.includes(d.getDay());
                const isSelected = sameDay(d, selected);
                const isToday = sameDay(d, today);
                const isDisabled = disabled(d);
                return (
                  <div role="gridcell" key={d.toISOString()} aria-selected={isSelected || undefined}>
                    <button
                      type="button"
                      tabIndex={sameDay(d, focused) ? 0 : -1}
                      aria-label={dayLabel(d)}
                      aria-current={isToday ? "date" : undefined}
                      aria-disabled={isDisabled || undefined}
                      onClick={() => {
                        setFocused(d);
                        select(d);
                      }}
                      className={cn(
                        "relative inline-flex size-9 items-center justify-center rounded-md text-sm tabular-nums",
                        focusRing,
                        transition,
                        pressable,
                        outside ? "text-foreground-muted" : isWeekend ? "text-danger-text" : "text-foreground",
                        !isSelected && !isDisabled && "hover:bg-primary-subtle hover:text-primary-on-subtle",
                        isSelected && "bg-primary font-semibold text-primary-on-solid shadow-glow-primary animate-ks-bounce-in",
                        isToday && !isSelected && "font-semibold text-primary-text after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
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
            <CalendarDays aria-hidden className="size-4 shrink-0 text-foreground-muted transition-transform duration-(--ks-duration-slow) ease-(--ks-ease-interactive) group-hover/date:scale-110 group-hover/date:text-primary-text" />
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
