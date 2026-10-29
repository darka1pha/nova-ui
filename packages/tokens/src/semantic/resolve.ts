import { contrastRatio, WCAG } from "../color/contrast.ts";
import { hexToOklch, isHexColor, normalizeHex } from "../color/convert.ts";
import { generateScale, nearestStep, SCALE_STEPS, stepOffset, type ColorScale, type ScaleStep } from "../color/palette.ts";
import { palette, white, type PaletteName } from "../primitives/colors.ts";
import { fontFamily } from "../primitives/scales.ts";
import type {
  BrandColors,
  ColorMode,
  ColorSeed,
  ContrastAdjustment,
  ResolvedTheme,
  SemanticOverrides,
  ThemeDefinition,
} from "../themes/types.ts";
import {
  INTENTS,
  SEMANTIC_COLOR_NAMES,
  type Intent,
  type IntentColorName,
  type SemanticColorName,
  type SurfaceRole,
} from "./schema.ts";

interface ResolvedSeed {
  scale: ColorScale;
  /** The step holding the seed color, if the seed was a single color. */
  anchor: ScaleStep | undefined;
}

const isScale = (value: unknown): value is ColorScale =>
  typeof value === "object" && value !== null && SCALE_STEPS.every((s) => isHexColor((value as ColorScale)[s]));

/** Turns any {@link ColorSeed} into a scale. Invalid seeds fall back and warn. */
export function resolveSeed(seed: ColorSeed, fallback: PaletteName, warnings: string[], kind: "chromatic" | "neutral" = "chromatic"): ResolvedSeed {
  if (isScale(seed)) return { scale: seed, anchor: undefined };
  if (typeof seed === "string") {
    if (seed in palette) return { scale: palette[seed as PaletteName], anchor: undefined };
    if (isHexColor(seed)) {
      const scale = generateScale(seed, { kind, anchor: kind === "chromatic" });
      const l = hexToOklch(seed)?.l ?? 0.5;
      return { scale, anchor: kind === "chromatic" ? nearestStep(l) : undefined };
    }
  }
  warnings.push(`Invalid color "${String(seed)}"; using the "${fallback}" palette instead.`);
  return { scale: palette[fallback], anchor: undefined };
}

interface Plan {
  solid: ScaleStep;
  /** +1 walks darker, -1 walks lighter. */
  hover: 1 | -1;
  subtle: ScaleStep;
  subtleHover: ScaleStep;
  onSubtle: ScaleStep;
  border: ScaleStep;
  text: ScaleStep;
}

const PLANS: Record<ColorMode, { chromatic: Plan; neutral: Plan }> = {
  light: {
    chromatic: { solid: 600, hover: 1, subtle: 100, subtleHover: 200, onSubtle: 800, border: 300, text: 700 },
    neutral: { solid: 900, hover: -1, subtle: 100, subtleHover: 200, onSubtle: 800, border: 300, text: 700 },
  },
  dark: {
    chromatic: { solid: 600, hover: -1, subtle: 975, subtleHover: 950, onSubtle: 200, border: 800, text: 300 },
    neutral: { solid: 100, hover: 1, subtle: 900, subtleHover: 800, onSubtle: 100, border: 700, text: 200 },
  },
};

/** Walks a scale from `start` in `dir` until `test` passes. Returns the step or null. */
function walk(start: ScaleStep, dir: 1 | -1, test: (step: ScaleStep) => boolean): ScaleStep | null {
  let step = start;
  for (let i = 0; i < SCALE_STEPS.length; i++) {
    if (test(step)) return step;
    const next = stepOffset(step, dir);
    if (next === step) break;
    step = next;
  }
  return null;
}

interface ModeContext {
  mode: ColorMode;
  out: Partial<Record<SemanticColorName, string>>;
  adjustments: ContrastAdjustment[];
}

function note(ctx: ModeContext, token: SemanticColorName, reason: string, fg: string, bg: string) {
  ctx.adjustments.push({ mode: ctx.mode, token, reason, ratio: Number(contrastRatio(fg, bg).toFixed(2)) });
}

/**
 * Picks a step for a foreground color, walking away from the preferred step
 * until it meets `min` contrast against every background.
 */
function pickReadable(
  ctx: ModeContext,
  token: SemanticColorName,
  scale: ColorScale,
  preferred: ScaleStep,
  backgrounds: string[],
  min: number,
): string {
  const dir: 1 | -1 = ctx.mode === "light" ? 1 : -1;
  const passes = (s: ScaleStep) => backgrounds.every((bg) => contrastRatio(scale[s], bg) >= min);
  const step = walk(preferred, dir, passes);
  if (step === null) {
    const extreme = scale[dir === 1 ? 975 : 50];
    note(ctx, token, `No step reaches ${min}:1; using the most extreme step.`, extreme, backgrounds[0] ?? white);
    return extreme;
  }
  if (step !== preferred) {
    note(ctx, token, `Moved from ${preferred} to ${step} to reach ${min}:1.`, scale[step], backgrounds[0] ?? white);
  }
  return scale[step];
}

