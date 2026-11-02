import type { ColorScale } from "../color/palette.ts";
import type { PaletteName } from "../primitives/colors.ts";
import type { Density, MotionStyle } from "../primitives/scales.ts";
import type { Intent, SemanticColorName } from "../semantic/schema.ts";

export type ColorMode = "light" | "dark";

/**
 * Where an intent's colors come from: a built-in palette name, any hex color
 * (a full scale is generated from it), or a hand-made scale.
 */
export type ColorSeed = PaletteName | (string & {}) | ColorScale;

export type RadiusPreset = "none" | "sm" | "md" | "lg" | "xl";
export type ShadowStyle = "soft" | "crisp" | "flat";
export type SurfaceStyle = "classic" | "glass" | "clay" | "neomorphic";

export interface ThemeFonts {
  /** Body and UI text. */
  sans?: string;
  /** Headlines and display text. */
  display?: string;
  /** Code. */
  mono?: string;
}

export type SemanticOverrides = Partial<Record<SemanticColorName, string>>;

/** Decorative gradient tokens, emitted as `--nv-gradient-<name>`. */
export type GradientName = "brand" | "vivid" | "subtle" | "conic" | "mesh" | "glow";

/**
 * Hand-made gradients that replace the ones derived from the theme's colors.
 * Values are CSS `<image>`s; use `light-dark()` in color stops to differ by mode.
 * `brand` and `vivid` sit behind `primary-on-solid` text, so every stop must keep
 * that text readable.
 */
export type ThemeGradients = Partial<Record<GradientName, string>>;

export interface ThemeDefinition {
  /** Unique id used for registration and `data-nv-theme`. */
  id: string;
  label: string;
  description?: string;
  colors: Record<Intent, ColorSeed>;
  /** Overall roundness. Every radius token scales from this. */
  radius?: RadiusPreset;
  shadow?: ShadowStyle;
  surface?: SurfaceStyle;
  density?: Density;
  /** Motion personality: how far things lift, squash and spring. */
  motion?: MotionStyle;
  fonts?: ThemeFonts;
  /** The mode used when the consumer asks for "system" but the theme prefers one. */
  preferredMode?: ColorMode;
  /** Per-mode semantic overrides, applied after automatic derivation. */
  overrides?: Partial<Record<ColorMode, SemanticOverrides>>;
  /** Custom decorative gradients. Omitted ones are derived from the theme's colors. */
  gradients?: ThemeGradients;
}

/** The colors a consumer can pass to rebrand any theme. */
export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
}

/** A contrast fix the resolver applied, reported so tooling can surface it. */
export interface ContrastAdjustment {
  mode: ColorMode;
  token: SemanticColorName;
  reason: string;
  ratio: number;
}

export interface ResolvedTheme {
  id: string;
  light: Record<SemanticColorName, string>;
  dark: Record<SemanticColorName, string>;
  radius: RadiusPreset;
  shadow: ShadowStyle;
  surface: SurfaceStyle;
  density: Density;
  motion: MotionStyle;
  fonts: Required<ThemeFonts>;
  preferredMode: ColorMode | undefined;
  /** The theme's hand-made gradients (empty when derived, or when rebranded). */
  gradients: ThemeGradients;
  adjustments: ContrastAdjustment[];
  warnings: string[];
}
