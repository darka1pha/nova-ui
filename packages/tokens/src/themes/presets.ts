import { fontFamily } from "../primitives/scales.ts";
import type { ThemeDefinition } from "./types.ts";

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

export const kaveh: ThemeDefinition = {
  id: "kaveh",
  label: "Kaveh",
  description: "Energetic port orange with deep maritime navy and harbor blue accents on cool slate.",
  colors: { primary: "#f07025", secondary: "#114b94", accent: "#a5bbe2", neutral: "slate", ...status, info: "sky" },
  radius: "md",
  shadow: "crisp",
};

export const presets = { vibrant, ocean, sunset, forest, berry, minimal, midnight, premium, kaveh } as const;
export type PresetName = keyof typeof presets;
export const defaultTheme = vibrant;
