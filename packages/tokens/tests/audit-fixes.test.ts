import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { auditContrast, COLOR_SCHEME_CSS, contrastPairs, contrastRatio, getResolvedTheme, parseHexAlpha, presets } from "../src/index.ts";

// Regression tests for the Medium/Low token findings in issues.md.

describe("semantic overrides (M-12, M-13)", () => {
  it("warns when an override breaks a rendered contrast pair", () => {
    const theme = getResolvedTheme("vibrant", { overrides: { light: { "primary-solid": "#e0e0ff" } } });
    expect(theme.light["primary-solid"]).toBe("#e0e0ff");
    expect(theme.warnings.some((w) => w.includes("primary-on-solid on primary-solid") && w.includes("light"))).toBe(true);
  });

  it("stays quiet for overrides that keep contrast", () => {
    const theme = getResolvedTheme("vibrant", { overrides: { light: { background: "#ffffff" } } });
    expect(theme.warnings).toEqual([]);
  });

  it("refuses values that could break out of a CSS declaration", () => {
    for (const value of ["red;} body{display:none} x{", "red</style><script>", "red /* x */", "url(\\61)"]) {
      const theme = getResolvedTheme("vibrant", { overrides: { dark: { background: value } } });
      expect(theme.dark.background).not.toBe(value);
      expect(theme.warnings.some((w) => w.includes('"background"') && w.includes("not allowed"))).toBe(true);
    }
  });

  it("still accepts CSS color functions and keeps hex alpha", () => {
    const theme = getResolvedTheme("vibrant", { overrides: { light: { overlay: "oklch(0.2 0.02 270 / 60%)", shadow: "#00000080" } } });
    expect(theme.light.overlay).toBe("oklch(0.2 0.02 270 / 60%)");
    expect(theme.light.shadow).toBe("#00000080");
  });
});

describe("contrast with alpha (L-10)", () => {
  it("reads the alpha channel", () => {
    expect(parseHexAlpha("#00000080")).toBeCloseTo(0.502, 2);
    expect(parseHexAlpha("#0008")).toBeCloseTo(0.533, 2);
    expect(parseHexAlpha("#000000")).toBe(1);
  });

  it("composites a translucent foreground over the background", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#00000080", "#ffffff")).toBeLessThan(5);
    expect(contrastRatio("#00000000", "#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrast coverage (L-9)", () => {
  it("audits raised, sunken and hovered surfaces and pressed fills", () => {
    const pairs = contrastPairs().map(([fg, bg]) => `${fg}/${bg}`);
    for (const pair of [
      "foreground-muted/surface-raised",
      "foreground-muted/surface-sunken",
      "foreground-muted/surface-hover",
      "input/surface-raised",
      "focus-ring/surface-raised",
      "primary-text/surface-raised",
      "primary-on-solid/primary-solid-active",
      "primary-on-subtle/primary-subtle-hover",
    ]) {
      expect(pairs).toContain(pair);
    }
  });

  it("every preset passes the wider audit", () => {
    for (const preset of Object.values(presets)) {
      expect(auditContrast(getResolvedTheme(preset)).filter((c) => !c.pass)).toEqual([]);
    }
  });

  it("an unusual neutral no longer drops muted text under 4.5:1 on sunken or hovered surfaces", () => {
    const theme = getResolvedTheme("vibrant", { brand: { neutral: "#ff0000" } });
    expect(auditContrast(theme).filter((c) => !c.pass)).toEqual([]);
  });
});

describe("color-scheme scope (M-10)", () => {
  it("never sets color-scheme on :root", () => {
    expect(COLOR_SCHEME_CSS).not.toMatch(/:root/);
    expect(COLOR_SCHEME_CSS).toMatch(/:where\(\.nv-theme, \[data-nv-theme\]\):not\(:where\(\[data-nv-mode\], \[data-nv-mode\] \*\)\) \{ color-scheme: light dark; \}/);
  });

  it("the built tokens.css only sets color-scheme on theme roots and explicit modes", () => {
    const css = readFileSync(new URL("../dist/css/tokens.css", import.meta.url), "utf8");
    const rootBlock = css.slice(css.indexOf(":where(:root)"), css.indexOf("}", css.indexOf(":where(:root)")));
    expect(rootBlock).not.toContain("color-scheme");
    expect(css).toContain(COLOR_SCHEME_CSS);
  });
});
