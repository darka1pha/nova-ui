"use client";

import { palette, type PaletteName } from "@darkalpha/nova-tokens";
import { ChevronRight } from "lucide-react";
import { forwardRef, useId, useMemo, type AnchorHTMLAttributes, type CSSProperties, type HTMLAttributes, type MouseEventHandler, type ReactNode, type Ref } from "react";
import { cn } from "../utils/cn.ts";
import { focusRing } from "./shared.ts";

/*
 * ModuleCard: a launcher tile for one area of an app (imports, exports, reports,
 * settings…). A soft tinted surface with a wave in the corner, a large icon,
 * title and description, and a round arrow that moves forward on hover. Each
 * card takes its own tone, so a grid of them reads as distinct modules.
 */

/** `primary` follows the theme; the rest are fixed palette hues. */
export type ModuleCardTone = "primary" | "violet" | "blue" | "sky" | "cyan" | "teal" | "mint" | "green" | "amber" | "orange" | "coral" | "pink" | "magenta";

type ToneVars = Record<"--mc-tint" | "--mc-wave" | "--mc-accent" | "--mc-chip" | "--mc-chip-fg" | "--mc-glow", string>;

/** Tint and wave stay light in light mode; in dark mode they mix the hue into the surface so text keeps its contrast. */
function paletteTone(name: PaletteName): ToneVars {
  const p = palette[name];
  return {
    "--mc-tint": `light-dark(${p[100]}, color-mix(in srgb, ${p[900]} 45%, var(--nv-color-surface)))`,
    "--mc-wave": `light-dark(${p[200]}, color-mix(in srgb, ${p[700]} 32%, var(--nv-color-surface)))`,
    "--mc-accent": `light-dark(${p[600]}, ${p[300]})`,
    "--mc-chip": `light-dark(color-mix(in srgb, ${p[200]} 65%, transparent), color-mix(in srgb, ${p[400]} 22%, transparent))`,
    "--mc-chip-fg": `light-dark(${p[800]}, ${p[100]})`,
    "--mc-glow": `color-mix(in srgb, ${p[500]} 38%, transparent)`,
  };
}

const primaryTone: ToneVars = {
  "--mc-tint": "var(--nv-color-primary-subtle)",
  "--mc-wave": "color-mix(in srgb, var(--nv-color-primary-border) 80%, var(--nv-color-primary-subtle))",
  "--mc-accent": "var(--nv-color-primary-text)",
  "--mc-chip": "color-mix(in srgb, var(--nv-color-primary-border) 55%, transparent)",
  "--mc-chip-fg": "var(--nv-color-primary-on-subtle)",
  "--mc-glow": "color-mix(in srgb, var(--nv-color-primary-solid) 35%, transparent)",
};

const toneVars = (tone: ModuleCardTone): ToneVars => (tone === "primary" ? primaryTone : paletteTone(tone));

const sizes = {
  md: { card: "min-h-36 gap-4 p-5", icon: "size-16 [&_svg]:size-14", title: "text-lg", arrow: "size-10 [&_svg]:size-5" },
  lg: { card: "min-h-44 gap-5 p-6", icon: "size-20 [&_svg]:size-[4.5rem]", title: "text-xl", arrow: "size-11 [&_svg]:size-5" },
} as const;

interface ModuleCardBaseProps {
  /** The module's name. */
  title: ReactNode;
  /** One line on what it covers. */
  description?: ReactNode;
  /** A large illustration, usually a Nova icon in its `soft` variant. It takes the tone's accent color. */
  icon?: ReactNode;
  /** The card's hue. Defaults to "primary", which follows the theme. */
  tone?: ModuleCardTone;
  /** A count or label in the top corner, e.g. "12" or "New". */
  badge?: ReactNode;
  /** `md` (default) or `lg`. */
  size?: keyof typeof sizes;
  /** Show the round arrow. Defaults to true when the card is a link or button. */
  arrow?: boolean;
  /**
   * Seed for the corner wave's hills, or `false` for no wave. The same seed always
   * draws the same wave, so it is stable across renders and server rendering.
   * Defaults to the title when it is a string, so each module gets its own wave.
   */
  wave?: number | string | false;
}

