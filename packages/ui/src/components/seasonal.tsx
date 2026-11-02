import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { cn } from "../utils/cn.ts";

/*
 * Persian seasonal motifs and prebuilt campaign pieces for Yalda Night (شب یلدا)
 * and Nowruz (نوروز). Built for the `kaveh-yalda` and `kaveh-nowruz` presets but
 * usable with any theme. Motifs are flat, filled illustrations with their own
 * colors (a pomegranate is always pomegranate red); the composites take text
 * and layout from props and stay readable in both directions.
 */

/* ------------------------------------------------------------------ Motifs */

export interface MotifProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Width and height. Defaults to 64. */
  size?: number | string;
  /** Accessible name. Without it (or `aria-label`) the motif is decorative and hidden. */
  title?: string;
}

export type MotifComponent = ReturnType<typeof forwardRef<SVGSVGElement, MotifProps>> & {
  /** kebab-case name, also the `nv-motif-<name>` class. */
  motifName: string;
};

function createMotif(name: string, viewBox: string, art: ReactNode): MotifComponent {
  const Motif = forwardRef<SVGSVGElement, MotifProps>(function Motif({ size = 64, title, className, children, ...props }, ref) {
    const labelled = Boolean(title || props["aria-label"] || props["aria-labelledby"]);
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        role={labelled ? "img" : undefined}
        aria-hidden={labelled ? undefined : true}
        focusable="false"
        className={cn("nv-motif", `nv-motif-${name}`, "shrink-0", className)}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {art}
        {children}
      </svg>
    );
  }) as MotifComponent;
  Motif.displayName = name.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());
  Motif.motifName = name;
  return Motif;
}

/** Seasonal palette the motifs are drawn in. Exported for matching custom art. */
export const seasonalColors = {
  night: "#081430",
  navy: "#0b1f3f",
  blue: "#164a96",
  orange: "#f37021",
  flare: "#ff8a3d",
  pomegranate: "#b3122e",
  garnet: "#6e0b1f",
  seed: "#e85a6b",
  ember: "#e8a33d",
  rind: "#2e6b3a",
  sabzeh: "#3ba55c",
  leaf: "#a8d86e",
  firouzeh: "#18a5a7",
  blossom: "#f6b5c4",
  cream: "#fff8ec",
} as const;
const c = seasonalColors;

/* Yalda ------------------------------------------------------------------- */

export const Pomegranate = createMotif(
  "pomegranate",
  "0 0 100 100",
  <>
    <path d="M37 26 40 10l6 10 4-13 4 13 6-10 3 16Z" fill={c.garnet} />
    <circle cx="50" cy="58" r="35" fill={c.pomegranate} />
    <path d="M30 40a30 30 0 0 1 22-12" fill="none" stroke={c.seed} strokeWidth="5" strokeLinecap="round" opacity=".7" />
    <circle cx="50" cy="58" r="35" fill="none" stroke={c.garnet} strokeWidth="2" opacity=".5" />
  </>,
);

const SEEDS: [number, number, number][] = [
  [38, 38, -20], [50, 34, 0], [62, 38, 20], [32, 50, -40], [43, 48, 0], [57, 48, 0], [68, 50, 40],
  [36, 62, -30], [50, 60, 0], [64, 62, 30], [43, 72, 0], [57, 72, 0],
];

/** A pomegranate broken open, its seeds showing: the heart of the Yalda table. */
export const PomegranateOpen = createMotif(
  "pomegranate-open",
  "0 0 100 100",
  <>
    <circle cx="50" cy="52" r="40" fill={c.pomegranate} />
    <circle cx="50" cy="52" r="33" fill="#f6e3d2" />
    <g fill="#c8192f">
      {SEEDS.map(([x, y, r]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4" ry="5.5" transform={r ? `rotate(${r} ${x} ${y})` : undefined} />
      ))}
    </g>
    <path d="M50 19v66M17 52h66" stroke="#ebcdb6" strokeWidth="2" />
  </>,
);

