# Kaleido Design System

A colorful, accessible, themeable design system for React. Design tokens are the
source of truth; a real color engine turns any brand color into a complete,
contrast-checked theme in light and dark; 85+ components share one visual language
and one motion system (hover lift and glow, spring presses, animated focus,
drawn checkmarks, gliding tab indicators) that every theme can make calmer or livelier.

```tsx
import { Badge, Button, Card, Input, ThemeProvider } from "@kaleido/ui";
import "@kaleido/ui/styles.css";

export function App() {
  return (
    <ThemeProvider theme="vibrant" brand={{ primary: "#6C5CE7", secondary: "#00C2A8", accent: "#FF6B6B" }}>
      <Card>
        <Badge variant="success">Ready</Badge>
        <h2>Welcome back</h2>
        <Input placeholder="Enter your email" aria-label="Email" />
        <Button variant="primary">Get started</Button>
      </Card>
    </ThemeProvider>
  );
}
```

> `@kaleido` is a placeholder scope. Rename it in the two `package.json` files,
> `.changeset/config.json` and the import paths once the real name is chosen.

## Packages

| Package | What it is |
| --- | --- |
| [`@kaleido/tokens`](packages/tokens) | Framework-agnostic. Primitive palettes, OKLCH color engine, WCAG contrast resolver, semantic tokens, 8 theme presets, CSS/JSON generation. Zero dependencies. |
| [`@kaleido/ui`](packages/ui) | React components, `ThemeProvider`, the precompiled `styles.css`, an optional Tailwind v4 preset, and `themes.css` for zero-JS theming. |
| [`apps/docs`](apps/docs) | Documentation site and live theme playground, built on the published package output. Hosts the Playwright suites. |

## Forms: plain React, native forms, or react-hook-form + zod

`FormField` shows **errors** (one or many), **warnings** and **success**
messages, wires ids/`aria-invalid`/`aria-describedby`, announces messages through
a polite live region and colors the control to match. Every control accepts a
`name`, so native `<form>` posts and `FormData` work too (Combobox, DatePicker as
`YYYY-MM-DD`, TagInput, PinInput and FileDropzone included).

react-hook-form is **optional**: it's an optional peer dependency, and its
bindings live in a separate entry that the main entry never imports.

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormErrorSummary, FormRootError, FormInput, FormDatePicker, FormSubmit, FormError } from "@kaleido/ui/react-hook-form";

const form = useForm({ resolver: zodResolver(schema), mode: "onTouched" });

<Form form={form} schema={schema} onSubmit={save}>   {/* schema → automatic required markers */}
  <FormErrorSummary />                                {/* after a failed submit: linked list of errors */}
  <FormRootError />                                   {/* errors thrown from onSubmit (FormError) */}
  <FormInput control={form.control} name="email" label="Email" successMessage="Looks good!" />
  <FormDatePicker control={form.control} name="start" label="Start date" />
  <FormSubmit loadingText="Saving…">Save</FormSubmit>
