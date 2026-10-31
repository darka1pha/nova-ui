"use client";

import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { useLocale, useOptionalTheme } from "../theme/theme-provider.tsx";

const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ Reveal */

const revealAnimations = {
  up: "animate-ks-reveal-up",
  fade: "animate-ks-reveal-fade",
  zoom: "animate-ks-reveal-zoom",
  blur: "animate-ks-reveal-blur",
} as const;

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** How content enters. */
  animation?: keyof typeof revealAnimations;
  /** Delay in ms — use `index * 80` to stagger a list. */
  delay?: number;
  /** Reveal again each time it re-enters the viewport. */
  repeat?: boolean;
  /** Portion of the element that must be visible, 0–1. */
  threshold?: number;
}

/**
 * Animates content in as it scrolls into view. Server-rendered and no-JS
 * output is fully visible; content is only hidden once JavaScript knows it is
 * off screen, so nothing can get stuck invisible.
 */
export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { animation = "up", delay = 0, repeat = false, threshold = 0.15, className, style, ...props },
  ref,
) {
  const local = useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(ref, local);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = local.current;
    if (!el || typeof IntersectionObserver === "undefined" || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setState("shown");
          if (!repeat) observer.disconnect();
        } else {
          setState((s) => (s === "shown" && !repeat ? s : "hidden"));
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [repeat, threshold]);

  return (
    <div
      ref={composed}
      data-reveal={state}
      className={cn(state === "hidden" && "opacity-0", state === "shown" && revealAnimations[animation], className)}
      style={delay ? { animationDelay: `${delay}ms`, ...style } : style}
      {...props}
    />
  );
});

/* ---------------------------------------------------------- AnimatedNumber */

export interface AnimatedNumberProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  /** Intl formatting, e.g. `{ style: "currency", currency: "USD" }`. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Milliseconds for the count. */
  duration?: number;
}

/**
 * Counts smoothly to a number whenever it changes. Screen readers get the
 * final value only (the ticking digits are hidden from them).
 */
export const AnimatedNumber = forwardRef<HTMLSpanElement, AnimatedNumberProps>(function AnimatedNumber(
  { value, format, locale: localeProp, duration = 900, className, ...props },
  ref,
) {
  const { locale } = useLocale(localeProp);
  const formatter = new Intl.NumberFormat(locale, format);
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value || prefersReducedMotion()) {
      from.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - t) ** 4;
      const current = start + (value - start) * eased;
      setDisplay(current);
      from.current = current;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const decimals = format?.maximumFractionDigits ?? (Number.isInteger(value) ? 0 : 2);
  const shown = decimals === 0 && !format?.style ? Math.round(display) : display;
  return (
    <span ref={ref} className={cn("tabular-nums", className)} {...props}>
      <span aria-hidden>{formatter.format(shown)}</span>
      <span className="sr-only">{formatter.format(value)}</span>
    </span>
  );
});

/* ----------------------------------------------------------------- Marquee */

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds for one full loop. */
  duration?: number;
  /** Space between items, e.g. "2rem". */
  gap?: string;
  reverse?: boolean;
  /** Pause while hovered or focused (default true). */
  pauseOnHover?: boolean;
  /** Fade the edges into the background. */
  fade?: boolean;
  children: ReactNode;
}

/**
 * An endlessly scrolling row (logos, testimonials). Pauses on hover and focus,
 * and becomes a static, wrapping row under reduced motion.
 */