export const Watermelon = createMotif(
  "watermelon",
  "0 0 100 100",
  <>
    <path d="M6 34a44 44 0 0 0 88 0Z" fill={c.rind} />
    <path d="M11 34a39 39 0 0 0 78 0Z" fill="#e9f2d0" />
    <path d="M15 34a35 35 0 0 0 70 0Z" fill="#e23a4e" />
    <g fill="#1a1a1a">
      <ellipse cx="34" cy="46" rx="2" ry="3.4" transform="rotate(-25 34 46)" />
      <ellipse cx="50" cy="52" rx="2" ry="3.4" />
      <ellipse cx="66" cy="46" rx="2" ry="3.4" transform="rotate(25 66 46)" />
      <ellipse cx="42" cy="59" rx="2" ry="3.4" transform="rotate(-15 42 59)" />
      <ellipse cx="58" cy="59" rx="2" ry="3.4" transform="rotate(15 58 59)" />
    </g>
  </>,
);

export const YaldaCandle = createMotif(
  "yalda-candle",
  "0 0 100 100",
  <>
    <circle cx="50" cy="30" r="24" fill={c.ember} opacity=".14" />
    <circle cx="50" cy="30" r="15" fill={c.ember} opacity=".2" />
    <path d="M50 14s-8 12-8 18a8 8 0 0 0 16 0c0-6-8-18-8-18Z" fill={c.orange} />
    <path d="M50 24s-4 6-4 9a4 4 0 0 0 8 0c0-3-4-9-4-9Z" fill="#ffd27a" />
    <rect x="49" y="38" width="2" height="6" fill="#4a2a10" />
    <rect x="38" y="44" width="24" height="44" rx="3" fill="#fff3e2" />
    <path d="M38 52h24" stroke={c.ember} strokeWidth="3" />
    <rect x="30" y="86" width="40" height="6" rx="3" fill={c.ember} />
  </>,
);

/** The Divan of Hafez, read for fal (divination) on Yalda night. */
export const DivanOfHafez = createMotif(
  "divan-of-hafez",
  "0 0 100 100",
  <>
    <path d="M50 30c-12-6-28-6-38-2v50c10-4 26-4 38 2Z" fill={c.garnet} />
    <path d="M50 30c12-6 28-6 38-2v50c-10-4-26-4-38 2Z" fill="#8e1328" />
    <path d="M50 34c-10-5-24-5-33-2v41c9-3 23-3 33 2Z" fill="#fff3e2" />
    <path d="M50 34c10-5 24-5 33-2v41c-9-3-23-3-33 2Z" fill="#f7e6cf" />
    <path d="M23 40h20M23 47h20M23 54h20M23 61h16M57 40h20M57 47h20M57 54h20M61 61h16" stroke="#b9946a" strokeWidth="1.6" strokeLinecap="round" />
    <g fill={c.ember} transform="translate(50 17)">
      <rect x="-5" y="-5" width="10" height="10" />
      <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" />
    </g>
  </>,
);

export const CrescentMoon = createMotif("crescent-moon", "0 0 100 100", <path d="M64 14a38 38 0 1 0 22 60 30 30 0 1 1-22-60Z" fill="#f4d9a4" />);

/** The eight-pointed Persian star (شمسه), drawn from two squares. Follows `color`. */
export const PersianStar = createMotif(
  "persian-star",
  "-50 -50 100 100",
  <g fill="currentColor">
    <rect x="-32" y="-32" width="64" height="64" />
    <rect x="-32" y="-32" width="64" height="64" transform="rotate(45)" />
  </g>,
);

/* Nowruz: the Haft-Seen and friends --------------------------------------- */

export const Sabzeh = createMotif(
  "sabzeh",
  "0 0 64 64",
  <>
    <path d="M18 40q-3-14-6-24M23 40q-1-16-1-30M28 40q1-18-1-32M33 40q1-16 3-31M38 40q2-14 5-28M43 40q3-10 8-22" stroke={c.sabzeh} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    <path d="M20 40q-1-10-3-18M30 40q1-12 1-24M41 40q2-10 5-18" stroke={c.leaf} strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M12 40h40l-4 14H16Z" fill={c.firouzeh} />
    <rect x="12" y="42" width="40" height="4" fill="#d7263d" />
  </>,
);

