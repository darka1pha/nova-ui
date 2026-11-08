---
"@darkalpha/nova-tokens": patch
"@darkalpha/nova-ui": patch
---

Medium and Low fixes from the design system audit (see issues.md).

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