export const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  { duration = 30, gap = "2rem", reverse = false, pauseOnHover = true, fade = true, className, children, style, ...props },
  ref,
) {
  const dir = useOptionalTheme()?.dir;
  const group = "flex shrink-0 items-center gap-(--ks-marquee-gap) motion-reduce:flex-wrap motion-reduce:justify-center";
  return (
    <div
      ref={ref}
      className={cn(
        "group/marquee relative flex overflow-hidden",
        fade && "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
      style={{ "--ks-marquee-gap": gap, "--ks-marquee-duration": `${duration}s`, ...style } as CSSProperties}
      {...props}
    >
      {/* The track always runs left-to-right; each copy keeps the page's text direction. */}
      <div
        dir="ltr"
        className={cn(
          "flex w-max gap-(--ks-marquee-gap) animate-ks-marquee motion-reduce:w-full motion-reduce:animate-none",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]",
        )}
      >
        <div className={group} dir={dir}>
          {children}
        </div>
        <div className={cn(group, "motion-reduce:hidden")} dir={dir} aria-hidden inert>
          {children}
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------ GradientText */

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  /** Slowly pan the gradient. */
  animate?: boolean;
  gradient?: "vivid" | "brand";
}

/** Text filled with the theme's gradient. */
export const GradientText = forwardRef<HTMLSpanElement, GradientTextProps>(function GradientText({ animate = false, gradient = "vivid", className, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={cn(
        "bg-clip-text text-transparent [-webkit-text-fill-color:transparent] bg-[length:200%_auto]",
        gradient === "vivid" ? "bg-(image:--ks-gradient-vivid)" : "bg-(image:--ks-gradient-brand)",
        animate && "motion-safe:animate-ks-gradient-pan",
        className,
      )}
      {...props}
    />
  );
});

/* ----------------------------------------------------------- SpotlightCard */

export interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Spotlight color; defaults to the primary intent. */
  color?: string;
}

/**
 * A card with a soft light that follows the pointer, plus a matching border
 * glow. Purely decorative: content and focus behave like a normal card.
 */
export const SpotlightCard = forwardRef<HTMLDivElement, SpotlightCardProps>(function SpotlightCard({ color, className, style, onPointerMove, children, ...props }, ref) {
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--ks-spot-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--ks-spot-y", `${e.clientY - rect.top}px`);
    onPointerMove?.(e);
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      className={cn(
        "group/spot relative isolate overflow-hidden rounded-(--ks-card-radius) border border-border bg-surface p-(--ks-card-padding) text-foreground shadow-sm",
        "transition-[translate,box-shadow,border-color] duration-(--ks-duration-slow) ease-(--ks-ease-interactive) hover:translate-y-(--ks-hover-lift) hover:border-primary-border hover:shadow-lg motion-reduce:hover:translate-y-0",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-(--ks-duration-slow) hover:before:opacity-100",
        "before:bg-[radial-gradient(28rem_circle_at_var(--ks-spot-x,50%)_var(--ks-spot-y,50%),color-mix(in_srgb,var(--ks-spot-color)_16%,transparent),transparent_45%)]",
        className,
      )}
      style={{ "--ks-spot-color": color ?? "var(--ks-color-primary-solid)", ...style } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
});

/* ---------------------------------------------------------- AnimatedBorder */

export interface AnimatedBorderProps extends HTMLAttributes<HTMLDivElement> {
  /** Border thickness in px. */
  width?: number;
  /** Seconds per rotation. */
  speed?: number;
}

/**
 * Frames content with a rotating gradient border in the theme's colors —
 * for featured plans, "new" callouts and hero cards. Static under reduced motion.
 */
export const AnimatedBorder = forwardRef<HTMLDivElement, AnimatedBorderProps>(function AnimatedBorder({ width = 2, speed = 4, className, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-(--ks-card-radius) border-transparent bg-origin-border motion-safe:animate-ks-spin-border",
        "[background:linear-gradient(var(--ks-color-surface),var(--ks-color-surface))_padding-box,conic-gradient(from_var(--ks-angle),var(--ks-color-primary-solid),var(--ks-color-secondary-solid),var(--ks-color-accent-solid),var(--ks-color-primary-solid))_border-box]",
        className,
      )}
      style={{ borderWidth: width, borderStyle: "solid", animationDuration: `${speed}s`, ...style }}
      {...props}
    />
  );
});
