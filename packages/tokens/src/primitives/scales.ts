/**
 * Non-color primitive tokens: the raw vocabulary every semantic and
 * component token draws from.
 */

/** Base spacing unit. Utility classes multiply this (p-4 = 4 × unit = 1rem). */
export const spacingUnit = "0.25rem";

export const radius = {
  none: "0px",
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;
export type RadiusToken = keyof typeof radius;

export const borderWidth = {
  thin: "1px",
  thick: "2px",
} as const;

export const fontFamily = {
  sans: `"Plus Jakarta Sans Variable", "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`,
  display: `"Bricolage Grotesque Variable", "Bricolage Grotesque", "Plus Jakarta Sans Variable", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`,
  serif: `"Fraunces Variable", "Fraunces", ui-serif, Georgia, Cambria, "Times New Roman", serif`,
  mono: `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`,
  system: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif`,
} as const;

/** Font sizes as [size, line-height]. */
export const fontSize = {
  "2xs": ["0.6875rem", "1rem"],
  xs: ["0.75rem", "1rem"],
  sm: ["0.875rem", "1.25rem"],
  md: ["1rem", "1.5rem"],
  lg: ["1.125rem", "1.75rem"],
  xl: ["1.25rem", "1.75rem"],
  "2xl": ["1.5rem", "2rem"],
  "3xl": ["1.875rem", "2.25rem"],
  "4xl": ["2.25rem", "2.5rem"],
  "5xl": ["3rem", "1.1"],
  "6xl": ["3.75rem", "1.05"],
  "7xl": ["4.5rem", "1"],
} as const;
export type FontSizeToken = keyof typeof fontSize;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

export const letterSpacing = {
  tighter: "-0.04em",
  tight: "-0.02em",
  normal: "0em",
  wide: "0.02em",
  wider: "0.06em",
} as const;

export const lineHeight = {
  none: "1",
  tight: "1.2",
  snug: "1.35",
  normal: "1.5",
  relaxed: "1.65",
} as const;

export const opacity = {
  disabled: "0.5",
  muted: "0.7",
  overlay: "0.6",
} as const;

export const duration = {
  instant: "50ms",
  fast: "120ms",
  normal: "200ms",
  slow: "320ms",
  slower: "480ms",
  slowest: "720ms",
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  emphasized: "cubic-bezier(0.3, 1.3, 0.5, 1)",
  /** A gentle spring with a small overshoot (CSS linear() approximation). */
  spring:
    "linear(0, 0.034 1.4%, 0.13 3%, 0.483 8.6%, 0.643 11.6%, 0.775 14.9%, 0.873 18.3%, 0.948 22.1%, 1.002 26.6%, 1.033 31.5%, 1.042 36.9%, 1.036 43%, 1.006 61.3%, 0.997 75.2%, 1)",
  /** A playful spring that settles after a visible bounce. */
  bounce:
    "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)",
} as const;

/**
 * Motion personalities. A theme picks one; components read the resulting
 * interaction tokens (`--ks-hover-lift`, `--ks-press-scale`…), so the same
 * Button feels calm in "minimal" and lively in "berry".
 */
export const motionStyles = {
  subtle: {
    "motion-scale": "0.85",
    "hover-lift": "-1px",
    "hover-scale": "1.01",
    "press-scale": "0.985",
    "ease-interactive": easing.standard,
  },
  standard: {
    "motion-scale": "1",
    "hover-lift": "-2px",
    "hover-scale": "1.02",
    "press-scale": "0.97",
    "ease-interactive": easing.spring,
  },
  expressive: {
    "motion-scale": "1.15",
    "hover-lift": "-3px",
    "hover-scale": "1.04",
    "press-scale": "0.94",
    "ease-interactive": easing.bounce,
  },
} as const;
export type MotionStyle = keyof typeof motionStyles;

export const blur = {
  sm: "4px",
  md: "12px",
  lg: "24px",
  xl: "48px",
} as const;

export const zIndex = {
  base: "0",
  raised: "10",
  dropdown: "1000",
  sticky: "1100",
  overlay: "1200",
  modal: "1300",
  popover: "1400",
  toast: "1500",
  tooltip: "1600",
} as const;

export const breakpoints = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export const containers = {
  xs: "20rem",
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
  "4xl": "56rem",
  "5xl": "64rem",
  "6xl": "72rem",
  "7xl": "80rem",
  prose: "65ch",
} as const;

/** Density multipliers applied to control heights and component padding. */
export const density = {
  compact: 0.85,
  comfortable: 1,
  spacious: 1.15,
} as const;
export type Density = keyof typeof density;