export const Samanu = createMotif(
  "samanu",
  "0 0 64 64",
  <>
    <path d="M10 34h44c0 12-10 20-22 20S10 46 10 34Z" fill={c.firouzeh} />
    <ellipse cx="32" cy="34" rx="22" ry="5" fill="#7a3e16" />
    <g fill="#f5e6c8">
      <ellipse cx="26" cy="33.5" rx="2.4" ry="1.2" />
      <ellipse cx="32" cy="32.5" rx="2.4" ry="1.2" />
      <ellipse cx="38" cy="33.5" rx="2.4" ry="1.2" />
    </g>
  </>,
);

export const Senjed = createMotif(
  "senjed",
  "0 0 64 64",
  <>
    <ellipse cx="32" cy="46" rx="24" ry="7" fill="#e9effa" stroke={c.firouzeh} strokeWidth="2" />
    <g fill="#c8743a">
      <ellipse cx="22" cy="40" rx="4" ry="6" transform="rotate(-20 22 40)" />
      <ellipse cx="31" cy="38" rx="4" ry="6" />
      <ellipse cx="40" cy="40" rx="4" ry="6" transform="rotate(20 40 40)" />
      <ellipse cx="26" cy="31" rx="4" ry="6" transform="rotate(-10 26 31)" />
      <ellipse cx="36" cy="31" rx="4" ry="6" transform="rotate(10 36 31)" />
    </g>
  </>,
);

export const Seer = createMotif(
  "seer",
  "0 0 64 64",
  <>
    <path d="M32 10c-2 6-16 14-16 28a16 14 0 0 0 32 0c0-14-14-22-16-28Z" fill="#f7efe2" stroke="#cdbfa8" strokeWidth="1.6" />
    <path d="M32 14c-6 10-8 18-6 36M32 14c6 10 8 18 6 36M32 14v37" stroke="#d9cbb2" strokeWidth="1.4" fill="none" />
    <path d="m28 52-2 4M32 52v5M36 52l2 4" stroke="#b5a68c" strokeWidth="1.4" strokeLinecap="round" />
  </>,
);

export const Seeb = createMotif(
  "seeb",
  "0 0 64 64",
  <>
    <path d="M32 20c-6-6-20-4-20 12 0 14 10 22 14 22 2 0 4-1 6-1s4 1 6 1c4 0 14-8 14-22 0-16-14-18-20-12Z" fill="#d7263d" />
    <path d="M32 20c-1-6 1-10 3-12" stroke="#5b3a1e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M35 13c5-5 13-4 15-1-4 4-10 4-15 1Z" fill={c.sabzeh} />
    <path d="M18 30a12 12 0 0 1 8-9" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".55" />
  </>,
);

export const Somagh = createMotif(
  "somagh",
  "0 0 64 64",
  <>
    <path d="M18 36q14-18 28 0Z" fill="#8e2a3c" />
    <path d="M10 36h44c0 10-10 16-22 16S10 46 10 36Z" fill={c.orange} />
    <path d="M10 36h44" stroke="#c2500f" strokeWidth="2" />
  </>,
);

export const Serkeh = createMotif(
  "serkeh",
  "0 0 64 64",
  <>
    <path d="M28 6h8v10l6 8v28a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V24l6-8Z" fill={c.ember} opacity=".85" />
    <path d="M22 34h20v18a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4Z" fill="#b5651d" />
    <rect x="27" y="4" width="10" height="5" rx="1.5" fill={c.blue} />
    <rect x="25" y="26" width="14" height="8" rx="1.5" fill={c.cream} />
  </>,
);

export const Goldfish = createMotif(
  "goldfish",
  "0 0 64 64",
  <>
    <circle cx="32" cy="36" r="22" fill="#d9f2f2" stroke={c.firouzeh} strokeWidth="2" />
    <path d="M12 32h40" stroke={c.firouzeh} strokeWidth="1.5" opacity=".6" />
    <path d="M24 40c4-8 16-8 18 0-2 8-14 8-18 0Z" fill={c.orange} />
    <path d="m24 40-8-6 1 12Z" fill={c.flare} />
    <circle cx="38" cy="39" r="1.3" fill={c.navy} />
    <path d="M22 13h20" stroke={c.firouzeh} strokeWidth="3" strokeLinecap="round" />
  </>,
);

