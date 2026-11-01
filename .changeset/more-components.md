---
"@kaleido/ui": minor
---

Add twelve components:

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
