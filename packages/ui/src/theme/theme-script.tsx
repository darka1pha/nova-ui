export interface ThemeScriptProps {
  /** Must match the `storageKey` passed to `<ThemeProvider>`. */
  storageKey: string;
  /**
   * Match the provider's `defaultMode` ("light" or "dark") so a first visit with
   * nothing stored also paints in that mode. Omit it for "system".
   */
  defaultMode?: "light" | "dark" | "system";
  /** CSP nonce, if your policy requires one for inline scripts. */
  nonce?: string;
}

/**
 * Returns the inline script source that applies a stored color mode (or the
 * default) to `<html data-nv-mode>` before first paint. Useful for frameworks
 * that inject head content as strings.
 */
export function getThemeScript(storageKey: string, defaultMode?: "light" | "dark" | "system"): string {
  const key = JSON.stringify(storageKey);
  const fallback = defaultMode === "light" || defaultMode === "dark" ? JSON.stringify(defaultMode) : "null";
  return `(function(){try{var m=localStorage.getItem(${key});if(m!=="light"&&m!=="dark"&&m!=="system")m=${fallback};if(m==="light"||m==="dark")document.documentElement.setAttribute("data-nv-mode",m);}catch(e){}})();`;
}

/**
 * Render inside `<head>` when using `storageKey`, so a persisted light/dark
 * choice is applied before the page paints (no flash, no hydration mismatch).
 */
export function ThemeScript({ storageKey, defaultMode, nonce }: ThemeScriptProps) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: getThemeScript(storageKey, defaultMode) }} />;
}
