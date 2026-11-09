---
"@darkalpha/nova-ui": minor
---

Theming additions:

- A `ThemeProvider` with `storageKey` now follows mode changes made in other tabs and windows of the same origin (the `storage` event), and runs `onModeChange` there too. If the key is removed or storage is cleared, it falls back to `defaultMode` (or the theme's preferred mode, else "system"). Controlled providers (`mode`) ignore it.
- `useThemeVariables()` returns the nearest theme's colors for the mode in effect: `colors` (every semantic color), `chart` (the eight chart colors), `mode`, and `cssVar(name)`. Use it for canvas, WebGL and chart libraries that can't read CSS variables; it updates when the theme, brand or mode changes.
