import { parseHex, parseHexAlpha, type Rgb } from "./convert.ts";

/** WCAG 2.x relative luminance of an sRGB color. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG 2.x contrast ratio between two hex colors, from 1 to 21.
 * Returns 1 when either color is invalid so callers fail safe.
 * A translucent first color (`#rrggbbaa`) is composited over the second, which
 * is treated as opaque, so the ratio is the one actually rendered.
 */
export function contrastRatio(a: string, b: string): number {
  const cb = parseHex(b);
  const raw = parseHex(a);
  if (!raw || !cb) return 1;
  const alpha = parseHexAlpha(a);
  const ca = alpha >= 1 ? raw : { r: raw.r * alpha + cb.r * (1 - alpha), g: raw.g * alpha + cb.g * (1 - alpha), b: raw.b * alpha + cb.b * (1 - alpha) };
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
