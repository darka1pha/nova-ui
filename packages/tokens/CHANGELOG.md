# @darkalpha/nova-tokens

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