export const NowruzMirror = createMotif(
  "nowruz-mirror",
  "0 0 64 64",
  <>
    <ellipse cx="32" cy="28" rx="18" ry="22" fill={c.ember} />
    <ellipse cx="32" cy="28" rx="13" ry="17" fill="#e9effa" />
    <path d="m24 20 8-6m-8 14 12-10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M26 50h12l3 8H23Z" fill="#c2500f" />
  </>,
);

export const PaintedEgg = createMotif(
  "painted-egg",
  "0 0 64 64",
  <>
    <path d="M32 8C20 8 12 28 12 40a20 18 0 0 0 40 0C52 28 44 8 32 8Z" fill={c.firouzeh} />
    <path d="M13 34q19-6 38 0l1 8q-20-6-40 0Z" fill={c.orange} />
    <g fill="#fff">
      <circle cx="24" cy="22" r="2" /><circle cx="32" cy="18" r="2" /><circle cx="40" cy="22" r="2" />
      <circle cx="22" cy="50" r="2" /><circle cx="32" cy="52" r="2" /><circle cx="42" cy="50" r="2" />
    </g>
  </>,
);

export const Blossom = createMotif(
  "blossom",
  "-20 -20 40 40",
  <>
    <g fill={c.blossom}>
      <circle cx="0" cy="-9" r="7" /><circle cx="8.6" cy="-2.8" r="7" /><circle cx="5.3" cy="7.3" r="7" />
      <circle cx="-5.3" cy="7.3" r="7" /><circle cx="-8.6" cy="-2.8" r="7" />
    </g>
    <circle r="4" fill={c.ember} />
  </>,
);

export interface MotifInfo {
  name: string;
  component: MotifComponent;
  /** English name. */
  label: string;
  /** Persian name. */
  labelFa: string;
  /** What it stands for. */
  meaning: string;
}

/** The Yalda table, in display order. */
export const yaldaMotifs: MotifInfo[] = [
  { name: "pomegranate", component: Pomegranate, label: "Pomegranate", labelFa: "انار", meaning: "The red of dawn breaking through the longest night." },
  { name: "pomegranate-open", component: PomegranateOpen, label: "Open pomegranate", labelFa: "انار دانه‌شده", meaning: "Abundance shared around the table." },
  { name: "watermelon", component: Watermelon, label: "Watermelon", labelFa: "هندوانه", meaning: "Summer's warmth kept for winter; health for the cold months." },
  { name: "yalda-candle", component: YaldaCandle, label: "Candle", labelFa: "شمع", meaning: "Light kept burning until the sun returns." },
  { name: "divan-of-hafez", component: DivanOfHafez, label: "Divan of Hafez", labelFa: "دیوان حافظ", meaning: "Poetry and fal-e Hafez, read aloud through the night." },
  { name: "crescent-moon", component: CrescentMoon, label: "Moon", labelFa: "ماه", meaning: "The long night itself." },
];

/** The seven items whose names start with "S" (س), plus the customary extras. */
export const haftSeenItems: (MotifInfo & { seen: boolean })[] = [
  { name: "sabzeh", component: Sabzeh, label: "Sabzeh", labelFa: "سبزه", meaning: "Rebirth and growth.", seen: true },
  { name: "samanu", component: Samanu, label: "Samanu", labelFa: "سمنو", meaning: "Strength and patience.", seen: true },
  { name: "senjed", component: Senjed, label: "Senjed", labelFa: "سنجد", meaning: "Love.", seen: true },
  { name: "seer", component: Seer, label: "Seer", labelFa: "سیر", meaning: "Health.", seen: true },
  { name: "seeb", component: Seeb, label: "Seeb", labelFa: "سیب", meaning: "Beauty and health.", seen: true },
  { name: "somagh", component: Somagh, label: "Somagh", labelFa: "سماق", meaning: "The color of sunrise.", seen: true },
  { name: "serkeh", component: Serkeh, label: "Serkeh", labelFa: "سرکه", meaning: "Age and patience.", seen: true },
  { name: "goldfish", component: Goldfish, label: "Goldfish", labelFa: "ماهی قرمز", meaning: "Life.", seen: false },
  { name: "nowruz-mirror", component: NowruzMirror, label: "Mirror", labelFa: "آینه", meaning: "Reflection on the year past.", seen: false },
  { name: "painted-egg", component: PaintedEgg, label: "Painted egg", labelFa: "تخم‌مرغ رنگی", meaning: "Fertility.", seen: false },
];

