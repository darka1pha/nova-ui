# @darkalpha/nova-ui

## 0.3.3

### Patch Changes

- `KavehAppIcon` now shows the KMS monogram under the anchor from 40px up; pass `monogram={false}` to turn it off. The sunset tile ends on true Kaveh orange. `KavehSeal` no longer shows the founding year: it is the anchor over KMS, named "KMS" by default, and its `persian` prop is deprecated with no effect. Kaveh presets now brighten primary buttons on hover (`#ff8349`) and press (`#ff8f5c`) instead of darkening them.
- Updated dependencies
  - @darkalpha/nova-tokens@0.3.3

## 0.3.2

### Patch Changes

- Re-tune the Kaveh orange shades to the new brand orange `#f37537`, so orange text, focus rings, dark-mode accents and gradient ends match its hue: orange text is `#c44e00` (`#bc4b00` on the peach tint), the focus ring `#e96c2c`, the dark-mode orange `#fc7d40` and the gradient end `#e16523`. All keep WCAG AA contrast.
- Updated dependencies
  - @darkalpha/nova-tokens@0.3.2

## 0.3.1

### Patch Changes

- Update the Kaveh brand colors: Kaveh orange is now `#f37537` (was `#f37021`) and KMS navy is now `#295097` (was `#164a96`), in the Kaveh presets, gradients, brand marks and Kaveh kit components.
- Updated dependencies
  - @darkalpha/nova-tokens@0.3.1

## 0.3.0

### Minor Changes

- b891e0a: Icons now have rounded corners. `createIcon` fillets every corner where two straight path segments meet (1.25px on the 24px grid), so stars, arrows, chevrons, hulls and other angular shapes share the same soft geometry. Custom icons get it too; pass `createIcon(name, elements, { corner: 0 })` to keep sharp corners.
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
- e928d97: Add 85 icons. Everyday UI: Plus, Minus, Close, Check, ArrowUp, ArrowDown, ExternalLink, MoreHorizontal, MoreVertical, GripVertical, List, Sort, Sidebar, Maximize, Minimize, ZoomIn, ZoomOut, Undo, Redo, Save, Print, Pin, Code, Login, Share, EyeOff, Unlock, Key, QuestionCircle, Bolt, Flag, ThumbsUp, Sparkles, BellOff, Phone, Send, Inbox, UserPlus, Building, Headset, Video, Mic, Map, Navigation, Paperclip, Image, Camera, Archive, Receipt, Tag, Cart, Barcode, Clipboard, ClipboardCheck, Hourglass, History, Database, PieChart, TrendingUp, TrendingDown, Gauge, CreditCard, Wallet. Weather: Moon, Cloud, CloudRain, CloudLightning, Snowflake, Thermometer, Sunrise, Fog, Umbrella. Shipping & logistics: Ferry, Sailboat, CruiseShip, FishingBoat, Radar, Binoculars, Forklift, Silo, Package, Train, Plane, Passport, Certificate.
- 2e0217e: Add six components: `MultiSelect` (searchable multi-choice with chips, `max` and creatable options), `DateTimePicker` (Calendar and TimeInput in one popover, submits local `YYYY-MM-DDTHH:mm`), `KanbanBoard` (drag or keyboard moves across columns, WIP limits, announcements), `Masonry` (shortest-column packing that keeps DOM order), `InfiniteScroll` (IntersectionObserver loading with a Load more fallback) and `SignaturePad` (pointer drawing with undo, clear and a typed alternative).
  
  Fix `Toaster` logging "The result of getServerSnapshot should be cached" when hydrating server-rendered pages (Next.js App Router).

### Patch Changes

