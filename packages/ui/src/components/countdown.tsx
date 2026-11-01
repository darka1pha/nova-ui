"use client";

import { forwardRef, useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";

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

export interface CountdownProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
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
}

/**
 * Time left until a moment, ticking every second (or minute without seconds).
 * Unit labels come from Intl, so they're localized. It's a `role="timer"`
 * whose accessible name updates once a minute, so screen readers aren't flooded.
 */
export const Countdown = forwardRef<HTMLDivElement, CountdownProps>(function Countdown(
  { to, onComplete, variant = "blocks", showSeconds = true, completed, locale: localeProp, className, ...props },
  ref,
) {
  const { locale } = useLocale(localeProp);
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, target - now);
  const done = remaining <= 0;
  const step = showSeconds ? MS.second : MS.minute;
  const fired = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    fired.current = false;
  }, [target]);

  useEffect(() => {
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
  }, [now, done, remaining, step]);

  // Round up, like any countdown: 1:02 stays on screen until a full second has passed.
  const parts = splitDuration(Math.ceil(remaining / step) * step);
  const shown = UNITS.filter((u) => (u === "day" ? parts.day > 0 : u === "second" ? showSeconds : true));

  const format = useMemo(() => {
    const unitText = (unit: Unit, value: number, display: "long" | "narrow") =>
      new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: display }).formatToParts(value).find((p) => p.type === "unit")?.value.trim() ?? unit;
    const full = (unit: Unit, value: number) => new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(value);
    const digits = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
    return { unitText, full, digits };
  }, [locale]);

  // Minute precision for the spoken label: "2 days, 4 hours, 9 minutes".
  const spokenUnits = UNITS.filter((u) => u !== "second" && (u !== "day" || parts.day > 0));
  const spoken = new Intl.ListFormat(locale, { type: "unit", style: "long" }).format(spokenUnits.map((u) => format.full(u, parts[u])));

  return (
    <div
      ref={ref}
      role="timer"
      aria-label={done && typeof completed === "string" ? completed : spoken}
      data-done={done || undefined}
      className={cn(variant === "blocks" ? "inline-flex gap-2" : "inline-flex items-baseline gap-1 tabular-nums", className)}
      {...props}
    >
      {done && completed ? (
        <span aria-hidden>{completed}</span>
      ) : variant === "blocks" ? (
        shown.map((unit) => (
          <span key={unit} aria-hidden className="flex min-w-16 flex-col items-center gap-1 rounded-(--nv-card-radius) border border-border bg-surface px-3 py-2 shadow-xs">
            <span className="font-display text-2xl font-semibold tabular-nums leading-none">{format.digits.format(parts[unit])}</span>
            <span className="text-xs text-foreground-muted">{format.unitText(unit, parts[unit], "long")}</span>
          </span>
        ))
      ) : (
        shown.map((unit) => (
          <span key={unit} aria-hidden>
            <span className="font-semibold">{unit === "day" ? parts.day : format.digits.format(parts[unit])}</span>
            <span className="text-foreground-muted">{format.unitText(unit, parts[unit], "narrow")}</span>
          </span>
        ))
      )}
    </div>
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
  thickness?: number;
  /** Text under the value, e.g. "CPU". */
  label?: ReactNode;
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
