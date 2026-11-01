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
  adjustments: ContrastAdjustment[];
  warnings: string[];
}
