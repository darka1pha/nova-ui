# @darkalpha/nova-tokens

Design tokens and the color engine behind Nova UI. Framework-agnostic, zero dependencies.

```ts
import { auditContrast, generateScale, getResolvedTheme, themeCss } from "@darkalpha/nova-tokens";

generateScale("#6d4aff"); // { 50: "#f6f7ff", …, 600: "#6d4aff", …, 975: "#150644" }

const theme = getResolvedTheme("vibrant", { brand: { primary: "#e11d48" } });
theme.light["primary-solid"]; // "#e11d48" (kept: white text on it passes 4.5:1)
auditContrast(theme).filter((c) => !c.pass); // []

themeCss(theme, ":root"); // CSS custom properties using light-dark()
```

## Layers

- **Primitives** (`primitives`): 20 OKLCH-generated 12-step color scales plus spacing, radius, type, motion, z-index, breakpoints, containers and density. Regenerate colors with `pnpm generate:primitives`.
- **Semantic** (`SEMANTIC_COLOR_NAMES`): role-based colors — surfaces, text, focus, chart colors, and nine roles for each of eight intents. `resolveTheme` maps them to primitives per mode and fixes contrast.
- **Component** tokens (`staticVariables()`): narrow knobs such as `--nv-button-radius` and `--nv-card-padding` that default to global tokens.

## Files

- `@darkalpha/nova-tokens/css/tokens.css`: static tokens plus the default theme on `:root`
- `@darkalpha/nova-tokens/css/themes.css`: every preset scoped to `[data-nv-theme]`
- `@darkalpha/nova-tokens/css/tailwind.css`: Tailwind v4 `@theme inline` mapping
- `@darkalpha/nova-tokens/tokens.json`: resolved values for design tools
- `@darkalpha/nova-tokens/tokens.dtcg.json` and `dtcg/*.json`: W3C DTCG tokens (Tokens Studio, Style Dictionary)
- `@darkalpha/nova-tokens/figma/<theme>.json`: Figma variables for one theme, as a REST API request body

## Figma variables

`figmaVariables(themes)` turns tokens into Figma variables: a **Nova primitives** collection (palette, radius, font sizes, weights, line heights, opacity, font families) and a **Nova theme** collection with a Light and a Dark mode per theme. A semantic color that is exactly a palette step becomes an alias of that palette variable, so the link survives in Figma.

To push them into a file (the Variables REST API needs a Figma Enterprise plan and a token with the `file_variables:read` and `file_variables:write` scopes):

```bash
pnpm --filter @darkalpha/nova-tokens build
FIGMA_TOKEN=… FIGMA_FILE_KEY=… pnpm --filter @darkalpha/nova-tokens figma:sync --themes vibrant,ocean
```

Re-running updates the same variables by collection and name instead of duplicating them. `--dry-run` writes the request body to `figma-variables.json` without calling Figma. On other plans, import the DTCG files with Tokens Studio.