export interface ModuleCardProps extends ModuleCardBaseProps, Omit<HTMLAttributes<HTMLElement>, "title" | "onClick"> {
  /** Makes the whole card a link. */
  href?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: string;
  /** Makes the whole card a button when there is no `href`. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Dims the card and blocks interaction. */
  disabled?: boolean;
}

/* ------------------------------------------------------------------ Wave */

/** FNV-1a: a short, stable hash of the seed. */
function hashSeed(seed: number | string): number {
  const text = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: a tiny seeded generator, so the same seed draws the same hills. */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 240;
const H = 120;
const round = (n: number) => Math.round(n * 10) / 10;

/**
 * One wave layer rising from the start edge: alternating troughs and crests,
 * `hills` crests in all, then a long tail that comes down onto the bottom edge
 * at `end`. Every point has a flat tangent, including the landing, so the curve
 * is smooth, never overshoots its band and meets the bottom without a corner.
 */
function wavePath(rand: () => number, hills: number, crest: [number, number], trough: [number, number], end: number): string {
  const count = hills * 2;
  const pick = ([lo, hi]: [number, number]) => lo + rand() * (hi - lo);
  // The hills share the first 85% of the run; the rest is the tail down to the bottom.
  const step = (end * 0.85) / count;
  let x0 = 0;
  let y0 = pick(trough);
  let d = `M0 ${H}L0 ${round(y0)}`;
  const curve = (x1: number, y1: number) => {
    const mid = (x1 - x0) / 2;
    d += `C${round(x0 + mid)} ${round(y0)} ${round(x1 - mid)} ${round(y1)} ${round(x1)} ${round(y1)}`;
    x0 = x1;
    y0 = y1;
  };
  for (let i = 1; i < count; i++) curve((i + (rand() - 0.5) * 0.3) * step, pick(i % 2 === 0 ? trough : crest));
  curve(end, H);
  return `${d}Z`;
}

/**
 * The two layers for a seed, like the corner wave they grew from: a taller,
 * fainter one behind that comes down between 62% and 88% of the width, and a
 * lower, fuller one in front that comes down between 45% and 72%. Each has one
 * or two crests.
 */
function wavePaths(seed: number | string): [string, string] {
  const rand = seededRandom(hashSeed(seed));
  const back = wavePath(rand, 1 + Math.floor(rand() * 2), [32, 46], [52, 66], W * (0.62 + rand() * 0.26));
  const front = wavePath(rand, 1 + Math.floor(rand() * 2), [64, 78], [82, 94], W * (0.45 + rand() * 0.27));
  return [back, front];
}

/** Soft hills rising from the card's start corner and coming down part-way across, drawn for the left and mirrored in right-to-left layouts. */
function Wave({ seed }: { seed: number | string }) {
  const [back, front] = useMemo(() => wavePaths(seed), [seed]);
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-3/5 w-full opacity-80 transition-opacity duration-(--nv-duration-slow) group-hover/mc:opacity-100 rtl:-scale-x-100"
    >
      {/* Each layer lands flat on the bottom edge, so the only edge is the curve on top. */}
      <path d={back} fill="var(--mc-wave)" opacity="0.45" />
      <path d={front} fill="var(--mc-wave)" opacity="0.85" />
    </svg>
  );
}