/* ---------------------------------------------------------------- Patterns */

export type SeasonalPatternName = "yalda-stars" | "pomegranate-seeds" | "blossom" | "girih" | "tide";

const enc = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const patternSvg: Record<SeasonalPatternName, (color: string) => string> = {
  "yalda-stars": (col) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><g fill="${col}"><path d="M20 12c1 6 2 7 8 8-6 1-7 2-8 8-1-6-2-7-8-8 6-1 7-2 8-8Z" opacity=".8"/><path d="M84 66c.6 4 1 4.5 5 5-4 .6-4.4 1-5 5-.6-4-1-4.4-5-5 4-.5 4.4-1 5-5Z" opacity=".6"/><circle cx="62" cy="22" r="1.2" opacity=".7"/><circle cx="104" cy="36" r="1" opacity=".5"/><circle cx="36" cy="88" r="1.4" opacity=".6"/><circle cx="96" cy="104" r="1.2" opacity=".6"/></g></svg>`,
  "pomegranate-seeds": (col) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><g fill="${col}"><ellipse cx="10" cy="11" rx="3.4" ry="4.8" transform="rotate(-20 10 11)"/><ellipse cx="32" cy="31" rx="3.4" ry="4.8" transform="rotate(25 32 31)"/><ellipse cx="33" cy="9" rx="2.4" ry="3.4" transform="rotate(30 33 9)"/><ellipse cx="11" cy="34" rx="2.4" ry="3.4" transform="rotate(-30 11 34)"/></g></svg>`,
  blossom: (col) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><g fill="${col}" transform="translate(18 18)"><circle cy="-5" r="4"/><circle cx="4.8" cy="-1.5" r="4"/><circle cx="3" cy="4" r="4"/><circle cx="-3" cy="4" r="4"/><circle cx="-4.8" cy="-1.5" r="4"/></g><g fill="${col}" opacity=".7" transform="translate(54 50) scale(.6)"><circle cy="-5" r="4"/><circle cx="4.8" cy="-1.5" r="4"/><circle cx="3" cy="4" r="4"/><circle cx="-3" cy="4" r="4"/><circle cx="-4.8" cy="-1.5" r="4"/></g></svg>`,
  girih: (col) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><g fill="none" stroke="${col}" stroke-width="1.2"><rect x="18" y="18" width="24" height="24"/><rect x="18" y="18" width="24" height="24" transform="rotate(45 30 30)"/><path d="M30 13V0M30 47v13M13 30H0M47 30h13M18 18 0 0M42 18 60 0M18 42 0 60M42 42l18 18"/></g></svg>`,
  tide: (col) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="28"><path d="M0 14q10-8 20 0t20 0 20 0 20 0" fill="none" stroke="${col}" stroke-width="1.6"/></svg>`,
};

/** A CSS `background-image` value for a seasonal pattern tile. */
export function seasonalPatternUrl(pattern: SeasonalPatternName, color = "currentColor"): string {
  // currentColor does not resolve inside a data URI, so fall back to a neutral ink.
  return enc(patternSvg[pattern](color === "currentColor" ? "#0b1f3f" : color));
}

export interface SeasonalPatternProps extends HTMLAttributes<HTMLDivElement> {
  pattern: SeasonalPatternName;
  /** Pattern color as hex. */
  color?: string;
  /** Pattern opacity, 0–1. Keep it low (0.1–0.3) behind content. */
  opacity?: number;
}

/**
 * A decorative, seamless pattern layer. Fills its positioned parent by default,
 * so place it first inside a `relative` container, under the content.
 */
export const SeasonalPattern = forwardRef<HTMLDivElement, SeasonalPatternProps>(function SeasonalPattern(
  { pattern, color = seasonalColors.navy, opacity = 0.2, className, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("nv-seasonal-pattern pointer-events-none absolute inset-0", className)}
      style={{ backgroundImage: seasonalPatternUrl(pattern, color), opacity, ...style }}
      {...props}
    />
  );
});

/* ------------------------------------------------------------ PersianVerse */

export interface PersianVerseProps extends HTMLAttributes<HTMLElement> {
  /** The two hemistichs (مصراع) of a beyt, or more lines. */
  lines: string[];
  /** English translation shown under the verse. */
  translation?: ReactNode;
  /** Poet, e.g. "Hafez". */
  attribution?: ReactNode;
}

/** A Persian couplet set right to left, with an optional translation and attribution. */
export const PersianVerse = forwardRef<HTMLElement, PersianVerseProps>(function PersianVerse({ lines, translation, attribution, className, ...props }, ref) {
  return (
    <figure ref={ref} className={cn("nv-persian-verse text-center", className)} {...props}>
      <blockquote lang="fa" dir="rtl" className="font-display text-xl leading-[2]">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </blockquote>
      {translation || attribution ? (
        <figcaption className="mt-2 text-sm opacity-75">
          {translation ? <span className="italic">{translation}</span> : null}
          {translation && attribution ? " — " : null}
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
});

/* -------------------------------------------------------- SeasonalGreeting */

export type Season = "yalda" | "nowruz";

const seasons: Record<Season, { title: string; titleFa: string; background: string; text: string; muted: string; accent: string; pattern: SeasonalPatternName; patternColor: string }> = {
  yalda: {
    title: "Happy Yalda",
    titleFa: "یلدا مبارک",
    background: `radial-gradient(120% 90% at 75% 20%, #1b1f52 0%, ${c.night} 60%)`,
    text: "#ffffff",
    muted: "rgba(255,255,255,.75)",
    accent: c.ember,
    pattern: "yalda-stars",
    patternColor: c.ember,
  },
  nowruz: {
    title: "Happy Nowruz",
    titleFa: "نوروز مبارک",
    background: `linear-gradient(160deg, ${c.cream} 0%, #e9f6ec 60%, #bde7df 100%)`,
    text: c.navy,
    muted: "#3d4b5c",
    accent: "#0e7c66",
    pattern: "blossom",
    patternColor: c.blossom,
  },
};

