import { hexToOklch, normalizeHex, oklchToHex, type Oklch } from "./convert.ts";

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 975] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];
/** A 12-step tonal scale from lightest (50) to darkest (975). */
export type ColorScale = Record<ScaleStep, string>;

export type ScaleKind = "chromatic" | "neutral";

/**
 * Target OKLCH lightness per step. Chromatic scales keep 500/600 for the
 * "brand" tone; neutral scales spend more resolution on the dark end, where
 * dark-mode surfaces need several closely spaced layers.
 */
const LIGHTNESS: Record<ScaleKind, Record<ScaleStep, number>> = {
  chromatic: {
    50: 0.977,
    100: 0.948,
    200: 0.895,
    300: 0.825,
    400: 0.735,
    500: 0.65,
    600: 0.565,
    700: 0.49,
    800: 0.41,
    900: 0.335,
    950: 0.265,
    975: 0.205,
  },
  neutral: {
    50: 0.985,
    100: 0.963,
    200: 0.922,
    300: 0.868,
    400: 0.72,
    500: 0.585,
    600: 0.475,
    700: 0.375,
    800: 0.295,
    900: 0.24,
    950: 0.2,
    975: 0.165,
  },
};

/** Chroma multiplier per step: tints and shades carry less color than mid tones. */
const CHROMA: Record<ScaleStep, number> = {
  50: 0.14,
  100: 0.28,
  200: 0.52,
  300: 0.76,
  400: 0.94,
  500: 1,
  600: 1,
  700: 0.92,
  800: 0.8,
  900: 0.66,
  950: 0.52,
  975: 0.42,
};

export interface ScaleOptions {
  /** Lightness curve to follow. Defaults to "chromatic". */
  kind?: ScaleKind;
  /**
   * Keep the exact seed color in the scale at the step whose lightness is
   * closest to it. Defaults to true so a brand hex is always present verbatim.
   */
  anchor?: boolean;
  /** Hue rotation in degrees applied progressively towards the dark end. */
  hueShift?: number;
}

/**
 * Generates a perceptually even 12-step scale from one seed color.
 * Lightness follows a fixed curve; chroma follows the seed, tapered towards the
 * extremes and gamut-mapped into sRGB, so every step is a real, usable color
 * rather than the seed with opacity applied.
 */
export function generateScale(seed: string, options: ScaleOptions = {}): ColorScale {
  const { anchor = true, hueShift = 0, kind = "chromatic" } = options;
  const curve = LIGHTNESS[kind];
  const base = hexToOklch(seed);
  if (!base) throw new TypeError(`generateScale: "${seed}" is not a valid hex color`);

  const scale = {} as ColorScale;
  for (const [i, step] of SCALE_STEPS.entries()) {
    const t = i / (SCALE_STEPS.length - 1);
    const color: Oklch = {
      l: curve[step],
      c: base.c * CHROMA[step],
      h: (base.h + hueShift * (t - 0.5) + 360) % 360,
    };
    scale[step] = oklchToHex(color);
  }

  if (anchor) {
    scale[nearestStep(base.l, kind)] = normalizeHex(seed) ?? scale[500];
  }
  return scale;
}

/** The scale step whose target lightness is closest to `l`. */
export function nearestStep(l: number, kind: ScaleKind = "chromatic"): ScaleStep {
  let best: ScaleStep = 500;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const step of SCALE_STEPS) {
    const diff = Math.abs(LIGHTNESS[kind][step] - l);
    if (diff < bestDiff) {
      best = step;
      bestDiff = diff;
    }
  }
  return best;
}

/** Index helpers for walking a scale towards lighter or darker steps. */
export function stepOffset(step: ScaleStep, offset: number): ScaleStep {
  const i = SCALE_STEPS.indexOf(step);
  const j = Math.min(SCALE_STEPS.length - 1, Math.max(0, i + offset));
  return SCALE_STEPS[j] ?? step;
}
