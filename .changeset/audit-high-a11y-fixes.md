---
"@darkalpha/nova-ui": patch
---

Accessibility and SSR fixes from the design system audit:

- Carousel: autoplay now has a stop/start rotation button (WCAG 2.2.2), localizable with `labels.pause` / `labels.play`. Hover and focus pause it independently, so it no longer resumes while focus is still inside, and a touch tap no longer leaves it paused.
- Countdown: no hydration mismatch under SSR. Server and hydration renders show placeholders; pass the new `initialNow` prop to render real digits on the server.
- Rating: wired to FormField (label, description, error, required, disabled), with new `disabled` and `required` props. Empty stars use the `input` token, so they meet 3:1 non-text contrast.
