---
"@kaleido/ui": minor
---

`@kaleido/ui/tailwind.css` is now the complete stylesheet for apps that run Tailwind CSS v4: it brings the tokens, scoped base, interactions and materials, and an `@source` for the components, so the app's own build generates the component utilities. Import it instead of `styles.css`. Loading both let the app's base utilities (`.flex-col`) override the components' breakpoint classes (`sm:flex-row`) at every width. `styles.css` no longer picks up stray classes from files outside the components.
