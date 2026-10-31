"use client";

import {
  defaultTheme,
  getResolvedTheme,
  primitives,
  themeVariables,
  type BrandColors,
  type ColorMode,
  type Density,
  type MotionStyle,
  type RadiusPreset,
  type ResolvedTheme,
  type SemanticOverrides,
  type SurfaceStyle,
  type ThemeDefinition,
  type ThemeFonts,
} from "@kaleido/tokens";
import { Direction } from "radix-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { devWarn } from "../utils/dev.ts";

export type ModePreference = ColorMode | "system";
export type MotionPreference = "system" | "reduce";

export interface ThemeProviderProps extends Omit<HTMLAttributes<HTMLDivElement>, "dir"> {
  /** A preset name (`"vibrant"`, `"ocean"`…), a registered theme id, or a theme object. */
  theme?: string | ThemeDefinition;
  /** Replace the theme's brand seeds with your own hex colors. */
  brand?: BrandColors;
  /** Per-mode semantic token overrides, e.g. `{ light: { background: "#fff" } }`. */
  overrides?: Partial<Record<ColorMode, SemanticOverrides>>;
  /** Controlled color mode. Omit to let the provider manage it. */
  mode?: ModePreference;
  /** Initial mode when uncontrolled. Defaults to the theme's preferred mode, else "system". */
  defaultMode?: ModePreference;
  /** Called whenever the mode preference changes. */
  onModeChange?: (mode: ModePreference) => void;
  /**
   * Persist the mode preference in localStorage under this key. Pair with
   * `<ThemeScript storageKey>` in the document head to avoid a flash on load.
   */
  storageKey?: string;
  radius?: RadiusPreset;
  surface?: SurfaceStyle;
  density?: Density;
  fonts?: ThemeFonts;
  /** `"reduce"` forces reduced motion regardless of the OS setting. */
  motion?: MotionPreference;
  /** Motion personality: "subtle", "standard" or "expressive". Defaults to the theme's. */
  motionStyle?: MotionStyle;
  /** Text direction for this subtree. Also configures Radix primitives. */
  dir?: "ltr" | "rtl";
  /**
   * BCP 47 locale for this subtree, e.g. "fa-IR". Date, number and calendar
   * components use it when they are not given their own, and it is written
   * to `lang` so screen readers pronounce text correctly. Inherited by nested providers.
   */
  locale?: string;
  /**
   * Calendar system for dates. Defaults to "persian" (Jalali) for Persian
   * locales or a `-u-ca-persian` locale, otherwise "gregory".
   */
  calendar?: CalendarSystemName;
  children?: ReactNode;
}

export type CalendarSystemName = "gregory" | "persian";

/** The calendar a locale implies: an explicit `-u-ca-` extension, else Jalali for Persian. */
export function calendarForLocale(locale: string | undefined): CalendarSystemName {
  if (!locale) return "gregory";
  const ca = /-u-(?:.*-)?ca-([a-z]+)/i.exec(locale)?.[1]?.toLowerCase();
  if (ca) return ca === "persian" ? "persian" : "gregory";
  return /^fa(-|$)/i.test(locale) ? "persian" : "gregory";
}

