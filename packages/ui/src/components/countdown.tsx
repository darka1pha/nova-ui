"use client";

import { forwardRef, useEffect, useMemo, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { devWarn } from "../utils/dev.ts";
import { useLatestRef } from "../utils/use-latest-ref.ts";

/* --------------------------------------------------------------- Countdown */

type Unit = "day" | "hour" | "minute" | "second";
const UNITS: Unit[] = ["day", "hour", "minute", "second"];
const MS: Record<Unit, number> = { day: 86_400_000, hour: 3_600_000, minute: 60_000, second: 1000 };

/** Splits a duration into days, hours, minutes and seconds. */
export function splitDuration(ms: number): Record<Unit, number> {
  let rest = Math.max(0, Math.floor(ms / 1000) * 1000);
  const out = {} as Record<Unit, number>;
  for (const unit of UNITS) {
    out[unit] = Math.floor(rest / MS[unit]);
    rest -= out[unit] * MS[unit];
  }
  return out;
}

/** What a `format` render prop gets: the time left, already rounded for display. */
export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  /** Always 0 when `showSeconds` is false. */
  seconds: number;
  /** Milliseconds left, rounded up to the shown precision. */
  total: number;
  done: boolean;
  /**
   * True on the server and while hydrating when no `initialNow` is given: the
   * numbers are zeros and shouldn't be shown. Render a placeholder like "--:--".
   */
  placeholder: boolean;
}

export interface CountdownProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** The moment it counts down to. */
  to: Date | string | number;
  /** Called once when it reaches zero. */
  onComplete?: () => void;
  /** `blocks`: big numbers with labels. `inline`: "2d 04h 09m 12s". */
  variant?: "blocks" | "inline";
  /** Show seconds (they tick every second). */
  showSeconds?: boolean;
  /** Shown instead of zeros once finished. */
  completed?: ReactNode;
  locale?: string;
  /**
   * The current time (ms since epoch) to render on the server and while hydrating,
   * e.g. `Date.now()` captured on the server. Without it the server renders
   * placeholders ("--") and the real time appears right after hydration, so the
   * markup never mismatches.
   */
  initialNow?: number;
  /**
   * The element to render. `span` (default) fits inside a sentence; use `div`
   * for block layouts so it can hold block content without invalid nesting.
   */
  as?: "span" | "div";
  /**
   * Custom layout for the time left, e.g. `({ hours, minutes, seconds }) => [hours, minutes, seconds].map(pad).join(":")`.
   * Replaces the `variant` markup (not `completed`, which still shows once done).
   * The output is hidden from screen readers; the timer keeps its spoken label.
   */
  format?: (parts: CountdownParts) => ReactNode;
}

const noopSubscribe = () => () => {};
/** False on the server and during hydration, true afterwards and on client-only renders. */
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/**
 * Time left until a moment, ticking every second (or minute without seconds).
 * Unit labels come from Intl, so they're localized. It's a `role="timer"`
 * whose accessible name updates once a minute, so screen readers aren't flooded.
 * Renders a `<span>`, so it can sit inside a sentence ("Sale ends in …");
 * pass `as="div"` for block layouts, and `format` for a custom layout.
 */