/** A launcher tile for one module of an app: tinted surface, corner wave, large icon, title, description and a forward arrow. */
export const ModuleCard = forwardRef<HTMLElement, ModuleCardProps>(function ModuleCard(
  { title, description, icon, tone = "primary", badge, size = "md", arrow, wave, href, target, rel, onClick, disabled = false, className, style, ...props },
  ref,
) {
  const s = sizes[size];
  const fallbackSeed = useId();
  const waveSeed = wave === false ? null : (wave ?? (typeof title === "string" ? title : fallbackSeed));
  const interactive = !disabled && (href !== undefined || onClick !== undefined);
  const showArrow = arrow ?? (href !== undefined || onClick !== undefined);
  const classes = cn(
    "nv-module-card group/mc relative isolate flex w-full flex-col overflow-hidden rounded-2xl text-start text-foreground",
    "border border-[light-dark(rgb(255_255_255/0.85),rgb(255_255_255/0.08))] backdrop-blur-sm",
    "bg-[linear-gradient(155deg,color-mix(in_srgb,var(--mc-tint)_55%,var(--nv-color-surface))_0%,var(--nv-color-surface)_55%,color-mix(in_srgb,var(--mc-tint)_70%,var(--nv-color-surface))_100%)]",
    "shadow-[0_1px_2px_rgb(10_14_22/0.05),0_14px_32px_-18px_var(--mc-glow)]",
    "transition-[translate,box-shadow] duration-(--nv-duration-slow) ease-(--nv-ease-interactive)",
    interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgb(10_14_22/0.05),0_22px_44px_-18px_var(--mc-glow)] motion-reduce:hover:translate-y-0",
    interactive && focusRing,
    disabled && "pointer-events-none opacity-55",
    s.card,
    className,
  );
  const content = (
    <>
      {waveSeed === null ? null : <Wave seed={waveSeed} />}
      {badge !== undefined && badge !== null ? (
        <span className="absolute end-4 top-4 rounded-full bg-(--mc-chip) px-2 py-0.5 text-xs font-semibold text-(--mc-chip-fg) tabular-nums">{badge}</span>
      ) : null}
      <span className="flex min-w-0 items-start gap-4">
        {icon ? (
          <span
            aria-hidden
            className={cn("grid shrink-0 place-items-center text-(--mc-accent) [&_svg]:drop-shadow-[0_6px_10px_var(--mc-glow)]", s.icon)}
          >
            {icon}
          </span>
        ) : null}
        <span className={cn("flex min-w-0 flex-col gap-1", icon && "pt-2", badge !== undefined && badge !== null && "pe-10")}>
          <span className={cn("font-display font-bold leading-snug", s.title)}>{title}</span>
          {description ? <span className="text-sm text-foreground-muted">{description}</span> : null}
        </span>
      </span>
      {showArrow ? (
        <span
          aria-hidden
          className={cn(
            "mt-auto grid shrink-0 place-items-center self-end rounded-full bg-(--mc-chip) text-(--mc-chip-fg) backdrop-blur-sm",
            "transition-[translate,background-color] duration-(--nv-duration-normal) ease-(--nv-ease-interactive)",
            "group-hover/mc:translate-x-0.5 group-hover/mc:bg-[color-mix(in_srgb,var(--mc-chip)_60%,var(--mc-wave))] rtl:group-hover/mc:-translate-x-0.5 motion-reduce:group-hover/mc:translate-x-0",
            s.arrow,
          )}
        >
          <ChevronRight className="rtl:-scale-x-100" strokeWidth={2.5} />
        </span>
      ) : null}
    </>
  );
  const vars = { ...toneVars(tone), ...style } as CSSProperties;

  if (href !== undefined) {
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={disabled ? undefined : href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        aria-disabled={disabled || undefined}
        onClick={onClick}
        className={classes}
        style={vars}
        {...props}
      >
        {content}
      </a>
    );
  }
  if (onClick !== undefined) {
    return (
      <button ref={ref as Ref<HTMLButtonElement>} type="button" disabled={disabled} onClick={onClick} className={classes} style={vars} {...props}>
        {content}
      </button>
    );
  }
  return (
    <div ref={ref as Ref<HTMLDivElement>} className={classes} style={vars} {...props}>
      {content}
    </div>
  );
});
