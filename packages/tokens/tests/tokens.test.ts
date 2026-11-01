import { describe, expect, it } from "vitest";
import {
  auditContrast,
  derivedVariables,
  contrastRatio,
  createTheme,
  generateScale,
  getResolvedTheme,
  getTheme,
  hexToOklch,
  isHexColor,
  normalizeHex,
  oklchToHex,
  presets,
  registerTheme,
  resolveTheme,
  SCALE_STEPS,
  SEMANTIC_COLOR_NAMES,
  tailwindThemeCss,
  themeCss,
  themeVariables,
  staticVariables,
  type SemanticOverrides,
} from "../src/index.ts";

describe("color conversion", () => {
  it("parses and normalizes hex", () => {
    expect(isHexColor("#abc")).toBe(true);
    expect(isHexColor("abc")).toBe(true);
    expect(isHexColor("#abcd12")).toBe(true);
    expect(isHexColor("#ggg")).toBe(false);
    expect(isHexColor("rgb(0,0,0)")).toBe(false);
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("nope")).toBeNull();
  });

  it("round-trips through OKLCH", () => {
    for (const hex of ["#6d4aff", "#0fb5a6", "#ff6b57", "#000000", "#ffffff", "#777777"]) {
      const lch = hexToOklch(hex);
      expect(lch).not.toBeNull();
      expect(oklchToHex(lch!)).toBe(hex);
    }
  });
});

describe("contrast", () => {
  it("matches WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // Reference value from the WCAG contrast checker.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("fails safe on invalid input", () => {
    expect(contrastRatio("not-a-color", "#fff")).toBe(1);
  });
});

describe("generateScale", () => {
  it("produces 12 steps with strictly decreasing lightness", () => {
    const scale = generateScale("#2563ff");
    expect(Object.keys(scale)).toHaveLength(SCALE_STEPS.length);
    const ls = SCALE_STEPS.map((s) => hexToOklch(scale[s])!.l);
    for (let i = 1; i < ls.length; i++) expect(ls[i]!).toBeLessThan(ls[i - 1]!);
  });

  it("keeps the exact seed color in the scale", () => {
    expect(Object.values(generateScale("#ff6b57"))).toContain("#ff6b57");
  });

  it("throws on invalid seeds", () => {
    expect(() => generateScale("purple")).toThrow(TypeError);
  });
});

