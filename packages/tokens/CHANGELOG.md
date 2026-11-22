# @darkalpha/nova-tokens

## 0.9.0

### Minor Changes

- 5958c39: Chart colors meet 3:1 against the page and cards (WCAG 1.4.11). Light mode: `chart-3` `#1baf7a` → `#00a470`, `chart-4` `#eda100` → `#c18200`, `chart-5` `#e87ba4` → `#d86d96`. Kaveh presets: light `chart-1` `#e76a2a`, `chart-3` `#b34700`, `chart-6` `#7b8fb2` (Yalda `chart-4` `#c38100`, Nowruz `chart-4` `#039fa1`), dark `chart-6` `#4978c4`. `auditContrast` now also checks every `chart-*` token against `background`, `surface` and `surface-raised`, so a custom theme with an unreadable series color is reported.

### Patch Changes

- 5ec192d: Kaveh presets: solid primary buttons are a touch lighter. `primary-solid` is `#fe7f42` (Kaveh orange lifted 0.03 in OKLCH lightness, same hue), with hover `#ff9465` and press `#ff9f75`. Navy text stays at 6.5:1 or more.

## 0.8.0

### Patch Changes

- fd7bdc7: Fix system color mode in apps whose CSS pipeline lowers `light-dark()`, including every Tailwind v4 app that imports `@darkalpha/nova-ui/tailwind.css` (Tailwind's Lightning CSS targets browsers without `light-dark()`). The lowered form only resolves where `color-scheme` is set, and the default color tokens were declared on `:root` alone, so with no explicit mode every color became an invalid value like `#fff#1a1510`: black text on no background. The `light-dark()` tokens are now also declared on the outermost theme root (`.nv-theme` / `[data-nv-theme]`), where the color scheme lives. Explicit light and dark modes, nested themes and native `light-dark()` are unaffected.

## 0.7.0

### Minor Changes

- 97a9038: Tokens as Figma variables: `figmaVariables(themes, { existing })` builds a Figma Variables REST API request body with a "Nova primitives" collection (palette, radius, font sizes and weights, line heights, opacity, font families) and a "Nova theme" collection with a Light and a Dark mode per theme, where semantic colors that are palette steps stay aliases. The build writes `dist/figma/<theme>.json` (exported as `@darkalpha/nova-tokens/figma/*`), and `scripts/figma-sync.ts` (`pnpm figma:sync`) pushes them to a file, updating existing variables by name.

## 0.6.0

No changes in this release.

## 0.5.1

No changes in this release.

## 0.5.0

### Patch Changes

- eb44e9d: Medium and Low fixes from the design system audit (see issues.md).
  
  Tokens:
  
  - `color-scheme` is now set on theme roots instead of `:root`, so importing the CSS no longer turns the host page's scrollbars and form controls dark. New `COLOR_SCHEME_CSS` export.
  - Semantic overrides are checked against every rendered contrast pair they touch and produce warnings when they fail. Values that could break out of a CSS declaration (`;`, `{`, `}`, `<`, `>`, backslash, `/*`) are refused. 4- and 8-digit hex overrides keep their alpha.
  - `contrastRatio` composites a translucent foreground over its background; new `parseHexAlpha`.
  - The resolver and `contrastPairs()` cover raised, sunken and hovered surfaces and pressed fills. Every preset resolves to the same colors as before.
  
  UI:
  
  - The `dark:` variant in `tailwind.css` also matches a dark OS when no mode is set.
  - `ThemeProvider` with `storageKey` no longer flashes `defaultMode` over a stored mode; `ThemeScript` accepts `defaultMode`.
  - `Button asChild` renders icons, spinner and ripples, and blocks activation while disabled or loading.
  - The Toast countdown bar pauses whenever Radix pauses the timer; centered toasts follow vertical swipes.
  - `<Tooltip>` joins an enclosing `TooltipProvider` (the rich text toolbar now shares one).
  - The rich text editor refuses non-http(s)/mailto/tel link URLs.
  - `cn()` merges `animate-nv-*` classes, so `className="animate-none"` overrides a component's animation.
  - Fieldset is described by its description and error; empty field message regions stay in the accessibility tree; labels dim in disabled fields; `DataTable` rows drop the invalid `aria-selected`.
  - `Rating` gets `getValueLabel` for read-only labels; `Countdown` renders nothing for an invalid date; `AlertDialogTitle` uses the dialog title tracking.

## 0.4.0

No changes in this release.

## 0.3.4

### Patch Changes

- New `ModuleCard`: a launcher tile for one module of an app, with a large icon, title, description, a round forward arrow and a corner wave whose hills are seeded by the title. `tone` takes `primary` or a palette hue, `href` or `onClick` make the whole card one link or button, and `badge`, `size`, `disabled` and `wave` cover the rest. It mirrors in right-to-left layouts.
  
  The Kaveh anchor and solid KMS lettering now come from the master logo: a deep navy `#04287e` anchor with its heavy outline, white inline, eye and violet drop, and clean K, M and S letters. The `brand` tone uses the master's inks. Brand marks size in whole pixels, and `KavehMark` defaults to `variant="auto"`, which keeps the fine inline only where it renders crisply (engraved from 44px, by screen density from 20px, a plain silhouette below). The outlined KMS steps down the same way, and app icons show KMS from 64px.

## 0.3.3

### Patch Changes

- `KavehAppIcon` now shows the KMS monogram under the anchor from 40px up; pass `monogram={false}` to turn it off. The sunset tile ends on true Kaveh orange. `KavehSeal` no longer shows the founding year: it is the anchor over KMS, named "KMS" by default, and its `persian` prop is deprecated with no effect. Kaveh presets now brighten primary buttons on hover (`#ff8349`) and press (`#ff8f5c`) instead of darkening them.

## 0.3.2

### Patch Changes

- Re-tune the Kaveh orange shades to the new brand orange `#f37537`, so orange text, focus rings, dark-mode accents and gradient ends match its hue: orange text is `#c44e00` (`#bc4b00` on the peach tint), the focus ring `#e96c2c`, the dark-mode orange `#fc7d40` and the gradient end `#e16523`. All keep WCAG AA contrast.

## 0.3.1

### Patch Changes

- Update the Kaveh brand colors: Kaveh orange is now `#f37537` (was `#f37021`) and KMS navy is now `#295097` (was `#164a96`), in the Kaveh presets, gradients, brand marks and Kaveh kit components.

## 0.3.0

### Minor Changes

- 58275cb: Kaveh brand: every Kaveh preset follows a strict two-color rule. KMS navy is the base: body text, links, tooltips, neutral fills, every tint and soft badge, and a Deep Harbour navy dark mode instead of near-black. Kaveh orange is for action only: solid primary fills (main buttons, switches, checkboxes, progress), focus ring, selection and the first chart series, with navy text on it. The periwinkle secondary and accent are gone from `kaveh`. This changes the look of apps already using `kaveh`.
  
  Themes can now set their own decorative gradients with `gradients` (`brand`, `vivid`, `subtle`, `conic`, `mesh`, `glow`); omitted ones are still derived from the theme's colors, and a `brand` rebrand falls back to the derived ones. The Kaveh presets use this for a harbour-sunset palette: warm orange fills that keep navy text at 4.5:1, and navy-to-orange ambient gradients (Yalda burns toward candle red, Nowruz turns from the sun to new leaf).
  
  New presets `kaveh-yalda` (dark-first, pomegranate red accent) and `kaveh-nowruz` (light-first, sabzeh green accent, firouzeh info) share that core.
  
  New Kaveh brand components, redrawn from the heritage logo and offered in auto, brand, reversed, on-orange and mono tones:
  
  - `KavehMark`: the engraved anchor, traced from the heritage logo artwork (inline, double ring, notched stock with its small drop, the shank drop, barbed flukes and keel point). One even-odd path, so the inline and drops are true holes and it sits on any background.
  - `KmsMonogram` and `KavehWordmark`, also traced from the artwork: the engraved KMS lettering (outline, white inline, letters) and the KAVEH wordmark with its rounded "A" and the H's slanted foot. `KavehEmblem` stacks the anchor over KMS.
  - `KavehLogo` in `horizontal`, `stacked` and `heritage` layouts; `heritage` is the full logo with "Since 1948 · تأسیس ۱۳۲۷", the tagline band and the bilingual name.
  - `KavehSeal`, `HorizonDivider`, `Tideband` and `PortholeFrame`.
  - `KavehAppIcon`, `VesselStatusBadge`, `BrandStat`, `BilingualHeading` and `KavehHeader`.
  
  Variants: `KavehMark` engraved or solid; `KmsMonogram` outline or solid; `KavehLogo` adds `persian` (right-to-left, «کاوه») and `badge` layouts; `KavehSeal` navy, orange, light or outline; `HorizonDivider` solid, double, fade or dashed, with an optional centred label; `Tideband` light, dark, orange or solid in three sizes; `PortholeFrame` navy, orange, double or thin, with a badge slot; `VesselStatusBadge` soft, solid, outline or dot; `KavehAppIcon` navy, orange, light or sunset in three shapes; `BrandStat` navy, orange, inverse or tile; `BilingualHeading` stacked, split or centered in three sizes; `KavehHeader` navy, light or transparent.
  
  The Kaveh kit, everyday product components in the Kaveh style, built on Nova UI's own primitives and tokens. App chrome is light by default (sidebar, header, table head, bulk-action bar); the opt-in `navy` variants use KMS blue (#164a96) rather than near-black, with white, white/75 or peach (#ffd0b0) text on it to keep AA contrast:
  
  - Cards: `KavehCard` (horizon, navy, band, elevated, outline), `KavehServiceCard`, `KavehPortCard`, `KavehContactCard` and `KavehKpiCard`.
  - Page sections: `KavehHero` (navy, sunset, light, split), `KavehPageHeader`, `KavehFooter` and `KavehTimeline`.
  - Navigation: `KavehSidebar` (navy or light, collapsible, Persian labels), `KavehNavMenu` (underline, pill, band) and `KavehMenu` (a branded DropdownMenu).
  - Data and status: `KavehTable` (on DataTable: a framed header with bilingual title, record count and actions; search, sorting, pagination, column toggle and expandable rows; selection with a navy bulk-action bar; an orange marker on hovered, focused and selected rows; numeric columns; sticky head; navy, band or minimal heads), `KavehNotice` (info, success, warning, navy, campaign), `KavehEmptyState`, `KavehLoader` (ring, wave, pulse) and `KavehLink`.
  
  New seasonal components: Persian motifs (Pomegranate, PomegranateOpen, Watermelon, YaldaCandle, DivanOfHafez, CrescentMoon, PersianStar, the Haft-Seen items, Goldfish, NowruzMirror, PaintedEgg, Blossom), `SeasonalGreeting`, `HaftSeen`, `PersianVerse` and `SeasonalPattern`.

### Patch Changes

- ee2405d: Point `homepage`, `repository` and `bugs` at the renamed repository, `github.com/darka1pha/nova-ui`.

## 0.2.0

### Minor Changes

- 63efb61: Initial release: OKLCH color engine with WCAG-checked semantic tokens, eight theme presets, runtime brand theming, SSR-safe ThemeProvider and 60+ accessible React components.
- 63efb61: Motion system and 25 new components. Themes gain a motion personality (subtle, standard, expressive) that drives new interaction tokens (hover lift, press scale, spring easing, motion-scaled durations, intent glows, focus glow, blur). Existing components gain hover/press/focus animations, a gliding Tabs indicator, drawn checkmarks and a toast countdown. New: Calendar, DatePicker, PinInput, TagInput, FileDropzone, Rating, Chip, CopyButton, CircularProgress, Stepper, Timeline, Stat, Sparkline, Banner, Carousel, Collapsible, HoverCard, ScrollArea, AspectRatio, Reveal, AnimatedNumber, Marquee, GradientText, SpotlightCard, AnimatedBorder. Also adds `pnpm install:local` for registry-free installs.
