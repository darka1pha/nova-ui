import { describe, expect, it } from "vitest";
import { contrastRatio, createTheme, getResolvedTheme, presets, themeCss, themeVariables } from "../src/index.ts";

const hexStops = (gradient: string) => gradient.match(/#[0-9a-f]{6}\b/gi) ?? [];

describe("theme gradients", () => {
  it("emits a preset's hand-made gradients and keeps derived ones otherwise", () => {
    const kaveh = themeVariables(getResolvedTheme(presets.kaveh));
    expect(kaveh["--nv-gradient-vivid"]).toContain("#f37021");
    expect(themeCss(getResolvedTheme(presets.kaveh))).toContain("--nv-gradient-mesh:");
    // Presets without gradients leave the derived (var-based) ones in charge.
    expect(themeVariables(getResolvedTheme(presets.ocean))["--nv-gradient-vivid"]).toBeUndefined();
  });

  it("drops hand-made gradients when a theme is rebranded", () => {
    const rebranded = getResolvedTheme(presets.kaveh, { brand: { primary: "#2563ff" } });
    expect(rebranded.gradients).toEqual({});
  });

  it("inherits and overrides gradients through createTheme", () => {
    const custom = createTheme({ id: "kaveh-custom", extends: "kaveh", gradients: { glow: "none" } });
    expect(custom.gradients?.glow).toBe("none");
    expect(custom.gradients?.vivid).toBe(presets.kaveh.gradients?.vivid);
  });

  // brand and vivid fill buttons, badges and alerts that set primary-on-solid text.
  for (const preset of Object.values(presets).filter((p) => p.gradients)) {
    it(`${preset.id}: text on brand and vivid gradients meets AA at every stop`, () => {
      const theme = getResolvedTheme(preset);
      for (const name of ["brand", "vivid"] as const) {
        const stops = hexStops(theme.gradients[name] ?? "");
        expect(stops.length).toBeGreaterThan(0);
        for (const mode of ["light", "dark"] as const) {
          for (const stop of stops) expect(contrastRatio(theme[mode]["primary-on-solid"], stop), `${name} ${mode} ${stop}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});
