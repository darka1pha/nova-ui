---
"@darkalpha/nova-tokens": minor
---

Tokens as Figma variables: `figmaVariables(themes, { existing })` builds a Figma Variables REST API request body with a "Nova primitives" collection (palette, radius, font sizes and weights, line heights, opacity, font families) and a "Nova theme" collection with a Light and a Dark mode per theme, where semantic colors that are palette steps stay aliases. The build writes `dist/figma/<theme>.json` (exported as `@darkalpha/nova-tokens/figma/*`), and `scripts/figma-sync.ts` (`pnpm figma:sync`) pushes them to a file, updating existing variables by name.