describe("theme resolution", () => {
  it("resolves every semantic token for both modes", () => {
    const theme = getResolvedTheme("vibrant");
    for (const name of SEMANTIC_COLOR_NAMES) {
      expect(theme.light[name], name).toBeTruthy();
      expect(theme.dark[name], name).toBeTruthy();
    }
  });

  it.each(Object.keys(presets))("preset %s passes WCAG AA for every rendered pair", (id) => {
    const failures = auditContrast(getResolvedTheme(id)).filter((c) => !c.pass);
    expect(failures).toEqual([]);
  });

  it("applies brand colors and keeps them verbatim when readable", () => {
    const theme = getResolvedTheme("vibrant", { brand: { primary: "#6C5CE7" } });
    expect(theme.light["primary-solid"]).toBe("#6c5ce7");
  });

  it("fixes unreadable brand colors instead of shipping them", () => {
    // Pale yellow cannot carry white text; the resolver must find a readable pair.
    const theme = getResolvedTheme("vibrant", { brand: { primary: "#fff3a0" } });
    expect(contrastRatio(theme.light["primary-on-solid"], theme.light["primary-solid"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.light["primary-text"], theme.light.background)).toBeGreaterThanOrEqual(4.5);
    expect(auditContrast(theme).filter((c) => !c.pass)).toEqual([]);
  });

  it("ignores invalid brand colors with a warning", () => {
    const theme = getResolvedTheme("vibrant", { brand: { secondary: "teal-ish" } });
    expect(theme.warnings.join(" ")).toMatch(/not a valid hex/);
    expect(theme.light["secondary-solid"]).toBe(getResolvedTheme("vibrant").light["secondary-solid"]);
  });

  it("warns and falls back for unknown themes", () => {
    const theme = getResolvedTheme("does-not-exist");
    expect(theme.id).toBe("vibrant");
    expect(theme.warnings[0]).toMatch(/Unknown theme/);
  });

  it("applies semantic overrides after derivation and rejects unknown keys", () => {
    // Simulates an untyped caller (e.g. JSON config) passing a bad key.
    const light = JSON.parse('{ "background": "#FFFFFF", "not-a-token": "#000" }') as SemanticOverrides;
    const theme = resolveTheme(presets.vibrant, { overrides: { light } });
    expect(theme.light.background).toBe("#ffffff");
    expect(theme.warnings.join(" ")).toMatch(/Unknown semantic token/);
  });

  it("is deterministic (safe for SSR + hydration)", () => {
    expect(resolveTheme(presets.ocean)).toEqual(resolveTheme(presets.ocean));
  });
});

describe("custom themes", () => {
  it("createTheme extends a preset and registerTheme makes it resolvable", () => {
    const acme = createTheme({ id: "acme", extends: "ocean", colors: { primary: "#e11d48" }, radius: "xl" });
    expect(acme.colors.secondary).toBe("cyan");
    registerTheme(acme);
    expect(getTheme("acme")).toBe(acme);
    const resolved = getResolvedTheme("acme");
    expect(resolved.radius).toBe("xl");
    expect(auditContrast(resolved).filter((c) => !c.pass)).toEqual([]);
  });
});

describe("CSS output", () => {
  it("emits light-dark() pairs and theme knobs", () => {
    const vars = themeVariables(getResolvedTheme("vibrant"));
    expect(vars["--nv-color-background"]).toMatch(/^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
    expect(vars["--nv-radius-base"]).toBe("0.5rem");
    expect(vars["--nv-density"]).toBe("1");
  });

  it("emits the theme's motion personality and motion-scaled durations", () => {
    const calm = themeVariables(getResolvedTheme("minimal"));
    const lively = themeVariables(getResolvedTheme("berry"));
    expect(calm["--nv-press-scale"]).toBe("0.985");
    expect(lively["--nv-press-scale"]).toBe("0.94");
    expect(lively["--nv-ease-interactive"]).toMatch(/^linear\(/);
    const statics = staticVariables();
    expect(statics["--nv-duration-normal"]).toBe("calc(200ms * var(--nv-motion-scale))");
    expect(statics["--nv-shadow-glow-primary"]).toContain("var(--nv-color-primary-solid)");
  });

  it("emits surface styling tokens (glass, clay, neomorph)", () => {
    const statics = staticVariables();
    expect(statics["--nv-glass-bg"]).toContain("var(--nv-color-surface)");
    expect(statics["--nv-shadow-glass"]).toContain("var(--nv-color-shadow)");
    expect(statics["--nv-shadow-clay"]).toContain("inset");
    expect(statics["--nv-shadow-clay-primary"]).toContain("var(--nv-color-primary-solid)");
    expect(statics["--nv-shadow-neomorph"]).toContain("var(--nv-color-shadow)");
    expect(statics["--nv-shadow-neomorph-inset"]).toContain("inset");

    const vibrant = getResolvedTheme("vibrant");
    expect(vibrant.surface).toBe("classic");
    const vars = themeVariables(vibrant);
    expect(vars["--nv-surface-style"]).toBe("classic");

    const css = tailwindThemeCss();
    expect(css).toContain("--shadow-glass: var(--nv-shadow-glass);");
    expect(css).toContain("--shadow-clay: var(--nv-shadow-clay);");
    expect(css).toContain("--shadow-neomorph: var(--nv-shadow-neomorph);");
  });

  it("scopes theme CSS to a selector", () => {
    expect(themeCss(getResolvedTheme("berry"))).toMatch(/^\[data-nv-theme="berry"\] \{/);
  });

  it("maps Tailwind utility names to tokens", () => {
    const css = tailwindThemeCss();
    expect(css).toContain("--color-primary: var(--nv-color-primary-solid);");
    // Every semantic token is reachable by its full name too (bg-primary-solid, text-danger-on-subtle…).
    for (const name of SEMANTIC_COLOR_NAMES) expect(css, name).toContain(`--color-${name}: var(--nv-color-${name});`);
    expect(css).toContain("--color-foreground-muted: var(--nv-color-foreground-muted);");
    expect(css).toContain("--color-*: initial;");
  });
});

describe("derived tokens", () => {
  it("re-declares every token that references another, so nested themes recompute them", () => {
    const derived = derivedVariables();
    // Theme-dependent: materials, gradients, radius scale, control sizes.
    for (const name of ["--nv-neo-bg", "--nv-clay-bg", "--nv-glass-bg", "--nv-gradient-brand", "--nv-radius-lg", "--nv-control-h-md"]) {
      expect(derived, name).toHaveProperty(name);
    }
    // Plain literals stay on :root only.
    expect(derived).not.toHaveProperty("--nv-spacing");
    expect(Object.keys(derived).length).toBeLessThan(Object.keys(staticVariables()).length);
  });

  it("gives neumorphism a mid-tone base so both shadows can read", () => {
    // Darkened toward the ink; how far is bounded by tests/materials.test.ts (text AA vs a visible rim).
    expect(derivedVariables()["--nv-neo-bg"]).toMatch(/color-mix\(in oklab, var\(--nv-color-surface-sunken\), var\(--nv-color-foreground\) [\d.]+%\)/);
  });
});
