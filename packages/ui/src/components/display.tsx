"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Children,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { AnimatedNumber } from "./motion.tsx";
import { focusRing, pressable, transition } from "./shared.ts";

type Tone = "primary" | "success" | "warning" | "danger" | "info" | "gradient";

/* -------------------------------------------------------- CircularProgress */

const ringStroke: Record<Tone, string> = {
  primary: "stroke-primary",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
  info: "stroke-info",
  gradient: "",
};

export interface CircularProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** 0–max; omit for an indeterminate spinner ring. */
  value?: number | null;
  max?: number;
  /** Diameter in px. */
  size?: number;
  thickness?: number;
  tone?: Tone;
  /** Content in the middle; defaults to the percentage when determinate. */
  label?: ReactNode;
  showValue?: boolean;
}

/** A ring that fills smoothly as `value` changes. Exposes progressbar semantics. */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(function CircularProgress(
  { value = null, max = 100, size = 64, thickness = 6, tone = "gradient", label, showValue = true, className, ...props },
  ref,
) {
  const gradientId = useId();
  const r = (size - thickness) / 2;
  const pct = value === null ? null : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className={cn("-rotate-90", pct === null && "animate-nv-spin")} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--nv-color-primary-solid)" />
            <stop offset="55%" stopColor="var(--nv-color-secondary-solid)" />
            <stop offset="100%" stopColor="var(--nv-color-accent-solid)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-surface-active" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={pct === null ? 72 : 100 - pct}
          stroke={tone === "gradient" ? `url(#${gradientId})` : undefined}
          className={cn(ringStroke[tone], "transition-[stroke-dashoffset] duration-(--nv-duration-slowest) ease-(--nv-ease-out)")}
        />
      </svg>
      {label ?? (showValue && pct !== null) ? (
        <span className="absolute text-xs font-semibold tabular-nums text-foreground">{label ?? `${Math.round(pct ?? 0)}%`}</span>
      ) : null}
    </div>
  );
});

/* ----------------------------------------------------------------- Stepper */

export interface StepperStep {
  title: ReactNode;
  description?: ReactNode;
}

export interface StepperProps extends Omit<HTMLAttributes<HTMLOListElement>, "onChange"> {
  steps: StepperStep[];
  /** Index of the current step. Steps before it are complete. */
  current: number;
  orientation?: "horizontal" | "vertical";
  /** Make completed steps clickable (e.g. to go back). */
  onStepClick?: (index: number) => void;
  /** Accessible status words, for localization. */
  labels?: { complete?: string; current?: string; upcoming?: string };
}

