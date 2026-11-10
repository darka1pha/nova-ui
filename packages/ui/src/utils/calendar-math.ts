/*
 * Calendar math shared by Calendar, DatePicker and Scheduler: local-midnight date helpers,
 * the Gregorian and Persian (Jalali) month systems, and locale week conventions.
 */
import type { CalendarSystemName } from "../theme/theme-provider.tsx";
import { fromJalali, jalaliMonthLength, toJalali } from "./jalali.ts";

/* Date helpers. Calendar dates are local dates at midnight. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * How a calendar system names days and groups them into months. Dates stay
 * ordinary local Dates; only month boundaries and labels change.
 */
export interface CalendarMath {
  parts: (d: Date) => { year: number; month: number; day: number };
  /** Month is 1-based and may overflow (13 → next year). */
  make: (year: number, month: number, day: number) => Date;
  monthLength: (year: number, month: number) => number;
}

export const calendars: Record<CalendarSystemName, CalendarMath> = {
  gregory: {
    parts: (d) => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }),
    make: (y, m, d) => new Date(y, m - 1, d),
    monthLength: (y, m) => new Date(y, m, 0).getDate(),
  },
  persian: { parts: toJalali, make: fromJalali, monthLength: jalaliMonthLength },
};

export function addMonths(cal: CalendarMath, d: Date, n: number) {
  const { year, month, day } = cal.parts(d);
  const index = month - 1 + n;
  const y = year + Math.floor(index / 12);
  const m = (((index % 12) + 12) % 12) + 1;
  return cal.make(y, m, Math.min(day, cal.monthLength(y, m)));
}
export function sameMonth(cal: CalendarMath, a: Date, b: Date) {
  const pa = cal.parts(a);
  const pb = cal.parts(b);
  return pa.year === pb.year && pa.month === pb.month;
}

/** First day of the week for a locale (Intl.Locale weekInfo where available). */
export function weekStartFor(locale?: string): number {
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
export function weekendFor(locale?: string): number[] {
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
