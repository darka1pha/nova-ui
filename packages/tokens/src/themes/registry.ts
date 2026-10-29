import { resolveTheme, type ResolveOptions } from "../semantic/resolve.ts";
import { INTENTS } from "../semantic/schema.ts";
import { defaultTheme, presets, type PresetName } from "./presets.ts";
import type { ResolvedTheme, ThemeDefinition } from "./types.ts";

const registry = new Map<string, ThemeDefinition>(Object.values(presets).map((t) => [t.id, t]));

/**
 * Builds a complete theme by extending a base (a preset by default).
 * Only what you pass changes; everything else is inherited.
 */
export function createTheme(
  definition: Partial<Omit<ThemeDefinition, "colors">> & { id: string; colors?: Partial<ThemeDefinition["colors"]>; extends?: PresetName | ThemeDefinition },
): ThemeDefinition {
  const { extends: base = defaultTheme, colors, overrides, fonts, ...rest } = definition;
  const parent = typeof base === "string" ? presets[base] : base;
  return {
    ...parent,
    ...rest,
    label: rest.label ?? definition.id,
    colors: { ...parent.colors, ...colors },
    fonts: { ...parent.fonts, ...fonts },
    overrides: {
      light: { ...parent.overrides?.light, ...overrides?.light },
      dark: { ...parent.overrides?.dark, ...overrides?.dark },
    },
  };
}

/** Makes a custom theme available by id, e.g. `<ThemeProvider theme="acme">`. */
export function registerTheme(theme: ThemeDefinition): void {
  const missing = INTENTS.filter((i) => theme.colors[i] === undefined);
  if (missing.length) throw new TypeError(`registerTheme("${theme.id}"): missing colors for ${missing.join(", ")}`);
  registry.set(theme.id, theme);
  cache.clear();
}

export function getTheme(id: string): ThemeDefinition | undefined {
  return registry.get(id);
}

export function listThemes(): ThemeDefinition[] {
  return [...registry.values()];
}

const cache = new Map<string, ResolvedTheme>();

/**
 * Resolves a theme by id or definition, memoized by input so repeated renders
 * and SSR requests do not recompute palettes.
 */
export function getResolvedTheme(theme: string | ThemeDefinition, options: ResolveOptions = {}): ResolvedTheme {
  const def = typeof theme === "string" ? registry.get(theme) : theme;
  const warnings: string[] = [];
  if (!def) warnings.push(`Unknown theme "${String(theme)}"; falling back to "${defaultTheme.id}".`);
  const target = def ?? defaultTheme;
  const key = JSON.stringify([target, options]);
  let resolved = cache.get(key);
  if (!resolved) {
    resolved = resolveTheme(target, options);
    if (cache.size > 64) cache.clear();
    cache.set(key, resolved);
  }
  return warnings.length ? { ...resolved, warnings: [...warnings, ...resolved.warnings] } : resolved;
}