</Form>
```

Bound components exist for every control (`FormInput`, `FormTextarea`,
`FormNumberInput`, `FormCheckbox`, `FormSwitch`, `FormRadioGroup`, `FormSelect`,
`FormCombobox`, `FormDatePicker`, `FormSlider`, `FormPinInput`, `FormTagInput`,
`FormRating`, `FormFileDropzone`), plus `FormController` for anything custom,
`formFields<T>()` for typed names, `FormSuccess`, `FormReset`, and
`messages`/`formatError` for localization. Values are stored in the types zod
expects (numbers, `Date`, arrays, booleans). See the "Forms & validation" docs page.

## Use it in any project on this machine (no npm)

```bash
# from this repository
pnpm install
pnpm install:local ../path/to/your-app
```

This builds both packages, packs them exactly as they would be published, copies
the tarballs into `<your-app>/vendor/kaleido/`, points the app's `package.json`
at them with `file:` dependencies (plus the override that makes `@kaleido/ui`'s
own dependency on `@kaleido/tokens` resolve locally too), and runs the app's
package manager — npm, pnpm, yarn or bun, detected from its lockfile. The app
keeps working if this repository moves, and you can commit `vendor/kaleido/` to
share it. Re-run the command after changing the library.

- `pnpm pack:local` only produces `local-packages/kaleido-tokens.tgz` and `kaleido-ui.tgz`.
- [`examples/vite-app`](examples/vite-app) is a working consumer installed this way.

Verified with npm (fresh install and re-install) and pnpm 12 (fresh install and
re-install); yarn and bun use the same mechanism but were not tested here.

## Getting started (repository)

```bash
pnpm install
pnpm build        # tokens → ui (JS + .d.ts + CSS)
pnpm dev          # docs + playground at http://localhost:5173
pnpm check        # build, typecheck, lint, unit tests, docs build, install verification
pnpm test:e2e     # Playwright: axe (with contrast), keyboard, RTL, visual regression
pnpm size         # bundle-size report per import
```

Requires Node 20.19+ and pnpm 10+ (developed on Node 24, pnpm 12).

## Architecture

```
Primitive tokens        Semantic tokens                 Component tokens
(OKLCH scales 50–975)   (background, primary-solid,     (--ks-button-radius,
 violet, teal, coral…)   danger-on-subtle, focus-ring…)   --ks-card-padding…)
        │                        │                               │
        └──── resolveTheme() ────┘                               │
              picks steps per mode, fixes contrast               │
                        │                                        │
             CSS custom properties  ─────────────────────────────┘
             --ks-color-*: light-dark(<light>, <dark>)
                        │
     Tailwind v4 @theme inline  →  utilities (bg-primary, text-foreground-muted)
                        │
                 React components (cva variants, Radix behavior)
