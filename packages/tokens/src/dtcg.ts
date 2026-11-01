import * as primitives from "./primitives/index.ts";
import type { ColorMode, ResolvedTheme } from "./themes/types.ts";

/*
 * Design tokens in the W3C Design Tokens Community Group format (DTCG):
 * `$value` / `$type` / `$description`, groups by nesting, and `{group.token}`
 * references. Figma (Tokens Studio, variables importers) and Style Dictionary
 * read it, so design files and code share one source.
 *
 * Theme colors point at palette tokens with references when the resolved hex
 * is a palette step, so tools keep the link (change "blue.600" and every role
 * using it follows); generated or contrast-adjusted colors stay literal.
 */

export interface DtcgToken {
  $value: unknown;
  $type?: string;
  $description?: string;
}
export type DtcgGroup = { [key: string]: DtcgToken | DtcgGroup | string | undefined; $type?: string; $description?: string };

const group = (type: string, entries: Record<string, unknown>, describe?: (key: string) => string | undefined): DtcgGroup => {
  const out: DtcgGroup = { $type: type };
  for (const [key, value] of Object.entries(entries)) {
    const description = describe?.(key);
    out[key] = description ? { $value: value, $description: description } : { $value: value };
  }
  return out;
};

/** "cubic-bezier(0.2, 0, 0, 1)" → [0.2, 0, 0, 1]; anything else stays a string. */
const bezier = (v: string) => {
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(v);
  return m ? (m[1] ?? "").split(",").map((n) => Number(n.trim())) : v;
};

/** "0.75rem" → { value: 0.75, unit: "rem" }, the DTCG 2025 dimension shape. */
const dimension = (v: string) => {
  const m = /^(-?[\d.]+)(px|rem)$/.exec(v);
  return m ? { value: Number(m[1]), unit: m[2] } : v;
};

/** Palette steps by hex, for turning resolved colors back into references. */
function paletteIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const [name, scale] of Object.entries(primitives.palette)) {
    for (const [step, hex] of Object.entries(scale as Record<string, string>)) {
      const key = hex.toLowerCase();
      // First palette wins on duplicates, so references are stable across builds.
      if (!index.has(key)) index.set(key, `{color.${name}.${step}}`);
    }
  }
  return index;
}

/** Primitive tokens: palette, spacing scale inputs, type, radius, motion. */
export function primitiveTokens(): DtcgGroup {
  const palette: DtcgGroup = { $type: "color" };
  for (const [name, scale] of Object.entries(primitives.palette)) palette[name] = group("color", scale as Record<string, string>);

  return {
    color: palette,
    radius: group("dimension", Object.fromEntries(Object.entries(primitives.radius).map(([k, v]) => [k, dimension(v)]))),
    breakpoint: group("dimension", Object.fromEntries(Object.entries(primitives.breakpoints).map(([k, v]) => [k, dimension(v)]))),
    fontFamily: group("fontFamily", primitives.fontFamily),
    fontWeight: group("fontWeight", Object.fromEntries(Object.entries(primitives.fontWeight).map(([k, v]) => [k, Number(v)]))),
    fontSize: group(
      "dimension",
      Object.fromEntries(Object.entries(primitives.fontSize).map(([k, v]) => [k, dimension((v as readonly string[])[0] ?? "")])),
      (k) => `Line height ${(primitives.fontSize as Record<string, readonly string[]>)[k]?.[1] ?? ""}`,
    ),
    letterSpacing: group("dimension", Object.fromEntries(Object.entries(primitives.letterSpacing).map(([k, v]) => [k, v]))),
    lineHeight: group("number", Object.fromEntries(Object.entries(primitives.lineHeight).map(([k, v]) => [k, Number(v)]))),
    duration: group("duration", Object.fromEntries(Object.entries(primitives.duration).map(([k, v]) => [k, { value: Number.parseFloat(v), unit: "ms" }]))),
    easing: group("cubicBezier", Object.fromEntries(Object.entries(primitives.easing).map(([k, v]) => [k, bezier(v)]))),
    opacity: group("number", Object.fromEntries(Object.entries(primitives.opacity).map(([k, v]) => [k, Number(v)]))),
  };
}

/** One theme in one mode: semantic colors (as palette references where possible), radius, fonts. */
export function themeTokens(theme: ResolvedTheme, mode: ColorMode): DtcgGroup {
  const index = paletteIndex();
  const colors: DtcgGroup = { $type: "color" };
  for (const [role, hex] of Object.entries(theme[mode])) {
    colors[role] = { $value: index.get(hex.toLowerCase()) ?? hex };
  }
  return {
    $description: `${theme.id} theme, ${mode} mode`,
    color: colors,
    font: group("fontFamily", { sans: theme.fonts.sans, display: theme.fonts.display, mono: theme.fonts.mono }),
    radius: { $type: "dimension", base: { $value: `{radius.${theme.radius === "none" ? "none" : theme.radius}}` } },
  };
}

/**
 * Everything in one DTCG document: `primitive` plus `theme.<id>.<mode>`.
 * References are written relative to the primitive group.
 */
export function dtcgTokens(themes: ResolvedTheme[]): DtcgGroup {
  const prefix = (g: DtcgGroup): DtcgGroup => JSON.parse(JSON.stringify(g).replace(/"\{(color|radius)\./g, '"{primitive.$1.')) as DtcgGroup;
  const theme: DtcgGroup = {};
  for (const t of themes) theme[t.id] = { light: prefix(themeTokens(t, "light")), dark: prefix(themeTokens(t, "dark")) };
  return { $description: "Nova UI design tokens (W3C DTCG format)", primitive: primitiveTokens(), theme };
}
