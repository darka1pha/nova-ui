/**
 * Semantic color roles. Components only ever reference these names — never a
 * primitive scale — so a theme can change every color without touching
 * component code.
 */

/** Color intents. Each one expands into the full set of {@link INTENT_ROLES}. */
export const INTENTS = [
  "primary",
  "secondary",
  "accent",
  "neutral",
  "success",
  "warning",
  "danger",
  "info",
] as const;
export type Intent = (typeof INTENTS)[number];

/** Status intents — the subset used for feedback components. */
export const STATUS_INTENTS = ["success", "warning", "danger", "info"] as const;
export type StatusIntent = (typeof STATUS_INTENTS)[number];

/**
 * Roles every intent provides.
 * - `solid`: filled background (buttons, solid badges). Pairs with `on-solid`.
 * - `subtle`: tinted background (soft badges, alerts). Pairs with `on-subtle`.
 * - `border`: tinted border for subtle surfaces.
 * - `text`: intent-colored text or icons on the page background (links).
 */
export const INTENT_ROLES = [
  "solid",
  "solid-hover",
  "solid-active",
  "on-solid",
  "subtle",
  "subtle-hover",
  "on-subtle",
  "border",
  "text",
] as const;
export type IntentRole = (typeof INTENT_ROLES)[number];

/** Page-level surface and text roles. */
export const SURFACE_ROLES = [
  "background",
  "foreground",
  "foreground-secondary",
  "foreground-muted",
  "foreground-disabled",
  "surface",
  "surface-raised",
  "surface-sunken",
  "surface-hover",
  "surface-active",
  "border",
  "border-strong",
  "input",
  "overlay",
  "focus-ring",
  "selection",
  "shadow",
] as const;
export type SurfaceRole = (typeof SURFACE_ROLES)[number];

/** Decorative colors for charts and illustrations. Never used for meaning alone. */
export const CHART_ROLES = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"] as const;
export type ChartRole = (typeof CHART_ROLES)[number];

export type IntentColorName = `${Intent}-${IntentRole}`;
export type SemanticColorName = SurfaceRole | IntentColorName | ChartRole;
export type SemanticColors = Record<SemanticColorName, string>;

export const SEMANTIC_COLOR_NAMES: readonly SemanticColorName[] = [
  ...SURFACE_ROLES,
  ...INTENTS.flatMap((intent) => INTENT_ROLES.map((role) => `${intent}-${role}` as const)),
  ...CHART_ROLES,
];

/** CSS custom property prefix for every token emitted by the system. */
export const CSS_PREFIX = "nv";

export const colorVar = (name: SemanticColorName) => `--${CSS_PREFIX}-color-${name}` as const;
