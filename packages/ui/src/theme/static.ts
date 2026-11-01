import { getResolvedTheme, themeCss, type ResolveOptions, type ThemeDefinition } from "@darkalpha/nova-tokens";

/**
 * Generates a complete CSS block for a theme. Use it to theme a page from the
 * server (e.g. inside a <style> tag) or to build static theme files.
 */
export function getThemeCss(theme: string | ThemeDefinition, options: ResolveOptions & { selector?: string } = {}): string {
  const { selector, ...resolve } = options;
  const resolved = getResolvedTheme(theme, resolve);
  return themeCss(resolved, selector ?? `[data-nv-theme="${resolved.id}"]`);
}