/**
 * Progress through a multi-step flow. Completed steps draw a check mark, the
 * current one pulses softly, and connectors fill as you advance.
 */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  { steps, current, orientation = "horizontal", onStepClick, labels, className, ...props },
  ref,
) {
  const vertical = orientation === "vertical";
  return (
    <ol ref={ref} className={cn("flex", vertical ? "flex-col" : "w-full items-start", className)} {...props}>
      {steps.map((step, i) => {
        const state = i < current ? "complete" : i === current ? "current" : "upcoming";
        const last = i === steps.length - 1;
        const marker = (
          <span
            className={cn(
              "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
              transition,
              state === "complete" && "border-primary bg-primary text-primary-on-solid",
              state === "current" && "border-primary bg-surface text-primary-text motion-safe:animate-nv-ring-pulse",
              state === "upcoming" && "border-border-strong bg-surface text-foreground-muted",
            )}
          >
            {state === "complete" ? (
              <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-none stroke-current stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" pathLength={24} strokeDasharray={24} className="animate-nv-check-draw" />
              </svg>
            ) : (
              i + 1
            )}
          </span>
        );
        const text = (
          <span className={cn("flex min-w-0 flex-col gap-0.5", vertical ? "pb-6 pt-1" : "mt-2 items-center px-1 text-center")}>
            <span className={cn("text-sm font-semibold", state === "upcoming" ? "text-foreground-muted" : "text-foreground")}>{step.title}</span>
            {step.description ? <span className="text-xs text-foreground-muted">{step.description}</span> : null}
            <span className="sr-only">{labels?.[state] ?? state}</span>
          </span>
        );
        return (
          <li
            key={i}
            aria-current={state === "current" ? "step" : undefined}
            className={cn("relative flex", vertical ? "gap-3" : "flex-1 flex-col items-center")}
          >
            {!last ? (
              // Connector: a track plus a fill that grows when the step completes.
              <span
                aria-hidden
                className={cn("absolute bg-border", vertical ? "start-[15px] top-8 bottom-0 w-0.5" : "start-[calc(50%+1rem)] end-[calc(-50%+1rem)] top-[15px] h-0.5")}
              >
                <span
                  className={cn(
                    "absolute inset-0 bg-primary transition-transform duration-(--nv-duration-slowest) ease-(--nv-ease-out)",
                    vertical ? "origin-top" : "origin-left rtl:origin-right",
                    state === "complete" ? "scale-100" : vertical ? "scale-y-0" : "scale-x-0",
                  )}
                />
              </span>
            ) : null}
            {onStepClick && state === "complete" ? (
              <button
                type="button"
                onClick={() => onStepClick(i)}
                className={cn("flex rounded-md text-start", vertical ? "gap-3" : "flex-col items-center", focusRing, pressable)}
              >
                {marker}
                {text}
              </button>
            ) : (
              <>
                {marker}
                {text}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
});

/* ---------------------------------------------------------------- Timeline */

const timelineDot: Record<Exclude<Tone, "gradient"> | "neutral", string> = {
  neutral: "bg-surface-active text-foreground-secondary",
  primary: "bg-primary-subtle text-primary-text ring-primary-border",
  success: "bg-success-subtle text-success-text ring-success-border",
  warning: "bg-warning-subtle text-warning-text ring-warning-border",
  danger: "bg-danger-subtle text-danger-text ring-danger-border",
  info: "bg-info-subtle text-info-text ring-info-border",
};

export interface TimelineItem {
  title: ReactNode;
  description?: ReactNode;
  time?: ReactNode;
  /** ISO date for the <time> element. */
  dateTime?: string;
  icon?: ReactNode;
  tone?: keyof typeof timelineDot;
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[];
}

/** A vertical sequence of events (activity feeds, order history). */
export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline({ items, className, ...props }, ref) {
  return (
    <ol ref={ref} className={cn("flex flex-col", className)} {...props}>
      {items.map((item, i) => (
        <li key={i} className="group/item relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 ? <span aria-hidden className="absolute start-4 top-9 bottom-1 w-px -translate-x-1/2 rtl:translate-x-1/2 bg-border" /> : null}
          <span
            aria-hidden
            className={cn(
              "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border [&_svg]:size-4",
              "transition-[scale] duration-(--nv-duration-slow) ease-(--nv-ease-interactive) group-hover/item:scale-110 motion-reduce:group-hover/item:scale-100",
              timelineDot[item.tone ?? "neutral"],
            )}
          >
            {item.icon ?? <span className="size-2 rounded-full bg-current" />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.time ? (
                <time dateTime={item.dateTime} className="text-xs text-foreground-muted">
                  {item.time}
                </time>
              ) : null}
            </div>
            {item.description ? <div className="text-sm text-foreground-secondary">{item.description}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
});

/* -------------------------------------------------------------- Sparkline */

export interface SparklineProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  data: number[];
  /** Accessible summary, e.g. "Revenue, last 12 weeks, up 18%". */
  label: string;
  tone?: Exclude<Tone, "gradient">;
  height?: number;
  /** Shade the area under the line. */
  area?: boolean;
}

const sparkStroke: Record<Exclude<Tone, "gradient">, string> = {
  primary: "var(--nv-color-primary-solid)",
  success: "var(--nv-color-success-solid)",
  warning: "var(--nv-color-warning-solid)",
  danger: "var(--nv-color-danger-solid)",
  info: "var(--nv-color-info-solid)",
};

/** A tiny trend line that draws itself in. */
export const Sparkline = forwardRef<HTMLDivElement, SparklineProps>(function Sparkline({ data, label, tone = "primary", height = 40, area = true, className, ...props }, ref) {
  const gradientId = useId();
  const w = 100;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = hi - lo || 1;
  const pts = data.map((v, i) => [data.length === 1 ? w / 2 : (i / (data.length - 1)) * w, height - 3 - ((v - lo) / span) * (height - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const color = sparkStroke[tone];
  return (
    <div ref={ref} role="img" aria-label={label} className={cn("w-full", className)} {...props}>
      {/* Wipes in left-to-right; a clip works with the non-scaling stroke where dash tricks would break. */}
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="block w-full overflow-visible animate-nv-wipe" style={{ height }} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {area && data.length > 1 ? <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${gradientId})`} /> : null}
        <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

/* -------------------------------------------------------------------- Stat */

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  /** A number counts up with AnimatedNumber; any other node renders as-is. */
  value: number | ReactNode;
  format?: Intl.NumberFormatOptions;
  /** Percentage change; positive renders as an increase. */
  delta?: number;
  /** For metrics where down is good (churn, latency). */
  invertDelta?: boolean;
  helpText?: ReactNode;
  icon?: ReactNode;
  /** Optional trend data rendered as a Sparkline. */
  trend?: number[];
  locale?: string;
}

/** A key metric with its change and optional trend. */
export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(
  { label, value, format, delta, invertDelta = false, helpText, icon, trend, locale: localeProp, className, ...props },
  ref,
) {
  const { locale } = useLocale(localeProp);
  const good = delta === undefined ? null : invertDelta ? delta <= 0 : delta >= 0;
  // Intl places the sign and percent per locale (and adds direction marks, so "+۱۲٫۵٪" stays intact in RTL).
  const deltaText =
    delta === undefined ? null : new Intl.NumberFormat(locale, { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 1 }).format(delta / 100);
  return (
    <div
      ref={ref}
      data-slot="card"
      data-variant="elevated"
      className={cn(
        "group/stat flex flex-col gap-2 rounded-(--nv-card-radius) border border-border bg-surface p-(--nv-card-padding) shadow-sm",
        "transition-[translate,box-shadow] duration-(--nv-duration-slow) ease-(--nv-ease-interactive) hover:translate-y-(--nv-hover-lift) hover:shadow-md motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        {icon ? (
          <span aria-hidden className="flex size-8 items-center justify-center rounded-md bg-primary-subtle text-primary-text transition-transform duration-(--nv-duration-slow) ease-(--nv-ease-interactive) group-hover/stat:rotate-[-8deg] group-hover/stat:scale-110 [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="font-display text-3xl font-bold tracking-(--nv-tracking-tight) text-foreground">
        {typeof value === "number" ? <AnimatedNumber value={value} format={format} locale={locale} /> : value}
      </p>
      {deltaText || helpText ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {deltaText ? (
            <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold", good ? "bg-success-subtle text-success-on-subtle" : "bg-danger-subtle text-danger-on-subtle")}>
              {(delta ?? 0) >= 0 ? <ArrowUpRight aria-hidden className="size-3.5" /> : <ArrowDownRight aria-hidden className="size-3.5" />}
              {deltaText}
            </span>
          ) : null}
          {helpText ? <span className="text-foreground-muted">{helpText}</span> : null}
        </div>
      ) : null}
      {trend && trend.length > 1 ? <Sparkline data={trend} label={`Trend for ${typeof label === "string" ? label : "metric"}`} tone={good === false ? "danger" : "primary"} /> : null}
    </div>
  );
});

/* ------------------------------------------------------------------ Banner */

const bannerVariants = cva("relative flex w-full items-center justify-center gap-3 px-4 py-2.5 text-sm animate-nv-slide-down", {
  variants: {
    variant: {
      gradient: "bg-(image:--nv-gradient-vivid) bg-[length:200%_100%] text-primary-on-solid motion-safe:animate-nv-gradient-pan",
      primary: "bg-primary text-primary-on-solid",
      info: "bg-info-subtle text-info-on-subtle border-b border-info-border",
      warning: "bg-warning-subtle text-warning-on-subtle border-b border-warning-border",
      danger: "bg-danger-subtle text-danger-on-subtle border-b border-danger-border",
      neutral: "bg-neutral text-neutral-on-solid",
    },
  },
  defaultVariants: { variant: "gradient" },
});

export interface BannerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof bannerVariants> {
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}

/** A full-width announcement bar for the top of a page or app. */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner({ variant, action, onDismiss, dismissLabel = "Dismiss", className, children, ...props }, ref) {
  return (
    <div ref={ref} role="region" aria-label="Announcement" className={cn(bannerVariants({ variant }), onDismiss && "pe-12", className)} {...props}>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-medium">{children}</div>
      {action}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn("absolute end-2 inline-flex size-7 items-center justify-center rounded-sm opacity-80 hover:bg-black/10 hover:opacity-100 [&_svg]:size-4", focusRing)}
        >
          <X />
        </button>
      ) : null}
    </div>
  );
});

/* ---------------------------------------------------------------- Carousel */

export interface CarouselProps extends HTMLAttributes<HTMLElement> {
  /** Accessible name for the carousel region. */
  label: string;
  /** Slide width as CSS, e.g. "100%", "80%" or "18rem". */
  slideSize?: string;
  gap?: string;
  /** Advance automatically (pauses on hover/focus; off under reduced motion). */
  autoPlay?: number | false;
  showDots?: boolean;
  labels?: { previous?: string; next?: string; goTo?: (n: number) => string; slide?: (n: number, total: number) => string };
  children: ReactNode;
}

/**
 * A swipeable, scroll-snapping carousel. Native scrolling (touch, trackpad,
 * keyboard) plus previous/next buttons and dots. Follows the ARIA carousel pattern.
 */
export const Carousel = forwardRef<HTMLElement, CarouselProps>(function Carousel(
  { label, slideSize = "100%", gap = "1rem", autoPlay = false, showDots = true, labels, className, children, ...props },
  ref,
) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Whether the track can scroll further back / forward. Drives the buttons, so they
  // stay right when several slides are visible at once (index alone can't tell).
  const [edges, setEdges] = useState({ start: true, end: slides.length <= 1 });
  const [paused, setPaused] = useState(false);
  // The slide a button scroll is heading to, so quick repeat clicks step on from
  // there instead of from wherever the smooth scroll has reached.
  const target = useRef<number | null>(null);

  /** Signed distance from the track's leading edge (left, or right in RTL) to a slide's. */
  const offsetOf = (el: HTMLElement, slide: HTMLElement) => {
    const box = el.getBoundingClientRect();
    const rect = slide.getBoundingClientRect();
    return getComputedStyle(el).direction === "rtl" ? rect.right - box.right : rect.left - box.left;
  };

  // The current slide is the one aligned with the leading edge, read from the scroll
  // position. (Visibility can't decide it: with narrow slides several are visible.)
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    let best = 0;
    let distance = Infinity;
    el.querySelectorAll<HTMLElement>("[data-index]").forEach((slide, i) => {
      const d = Math.abs(offsetOf(el, slide));
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    // scrollLeft is negative in RTL; the distance travelled is what matters.
    const position = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    if (target.current === best && distance < 2) target.current = null;
    setIndex(best);
    setEdges({ start: position <= 1, end: position >= max - 1 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    // A swipe, wheel or key scroll takes over from any button scroll in flight.
    const release = () => {
      target.current = null;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", release, { passive: true });
    el.addEventListener("wheel", release, { passive: true });
    el.addEventListener("keydown", release);
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", release);
      el.removeEventListener("wheel", release);
      el.removeEventListener("keydown", release);
      resize?.disconnect();
    };
  }, [measure, slides.length]);

  const goTo = useCallback(
    (i: number) => {
      const el = track.current;
      const n = (i + slides.length) % slides.length;
      const slide = el?.querySelector<HTMLElement>(`[data-index="${n}"]`);
      if (!el || !slide) return;
      target.current = n;
      // Scroll the track only: scrollIntoView would also scroll the page to the carousel.
      const left = el.scrollLeft + offsetOf(el, slide);
      const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      if (typeof el.scrollTo === "function") el.scrollTo({ left, behavior });
      else el.scrollLeft = left;
    },
    [slides.length],
  );

  useEffect(() => {
    if (!autoPlay || paused || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // At the end, wrap to the first slide.
    const t = setInterval(() => goTo(edges.end ? 0 : index + 1), autoPlay);
    return () => clearInterval(t);
  }, [autoPlay, paused, index, edges.end, goTo]);

  const nav = cn(
    "absolute top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground shadow-md backdrop-blur-sm hover:scale-110 disabled:opacity-0 [&_svg]:size-4",
    focusRing,
    transition,
    pressable,
  );

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn("group/carousel relative flex flex-col gap-3", className)}
      {...props}
    >
      <div className="relative">
        <div
          ref={track}
          // Focusable so keyboard users can scroll it with the arrow keys.
          tabIndex={0}
          aria-live={autoPlay && !paused ? "off" : "polite"}
          className={cn("flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-lg [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden", focusRing)}
          style={{ gap }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              data-index={i}
              role="group"
              aria-roledescription="slide"
              aria-label={labels?.slide?.(i + 1, slides.length) ?? `${i + 1} of ${slides.length}`}
              className="shrink-0 snap-start"
              style={{ width: slideSize }}
            >
              {slide}
            </div>
          ))}
        </div>
        <button type="button" className={cn(nav, "start-2")} aria-label={labels?.previous ?? "Previous slide"} disabled={edges.start} onClick={() => goTo(Math.max(0, (target.current ?? index) - 1))}>
          <ChevronLeft className="rtl:-scale-x-100" />
        </button>
        <button type="button" className={cn(nav, "end-2")} aria-label={labels?.next ?? "Next slide"} disabled={edges.end} onClick={() => goTo(Math.min(slides.length - 1, (target.current ?? index) + 1))}>
          <ChevronRight className="rtl:-scale-x-100" />
        </button>
      </div>
      {showDots ? (
        <div className="flex justify-center">
          {slides.map((_, i) => (
            // A 24px hit area around a small animated pill (WCAG 2.5.8 target size).
            <button
              key={i}
              type="button"
              aria-label={labels?.goTo?.(i + 1) ?? `Go to slide ${i + 1}`}
              aria-current={i === index || undefined}
              onClick={() => goTo(i)}
              className={cn("group/dot flex h-6 min-w-6 items-center justify-center rounded-full", focusRing)}
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-[width,background-color] duration-(--nv-duration-slow) ease-(--nv-ease-interactive)",
                  i === index ? "w-6 bg-primary" : "w-2 bg-border-strong group-hover/dot:bg-foreground-muted",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
});
