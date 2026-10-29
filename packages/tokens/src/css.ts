import * as scales from "./primitives/scales.ts";
import { colorVar, CSS_PREFIX, INTENT_ROLES, INTENTS, SEMANTIC_COLOR_NAMES, SURFACE_ROLES, CHART_ROLES } from "./semantic/schema.ts";
import type { RadiusPreset, ResolvedTheme, ShadowStyle } from "./themes/types.ts";

const p = (name: string) => `--${CSS_PREFIX}-${name}`;
const v = (name: string) => `var(${p(name)})`;

const RADIUS_BASE: Record<RadiusPreset, string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
};

const shadowColor = (pct: number) => `color-mix(in srgb, ${v("color-shadow")} ${pct}%, transparent)`;

const SHADOWS: Record<ShadowStyle, Record<"xs" | "sm" | "md" | "lg" | "xl", string>> = {
  soft: {
    xs: `0 1px 2px ${shadowColor(6)}`,
    sm: `0 1px 3px ${shadowColor(8)}, 0 1px 2px ${shadowColor(5)}`,
    md: `0 6px 16px -4px ${shadowColor(12)}, 0 2px 4px -2px ${shadowColor(7)}`,
    lg: `0 16px 36px -10px ${shadowColor(18)}, 0 6px 12px -6px ${shadowColor(9)}`,
    xl: `0 28px 64px -16px ${shadowColor(26)}, 0 10px 20px -10px ${shadowColor(12)}`,
  },
  crisp: {
    xs: `0 0 0 1px ${shadowColor(5)}, 0 1px 1px ${shadowColor(6)}`,
    sm: `0 0 0 1px ${shadowColor(6)}, 0 1px 2px ${shadowColor(8)}`,
    md: `0 0 0 1px ${shadowColor(7)}, 0 4px 8px -2px ${shadowColor(12)}`,
    lg: `0 0 0 1px ${shadowColor(8)}, 0 10px 20px -6px ${shadowColor(18)}`,
    xl: `0 0 0 1px ${shadowColor(9)}, 0 20px 40px -12px ${shadowColor(26)}`,
  },
  flat: {
    xs: "none",
    sm: "none",
    md: `0 0 0 1px ${shadowColor(8)}`,
    lg: `0 0 0 1px ${shadowColor(10)}, 0 8px 24px -12px ${shadowColor(14)}`,
    xl: `0 0 0 1px ${shadowColor(12)}, 0 16px 40px -16px ${shadowColor(20)}`,
  },
};

/** Every CSS custom property a theme controls, as a flat map. */
export function themeVariables(theme: ResolvedTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const name of SEMANTIC_COLOR_NAMES) {
    const light = theme.light[name];
    const dark = theme.dark[name];
    vars[colorVar(name)] = light === dark ? light : `light-dark(${light}, ${dark})`;
  }
  vars[p("radius-base")] = RADIUS_BASE[theme.radius];
  vars[p("density")] = String(scales.density[theme.density]);
  vars[p("font-sans")] = theme.fonts.sans;
  vars[p("font-display")] = theme.fonts.display;
  vars[p("font-mono")] = theme.fonts.mono;
  for (const [size, value] of Object.entries(SHADOWS[theme.shadow])) vars[p(`shadow-${size}`)] = value;
  for (const [key, value] of Object.entries(scales.motionStyles[theme.motion])) vars[p(key)] = value;
  return vars;
}