- 04aef4b: Redesign `KavehHeader`. Navigation now sits in a centered pill track and stays centered whatever the logo and actions measure, and `aria-current="page"` marks the current link with a raised pill. The navy, glass and transparent surfaces are richer, and their ghost, outline and glass buttons turn white so they stay legible. The orange Horizon is inset so it no longer runs past rounded corners, and it glows only on dark variants. Below `md`, the logo and actions sit at either end.
- 70d7a9e: Fix checkbox, radio and inset menu items (DropdownMenu, ContextMenu, Menubar, and DataTable's Columns menu) sliding their label under the check indicator on hover. The hover nudge now keeps the indicator's space.
- dbf50d3: Document about 170 more component props with JSDoc, so editors show what they do on hover. No runtime changes.
- ee2405d: Point `homepage`, `repository` and `bugs` at the renamed repository, `github.com/darka1pha/nova-ui`.
- 39df4af: `SortableList` rows now slide to their new positions when the order changes, whether by dragging, the keyboard or a new `items` order. Timing follows the theme's motion tokens, and the slide is off under reduced motion.
- 4920344: Fix `toast.dismiss()` leaving closed toasts in the store, which let them count toward the five-toast limit and push an open (e.g. `duration: Infinity`) toast off the stack. The oldest open toasts now animate out when the limit is passed, and swipe-to-dismiss follows the reading direction in RTL. `Countdown` now renders a `<span>` (its ref is an `HTMLSpanElement`), so it can sit inside a sentence without invalid `<p><div>` nesting.
- Updated dependencies [58275cb]
- Updated dependencies [ee2405d]
  - @darkalpha/nova-tokens@0.3.0

## 0.2.0

### Minor Changes

- 63efb61: Forms: FormField gains `warning`, `success`, multiple errors and an `optional` hint; messages use a polite live region and controls reflect valid/warning states. Composite controls (Combobox, DatePicker, PinInput, TagInput, FileDropzone) accept `name` and `onBlur` for native forms and form libraries. New optional entry `@darkalpha/nova-ui/react-hook-form` with `Form`, `FormController`, bound fields for every control, `FormErrorSummary`, `FormRootError`, `FormSuccess`, `FormSubmit`, `FormReset`, `FormError` and schema-derived required markers (zod v3/v4). Alerts are now named by their title, and the DatePicker trigger uses the combobox role.
- 63efb61: Initial release: OKLCH color engine with WCAG-checked semantic tokens, eight theme presets, runtime brand theming, SSR-safe ThemeProvider and 60+ accessible React components.
- 5c61f0d: Add twelve components:
  
  - **ColorPicker** and **ColorInput**: saturation/brightness area, hue slider, hex field, swatches, eyedropper where supported, a live WCAG contrast check and an optional preview of the tonal scale `generateScale` builds from the color.
  - **SegmentedControl**: a radio group with a gliding highlight, for view switches.
  - **DescriptionList**: label–value pairs as a real `<dl>`, stacked in columns or inline.
  - **SortableList**: reorder by dragging a handle or with the keyboard, every step announced. No drag-and-drop dependency.
  - **InlineEdit**: click-to-edit text with async saves, validation and focus return.
  - **Tour**: step-by-step onboarding popovers with a spotlight.
  - **CurrencyInput**: a NumberInput that formats money and rounds to the currency's minor units.
  - **PhoneInput**: country picker with localized names, as-you-type formatting and E.164 values.
  - **VirtualList**: renders only visible rows, with `onEndReached` for infinite scrolling.
  - **Image**, **Lightbox** and **ImageGallery**: loading shimmer and fallback; a full-screen viewer with arrows, swipes and zoom.
  - **CalendarHeatmap**: a keyboard-navigable activity grid.
  - **RelativeTime**: localized "3 minutes ago" text that keeps itself current.
  
  `NumberInput` gains a `precision` prop that rounds committed values.
- 63efb61: Motion system and 25 new components. Themes gain a motion personality (subtle, standard, expressive) that drives new interaction tokens (hover lift, press scale, spring easing, motion-scaled durations, intent glows, focus glow, blur). Existing components gain hover/press/focus animations, a gliding Tabs indicator, drawn checkmarks and a toast countdown. New: Calendar, DatePicker, PinInput, TagInput, FileDropzone, Rating, Chip, CopyButton, CircularProgress, Stepper, Timeline, Stat, Sparkline, Banner, Carousel, Collapsible, HoverCard, ScrollArea, AspectRatio, Reveal, AnimatedNumber, Marquee, GradientText, SpotlightCard, AnimatedBorder. Also adds `pnpm install:local` for registry-free installs.
- 4d249f8: Add `PasswordInput`: a password field with a show/hide toggle, an optional strength meter (`showStrength`, pluggable via `strength`), a live requirement checklist (`requirements`, with ready-made `passwordRequirements`), and a Caps Lock hint. `autoComplete` defaults to `new-password` when a meter or checklist is shown. Also exports `passwordStrength()`, and `FormPasswordInput` from `@darkalpha/nova-ui/react-hook-form`.
- 21abdb9: `@darkalpha/nova-ui/tailwind.css` is now the complete stylesheet for apps that run Tailwind CSS v4: it brings the tokens, scoped base, interactions and materials, and an `@source` for the components, so the app's own build generates the component utilities. Import it instead of `styles.css`. Loading both let the app's base utilities (`.flex-col`) override the components' breakpoint classes (`sm:flex-row`) at every width. `styles.css` no longer picks up stray classes from files outside the components.
- 5c61f0d: Add a utility pack and a chat kit:
  
  - **CodeBlock**: header, copy button, line numbers and highlighted lines; `renderLine` plugs in any syntax highlighter.
  - **ExpandableText**: clamps to a few lines with a "Show more" toggle that only appears when the text overflows.
  - **Popconfirm**: a small confirmation next to an action, focusing Cancel first for destructive ones, with async confirm.
  - **Countdown**: time left until a moment, with localized units and a screen-reader label that updates once a minute.
  - **Gauge**: a 240° meter with optional color bands.
  - **TransferList**: move checked items between two searchable lists; posts values with native forms.
  - **FileUploadList**: per-file upload progress with cancel, retry and remove; results are announced.
  - **Chat**: `MessageList`, `MessageGroup`, `Message` (with a streaming state), `ChatComposer` and `TypingIndicator`.
  
  Also exports `formatFileSize` and `splitDuration`.

### Patch Changes

- Updated dependencies [63efb61]
- Updated dependencies [63efb61]
  - @darkalpha/nova-tokens@0.2.0
