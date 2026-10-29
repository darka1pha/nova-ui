import { parseHex, type Rgb } from "./convert.ts";

/** WCAG 2.x relative luminance of an sRGB color. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG 2.x contrast ratio between two hex colors, from 1 to 21.
 * Returns 1 when either color is invalid so callers fail safe.
 */
export function contrastRatio(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const WCAG = {
  /** Normal body text (AA). */
  text: 4.5,
  /** Large text ≥ 24px, or ≥ 18.66px bold (AA). */
  largeText: 3,
  /** Non-text UI: borders of controls, focus indicators, icons (AA). */
  ui: 3,
} as const;

export type ContrastLevel = keyof typeof WCAG;

export function meetsContrast(fg: string, bg: string, level: ContrastLevel = "text"): boolean {
  return contrastRatio(fg, bg) >= WCAG[level];
}

/** Picks the candidate with the highest contrast against `bg`. */
export function bestContrast(bg: string, candidates: readonly string[]): string {
  let best = candidates[0] ?? "#000000";
  let bestRatio = 0;
  for (const c of candidates) {
    const ratio = contrastRatio(c, bg);
    if (ratio > bestRatio) {
      best = c;
      bestRatio = ratio;
    }
  }
  return best;
}
