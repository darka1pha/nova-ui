---
"@darkalpha/nova-ui": patch
---

Accessibility fixes found by the docs' axe checks:

- RichTextEditor: task-list checkboxes have a 24×24 touch target (WCAG 2.5.8); the visible box stays 16px and is now drawn by the library. The text color palette is stored as `light-dark()` pairs, so every color reads at 4.5:1 or better in both modes on every preset. Content saved with the old hex colors keeps those colors.
- Kaveh kit: rust text (eyebrows, timeline years, roles, KPI figures) is a shade darker (`#b34700`) to reach 4.5:1 on Kaveh's tinted surfaces. Persian sidebar labels on navy, and Persian table sub-headers, now meet 4.5:1. A horizontal `KavehTimeline` is keyboard-focusable so it can be scrolled. `KavehLogo` lockups are marked `data-nv-logotype` (logo lettering is exempt from contrast minimums).