function resolveSurfaces(ctx: ModeContext, neutral: ColorScale, primary: ColorScale) {
  const { mode, out } = ctx;
  const n = neutral;
  const s = (role: SurfaceRole, value: string) => {
    out[role] = value;
  };
  if (mode === "light") {
    s("background", n[50]);
    s("surface", white);
    s("surface-raised", white);
    s("surface-sunken", n[100]);
    s("surface-hover", n[100]);
    s("surface-active", n[200]);
    s("border", n[200]);
    s("overlay", n[975]);
    s("shadow", n[975]);
    s("selection", primary[200]);
    s("foreground-disabled", n[400]);
  } else {
    s("background", n[975]);
    s("surface", n[950]);
    s("surface-raised", n[900]);
    s("surface-sunken", n[975]);
    s("surface-hover", n[900]);
    s("surface-active", n[800]);
    s("border", n[800]);
    s("overlay", "#000000");
    s("shadow", "#000000");
    s("selection", primary[800]);
    s("foreground-disabled", n[600]);
  }
  const bgs = [out.background as string, out.surface as string, out["surface-raised"] as string];
  out.foreground = pickReadable(ctx, "foreground", n, mode === "light" ? 975 : 50, bgs, 7);
  out["foreground-secondary"] = pickReadable(ctx, "foreground-secondary", n, mode === "light" ? 700 : 300, bgs, WCAG.text);
  out["foreground-muted"] = pickReadable(ctx, "foreground-muted", n, mode === "light" ? 500 : 400, bgs, WCAG.text);
  // Form control boundaries must be identifiable: 3:1 against their surface.
  out.input = pickReadable(ctx, "input", n, mode === "light" ? 400 : 600, [out.surface as string], WCAG.ui);
  out["border-strong"] = pickReadable(ctx, "border-strong", n, mode === "light" ? 300 : 700, [out.surface as string], 1.6);
}

function resolveIntent(ctx: ModeContext, intent: Intent, seed: ResolvedSeed, neutralScale: ColorScale) {
  const { mode, out } = ctx;
  const { scale } = seed;
  const isNeutral = intent === "neutral";
  const plan = PLANS[mode][isNeutral ? "neutral" : "chromatic"];
  const set = (role: string, value: string) => {
    out[`${intent}-${role}` as IntentColorName] = value;
  };
  const background = out.background as string;
  const surface = out.surface as string;
  const onCandidates = [white, isNeutral ? neutralScale[975] : scale[975], neutralScale[975]];
  const bestOn = (bg: string) => {
    let best = onCandidates[0] as string;
    for (const c of onCandidates) if (contrastRatio(c, bg) > contrastRatio(best, bg)) best = c;
    return best;
  };

  // Solid: keep the brand's own color when it works; walk until text on it is
  // readable (4.5:1) and, in dark mode, the fill stands off the page (3:1).
  // Warning fills read best as a bright tone with dark text rather than a muddy dark one.
  const planSolid = intent === "warning" ? 400 : plan.solid;
  const preferredSolid = !isNeutral && seed.anchor !== undefined ? seed.anchor : planSolid;
  const solidOk = (s: ScaleStep) =>
    contrastRatio(bestOn(scale[s]), scale[s]) >= WCAG.text && (mode === "light" || contrastRatio(scale[s], background) >= WCAG.ui);
  const solidStep = walk(preferredSolid, mode === "light" ? 1 : -1, solidOk) ?? walk(preferredSolid, mode === "light" ? -1 : 1, solidOk) ?? preferredSolid;
  if (solidStep !== preferredSolid) {
    note(ctx, `${intent}-solid`, `Moved from ${preferredSolid} to ${solidStep} so text on it meets 4.5:1.`, bestOn(scale[solidStep]), scale[solidStep]);
  }
  const solid = scale[solidStep];
  const onSolid = bestOn(solid);
  set("solid", solid);
  set("on-solid", onSolid);

  // Hover/active move away from the solid but must keep text readable.
  const hoverOk = (s: ScaleStep) => contrastRatio(onSolid, scale[s]) >= WCAG.text;
  const firstDir = plan.hover;
  const hoverStep =
    [stepOffset(solidStep, firstDir), stepOffset(solidStep, -firstDir as 1 | -1)].find((s) => s !== solidStep && hoverOk(s)) ?? solidStep;
  const hoverDir = (SCALE_STEPS.indexOf(hoverStep) - SCALE_STEPS.indexOf(solidStep)) as number;
  const activeCandidate = stepOffset(hoverStep, hoverDir >= 0 ? 1 : -1);
  set("solid-hover", scale[hoverStep]);
  set("solid-active", hoverOk(activeCandidate) ? scale[activeCandidate] : scale[hoverStep]);

  set("subtle", scale[plan.subtle]);
  set("subtle-hover", scale[plan.subtleHover]);
  set("on-subtle", pickReadable(ctx, `${intent}-on-subtle`, scale, plan.onSubtle, [scale[plan.subtle], scale[plan.subtleHover]], WCAG.text));
  set("border", scale[plan.border]);
  set("text", pickReadable(ctx, `${intent}-text`, scale, plan.text, [background, surface], WCAG.text));
}

