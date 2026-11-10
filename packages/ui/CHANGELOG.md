# @darkalpha/nova-ui

## 0.7.0

### Minor Changes

- 46c03f4: Combobox async search and creatable options, and a FileUploader:
  
  - `Combobox` `loadOptions(query, signal)` fetches options as the user types (debounced by `debounceMs`, default 250). A newer query or closing the list aborts the older request through `signal`. `loadingMessage` and `errorMessage` cover the pending and failed states. `options` is now optional.
  - `Combobox` `creatable` adds a "Create …" item when the search doesn't exactly match an option. `onCreate(label)` can return the new option or its value (or a promise of either); `formatCreateLabel` changes the text.
  - The Combobox popup is now named after the field (`aria-label`, else `searchPlaceholder`), so it isn't announced as an unnamed dialog.
  - `useFileUploads({ upload, concurrency })` manages an upload queue for `FileUploadList`: progress through `onProgress`, cancel through an `AbortSignal`, retry, image thumbnails, and abort on unmount. `FileUploader` wires it to a `FileDropzone`.
- da4d658: `Countdown` gains `as` and `format`:
  
  - `as="div"` renders a block element for layouts that hold block content (the default is still an inline `<span>`). The ref type is now `HTMLElement`; a `RefObject<HTMLSpanElement>` still type-checks.
  - `format={(parts) => …}` replaces the built-in markup with your own, e.g. `02:15:09`. It gets `days`, `hours`, `minutes`, `seconds`, `total`, `done` and `placeholder` (true on the server without `initialNow`). The timer keeps its spoken label, and `completed` still wins once it finishes. `CountdownParts` is exported.