export const Countdown = forwardRef<HTMLElement, CountdownProps>(function Countdown(
  { to, onComplete, variant = "blocks", showSeconds = true, completed, locale: localeProp, initialNow, as: Tag = "span", format: render, className, ...props },
  ref,
) {
  const { locale } = useLocale(localeProp);
  const target = new Date(to).getTime();
  const invalid = Number.isNaN(target);
  useEffect(() => {
    if (invalid) devWarn(`Countdown: "${String(to)}" is not a valid date; nothing is rendered.`);
  }, [invalid, to]);
  const hydrated = useHydrated();
  // The client's clock, read when this mounts and on every tick.
  const [clientNow, setNow] = useState(() => Date.now());
  // Server and hydration renders must produce identical markup: either the
  // caller-supplied clock or placeholders, never the machine's own clock.
  // Once hydrated, the server's clock is stale, so switch to the client's.
  const now = hydrated || initialNow === undefined ? clientNow : initialNow;
  const placeholder = !hydrated && initialNow === undefined;
  const remaining = Math.max(0, target - now);
  const done = remaining <= 0;
  const step = showSeconds ? MS.second : MS.minute;
  const fired = useRef(false);
  const onCompleteRef = useLatestRef(onComplete);

  useEffect(() => {
    fired.current = false;
  }, [target]);

  useEffect(() => {
    if (invalid) return;
    if (done) {
      if (!fired.current) {
        fired.current = true;
        onCompleteRef.current?.();
      }
      return;
    }
    // Tick just after the shown value changes, not on a drifting interval.
    const id = setTimeout(() => setNow(Date.now()), (remaining % step || step) + 15);
    return () => clearTimeout(id);
  }, [now, done, remaining, step, invalid, onCompleteRef]);

  // Formatters are built once per locale, not on every tick.
  const format = useMemo(() => {
    const units = new Map<string, Intl.NumberFormat>();
    const unitFormat = (unit: Unit, display: "long" | "narrow") => {
      const key = `${unit}-${display}`;
      let f = units.get(key);
      if (!f) units.set(key, (f = new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: display })));
      return f;
    };
    const unitText = (unit: Unit, value: number, display: "long" | "narrow") =>
      unitFormat(unit, display).formatToParts(value).find((p) => p.type === "unit")?.value.trim() ?? unit;
    const full = (unit: Unit, value: number) => unitFormat(unit, "long").format(value);
    const digits = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
    const list = new Intl.ListFormat(locale, { type: "unit", style: "long" });
    return { unitText, full, digits, list };
  }, [locale]);

  // Round up, like any countdown: 1:02 stays on screen until a full second has passed.
  const parts = splitDuration(Math.ceil(remaining / step) * step);
  const shown = UNITS.filter((u) => (u === "day" ? parts.day > 0 && !placeholder : u === "second" ? showSeconds : true));
  const digitsOf = (unit: Unit) => (placeholder ? "--" : unit === "day" && variant === "inline" ? String(parts.day) : format.digits.format(parts[unit]));


  // Minute precision for the spoken label: "2 days, 4 hours, 9 minutes".
  const spokenUnits = UNITS.filter((u) => u !== "second" && (u !== "day" || parts.day > 0));
  const spoken = format.list.format(spokenUnits.map((u) => format.full(u, parts[u])));

  if (invalid) return null;

  const custom =
    render &&
    render({
      days: placeholder ? 0 : parts.day,
      hours: placeholder ? 0 : parts.hour,
      minutes: placeholder ? 0 : parts.minute,
      seconds: placeholder || !showSeconds ? 0 : parts.second,
      total: placeholder ? 0 : Math.ceil(remaining / step) * step,
      done: done && !placeholder,
      placeholder,
    });
  // A block wrapper keeps the flex layout; the inline one stays in the text flow.
  const Inner = Tag;

  return (
    <Tag
      ref={ref as never}
      role="timer"
      aria-label={placeholder ? undefined : done && typeof completed === "string" ? completed : spoken}
      data-done={(done && !placeholder) || undefined}
      className={cn(
        render ? "tabular-nums" : variant === "blocks" ? "inline-flex gap-2" : "inline-flex items-baseline gap-1 tabular-nums",
        Tag === "div" && !render && "flex",
        className,
      )}
      {...props}
    >
      {done && completed && !placeholder ? (
        <Inner aria-hidden>{completed}</Inner>
      ) : render ? (
        <Inner aria-hidden>{custom}</Inner>
      ) : variant === "blocks" ? (
        shown.map((unit) => (
          <span key={unit} aria-hidden className="flex min-w-16 flex-col items-center gap-1 rounded-(--nv-card-radius) border border-border bg-surface px-3 py-2 shadow-xs">
            <span className="font-display text-2xl font-semibold tabular-nums leading-none">{digitsOf(unit)}</span>
            <span className="text-xs text-foreground-muted">{format.unitText(unit, placeholder ? 0 : parts[unit], "long")}</span>
          </span>
        ))
      ) : (
        shown.map((unit) => (
          <span key={unit} aria-hidden>
            <span className="font-semibold">{digitsOf(unit)}</span>
            <span className="text-foreground-muted">{format.unitText(unit, placeholder ? 0 : parts[unit], "narrow")}</span>
          </span>
        ))
      )}
    </Tag>
  );
});

