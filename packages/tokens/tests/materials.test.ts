import { describe, expect, it } from "vitest";
import { contrastRatio, derivedVariables, getResolvedTheme, hexToOklch, oklchToHex, presets, type ColorMode } from "../src/index.ts";

/*
 * Contrast for the opaque material surfaces (clay, neomorphic), read from the
 * real token definitions rather than copied formulas, so changing a material
 * token re-runs these checks. Glass is translucent over a backdrop and is
 * covered by the browser tests instead.
 */

type Colors = Record<string, string>;

/** OKLab mix, as CSS `color-mix(in oklab, a, b p%)` does for opaque colors. */
function mixOklab(a: string, b: string, p: number): string {
  const ca = hexToOklch(a);
  const cb = hexToOklch(b);
  if (!ca || !cb) throw new Error(`Cannot mix ${a} and ${b}`);
  const lab = (c: { l: number; c: number; h: number }) => [c.l, c.c * Math.cos((c.h * Math.PI) / 180), c.c * Math.sin((c.h * Math.PI) / 180)] as const;
  const [l1, a1, b1] = lab(ca);
  const [l2, a2, b2] = lab(cb);
  const l = l1 * (1 - p) + l2 * p;
  const x = a1 * (1 - p) + a2 * p;
  const y = b1 * (1 - p) + b2 * p;
  return oklchToHex({ l, c: Math.hypot(x, y), h: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 });
}

/** Splits a CSS argument list on top-level commas. */
function args(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    else if (s[i] === "," && depth === 0) {
      out.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(s.slice(start).trim());
  return out;
}

/** Evaluates the subset of CSS the material tokens use: var(), light-dark(), color-mix(in oklab, …). */
function evaluate(expr: string, mode: ColorMode, colors: Colors): string {
  const e = expr.trim();
  const call = /^([a-z-]+)\((.*)\)$/s.exec(e);
  if (!call) throw new Error(`Unsupported value: ${e}`);
  const [, fn, inner = ""] = call;
  if (fn === "var") {
    const name = inner.trim().replace(/^--ks-color-/, "");
    const value = colors[name];
    if (!value) throw new Error(`Unknown color token ${inner}`);
    return value;
  }
  if (fn === "light-dark") {
    const [light = "", dark = ""] = args(inner);
    return evaluate(mode === "light" ? light : dark, mode, colors);
  }
  if (fn === "color-mix") {
    const [space, first = "", second = ""] = args(inner);
    if (space !== "in oklab") throw new Error(`Unsupported color space: ${space}`);
    const pct = /\s(\d+(?:\.\d+)?)%$/.exec(second);
    const p = pct ? Number(pct[1]) / 100 : 0.5;
    const b = pct ? second.slice(0, pct.index) : second;
    return mixOklab(evaluate(first, mode, colors), evaluate(b, mode, colors), p);
  }
  throw new Error(`Unsupported function ${fn}`);
}

const surfaces = ["neo-bg", "clay-bg", "clay-page"] as const;
const text = { foreground: 4.5, "foreground-secondary": 4.5, "foreground-muted": 4.5, "primary-text": 4.5 } as const;

describe("material surfaces", () => {
  const tokens = derivedVariables();

  for (const preset of Object.values(presets)) {
    const theme = getResolvedTheme(preset);
    for (const mode of ["light", "dark"] as const) {
      const colors = theme[mode] as unknown as Colors;
      for (const surface of surfaces) {
        it(`${preset.id} · ${mode} · text on ${surface} meets AA`, () => {
          const definition = tokens[`--ks-${surface}`];
          expect(definition, `--ks-${surface} is defined`).toBeDefined();
          const bg = evaluate(definition ?? "", mode, colors);
          for (const [role, min] of Object.entries(text)) {
            const fg = colors[role] ?? "";
            expect(contrastRatio(fg, bg), `${role} ${fg} on ${surface} ${bg}`).toBeGreaterThanOrEqual(min);
          }
        });
      }
    }
  }

  it("evaluates the real definitions (sanity check of the evaluator)", () => {
    const colors = getResolvedTheme(presets.kaveh).light as unknown as Colors;
    // Neumorphism's base is a mid-tone: darker than the sunken surface it starts from.
    const neo = evaluate(tokens["--ks-neo-bg"] ?? "", "light", colors);
    expect(contrastRatio("#ffffff", neo)).toBeGreaterThan(contrastRatio("#ffffff", colors["surface-sunken"] ?? ""));
    expect(contrastRatio("#ffffff", neo)).toBeGreaterThanOrEqual(1.3);
  });
});