/** Tokens that do not change between themes. Emitted once, at low specificity. */
export function staticVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  vars[p("spacing")] = scales.spacingUnit;
  // Radius scale derives from the theme's base so one value reshapes everything.
  vars[p("radius-xs")] = `calc(${v("radius-base")} * 0.25)`;
  vars[p("radius-sm")] = `calc(${v("radius-base")} * 0.5)`;
  vars[p("radius-md")] = v("radius-base");
  vars[p("radius-lg")] = `calc(${v("radius-base")} * 1.5)`;
  vars[p("radius-xl")] = `calc(${v("radius-base")} * 2)`;
  vars[p("radius-2xl")] = `calc(${v("radius-base")} * 3)`;
  vars[p("radius-full")] = scales.radius.full;
  for (const [k, val] of Object.entries(scales.borderWidth)) vars[p(`border-${k}`)] = val;
  for (const [k, [size, lh]] of Object.entries(scales.fontSize)) {
    vars[p(`text-${k}`)] = size;
    vars[p(`text-${k}-lh`)] = lh;
  }
  for (const [k, val] of Object.entries(scales.fontWeight)) vars[p(`weight-${k}`)] = val;
  for (const [k, val] of Object.entries(scales.letterSpacing)) vars[p(`tracking-${k}`)] = val;
  for (const [k, val] of Object.entries(scales.lineHeight)) vars[p(`leading-${k}`)] = val;
  // Durations scale with the theme's motion style (subtle 0.85×, expressive 1.15×).
  for (const [k, val] of Object.entries(scales.duration)) vars[p(`duration-${k}`)] = `calc(${val} * ${v("motion-scale")})`;
  for (const [k, val] of Object.entries(scales.easing)) vars[p(`ease-${k}`)] = val;
  for (const [k, val] of Object.entries(scales.zIndex)) vars[p(`z-${k}`)] = val;
  for (const [k, val] of Object.entries(scales.opacity)) vars[p(`opacity-${k}`)] = val;
  for (const [k, val] of Object.entries(scales.blur)) vars[p(`blur-${k}`)] = val;
  // Defaults so the tokens work even before a theme sets its motion style.
  for (const [k, val] of Object.entries(scales.motionStyles.standard)) vars[p(k)] = val;
  vars[p("stagger")] = "40ms";

  // Colored glows: depth that carries the intent's hue (hover states, featured items).
  for (const intent of INTENTS) {
    vars[p(`shadow-glow-${intent}`)] =
      `0 8px 24px -6px color-mix(in srgb, ${v(`color-${intent}-solid`)} 50%, transparent), 0 2px 6px -2px color-mix(in srgb, ${v(`color-${intent}-solid`)} 35%, transparent)`;
  }
  vars[p("focus-glow")] = `0 0 0 4px color-mix(in srgb, ${v("color-focus-ring")} 22%, transparent)`;

  // Decorative gradients reference semantic colors so they follow the theme.
  vars[p("gradient-brand")] = `linear-gradient(135deg, ${v("color-primary-solid")} 0%, ${v("color-accent-solid")} 100%)`;
  vars[p("gradient-vivid")] = `linear-gradient(120deg, ${v("color-primary-solid")} 0%, ${v("color-secondary-solid")} 55%, ${v("color-accent-solid")} 100%)`;
  vars[p("gradient-subtle")] = `linear-gradient(135deg, ${v("color-primary-subtle")} 0%, ${v("color-secondary-subtle")} 50%, ${v("color-accent-subtle")} 100%)`;
  vars[p("gradient-conic")] =
    `conic-gradient(from var(--ks-angle, 0deg), ${v("color-primary-solid")}, ${v("color-secondary-solid")}, ${v("color-accent-solid")}, ${v("color-primary-solid")})`;
  vars[p("gradient-mesh")] =
    `radial-gradient(at 15% 20%, color-mix(in srgb, ${v("color-primary-solid")} 30%, transparent) 0, transparent 50%), radial-gradient(at 85% 10%, color-mix(in srgb, ${v("color-accent-solid")} 25%, transparent) 0, transparent 45%), radial-gradient(at 60% 90%, color-mix(in srgb, ${v("color-secondary-solid")} 25%, transparent) 0, transparent 50%)`;
  vars[p("gradient-glow")] = `radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, ${v("color-primary-solid")} 22%, transparent) 0%, transparent 100%)`;

  // Component tokens: narrow, overridable knobs that default to global tokens.
  const d = v("density");
  vars[p("control-h-xs")] = `calc(1.75rem * ${d})`;
  vars[p("control-h-sm")] = `calc(2rem * ${d})`;
  vars[p("control-h-md")] = `calc(2.5rem * ${d})`;
  vars[p("control-h-lg")] = `calc(3rem * ${d})`;
  vars[p("control-h-xl")] = `calc(3.5rem * ${d})`;
  vars[p("control-px-sm")] = `calc(0.75rem * ${d})`;
  vars[p("control-px-md")] = `calc(1rem * ${d})`;
  vars[p("control-px-lg")] = `calc(1.25rem * ${d})`;
  vars[p("button-radius")] = v("radius-md");
  vars[p("input-radius")] = v("radius-md");
  vars[p("card-radius")] = v("radius-lg");
  vars[p("card-padding")] = `calc(1.5rem * ${d})`;
  vars[p("dialog-radius")] = v("radius-xl");
  vars[p("dialog-shadow")] = v("shadow-xl");
  vars[p("popover-radius")] = v("radius-md");
  vars[p("popover-shadow")] = v("shadow-lg");
  vars[p("badge-radius")] = v("radius-full");
  vars[p("focus-ring-width")] = "2px";
  vars[p("focus-ring-offset")] = "2px";
  return vars;
}

