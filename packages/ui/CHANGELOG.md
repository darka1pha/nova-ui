# @darkalpha/nova-ui

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
