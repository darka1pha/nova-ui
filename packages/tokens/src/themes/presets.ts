import { fontFamily } from "../primitives/scales.ts";
import type { SemanticOverrides, ThemeDefinition } from "./types.ts";

const status = { success: "green", warning: "amber", danger: "red", info: "blue" } as const;

/** Colorful, optimistic, expressive. The default. */
export const vibrant: ThemeDefinition = {
  id: "vibrant",
  label: "Vibrant",
  description: "Vivid violet with fresh teal and an energetic coral accent on warm neutrals.",
  colors: { primary: "violet", secondary: "teal", accent: "coral", neutral: "sand", ...status },
  radius: "md",
  shadow: "soft",
  motion: "standard",
};

export const ocean: ThemeDefinition = {
  id: "ocean",
  label: "Ocean",
  description: "Electric blue, cyan and teal over cool slate.",
  colors: { primary: "blue", secondary: "cyan", accent: "teal", neutral: "slate", ...status, info: "sky" },
  radius: "lg",
  shadow: "soft",
};

export const sunset: ThemeDefinition = {
  id: "sunset",
  label: "Sunset",
  description: "Coral, orange and warm pink with sand neutrals.",
  colors: { primary: "coral", secondary: "orange", accent: "pink", neutral: "sand", ...status, warning: "amber" },
  radius: "lg",
  shadow: "soft",
  motion: "expressive",
  fonts: { display: fontFamily.display },
};

export const forest: ThemeDefinition = {
  id: "forest",
  label: "Forest",
  description: "Natural green and mint with amber highlights on stone neutrals.",
  colors: { primary: "green", secondary: "mint", accent: "amber", neutral: "stone", ...status, success: "teal" },
  radius: "md",
  shadow: "crisp",
};

export const berry: ThemeDefinition = {
  id: "berry",
  label: "Berry",
  description: "Violet and magenta with a pink accent on cool slate.",
  colors: { primary: "magenta", secondary: "violet", accent: "pink", neutral: "slate", ...status },
  radius: "xl",
  shadow: "soft",
  motion: "expressive",
};

export const minimal: ThemeDefinition = {
  id: "minimal",
  label: "Minimal",
  description: "Restrained ink-on-paper neutrals with a single quiet blue accent.",
  colors: { primary: "gray", secondary: "gray", accent: "blue", neutral: "gray", ...status },
  radius: "sm",
  shadow: "flat",
  motion: "subtle",
  fonts: { sans: fontFamily.system, display: fontFamily.system },
};

export const midnight: ThemeDefinition = {
  id: "midnight",
  label: "Midnight",
  description: "Deep ink surfaces with luminous cyan and violet accents. Dark-first.",
  colors: { primary: "cyan", secondary: "violet", accent: "pink", neutral: "ink", ...status, info: "sky" },
  radius: "lg",
  shadow: "crisp",
  preferredMode: "dark",
};

export const premium: ThemeDefinition = {
  id: "premium",
  label: "Premium",
  description: "Elegant ink neutrals, refined serif display type and controlled gold accents.",
  colors: { primary: "ink", secondary: "slate", accent: "gold", neutral: "gray", ...status },
  radius: "sm",
  shadow: "crisp",
  motion: "subtle",
  fonts: { display: fontFamily.serif },
};

/*
 * Kaveh Port & Marine Services (KMS). Every Kaveh preset shares the brand core:
 * a strict two-color rule. KMS navy is the base: text, links, headers, tooltips,
 * every tint and soft badge, and in dark mode the page itself. Kaveh orange is
 * for action only: solid primary fills (main buttons, switches, checkboxes,
 * progress), focus and selection, with Deep Harbour navy text on it (white on
 * orange is only 2.9:1). Seasonal presets add their accent and nothing else.
 */
const kavehNavy = "#164a96";
const kavehOrange = "#f37021";

