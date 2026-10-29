# @kaleido/ui

Colorful, accessible, themeable React components.

```bash
pnpm add @kaleido/ui
```

```tsx
import { Button, ThemeProvider } from "@kaleido/ui";
import "@kaleido/ui/styles.css";

<ThemeProvider theme="ocean" brand={{ primary: "#0f766e" }}>
  <Button>Get started</Button>
</ThemeProvider>;
```

## Entry points

| Import | Contents |
| --- | --- |
| `@kaleido/ui` | Components, `ThemeProvider`, `ThemeScript`, hooks, `cn`, and the token API (`createTheme`, `registerTheme`, `auditContrast`…) |
| `@kaleido/ui/styles.css` | Required once. Tokens, a reset scoped to `.ks-theme`, and component styles. No global preflight. |
| `@kaleido/ui/themes.css` | Optional. All presets as `[data-ks-theme="…"]` blocks for zero-JS theming. |
| `@kaleido/ui/react-hook-form` | Optional bindings for react-hook-form (any resolver, e.g. zod). Requires `react-hook-form` ≥ 7.55; never loaded by the main entry. |
| `@kaleido/ui/tailwind.css` | Optional, for Tailwind v4 apps: `@import "tailwindcss"; @import "@kaleido/ui/tailwind.css";` |

## ThemeProvider

| Prop | Type | Default |
| --- | --- | --- |
| `theme` | preset name, registered id, or `ThemeDefinition` | `"vibrant"` |
| `brand` | `{ primary?, secondary?, accent?, neutral? }` (hex) | — |
| `overrides` | `{ light?: {...}, dark?: {...} }` semantic tokens | — |
| `mode` / `defaultMode` / `onModeChange` | `"light" \| "dark" \| "system"` | theme preference, else `"system"` |
| `storageKey` | persist the mode (pair with `<ThemeScript>`) | — |
| `radius` | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | from theme |
| `density` | `"compact" \| "comfortable" \| "spacious"` | from theme |
| `fonts` | `{ sans?, display?, mono? }` | from theme |
| `motion` | `"system" \| "reduce"` | `"system"` |
| `dir` | `"ltr" \| "rtl"` | inherited, else `"ltr"` |

Full documentation, the token reference and the theme playground are in `apps/docs`.

Peer dependencies: `react` and `react-dom` 18.2+ or 19.