- c055cd0: Theming additions:
  
  - A `ThemeProvider` with `storageKey` now follows mode changes made in other tabs and windows of the same origin (the `storage` event), and runs `onModeChange` there too. If the key is removed or storage is cleared, it falls back to `defaultMode` (or the theme's preferred mode, else "system"). Controlled providers (`mode`) ignore it.
  - `useThemeVariables()` returns the nearest theme's colors for the mode in effect: `colors` (every semantic color), `chart` (the eight chart colors), `mode`, and `cssVar(name)`. Use it for canvas, WebGL and chart libraries that can't read CSS variables; it updates when the theme, brand or mode changes.
- 2e776d3: New `VirtualTable` for very large data. Only the rows in view are rendered, and with `virtualizeColumns` only the columns in view too, so 100,000 rows × 50 columns scroll smoothly. It stays a real `<table>` with `aria-rowcount`/`aria-rowindex` and `aria-colcount`/`aria-colindex`, a sticky header, and `pinned` leading columns. `selectable` adds a checkbox column: shift-click selects a range, and "Select all" covers every row, not only the rendered ones. It also has client-side sorting (or controlled `sort`), `onEndReached` for loading more, and `apiRef.scrollToRow()`. `virtualRange()`, the range math it shares with `VirtualList`, is exported.

### Patch Changes

- Updated dependencies [97a9038]
  - @darkalpha/nova-tokens@0.7.0

## 0.6.0

### Minor Changes

- 70f6d14: Toast API additions:
  
  - `toast.promise(promise, { loading, success, error })` shows a spinner while the promise is pending, then turns the same toast into a success or error toast. `success` and `error` take a title, full toast options, or a function of the result or the rejection reason. It returns the promise you passed in (or that the function returned), so `await` still gives you the value or throws. If the loading toast is dismissed, the outcome isn't shown.
  - `onDismiss(id)` on a toast runs once however it closes: its timer, the close button, a swipe, `toast.dismiss()`, or being pushed out by newer toasts. It doesn't run when a toast with the same `id` replaces it.
  - `<Toaster max>` sets how many toasts can be open at once (default 5, as before). Lowering it closes the oldest open toasts right away.

### Patch Changes

- 20d0cb1: `toast.promise` always settles its toast. A function that throws before returning a promise now counts as a rejection: the error toast shows and the returned promise rejects. Before, the loading spinner never stopped. A `success` formatter that throws shows the error outcome. If the `error` formatter throws, the toast closes and the error is logged with `console.error`.
- @darkalpha/nova-tokens@0.6.0

## 0.5.1

### Patch Changes

- 408eead: `KavehPageHeader` takes a `headingLevel` prop (1–6, default 1) for headers that sit inside a page that already has an `h1`, such as a dashboard panel or a docs preview.
  
  `KavehContactCard` no longer grows past its container when the email address is long; the address truncates as intended.
- 16e2de7: Internal cleanup so components follow the React Compiler rules (no public API changes):
  
  - Callbacks that hold the latest props (Countdown's `onComplete`, Kanban's pointer drag, RichTextEditor's handlers) update in a layout effect instead of during render, which stays correct under concurrent rendering.
  - State that follows a prop is adjusted during render instead of in an effect, saving a re-render: ColorPicker's controlled `value`, `Image` resetting on a new `src`, Lightbox zoom resetting on close, FileUploadList announcements and the editor's link field. `Image` checks for an already-loaded server-rendered image through a callback ref.
  - Countdown with `initialNow` switches to the browser clock on hydration instead of in a follow-up effect.
  - Tour no longer shows the previous step's spotlight for a frame when reopened.
  - RichTextEditor's image and link popovers drop `autoFocus`; the popover already focuses its first field when it opens.
- 408eead: A horizontal `TabsList` (underline and segmented) that's wider than its container now scrolls sideways instead of pushing the page wider. The scrollbar is hidden; swiping, a trackpad, or the arrow keys move along it, and the active tab is scrolled into view when it changes. Pills still wrap onto more lines.
  
  The underline rule is now an inset shadow instead of a bottom border, so scrolling doesn't clip it or the indicator, and the underline variant's focus ring is drawn inside the tab. It looks the same as before.
- @darkalpha/nova-tokens@0.5.1

## 0.5.0

### Minor Changes

- eb44e9d: **Breaking:** two changes to what installs and what the main entry exports.
  
  - **Tiptap is now an optional peer dependency.** `@darkalpha/nova-ui` no longer installs the 16 `@tiptap/*` packages (and ProseMirror) for every app. If you import `@darkalpha/nova-ui/rich-text-editor`, add them yourself (the command is in the package README):
  
    ```bash
    pnpm add @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit @tiptap/extensions @tiptap/suggestion @tiptap/extension-bubble-menu @tiptap/extension-highlight @tiptap/extension-image @tiptap/extension-list @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-table @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-typography
    ```
  
  - **The Kaveh brand kit moved to `@darkalpha/nova-ui/kaveh`.** The Kaveh logo family, brand elements, page sections, cards, tables and navigation, plus the Yalda/Nowruz seasonal artwork (`SeasonalGreeting`, `HaftSeen`, the motifs and patterns), are no longer exported from `@darkalpha/nova-ui`. Change the import path:
  
    ```diff
    - import { KavehLogo, SeasonalGreeting } from "@darkalpha/nova-ui";
    + import { KavehLogo, SeasonalGreeting } from "@darkalpha/nova-ui/kaveh";
    ```
  
    The `kaveh`, `kaveh-yalda` and `kaveh-nowruz` themes are unchanged and still work by name.

### Patch Changes

- 61e7056: Accessibility and SSR fixes from the design system audit:
  
  - Carousel: autoplay now has a stop/start rotation button (WCAG 2.2.2), localizable with `labels.pause` / `labels.play`. Hover and focus pause it independently, so it no longer resumes while focus is still inside, and a touch tap no longer leaves it paused.
  - Countdown: no hydration mismatch under SSR. Server and hydration renders show placeholders; pass the new `initialNow` prop to render real digits on the server.
  - Rating: wired to FormField (label, description, error, required, disabled), with new `disabled` and `required` props. Empty stars use the `input` token, so they meet 3:1 non-text contrast.
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
- 70c6cb9: Accessibility fixes found by the docs' axe checks:
  
  - RichTextEditor: task-list checkboxes have a 24×24 touch target (WCAG 2.5.8); the visible box stays 16px and is now drawn by the library. The text color palette is stored as `light-dark()` pairs, so every color reads at 4.5:1 or better in both modes on every preset. Content saved with the old hex colors keeps those colors.
  - Kaveh kit: rust text (eyebrows, timeline years, roles, KPI figures) is a shade darker (`#b34700`) to reach 4.5:1 on Kaveh's tinted surfaces. Persian sidebar labels on navy, and Persian table sub-headers, now meet 4.5:1. A horizontal `KavehTimeline` is keyboard-focusable so it can be scrolled. `KavehLogo` lockups are marked `data-nv-logotype` (logo lettering is exempt from contrast minimums).
- Updated dependencies [eb44e9d]
  - @darkalpha/nova-tokens@0.5.0

## 0.4.0

### Minor Changes

- acb971b: Add `RichTextEditor` and `RichTextViewer` in a new entry, `@darkalpha/nova-ui/rich-text-editor` (built on Tiptap/ProseMirror, so apps that don't import it never load the engine).
  
  - Toolbar presets (`"full"`, `"basic"`, `"minimal"`), a custom item list or none: undo/redo, paragraph and heading styles, bold, italic, underline, strike, inline code, sub/superscript, text color, highlight, links, images, tables (size picker, then row/column/header/merge/split/delete actions), logical alignment, bulleted/numbered/check lists with indent, quotes, code blocks, dividers, per-block text direction, clear formatting and full screen.
  - A bubble menu over selected text, a `/` command menu (replaceable), markdown shortcuts and `Mod+K` for links.
  - Image upload through `onImageUpload` from the toolbar, the `/` menu, paste or drop; images resize from their corners.
  - HTML or JSON in, HTML out (`""` for an empty document), controlled or uncontrolled, `maxLength` with word and character counts, `name` for native form posts, `disabled` / `readOnly`, and FormField wiring.
  - `dir="auto"` gives each block the direction of its own text; English and Persian UI text built in, overridable through `labels`.
- 9ffff3f: Tabs: new optional `background` prop (on `Tabs`, overridable per `TabsList`) to fill the tab bar with a theme surface (`surface`, `raised`, `sunken`, `primary`), any CSS color, or `none`.

### Patch Changes

- 03a749a: InputGroup: an Input with its own `dir` (e.g. `dir="ltr"` for an email field in an RTL page) now pads the side the adornment is on, so the icon no longer sits over the placeholder.
- @darkalpha/nova-tokens@0.4.0

## 0.3.4

### Patch Changes

- New `ModuleCard`: a launcher tile for one module of an app, with a large icon, title, description, a round forward arrow and a corner wave whose hills are seeded by the title. `tone` takes `primary` or a palette hue, `href` or `onClick` make the whole card one link or button, and `badge`, `size`, `disabled` and `wave` cover the rest. It mirrors in right-to-left layouts.
  
  The Kaveh anchor and solid KMS lettering now come from the master logo: a deep navy `#04287e` anchor with its heavy outline, white inline, eye and violet drop, and clean K, M and S letters. The `brand` tone uses the master's inks. Brand marks size in whole pixels, and `KavehMark` defaults to `variant="auto"`, which keeps the fine inline only where it renders crisply (engraved from 44px, by screen density from 20px, a plain silhouette below). The outlined KMS steps down the same way, and app icons show KMS from 64px.
- Updated dependencies
  - @darkalpha/nova-tokens@0.3.4

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
