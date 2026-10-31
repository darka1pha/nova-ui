/**
 * Emits the distributable CSS files after `tsc` has built dist/.
 * - tokens.css: static tokens + the default theme on :root (no framework needed)
 * - themes.css: every preset scoped to [data-ks-theme="<id>"]
 * - tailwind.css: Tailwind v4 `@theme inline` mapping for consumer builds
 * - tokens.json: resolved values for design tools and documentation
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  cssBlock,
  defaultTheme,
  getResolvedTheme,
  presets,
  primitives,
  staticVariables,
  derivedVariables,
  THEME_ROOT_SELECTOR,
  tailwindThemeCss,
  themeCss,
  themeVariables,
} from "../dist/index.js";

const out = (file: string) => fileURLToPath(new URL(`../dist/${file}`, import.meta.url));
mkdirSync(out("css"), { recursive: true });

const header = "/* @kaleido/tokens — generated, do not edit. */\n";
const defaults = getResolvedTheme(defaultTheme);
const modeRules = `[data-ks-mode="light"] { color-scheme: light; }\n[data-ks-mode="dark"] { color-scheme: dark; }\n`;

writeFileSync(
  out("css/tokens.css"),
  header +
    cssBlock(":where(:root)", { ...staticVariables(), ...themeVariables(defaults) }, "  color-scheme: light dark;") +
    cssBlock(THEME_ROOT_SELECTOR, derivedVariables()) +
    modeRules,
);

writeFileSync(
  out("css/themes.css"),
  header + Object.values(presets).map((t) => themeCss(getResolvedTheme(t))).join("\n"),
);

writeFileSync(out("css/tailwind.css"), header + tailwindThemeCss());

const json = {
  primitives: { colors: primitives.palette, ...Object.fromEntries(Object.entries(primitives).filter(([k]) => k !== "palette" && typeof (primitives as Record<string, unknown>)[k] === "object")) },
  themes: Object.fromEntries(Object.values(presets).map((t) => {
    const r = getResolvedTheme(t);
    return [t.id, { light: r.light, dark: r.dark, radius: r.radius, shadow: r.shadow, density: r.density, fonts: r.fonts }];
  })),
};
writeFileSync(out("tokens.json"), JSON.stringify(json, null, 2));
console.log("CSS + JSON written to dist/");