const defaultArt: Record<Season, ReactNode> = {
  yalda: (
    <>
      <Watermelon className="h-auto w-[44%] -me-[14%] mt-[14%]" />
      <YaldaCandle className="h-auto w-[34%] z-10" />
      <Pomegranate className="h-auto w-[44%] -ms-[14%] mt-[10%]" />
    </>
  ),
  nowruz: (
    <>
      <Goldfish className="h-auto w-[32%] -me-[4%] mt-[18%]" />
      <Sabzeh className="h-auto w-[54%] z-10" />
      <Seeb className="h-auto w-[28%] -ms-[4%] mt-[24%]" />
    </>
  ),
};

export interface SeasonalGreetingProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  season: Season;
  /** `card` stacks art over text; `banner` puts them side by side. */
  layout?: "card" | "banner";
  /** Persian headline. Defaults to "یلدا مبارک" / "نوروز مبارک". */
  titleFa?: ReactNode;
  /** English headline. Defaults to "Happy Yalda" / "Happy Nowruz". Pass `null` to hide. */
  title?: ReactNode;
  /** Supporting line, e.g. a campaign message or date. */
  description?: ReactNode;
  /** A small line above the headline, e.g. "Yalda 1405 · ۳۰ آذر". */
  eyebrow?: ReactNode;
  /** Replaces the default motif arrangement. */
  art?: ReactNode;
  /** Brand sign-off, usually your logo. */
  logo?: ReactNode;
  /** A call to action, e.g. a Button. */
  action?: ReactNode;
}