export interface ThemeContextValue {
  /** The resolved theme (colors for both modes, fonts, radius…). */
  theme: ResolvedTheme;
  /** The user's preference, which may be "system". */
  mode: ModePreference;
  /** The mode actually in effect. */
  resolvedMode: ColorMode;
  setMode: (mode: ModePreference) => void;
  dir: "ltr" | "rtl";
  /** Locale for this subtree, if one was set on this or an outer provider. */
  locale: string | undefined;
  calendar: CalendarSystemName;
  /** Element portals render into so overlays inherit this theme. */
  portalContainer: HTMLElement | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const darkQuery = "(prefers-color-scheme: dark)";
function subscribeSystemDark(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(darkQuery);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
const getSystemDark = () => typeof window !== "undefined" && !!window.matchMedia?.(darkQuery).matches;

/** Reads the OS color scheme. Returns false during SSR and hydration. */
export function useSystemDarkMode(): boolean {
  return useSyncExternalStore(subscribeSystemDark, getSystemDark, () => false);
}

function readStoredMode(key: string | undefined): ModePreference | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key);
    return value === "light" || value === "dark" || value === "system" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Applies a theme to its subtree through CSS custom properties. Themes nest:
 * an inner provider inherits the outer mode unless it sets its own.
 */
export function ThemeProvider({
  theme = defaultTheme.id,
  brand,
  overrides,
  mode: modeProp,
  defaultMode,
  onModeChange,
  storageKey,
  radius,
  surface,
  density,
  fonts,
  motion = "system",
  motionStyle,
  dir: dirProp,
  locale: localeProp,
  calendar: calendarProp,
  className,
  style,
  children,
  ...rest
}: ThemeProviderProps) {
  const parent = useContext(ThemeContext);

  // Serialize inputs so inline objects (`brand={{…}}`) do not re-resolve every render.
  const key = JSON.stringify([theme, brand, overrides]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => getResolvedTheme(theme, { brand, overrides }), [key]);

  useEffect(() => {
    for (const warning of resolved.warnings) devWarn(warning);
  }, [resolved]);

  // A nested provider follows its parent's mode unless told otherwise.
  const inherits = parent !== null && modeProp === undefined && defaultMode === undefined && !storageKey && !resolved.preferredMode;
  const [internalMode, setInternalMode] = useState<ModePreference>(() => defaultMode ?? resolved.preferredMode ?? "system");
  useEffect(() => {
    const stored = readStoredMode(storageKey);
    if (stored) setInternalMode(stored);
  }, [storageKey]);

  const localSetMode = useCallback(
    (next: ModePreference) => {
      if (modeProp === undefined) setInternalMode(next);
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, next);
          if (next === "system") delete document.documentElement.dataset.ksMode;
          else document.documentElement.dataset.ksMode = next;
        } catch {
          /* storage unavailable (private mode, quota) — preference stays in memory */
        }
      }
      onModeChange?.(next);
    },
    [modeProp, storageKey, onModeChange],
  );

  const mode: ModePreference = modeProp ?? (inherits ? parent.mode : internalMode);
  const setMode = inherits ? parent.setMode : localSetMode;
  const systemDark = useSystemDarkMode();
  const resolvedMode: ColorMode = inherits ? parent.resolvedMode : mode === "system" ? (systemDark ? "dark" : "light") : mode;

  const isDefaultLook =
    resolved.id === defaultTheme.id && !brand && !overrides && !fonts && !radius && !surface && !density && !motionStyle;
  const fontKey = JSON.stringify(fonts);
  const vars = useMemo(() => {
    // The default theme ships in styles.css already; only emit what differs.
    if (isDefaultLook && !parent) return {};
    const all = themeVariables({
      ...resolved,
      radius: radius ?? resolved.radius,
      surface: surface ?? resolved.surface,
      density: density ?? resolved.density,
      motion: motionStyle ?? resolved.motion,
      fonts: { ...resolved.fonts, ...fonts },
    });
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, radius, surface, density, motionStyle, fontKey, isDefaultLook, parent]);

  const dir = dirProp ?? parent?.dir ?? "ltr";
  const locale = localeProp ?? parent?.locale;
  const calendar = calendarProp ?? (localeProp ? calendarForLocale(localeProp) : parent?.calendar ?? "gregory");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: resolved, mode, resolvedMode, setMode, dir, locale, calendar, portalContainer }),
    [resolved, mode, resolvedMode, setMode, dir, locale, calendar, portalContainer],
  );

  // Only an explicit choice is written; "system" and inherited modes are left
  // to CSS (`color-scheme`), which is what keeps SSR output flash-free.
  const explicitMode = inherits || mode === "system" ? undefined : mode;
  return (
    <ThemeContext.Provider value={value}>
      <Direction.Provider dir={dir}>
        <div
          {...rest}
          dir={dirProp ?? (parent ? undefined : dir)}
          lang={localeProp ?? rest.lang}
          data-ks-theme={resolved.id}
          data-ks-mode={explicitMode}
          data-ks-motion={motion === "reduce" ? "reduce" : undefined}
          data-ks-density={density ?? resolved.density}
          data-ks-motion-style={motionStyle ?? resolved.motion}
          data-ks-surface={surface ?? resolved.surface}
          className={className ? `ks-theme ${className}` : "ks-theme"}
          style={{ ...(vars as CSSProperties), ...style }}
        >
          {children}
          <div data-ks-portal-root="" ref={setPortalContainer} />
        </div>
      </Direction.Provider>
    </ThemeContext.Provider>
  );
}

/** Access the active theme, color mode and direction. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    devWarn("useTheme() was called outside <ThemeProvider>; returning the default theme.");
    return fallbackContext;
  }
  return ctx;
}

/**
 * The locale and calendar for date and number formatting: the component's own
 * `locale` prop wins, then the nearest ThemeProvider's, then the browser's.
 */
export function useLocale(locale?: string): { locale: string | undefined; calendar: CalendarSystemName } {
  const ctx = useContext(ThemeContext);
  if (locale) return { locale, calendar: calendarForLocale(locale) };
  return { locale: ctx?.locale, calendar: ctx?.calendar ?? "gregory" };
}

/** Like {@link useTheme} but returns null outside a provider. */
export function useOptionalTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

const fallbackContext: ThemeContextValue = {
  theme: getResolvedTheme(defaultTheme),
  mode: "system",
  resolvedMode: "light",
  setMode: () => devWarn("setMode() has no effect outside <ThemeProvider>."),
  dir: "ltr",
  locale: undefined,
  calendar: "gregory",
  portalContainer: null,
};

/** The density multiplier for a density preset; handy for custom components. */
export const densityFactor = (d: Density) => primitives.density[d];
