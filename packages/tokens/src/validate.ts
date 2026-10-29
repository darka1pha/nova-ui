import { contrastRatio, WCAG } from "./color/contrast.ts";
import { isHexColor } from "./color/convert.ts";
import { INTENTS, type SemanticColorName } from "./semantic/schema.ts";
import type { ColorMode, ResolvedTheme } from "./themes/types.ts";

export interface ContrastCheck {
  mode: ColorMode;
  foreground: SemanticColorName;
  background: SemanticColorName;
  ratio: number;
  required: number;
  pass: boolean;
}

type Pair = [SemanticColorName, SemanticColorName, number];

/** The foreground/background pairs the components actually render. */
export function contrastPairs(): Pair[] {
  const pairs: Pair[] = [
    ["foreground", "background", WCAG.text],
    ["foreground", "surface", WCAG.text],
    ["foreground", "surface-raised", WCAG.text],
    ["foreground-secondary", "background", WCAG.text],
    ["foreground-secondary", "surface", WCAG.text],
    ["foreground-muted", "background", WCAG.text],
    ["foreground-muted", "surface", WCAG.text],
    ["input", "surface", WCAG.ui],
    ["focus-ring", "background", WCAG.ui],
    ["focus-ring", "surface", WCAG.ui],
  ];
  for (const intent of INTENTS) {
    pairs.push([`${intent}-on-solid`, `${intent}-solid`, WCAG.text]);
    pairs.push([`${intent}-on-solid`, `${intent}-solid-hover`, WCAG.text]);
    pairs.push([`${intent}-on-subtle`, `${intent}-subtle`, WCAG.text]);
    pairs.push([`${intent}-text`, "background", WCAG.text]);
    pairs.push([`${intent}-text`, "surface", WCAG.text]);
  }
  return pairs;
}

/**
 * Checks every rendered color pair of a resolved theme against WCAG 2.2 AA.
 * Pairs involving non-hex overrides (e.g. `oklch()` strings) are skipped.
 */
export function auditContrast(theme: ResolvedTheme): ContrastCheck[] {
  const results: ContrastCheck[] = [];
  for (const mode of ["light", "dark"] as const) {
    const colors = theme[mode];
    for (const [fg, bg, required] of contrastPairs()) {
      if (!isHexColor(colors[fg]) || !isHexColor(colors[bg])) continue;
      const ratio = contrastRatio(colors[fg], colors[bg]);
      results.push({ mode, foreground: fg, background: bg, ratio: Number(ratio.toFixed(2)), required, pass: ratio >= required });
    }
  }
  return results;
}
