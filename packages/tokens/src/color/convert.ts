/**
 * Color conversion between hex/sRGB and OKLCH.
 *
 * OKLCH is used for palette generation because its lightness axis is
 * perceptually uniform: equal steps in L look like equal steps to the eye,
 * which is what makes generated tonal scales feel even and intentional.
 */

export interface Rgb {
  /** 0–1 */
  r: number;
  g: number;
  b: number;
}

export interface Oklch {
  /** Lightness, 0–1 */
  l: number;
  /** Chroma, 0–~0.37 */
  c: number;
  /** Hue in degrees, 0–360 */
  h: number;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Returns true when the value is a 3, 4, 6 or 8 digit hex color. */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

/** Parses a hex color. Alpha is ignored. Returns null for invalid input. */
export function parseHex(value: string): Rgb | null {
  const match = HEX_RE.exec(value.trim());
  if (!match?.[1]) return null;
  let hex = match[1];
  if (hex.length <= 4) {
    hex = hex
      .slice(0, 3)
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const n = Number.parseInt(hex.slice(0, 6), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** The alpha channel of a 4 or 8 digit hex color, 0–1 (1 for opaque or invalid input). */
export function parseHexAlpha(value: string): number {
  const hex = HEX_RE.exec(value.trim())?.[1];
  if (!hex) return 1;
  if (hex.length === 4) return Number.parseInt(hex.slice(3).repeat(2), 16) / 255;
  if (hex.length === 8) return Number.parseInt(hex.slice(6, 8), 16) / 255;
  return 1;
}

export function toHex({ r, g, b }: Rgb): string {
  const channel = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Normalizes any valid hex input to lowercase 6-digit form. */
export function normalizeHex(value: string): string | null {
  const rgb = parseHex(value);
  return rgb ? toHex(rgb) : null;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function rgbToOklch(rgb: Rgb): Oklch {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}

/** Converts OKLCH to *unclamped* sRGB. Channels outside 0–1 mean out of gamut. */
export function oklchToRgbUnclamped({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = l - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = l - 0.0894841775 * A - 1.291485548 * B;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return {
    r: fromLinear(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    g: fromLinear(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    b: fromLinear(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  };
}

const EPS = 1e-4;
const inGamut = ({ r, g, b }: Rgb) =>
  r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;

/**
 * Converts OKLCH to sRGB, reducing chroma (keeping lightness and hue) until
 * the color fits inside the sRGB gamut.
 */
export function oklchToRgb(color: Oklch): Rgb {
  const direct = oklchToRgbUnclamped(color);
  if (inGamut(direct)) return direct;
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgbUnclamped({ ...color, c: mid }))) lo = mid;
    else hi = mid;
  }
  return oklchToRgbUnclamped({ ...color, c: lo });
}

export const hexToOklch = (hex: string): Oklch | null => {
  const rgb = parseHex(hex);
  return rgb ? rgbToOklch(rgb) : null;
};

export const oklchToHex = (color: Oklch): string => toHex(oklchToRgb(color));
