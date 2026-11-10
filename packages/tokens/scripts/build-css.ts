/**
 * Emits the distributable CSS files after `tsc` has built dist/.
 * - tokens.css: static tokens + the default theme on :root (no framework needed)
 * - themes.css: every preset scoped to [data-nv-theme="<id>"]
 * - tailwind.css: Tailwind v4 `@theme inline` mapping for consumer builds
 * - tokens.json: resolved values for design tools and documentation
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  cssBlock,
  dtcgTokens,
  figmaVariables,
  primitiveTokens,
  themeTokens,
  defaultTheme,
  getResolvedTheme,
  presets,
  primitives,
  staticVariables,
  derivedVariables,
  THEME_ROOT_SELECTOR,
  COLOR_SCHEME_CSS,
  tailwindThemeCss,
  themeCss,
  themeVariables,
} from "../dist/index.js";

const out = (file: string) => fileURLToPath(new URL(`../dist/${file}`, import.meta.url));
mkdirSync(out("css"), { recursive: true });

const header = "/* @darkalpha/nova-tokens — generated, do not edit. */\n";
const defaults = getResolvedTheme(defaultTheme);
// light-dark() values are also declared on the outermost theme root, where color-scheme is set.
// Natively they'd resolve the same from :root, but CSS pipelines that lower light-dark() for older
// browsers (Lightning CSS, which Tailwind v4 runs) resolve it where it's declared, and only theme
// roots carry the switch: declared on :root alone, system mode got "#fff#1a1510" for every color.
const OUTER_THEME_ROOT = ":where(.nv-theme, [data-nv-theme]):not(:where(.nv-theme, [data-nv-theme]) *)";
const schemeDependent = (vars: Record<string, string>) => Object.fromEntries(Object.entries(vars).filter(([, value]) => value.includes("light-dark(")));

writeFileSync(
  out("css/tokens.css"),
  header +
    cssBlock(":where(:root)", { ...staticVariables(), ...themeVariables(defaults) }) +
    cssBlock(OUTER_THEME_ROOT, schemeDependent({ ...staticVariables(), ...themeVariables(defaults) })) +
    cssBlock(THEME_ROOT_SELECTOR, derivedVariables()) +
    COLOR_SCHEME_CSS,
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

// W3C DTCG: one document with everything, plus a file per set for Tokens Studio and Figma variables.
const resolved = Object.values(presets).map((t) => getResolvedTheme(t));
writeFileSync(out("tokens.dtcg.json"), JSON.stringify(dtcgTokens(resolved), null, 2));
mkdirSync(out("dtcg"), { recursive: true });
writeFileSync(out("dtcg/primitives.json"), JSON.stringify(primitiveTokens(), null, 2));
for (const theme of resolved) {
  for (const mode of ["light", "dark"] as const) {
    writeFileSync(out(`dtcg/${theme.id}.${mode}.json`), JSON.stringify(themeTokens(theme, mode), null, 2));
  }
}
// Figma variables: a `POST /v1/files/:key/variables` body per theme (Light and Dark modes),
// for a file that doesn't have them yet. scripts/figma-sync.ts also updates existing ones.
mkdirSync(out("figma"), { recursive: true });
for (const theme of resolved) writeFileSync(out(`figma/${theme.id}.json`), JSON.stringify(figmaVariables([theme]), null, 2));
console.log("CSS, JSON, DTCG and Figma tokens written to dist/");