/**
 * A ready-made greeting for Yalda or Nowruz: the seasonal backdrop, pattern and
 * motifs with your headline, message, logo and action. Use it as a hero banner,
 * a social card or an in-app announcement.
 */
export const SeasonalGreeting = forwardRef<HTMLElement, SeasonalGreetingProps>(function SeasonalGreeting(
  { season, layout = "card", titleFa, title, description, eyebrow, art, logo, action, className, style, ...props },
  ref,
) {
  const s = seasons[season];
  const banner = layout === "banner";
  const vars = { "--nv-seasonal-accent": s.accent, background: s.background, color: s.text, ...style } as CSSProperties;
  return (
    <section
      ref={ref}
      data-season={season}
      aria-label={typeof title === "string" ? title : s.title}
      className={cn(
        "nv-seasonal-greeting relative isolate overflow-hidden rounded-xl",
        banner ? "flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-10" : "flex flex-col items-center p-6 text-center",
        className,
      )}
      style={vars}
      {...props}
    >
      <SeasonalPattern pattern={s.pattern} color={s.patternColor} opacity={season === "yalda" ? 0.8 : 0.35} className="-z-10" />
      <div className={cn("flex min-w-0 flex-col gap-2", banner ? "flex-1 items-start text-start" : "order-2 items-center")}>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: s.accent }}>{eyebrow}</p> : null}
        <p lang="fa" dir="rtl" className="font-display text-4xl font-bold leading-tight sm:text-5xl" style={{ color: s.accent }}>
          {titleFa ?? s.titleFa}
        </p>
        {title === null ? null : <h2 className="font-display text-2xl font-bold leading-tight">{title ?? s.title}</h2>}
        {description ? <div className="max-w-prose text-sm" style={{ color: s.muted }}>{description}</div> : null}
        {action || logo ? (
          <div className={cn("mt-3 flex flex-wrap items-center gap-4", !banner && "justify-center")}>
            {action}
            {logo}
          </div>
        ) : null}
      </div>
      <div aria-hidden className={cn("flex items-end justify-center", banner ? "w-full max-w-xs sm:w-2/5" : "order-1 mb-4 w-full max-w-[16rem]")}>
        {art ?? defaultArt[season]}
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: c.orange }} />
    </section>
  );
});

/* ---------------------------------------------------------------- HaftSeen */

export interface HaftSeenProps extends HTMLAttributes<HTMLElement> {
  /** Which names to show under each item. */
  labels?: "fa" | "en" | "both" | "none";
  /** Add the goldfish, mirror and painted egg after the seven S items. */
  extras?: boolean;
  /** Item size in px. */
  itemSize?: number;
}

/** The Haft-Seen table: the seven S items of Nowruz on one line, labelled in Persian, English or both. */
export const HaftSeen = forwardRef<HTMLElement, HaftSeenProps>(function HaftSeen({ labels = "fa", extras = false, itemSize = 64, className, ...props }, ref) {
  const items = extras ? haftSeenItems : haftSeenItems.filter((i) => i.seen);
  return (
    <figure ref={ref} className={cn("nv-haft-seen", className)} {...props}>
      <ul aria-label="Haft-Seen" className="flex flex-wrap items-end justify-center gap-x-4 gap-y-6 border-b-[3px] pb-2" style={{ borderColor: c.orange }}>
        {items.map(({ name, component: Item, label, labelFa }) => (
          <li key={name} className="flex flex-col items-center gap-2">
            <Item size={itemSize} title={labels === "none" ? `${label} (${labelFa})` : undefined} />
            {labels === "none" ? null : (
              <span className="flex flex-col items-center text-xs leading-snug">
                {labels !== "en" ? <span lang="fa" dir="rtl" className="font-semibold">{labelFa}</span> : null}
                {labels !== "fa" ? <span className={labels === "both" ? "opacity-70" : "font-semibold"}>{label}</span> : null}
              </span>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
});
