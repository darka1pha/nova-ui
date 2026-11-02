"use client";

import { forwardRef, useEffect, useState, type HTMLAttributes } from "react";
import { useLocale } from "../theme/theme-provider.tsx";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export type RelativeTimeInput = Date | string | number;

const toDate = (value: RelativeTimeInput) => (value instanceof Date ? value : new Date(value));

/**
 * "3 minutes ago", "in 2 days", "yesterday": localized with Intl.RelativeTimeFormat.
 * Anything under 45 seconds reads as "now".
 */
export function formatRelativeTime(date: RelativeTimeInput, now: RelativeTimeInput = Date.now(), locale?: string, options: Intl.RelativeTimeFormatOptions = { numeric: "auto" }): string {
  const diff = toDate(date).getTime() - toDate(now).getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, options);
  const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
    abs < 45 * SECOND
      ? [0, "second"]
      : abs < 45 * MINUTE
        ? [diff / MINUTE, "minute"]
        : abs < 22 * HOUR
          ? [diff / HOUR, "hour"]
          : abs < 7 * DAY
            ? [diff / DAY, "day"]
            : abs < 4 * WEEK
              ? [diff / WEEK, "week"]
              : abs < 11 * MONTH
                ? [diff / MONTH, "month"]
                : [diff / YEAR, "year"];
  // Math.round(-0.4) is -0, which Intl formats as "0 … ago"; normalize it.
  return rtf.format(Math.round(value) || 0, unit);
}

/** How long until the text could change: every 15s for the first minute, then per minute, hour or day. */
function nextTick(time: number, now: number) {
  const abs = Math.abs(time - now);
  return abs < MINUTE ? 15 * SECOND : abs < HOUR ? MINUTE : abs < DAY ? 10 * MINUTE : HOUR;
}

export interface RelativeTimeProps extends Omit<HTMLAttributes<HTMLTimeElement>, "children"> {
  /** The moment: a Date, an ISO string or a timestamp. */
  date: RelativeTimeInput;
  /** BCP 47 locale; defaults to the ThemeProvider's, then the browser's. */
  locale?: string;
  /** `auto` writes "yesterday" instead of "1 day ago". */
  numeric?: Intl.RelativeTimeFormatNumeric;
  /** `long` "3 minutes ago", `short` "3 min. ago", `narrow` "3m ago" (varies by locale). */
  formatStyle?: Intl.RelativeTimeFormatStyle;
  /** Keep the text current. Re-renders only as often as the text can change. */
  live?: boolean;
  /** Tooltip with the absolute date and time. `false` turns it off. */
  absoluteFormat?: Intl.DateTimeFormatOptions | false;
}

/**
 * A `<time>` element that shows how long ago (or until) a date is and keeps
 * itself up to date. The machine-readable `dateTime` and an absolute tooltip
 * are always there for screen readers and hover.
 */
export const RelativeTime = forwardRef<HTMLTimeElement, RelativeTimeProps>(function RelativeTime(
  { date, locale: localeProp, numeric = "auto", formatStyle = "long", live = true, absoluteFormat = { dateStyle: "medium", timeStyle: "short" }, ...props },
  ref,
) {
  const { locale } = useLocale(localeProp);
  const parsed = toDate(date);
  const time = parsed.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!live) return;
    const id = setTimeout(() => setNow(Date.now()), nextTick(time, now));
    return () => clearTimeout(id);
  }, [live, time, now]);

  if (Number.isNaN(time)) return null;
  return (
    <time
      ref={ref}
      dateTime={parsed.toISOString()}
      title={absoluteFormat === false ? undefined : new Intl.DateTimeFormat(locale, absoluteFormat).format(parsed)}
      // Server and client clocks differ by a few seconds.
      suppressHydrationWarning
      {...props}
    >
      {formatRelativeTime(parsed, now, locale, { numeric, style: formatStyle })}
    </time>
  );
});