```

- **Tokens.** 20 primitive scales are generated in OKLCH (perceptually even
  lightness, chroma tapered at the extremes, gamut-mapped to sRGB) and committed
  as literal values. Semantic tokens are role-based: every intent (`primary`,
  `secondary`, `accent`, `neutral`, `success`, `warning`, `danger`, `info`) has the
  same nine roles (`solid`, `solid-hover`, `solid-active`, `on-solid`, `subtle`,
  `subtle-hover`, `on-subtle`, `border`, `text`), plus surface, text, focus and
  chart roles — 95 semantic colors in total.
- **Contrast by construction.** The resolver walks each scale until every pair
  the components render passes WCAG 2.2 AA (4.5:1 text, 3:1 UI and focus). Brand
  hexes are kept verbatim wherever they pass. Every adjustment is reported, and
  all 8 presets have zero failures — enforced by tests.
- **Theming at runtime.** `ThemeProvider` writes CSS variables on its own wrapper
  (default theme: none — `styles.css` already has it). Light/dark uses
  `light-dark()` + `color-scheme`, so "system" mode is pure CSS: no flash and no
  hydration mismatch. Providers nest, and overlays portal into the nearest provider
  so dialogs keep the theme, mode and direction they were opened from.
- **Styling.** Components use Tailwind utilities compiled into a precompiled
  `styles.css` (no preflight, a reset scoped to `.ks-theme`, cascade layers in
  Tailwind's own order). Consumers need no Tailwind; Tailwind v4 apps import
  `@kaleido/ui/tailwind.css` instead, so their one build generates the component
  utilities and the same token utilities in a single, correctly ordered layer.
- **Motion.** Interaction tokens (`--ks-hover-lift`, `--ks-press-scale`,
  `--ks-ease-interactive` springs written with CSS `linear()`, motion-scaled
  durations, intent-colored glows) come from the theme's motion personality —
  `subtle`, `standard` or `expressive` — so one Button feels calm in "minimal"
  and lively in "berry". Plain CSS classes (`ks-lift`, `ks-press`, `ks-grow`,
  `ks-shine`, `ks-glow`, `ks-underline`, `ks-float`) bring the same motion to
  your own elements. Everything collapses under reduced motion.
- **Distribution.** `tsc` emits one ESM file per source module with `.d.ts` and
  source maps, preserving `"use client"` directives for React Server Components.
  Component factories are annotated `/* @__PURE__ */` after compilation so
  bundlers can drop unused siblings.

## Key decisions and trade-offs

| Decision | Why | Trade-off |
| --- | --- | --- |
| Two packages (`tokens`, `ui`) rather than five | `tokens` has real value on its own (servers, design tools, other frameworks). A separate `theme` package would only split `ThemeProvider` from the portal/direction context every overlay needs. Shared tsconfig/eslint packages add nothing in a two-package repo. | `@kaleido/ui` re-exports the token API so most apps need a single import. |
| `light-dark()` for modes | Halves the CSS, makes "system" mode zero-JS, and nested providers can force a mode with one attribute. | Needs 2024+ browsers (Chrome 123, Firefox 120, Safari 17.5). |
| Precompiled CSS + Tailwind internally | Consumers get one stylesheet and no build plugin; the library still enjoys utility-first authoring. | ~18 kB gzip for all component styles and animations, whatever you import. |
| Motion in CSS, not a JS animation library | Hover, press, focus and enter/exit states run on the compositor, respect reduced motion automatically and cost no JavaScript. Springs use CSS `linear()`. | Only Reveal, AnimatedNumber, ripple and the tab indicator use JS. `linear()` needs 2023+ browsers (already below the `light-dark()` floor). |
| Local tarballs for registry-free use | Tarballs are byte-for-byte what npm would publish, so local and published installs behave identically; the vendored copy keeps consumer apps self-contained. | Changes reach an app when you re-run `install:local` (seconds), not live. |
| `tailwind-merge` in `cn()` | Makes `className` overrides predictable (`px-8` replaces the size padding instead of fighting it). | ~9 kB gzip — the largest fixed cost of any component import. |
| Custom docs site instead of Storybook | The docs consume the real `dist/` like an external app, double as the playground, and keep the dependency tree small. | No Storybook addon ecosystem; examples are hand-written. |
| TypeScript 6.0 (not 7.0) | `typescript-eslint` supports `<6.1`. | Revisit when the lint toolchain supports the native compiler. |
| Own Calendar/DatePicker (no date library) | Native `Date` + `Intl` keep it dependency-free, locale-aware (names, first weekday) and RTL-correct. | Single-date selection only; ranges and time zones are not covered yet. |
| Charts | `BarList` and `chartColors` cover simple cases with no dependency. | Use any charting library with `chartColors` for complex charts. |

## Verified results

Run on 2026-10-29, Windows 11, Node 24.21, Chromium (Playwright 1.64).

| Check | Result |
| --- | --- |
| `pnpm build` | ✅ tokens + ui build; 168 pure annotations applied |
| `pnpm typecheck` | ✅ strict, `noUncheckedIndexedAccess`, no `any` |
| `pnpm lint` | ✅ 0 problems (typescript-eslint strict, react-hooks) |
| Unit tests — `@kaleido/tokens` | ✅ 27 passed (color math, WCAG reference values, scales, every preset AA, brand/override handling, CSS output, motion tokens) |
| Unit tests — `@kaleido/ui` | ✅ 84 passed (react-hook-form + zod: schema-derived required markers, every zod message incl. `criteriaMode: "all"`, focus-on-error for composite controls, error summary links, re-validation, success messages, async submit + disabled fieldset, `FormError` server errors; plain `register()`-style use; FormData from composite controls; theme switching, brand colors, motion styles, SSR helpers, persistence, nesting, RTL, reduced motion, keyboard, focus management, forms, DataTable, toast, ripple, tab indicator, Calendar/DatePicker keyboard + RTL, PinInput paste, TagInput, FileDropzone accept/reject, Carousel ARIA, axe on every new component) |
| Local install | ✅ `install:local` into `examples/vite-app` with npm (install + re-install, tokens resolved from the local tarball, app builds and runs) and into a fresh pnpm 12 project (install + re-install) |
| Install verification | ✅ packed tarballs → fresh npm project: exports resolve, SSR renders deterministically without browser APIs, the main entry loads with react-hook-form **not installed** (and no module imports it), the `react-hook-form` subpath server-renders a zod form once installed, consumer types check under `Bundler` and `NodeNext` with `skipLibCheck: false` (misspelled field names are type errors) |
| Playwright functional + a11y | ✅ 54 passed: all 21 pages error-free, axe WCAG 2.2 AA **with color contrast** on 9 pages × light/dark, react-hook-form + zod (summary, focus, re-validation, axe after a failed submit, server errors), keyboard (radio, menu, dialog focus trap, date picker), hover lift/glow and press scale, gliding tab indicator, PinInput clipboard paste, persisted mode, playground, preset switching, RTL, reduced motion, mobile nav with no horizontal overflow |
| Playwright visual regression | ✅ 36 baselines (16 component examples + focus ring + playground, light and dark), stable across consecutive runs |
| Full Playwright suite | ✅ 90 passed (~37 s) |

### Bundle size

What an app ships per import (minified; react/react-dom excluded). `pnpm size` regenerates this.

| Import | Minified | Gzip |
| --- | ---: | ---: |
| Button | 50.0 kB | 13.5 kB |
| Button + Card + Badge + Input | 56.1 kB | 15.0 kB |
| ThemeProvider (custom brand) | 24.7 kB | 9.3 kB |
| Dialog | 123.4 kB | 35.7 kB |
| Select | 184.8 kB | 53.7 kB |
| Combobox (cmdk) | 182.1 kB | 53.6 kB |
| DataTable | 73.9 kB | 21.1 kB |
| Toast | 116.5 kB | 33.5 kB |
| Everything | 512.9 kB | 133.7 kB |
| styles.css | 109.9 kB | 17.6 kB |

Shared dependencies are counted in each row; the costs overlap rather than add up.
Select and Combobox are dominated by Radix's positioning engine.

## Components

| Group | Components |
| --- | --- |
| Foundation | Box, Stack, Inline, Grid, Container, Separator, VisuallyHidden, Text, Heading, Link (incl. animated underline), Code, Kbd, Icon, Spinner, Skeleton, Portal, AspectRatio, ScrollArea |
| Actions | Button (lift, glow, spring press, optional ripple), IconButton, ButtonGroup, Toggle, ToggleGroup, CopyButton, Chip, DropdownMenu, ContextMenu |
| Forms | FormField (error / warning / success), Fieldset, Label, Input, Textarea, InputGroup, SearchInput, NumberInput, PinInput, TagInput, Checkbox, RadioGroup, Switch, Slider, Select, Combobox, Calendar, DatePicker, Rating, FileDropzone |
| Feedback | Alert, Badge (pulse), Toast (countdown), Progress, CircularProgress, Banner, StatusIndicator, Tooltip, Popover, HoverCard, EmptyState, ErrorState, LoadingState |
| Overlays | Dialog, AlertDialog, Sheet, Drawer, CommandPalette |
| Navigation | Tabs (gliding indicator), Accordion, Collapsible, Breadcrumbs, Pagination, NavigationMenu, Sidebar, Stepper |
| Data | Card, Avatar, AvatarGroup, Table, DataTable, Stat, Timeline, Carousel, BarList, Sparkline |
| Form bindings (`@kaleido/ui/react-hook-form`, optional) | Form, FormController, Form{Input, Textarea, NumberInput, Checkbox, Switch, RadioGroup, Select, Combobox, DatePicker, Slider, PinInput, TagInput, Rating, FileDropzone}, FormSubmit, FormReset, FormErrorSummary, FormRootError, FormSuccess, FormError, formFields |
| Motion | Reveal, AnimatedNumber, Marquee, GradientText, SpotlightCard, AnimatedBorder, `useRipple` |

## Known limitations

- Visual-regression baselines are committed for Windows only. Screenshot
  rendering differs per OS, so generate Linux baselines once in CI
  (`pnpm --filter @kaleido/docs test:e2e:update`) and commit them.
- Screen-reader behavior was not tested manually for this release; see the
  checklist on the Accessibility docs page.
- React 18.2+ is inside the peer range (only stable 18 APIs are used), but the
  test suites run against React 19 only. Add an 18.x CI job before relying on it.
- Playwright runs are sensitive to machine load: keep other dev servers stopped
  while running the suite (a running docs dev server watches the output folder
  and caused timeouts locally). CI uses 2 workers.
- The docs site uses hash routing and is not server-rendered. SSR is verified by
  `scripts/verify-install.mjs` instead.

## Releasing

Changesets drives versioning (`@kaleido/tokens` and `@kaleido/ui` are versioned
together). Add a changeset with `pnpm changeset`. On `main`, the release workflow
opens a "Version packages" PR; merging it publishes to npm with provenance
(requires an `NPM_TOKEN` secret). See the Upgrading page for the semver policy.