/* ------------------------------------------------------------------- Gauge */

type GaugeTone = "primary" | "success" | "warning" | "danger";
const strokeTone: Record<GaugeTone, string> = { primary: "stroke-primary", success: "stroke-success", warning: "stroke-warning", danger: "stroke-danger" };

export interface GaugeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  min?: number;
  max?: number;
  /** Color bands: the arc takes the tone of the first band whose `upTo` the value doesn't exceed. */
  bands?: readonly { upTo: number; tone: GaugeTone }[];
  tone?: GaugeTone;
  /** Diameter in px. */
  size?: number;
  /** Arc width in px. */
  thickness?: number;
  /** Text under the value, e.g. "CPU". */
  label?: ReactNode;
  /** Formats the value in the middle. Defaults to a rounded percentage. */
  formatValue?: (value: number) => string;
  /** Required: what the gauge measures, e.g. "CPU usage". */
  "aria-label": string;
}

/** Endpoints of a 240° arc that opens at the bottom. */
function arcPath(size: number, thickness: number) {
  const r = (size - thickness) / 2;
  const c = size / 2;
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(c + r * Math.cos(rad)).toFixed(2)} ${(c + r * Math.sin(rad)).toFixed(2)}`;
  };
  return `M ${point(-120)} A ${r} ${r} 0 1 1 ${point(120)}`;
}

/**
 * A 240° dial for a single value in a range, with optional color bands
 * (e.g. green → amber → red). Exposed as a `role="meter"`, and the value is
 * always printed, so it never relies on color alone.
 */
export const Gauge = forwardRef<HTMLDivElement, GaugeProps>(function Gauge(
  { value, min = 0, max = 100, bands, tone = "primary", size = 160, thickness = 14, label, formatValue = (v) => `${Math.round(v)}%`, className, ...props },
  ref,
) {
  const clamped = Math.min(max, Math.max(min, value));
  const pct = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
  const activeTone = bands?.find((b) => clamped <= b.upTo)?.tone ?? bands?.at(-1)?.tone ?? tone;
  const d = arcPath(size, thickness);
  const text = formatValue(clamped);

  return (
    <div
      ref={ref}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={text}
      className={cn("relative inline-flex flex-col items-center", className)}
      style={{ width: size }}
      {...props}
    >
      <svg aria-hidden width={size} height={size * 0.86} viewBox={`0 0 ${size} ${size * 0.86}`} className="overflow-visible">
        <path d={d} fill="none" strokeWidth={thickness} strokeLinecap="round" className="stroke-surface-active" />
        <path
          d={d}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
          className={cn(strokeTone[activeTone], "transition-[stroke-dasharray,stroke] duration-(--nv-duration-slow) ease-(--nv-ease-out) motion-reduce:transition-none")}
          // A zero-length round cap still draws a dot; hide it at the minimum.
          opacity={pct === 0 ? 0 : 1}
        />
      </svg>
      <div aria-hidden className="absolute inset-x-0 flex flex-col items-center" style={{ top: size * 0.32 }}>
        <span className="font-display text-2xl font-semibold tabular-nums leading-tight">{text}</span>
        {label ? <span className="text-xs text-foreground-muted">{label}</span> : null}
      </div>
    </div>
  );
});