/** Overrides that keep orange in front and navy as its counterpart in every Kaveh preset. */
const kavehBrand = (light: SemanticOverrides = {}, dark: SemanticOverrides = {}): ThemeDefinition["overrides"] => ({
  light: {
    // Navy carries the reading layer: body text, links and dark fills.
    foreground: "#040f26",
    "primary-on-solid": "#0b1f3f",
    // Orange stays solid-only; every tint, link and soft badge of the primary is navy.
    "primary-text": kavehNavy,
    "primary-subtle": "#e9effa",
    "primary-subtle-hover": "#dce6f7",
    "primary-on-subtle": kavehNavy,
    "primary-border": "#a9bee3",
    "neutral-solid": kavehNavy,
    "neutral-solid-hover": "#1d5ab0",
    "neutral-solid-active": "#2464c0",
    "neutral-on-solid": "#ffffff",
    "secondary-text": kavehNavy,
    "focus-ring": "#d4580f",
    selection: "#ffd9bf",
    "chart-1": kavehOrange,
    "chart-2": kavehNavy,
    "chart-3": "#ff8a3d",
    "chart-4": "#4f7bc4",
    "chart-5": "#0b1f3f",
    "chart-6": "#a9bee3",
    ...light,
  },
  dark: {
    background: "#071730",
    surface: "#0b1f3f",
    "surface-raised": "#102a52",
    "surface-sunken": "#051226",
    "surface-hover": "#13305c",
    "surface-active": "#183868",
    border: "#1f3d6b",
    "primary-on-solid": "#0b1f3f",
    "primary-subtle": "#13305c",
    "primary-subtle-hover": "#183868",
    "primary-on-subtle": "#cfe0ff",
    "primary-border": "#2b4f86",
    "neutral-solid": kavehNavy,
    "neutral-solid-hover": "#1d5ab0",
    "neutral-solid-active": "#2464c0",
    "neutral-on-solid": "#ffffff",
    "primary-text": "#9cbcf0",
    "secondary-text": "#9cbcf0",
    "focus-ring": "#ff8a3d",
    selection: "#7a3410",
    "chart-1": "#ff8a3d",
    "chart-2": "#6f97da",
    "chart-3": "#f37021",
    "chart-4": "#a9bee3",
    "chart-5": "#ffc49c",
    "chart-6": "#3f6db8",
    ...dark,
  },
});

/**
 * Kaveh gradients: a harbour sunset. Fills that carry text (`brand`, `vivid`)
 * stay in the warm orange band so Deep Harbour navy text keeps at least 4.5:1 on
 * every stop; ambient ones (`mesh`, `subtle`, `conic`) let navy meet the orange,
 * like the sun setting over the Gulf. `warm` is the far end of the sunset and
 * `third` the seasonal color that joins the ambient gradients.
 */
const kavehGradients = (warm: string, third: string): ThemeDefinition["gradients"] => ({
  brand: `linear-gradient(135deg, #ffb35c 0%, ${kavehOrange} 55%, ${warm} 100%)`,
  vivid: `linear-gradient(120deg, #ffc46b 0%, #ff9a4d 30%, ${kavehOrange} 65%, ${warm} 100%)`,
  subtle: "linear-gradient(135deg, light-dark(#e9effa, #13305c) 0%, light-dark(#f4f7fc, #0f2649) 55%, light-dark(#ffefe3, #3a2112) 100%)",
  conic: `conic-gradient(from var(--nv-angle, 0deg), ${kavehNavy}, #4f7bc4, ${kavehOrange}, #ffb35c, ${kavehNavy})`,
  mesh: `radial-gradient(at 12% 18%, color-mix(in srgb, ${kavehNavy} 32%, transparent) 0, transparent 52%), radial-gradient(at 88% 82%, color-mix(in srgb, ${kavehOrange} 30%, transparent) 0, transparent 50%), radial-gradient(at 85% 12%, color-mix(in srgb, ${third} 26%, transparent) 0, transparent 45%)`,
  glow: `radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, ${kavehOrange} 20%, transparent) 0%, color-mix(in srgb, ${kavehNavy} 8%, transparent) 55%, transparent 100%)`,
});

