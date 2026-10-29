# @kaleido/tokens

Design tokens and the color engine behind Kaleido. Framework-agnostic, zero dependencies.

```ts
import { auditContrast, generateScale, getResolvedTheme, themeCss } from "@kaleido/tokens";

generateScale("#6d4aff"); // { 50: "#f6f7ff", …, 600: "#6d4aff", …, 975: "#150644" }

const theme = getResolvedTheme("vibrant", { brand: { primary: "#e11d48" } });
theme.light["primary-solid"]; // "#e11d48" (kept: white text on it passes 4.5:1)
auditContrast(theme).filter((c) => !c.pass); // []

themeCss(theme, ":root"); // CSS custom properties using light-dark()
```

## Layers

- **Primitives** (`primitives`): 20 OKLCH-generated 12-step color scales plus spacing, radius, type, motion, z-index, breakpoints, containers and density. Regenerate colors with `pnpm generate:primitives`.
- **Semantic** (`SEMANTIC_COLOR_NAMES`): role-based colors — surfaces, text, focus, chart colors, and nine roles for each of eight intents. `resolveTheme` maps them to primitives per mode and fixes contrast.
- **Component** tokens (`staticVariables()`): narrow knobs such as `--ks-button-radius` and `--ks-card-padding` that default to global tokens.

## Files

- `@kaleido/tokens/css/tokens.css`: static tokens plus the default theme on `:root`
- `@kaleido/tokens/css/themes.css`: every preset scoped to `[data-ks-theme]`
- `@kaleido/tokens/css/tailwind.css`: Tailwind v4 `@theme inline` mapping
- `@kaleido/tokens/tokens.json`: resolved values for design tools