const CHART_SOURCES: Intent[] = ["primary", "secondary", "accent", "info", "warning", "success"];

function resolveMode(mode: ColorMode, seeds: Record<Intent, ResolvedSeed>, overrides: SemanticOverrides | undefined, warnings: string[]) {
  const ctx: ModeContext = { mode, out: {}, adjustments: [] };
  resolveSurfaces(ctx, seeds.neutral.scale, seeds.primary.scale);
  for (const intent of INTENTS) resolveIntent(ctx, intent, seeds[intent], seeds.neutral.scale);
  ctx.out["focus-ring"] = pickReadable(ctx, "focus-ring", seeds.primary.scale, mode === "light" ? 500 : 400, [ctx.out.background as string, ctx.out.surface as string], WCAG.ui);
  CHART_SOURCES.forEach((intent, i) => {
    ctx.out[`chart-${i + 1}` as SemanticColorName] = seeds[intent].scale[mode === "light" ? 500 : 400];
  });

  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (!SEMANTIC_COLOR_NAMES.includes(key as SemanticColorName)) {
      warnings.push(`Unknown semantic token "${key}" in ${mode} overrides; ignored.`);
      continue;
    }
    if (typeof value !== "string" || value.trim() === "") continue;
    ctx.out[key as SemanticColorName] = isHexColor(value) ? (normalizeHex(value) as string) : value;
  }
  return { colors: ctx.out as Record<SemanticColorName, string>, adjustments: ctx.adjustments };
}

export interface ResolveOptions {
  /** Brand colors that replace the theme's seeds. */
  brand?: BrandColors;
  /** Extra per-mode semantic overrides, applied after the theme's own. */
  overrides?: Partial<Record<ColorMode, SemanticOverrides>>;
}

const FALLBACKS: Record<Intent, PaletteName> = {
  primary: "violet",
  secondary: "teal",
  accent: "coral",
  neutral: "sand",
  success: "green",
  warning: "amber",
  danger: "red",
  info: "blue",
};

/**
 * Resolves a theme definition into concrete light and dark semantic colors,
 * applying brand colors and overrides and fixing contrast where needed.
 * Pure and deterministic, so it is safe to run on the server and the client.
 */
export function resolveTheme(theme: ThemeDefinition, options: ResolveOptions = {}): ResolvedTheme {
  const warnings: string[] = [];
  const colors: Record<Intent, ColorSeed> = { ...theme.colors };
  for (const [key, value] of Object.entries(options.brand ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (!isHexColor(value)) {
      warnings.push(`Brand color ${key}="${String(value)}" is not a valid hex color; keeping the theme's ${key}.`);
      continue;
    }
    colors[key as Intent] = value;
  }
  const seeds = Object.fromEntries(
    INTENTS.map((intent) => [intent, resolveSeed(colors[intent], FALLBACKS[intent], warnings, intent === "neutral" ? "neutral" : "chromatic")]),
  ) as Record<Intent, ResolvedSeed>;

  const merge = (mode: ColorMode): SemanticOverrides => ({ ...theme.overrides?.[mode], ...options.overrides?.[mode] });
  const light = resolveMode("light", seeds, merge("light"), warnings);
  const dark = resolveMode("dark", seeds, merge("dark"), warnings);

  return {
    id: theme.id,
    light: light.colors,
    dark: dark.colors,
    radius: theme.radius ?? "md",
    shadow: theme.shadow ?? "soft",
    density: theme.density ?? "comfortable",
    motion: theme.motion ?? "standard",
    fonts: {
      sans: theme.fonts?.sans ?? fontFamily.sans,
      display: theme.fonts?.display ?? theme.fonts?.sans ?? fontFamily.display,
      mono: theme.fonts?.mono ?? fontFamily.mono,
    },
    preferredMode: theme.preferredMode,
    adjustments: [...light.adjustments, ...dark.adjustments],
    warnings,
  };
}