export function cssBlock(selector: string, vars: Record<string, string>, extra = ""): string {
  const body = Object.entries(vars)
    .map(([k, val]) => `  ${k}: ${val};`)
    .join("\n");
  return `${selector} {\n${body}${extra ? `\n${extra}` : ""}\n}\n`;
}

/** Complete CSS for a theme scoped to a selector, e.g. `[data-ks-theme="ocean"]`. */
export function themeCss(theme: ResolvedTheme, selector = `[data-ks-theme="${theme.id}"]`): string {
  return cssBlock(selector, themeVariables(theme));
}

/**
 * Tailwind CSS v4 `@theme inline` block mapping utility names
 * (`bg-primary`, `text-foreground-muted`, `rounded-md`, `shadow-lg`…) to the
 * system's CSS variables. Shipped so consumer Tailwind builds speak the same
 * vocabulary as the components.
 */
export function tailwindThemeCss(): string {
  const lines: string[] = ["@theme inline {", "  --color-*: initial;", "  --color-transparent: transparent;", "  --color-current: currentColor;", "  --color-white: #ffffff;", "  --color-black: #000000;"];
  for (const role of SURFACE_ROLES) lines.push(`  --color-${role}: ${v(`color-${role}`)};`);
  for (const intent of INTENTS) {
    for (const role of INTENT_ROLES) {
      lines.push(`  --color-${intent}-${role}: ${v(`color-${intent}-${role}`)};`);
    }
    // Short alias: `bg-primary` is the solid fill (same as `bg-primary-solid`).
    lines.push(`  --color-${intent}: ${v(`color-${intent}-solid`)};`);
  }
  for (const role of CHART_ROLES) lines.push(`  --color-${role}: ${v(`color-${role}`)};`);
  lines.push(
    "  --radius-*: initial;",
    ...["xs", "sm", "md", "lg", "xl", "2xl", "full"].map((r) => `  --radius-${r}: ${v(`radius-${r}`)};`),
    "  --shadow-*: initial;",
    ...["xs", "sm", "md", "lg", "xl"].map((s) => `  --shadow-${s}: ${v(`shadow-${s}`)};`),
    ...INTENTS.map((i) => `  --shadow-glow-${i}: ${v(`shadow-glow-${i}`)};`),
    `  --shadow-focus-glow: ${v("focus-glow")};`,
    "  --blur-*: initial;",
    ...Object.keys(scales.blur).map((k) => `  --blur-${k}: ${v(`blur-${k}`)};`),
    `  --font-sans: ${v("font-sans")};`,
    `  --font-display: ${v("font-display")};`,
    `  --font-mono: ${v("font-mono")};`,
    ...Object.keys(scales.fontSize).flatMap((k) => [`  --text-${k}: ${v(`text-${k}`)};`, `  --text-${k}--line-height: ${v(`text-${k}-lh`)};`]),
    ...Object.keys(scales.duration).map((k) => `  --duration-${k}: ${v(`duration-${k}`)};`),
    ...Object.keys(scales.easing).map((k) => `  --ease-${k}: ${v(`ease-${k}`)};`),
    `  --ease-interactive: ${v("ease-interactive")};`,
    "  --container-*: initial;",
    ...Object.entries(scales.containers).map(([k, val]) => `  --container-${k}: ${val};`),
    "  --breakpoint-*: initial;",
    ...Object.entries(scales.breakpoints).map(([k, val]) => `  --breakpoint-${k}: ${val};`),
    "}",
  );
  return `${lines.join("\n")}\n`;
}