/** Kaveh core: two colors only. Navy for structure and text, Kaveh orange for actions. */
export const kaveh: ThemeDefinition = {
  id: "kaveh",
  label: "Kaveh",
  description: "Two colors from the logo: KMS navy for structure, text and links, Kaveh orange for actions, with a Deep Harbour dark mode.",
  colors: {
    primary: kavehOrange,
    secondary: kavehNavy,
    accent: "#0b1f3f",
    neutral: "#5b6982",
    ...status,
    warning: "amber",
    info: "sky",
  },
  radius: "md",
  shadow: "crisp",
  motion: "standard",
  overrides: kavehBrand(),
  gradients: kavehGradients("#ec5f24", "#a9bee3"),
};

/**
 * Kaveh for Yalda Night (شب یلدا), the longest night of the year. Opens on the
 * night sky (Deep Harbour navy), with orange candlelight leading and pomegranate
 * red as the accent. Dark-first.
 */
export const kavehYalda: ThemeDefinition = {
  id: "kaveh-yalda",
  label: "Kaveh · Yalda",
  description: "Yalda Night: Deep Harbour navy night, Kaveh orange candlelight and pomegranate red.",
  colors: {
    primary: kavehOrange,
    secondary: kavehNavy,
    accent: "#b3122e",
    neutral: "#4a5f86",
    ...status,
    warning: "amber",
    info: "sky",
  },
  radius: "md",
  shadow: "soft",
  motion: "standard",
  preferredMode: "dark",
  gradients: {
    ...kavehGradients("#ef5a3c", "#b3122e"),
    vivid: `linear-gradient(120deg, #ffc46b 0%, #e8a33d 28%, ${kavehOrange} 62%, #ef5a3c 100%)`,
  },
  overrides: kavehBrand(
    { "chart-3": "#b3122e", "chart-4": "#e8a33d" },
    { background: "#081430", surface: "#0d1c42", "surface-raised": "#13265a", "chart-3": "#e85a6b", "chart-4": "#e8a33d" },
  ),
};

/**
 * Kaveh for Nowruz (نوروز), the Persian New Year at the spring equinox. Orange
 * and navy stay in front; sabzeh green is the accent and firouzeh turquoise carries
 * info, with softer corners and livelier motion. Light-first.
 */
export const kavehNowruz: ThemeDefinition = {
  id: "kaveh-nowruz",
  label: "Kaveh · Nowruz",
  description: "Nowruz spring: Kaveh navy and orange with sabzeh green and firouzeh turquoise.",
  colors: {
    primary: kavehOrange,
    secondary: kavehNavy,
    accent: "#2f9a55",
    neutral: "#4f6a78",
    ...status,
    success: "#2f9a55",
    warning: "amber",
    info: "#18a5a7",
  },
  radius: "lg",
  shadow: "soft",
  motion: "expressive",
  preferredMode: "light",
  gradients: {
    ...kavehGradients("#ec5f24", "#3ba55c"),
    // Spring morning: orange sun into new leaf.
    vivid: `linear-gradient(120deg, ${kavehOrange} 0%, #ffb35c 50%, #a8d86e 100%)`,
  },
  overrides: kavehBrand({ "chart-3": "#2f9a55", "chart-4": "#18a5a7" }, { "chart-3": "#5cc47f", "chart-4": "#3cc2c4" }),
};

export const presets = {
  vibrant,
  ocean,
  sunset,
  forest,
  berry,
  minimal,
  midnight,
  premium,
  kaveh,
  "kaveh-yalda": kavehYalda,
  "kaveh-nowruz": kavehNowruz,
} as const;
export type PresetName = keyof typeof presets;
export const defaultTheme = vibrant;
