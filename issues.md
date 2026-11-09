# Nova UI — design system audit

Audit of `main` at `c7b1afc` (v0.4.0), 2026-11-08.

## Baseline

| Check | Result |
| --- | --- |
| `pnpm build` | Clean (`styles.css` 220.7 kB, `themes.css` 80.8 kB) |
| `pnpm typecheck` | Clean |
| `pnpm lint` | Clean (0 warnings) |
| `pnpm test` | 491 passing (tokens 110, ui 381); no stderr noise |
| Contrast engine stress test | 11 presets × all pairs pass; 80 random brand/neutral combos pass `auditContrast` (one gap, see T-2) |
| RTL | No physical `left/right/ml/mr/pl/pr` classes left in components (only intentional `left-1/2` centering) |

Playwright (e2e/visual) was **not** run in this audit.

**Flaky test (pre-existing):** `tests/rich-text-editor.test.tsx` › "is a labelled multiline textbox…" takes about 5.3 s in a full `pnpm test` run on this machine, which is over vitest's 5 s default timeout. It fails the same way on the unmodified code and passes on its own. A react-hook-form test timed out once the same way. Raise the timeout for editor tests or split the test.

Severity: **High** = user-visible bug or a11y failure in normal use · **Medium** = bug in a
common-but-specific setup, or a notable gap · **Low** = polish, consistency, hygiene.

---

## High — all fixed (uncommitted)

All five are fixed in the working tree, with regression tests in
`packages/ui/tests/audit-regressions.test.tsx` (9 tests; 7 fail on the old code, and the other 2 cover behaviour that was already correct).

### H-1. ✅ Fixed — Carousel autoplay has no pause control (WCAG 2.2.2)
`packages/ui/src/components/display.tsx:533-555`
With `autoPlay` set, slides move on their own with no visible pause/play button. The only way to stop it
is to hover or focus inside it. Touch and screen-reader users have no reliable way to stop it,
and WCAG 2.2.2 (Pause, Stop, Hide) requires one for motion that lasts more than 5 s.
Fix: render a pause/play toggle when `autoPlay` is on, and keep it paused once the user presses it.

**Done:** when autoplay is actually running (`autoPlay` set, more than one slide, no reduced motion), the dots row starts with a rotation button labelled "Stop slide rotation" / "Start slide rotation" (localizable with `labels.pause` / `labels.play`). Once pressed, rotation stays stopped until the button is pressed again. Reduced motion is now tracked live through a `matchMedia` listener.

### H-2. ✅ Fixed — Carousel resumes autoplay while focus is still inside
`packages/ui/src/components/display.tsx:552-555`
`onFocus`/`onBlur` and `onPointerEnter`/`onPointerLeave` all write the same `paused` flag. React's
`onBlur` is `focusout` and bubbles, so moving focus from one dot to the next briefly unpauses it.
Moving the pointer out while a control still has focus also resumes it. (This is listed in ROADMAP P2.3 and still open.)
Fix: track `hovered` and `focusWithin` separately (check `relatedTarget` on blur) and pause when either is true.

**Done:** hover, focus-within and the explicit stop are three separate flags. Blur only counts when `relatedTarget` is outside the carousel. Hover only counts for `pointerType === "mouse"`, so a tap no longer leaves it paused. The consumer's `onPointerEnter`/`onPointerLeave`/`onFocus`/`onBlur` are now chained; before, `{...props}` overrode them. Closes ROADMAP P2.3.

### H-3. ✅ Fixed — `Countdown` causes a hydration mismatch under SSR
`packages/ui/src/components/countdown.tsx:50,90-115`
`useState(() => Date.now())` runs on the server and again on the client, so the digits and the
`aria-label` differ and React logs a hydration error (it can also re-render the whole tree on the client).
`RelativeTime` handles this with `suppressHydrationWarning`, but `Countdown` doesn't. The Next example app is exactly this case.
Fix: render a stable placeholder (or the server time passed in as a prop) on first render and start the clock in an effect, or add `suppressHydrationWarning` to the root and each digit span.

**Done:** server and hydration renders show `--` placeholders with no `aria-label` (the day block is hidden). The real time renders on the commit right after hydration; client-only renders show it immediately via `useSyncExternalStore`. A new `initialNow` prop lets the server render real digits instead. The clock re-syncs to `Date.now()` on mount. Remaining caveat: with no `locale` set, server and browser default locales can still differ (this applies to every Intl-formatted component).

### H-4. ✅ Fixed — `Rating` is not wired to `FormField` / `FormRating`
`packages/ui/src/components/chip.tsx:186-240`, `packages/ui/src/react-hook-form.tsx:620-629`
`Rating` doesn't call `useFormField`, so inside `FormField`/`FormRating`:
- the `<Label htmlFor>` points to an id that doesn't exist,
- the radiogroup gets no `aria-invalid` or `aria-describedby`, so the error message isn't tied to it,
- ~~`focusRef` goes to a non-focusable `<div>`, so react-hook-form's focus-on-error does nothing.~~ *Correction:* this was wrong. `FormController`'s `focusRef` (`react-hook-form.tsx:338`) focuses the first focusable descendant, so focus-on-error already worked.

Fix: consume `useFormField()` for `aria-*`/`required`/`disabled` and `aria-labelledby={labelId}`, and forward the focus ref to the checked (or first) radio input.

**Done:** `Rating` uses `useFormField`, so it gets the field's id, `aria-describedby` (description and message), `aria-invalid`, `required` and `disabled`. The group is named by `aria-labelledby` pointing at the field's label; an explicit `label` prop still wins, and the fallback is still "Rating". New `disabled` and `required` props: disabled radios, `aria-disabled`, no hover preview. `FormRating` no longer passes its label as an `aria-label` string, so non-string labels name the group too.

### H-5. ✅ Fixed — Empty rating stars fail non-text contrast (WCAG 1.4.11)
`packages/ui/src/components/chip.tsx:201,232`
Unselected stars use `text-border-strong`. The resolver only requires `border-strong` to reach **1.6:1**
(`packages/tokens/src/semantic/resolve.ts:155`), but the empty stars carry the meaning "not rated / these
are the choices", so they need 3:1.
Fix: use `text-input` (guaranteed 3:1) or `foreground-muted` for empty stars.

**Done:** empty stars (both interactive and read-only) use `text-input`. This is a visual change, so the `forms-rating` Playwright baselines (win32 and linux) need regenerating.

---

## Medium and Low — status

Fixed on branch `fix/audit-medium-low`, which is stacked on `fix/audit-high-issues` (PR #7). Regression tests: `packages/ui/tests/audit-medium-low.test.tsx` (15), `packages/tokens/tests/audit-fixes.test.ts` (11), and a `dark:` compile test in `packages/ui/tests/tailwind-consumer.test.ts`.

| Status | Medium | Low |
| --- | --- | --- |
| ✅ Fixed | M-4, M-5, M-7, M-8, M-9, M-10, M-11, M-12, M-13, M-14 (breaking), M-16 (breaking), M-17, M-18, M-19, M-20 | L-1, L-3, L-4, L-5, L-6, L-7, L-9, L-10, L-11, L-13, L-14, L-15, L-16, L-18, L-19, L-20, L-21, L-22 |
| 📝 Documented | M-2, M-6 | |
| ❎ Not reproduced / ➖ left as is | M-1 | L-12, L-17 |
| ⏸ Deferred | M-3, M-15 | L-2, L-8, L-23 |

**Visual baselines** may need regenerating: screenshots containing a disabled FormField label (L-6) or an AlertDialog title (L-11). Token colors are unchanged for every preset.

**Flaky tests fixed:** `packages/ui` now has a 15 s test timeout (the RichTextEditor suite 20 s). Under full-suite load, the userEvent-heavy editor and react-hook-form tests ran past the 5 s default. A react-hook-form test also failed once at 2.4 s, which isn't a timeout; it hasn't reproduced since.

**Bundle size:** `Button` alone went from 50.8 to 53.1 kB minified: about 1.2 kB from the `extendTailwindMerge` config (L-13) and about 1.1 kB from the `asChild` handling (M-5). "Everything" went down 91.6 kB (M-16).

## Medium

### Components

**M-1. ❎ Not reproduced — Overlays opened on first render go to `document.body`, outside the theme.**
`packages/ui/src/theme/theme-provider.tsx:219,246`, `packages/ui/src/components/portal.tsx:20`
`portalContainer` is set with a ref callback, so it is `null` during the first render. A
`defaultOpen` Dialog/Popover/Tooltip (or one opened from a mount effect) first portals into `body`,
without theme variables, mode or `dir`, and then re-mounts into the portal root once the state updates.
That shows up as a flash of unthemed content, a replayed entrance animation, and lost focus.
Fix: render children only once the container exists when anything is open, or use a `useLayoutEffect` plus a stable container.

**Status:** A probe that renders `defaultOpen` Dialog, Popover and Tooltip found nothing added to `body` except Radix's focus guards; all three rendered straight into the portal root. Radix's Portal waits for a layout effect, and that state update is batched with the portal container's, so the content never mounts in `body` first. No code change.

**M-2. 📝 Documented — The portal root lives inside the provider's `<div>`.**
`packages/ui/src/theme/theme-provider.tsx:246`
If an app gives the `ThemeProvider` `overflow:hidden`, `transform`, `filter`, `contain` or a `z-index`
(common for scoped/previews/embedded widgets), `position:fixed` modals, sheets and toasts are clipped or trapped under other content.
Fix: document the constraint, or offer `portalContainer` / `portalTarget="body"` that portals into a body-level host that copies the provider's `data-*` attributes and variables.

**Status:** The constraint is now in `ThemeProvider`'s JSDoc. A body-level portal host that copies the provider's variables is still an option if this keeps coming up.

**M-3. ⏸ Deferred — `RichTextViewer` renders nothing on the server.**
`packages/ui/src/components/rich-text-editor.tsx:769,1843-1858`
The viewer is a full read-only Tiptap editor with `immediatelyRender: false`, so SSR/SSG output is empty.
That's bad for SEO, causes a layout shift, and pulls the whole ProseMirror engine into the bundle just to display content.
Fix: render static HTML for the viewer (`generateHTML` from `@tiptap/html`, or a small JSON→React renderer) and keep the editor for editing.

**Status:** Rendering saved content statically needs `@tiptap/html` (plus a DOM implementation on the server to parse HTML input) and a sanitizing pass. That's a new dependency and a design decision, so it's out of scope for a fix pass.

**M-4. ✅ Fixed — Link URL normalization doesn't block dangerous schemes.**
`packages/ui/src/components/rich-text-editor.tsx:387-393,1628,1659`
`normalizeUrl` passes through any `scheme:` (e.g. `javascript:`, `data:`). The `insertContent` path at
L1628 builds a link mark directly instead of going through `setLink`. Today the app relies on Tiptap's
`isAllowedUri` (in `renderHTML`) to strip it. That wasn't checked in this audit, and the "open link" button
at L1659 renders `href={current}` straight from the mark attributes.
Fix: allow-list `http`, `https`, `mailto`, `tel` and relative URLs in `normalizeUrl`, and add a test that `javascript:alert(1)` never reaches an `href`.

**Status:** `normalizeUrl` allow-lists `http:`, `https:`, `mailto:` and `tel:` (plus relative URLs). It strips control characters first, so `java\tscript:` is caught, and returns `""` for anything else, which removes the link. The link editor's "open link" button sanitizes stored hrefs too and is disabled for unsafe ones.

**M-5. ✅ Fixed — `asChild` Button silently ignores `loading`, `startIcon`, `endIcon`, `ripple`, and `disabled` doesn't block activation.**
`packages/ui/src/components/button.tsx:153-159`
With `asChild` (e.g. a router `<Link>`), `disabled`/`loading` only set `aria-disabled` and `pointer-events:none`.
The element can still be activated with the keyboard (Enter on a focused link), and the icon/spinner props are dropped without a warning.
Fix: on `aria-disabled`, `preventDefault` on click/keydown and set `tabIndex={-1}`; render `Slottable` with the icons, or `devWarn` about props that aren't supported.

**Status:** With `asChild`, Button now renders `startIcon`, `endIcon`, the loading spinner and ripples inside the child, via Radix `Slottable`. While `disabled` or `loading` it gets `aria-disabled`, `aria-busy`, `tabIndex={-1}`, and a capture-phase click guard that stops the child's own `onClick` and the href. `loadingText` produces a dev warning, because the child keeps its own content.

**M-6. 📝 Documented — Tooltips never show on disabled buttons.**
`packages/ui/src/components/shared.ts:9`
`disabledState` applies `pointer-events-none` to `:disabled` and `[aria-disabled]`, so a tooltip trigger
that is a disabled Button never gets hover/focus. "Why is this disabled?" tooltips are a common pattern.
That rule also makes `cursor: not-allowed` in `base.css:33` dead code.
Fix: drop `pointer-events-none` for `aria-disabled` (block clicks in JS), or document wrapping disabled triggers in a `<span tabIndex={0}>`.

**Status:** The `Tooltip` JSDoc now explains the `<span tabIndex={0}>` wrapper. `pointer-events: none` stays, because `aria-disabled` elements that aren't Buttons still rely on it to block clicks.

**M-7. ✅ Fixed — The Toast countdown bar drifts from the real timer.**
`packages/ui/src/components/toast.tsx:150-160`
The progress bar is a CSS animation paused on hover/focus-within. Radix also pauses the timer when the window loses focus,
but the CSS animation keeps running, so the bar can be empty while the toast stays open. Updating a toast with the same `id` doesn't restart the bar either.
Fix: drive the bar from Radix's pause/resume events (`onPause`/`onResume`), and key the bar on an update counter.

**Status:** Each toast is its own `ToastItem`, and the bar's `animation-play-state` follows Radix's `onPause`/`onResume`: viewport hover, focus inside it, and the window losing focus, for every toast at once (checked in the docs: hover → `paused`, leave → `running`). *Correction:* the other half of this finding was wrong. Radix doesn't restart its timer when a toast with the same id is updated, so the bar correctly doesn't restart either.

**M-8. ✅ Fixed — Toast swipe doesn't follow the finger for centered positions** (ROADMAP P0.2, still open).
`packages/ui/src/components/toast.tsx:129,156`
`top-center`/`bottom-center` set `swipeDirection` to up/down, but only `--radix-toast-swipe-move-x` is applied.
Fix: add `data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y)` for vertical swipes.

**Status:** The toast follows `--radix-toast-swipe-move-y` as well (Radix sets x or y according to the swipe direction). Closes ROADMAP P0.2. Not tested with a real touch drag.

### Theming & tokens

**M-9. ✅ Fixed — The Tailwind preset's `dark:` variant ignores the OS ("system") mode.**
`packages/ui/src/styles/motion.css:98`
`@custom-variant dark (&:where([data-nv-mode="dark"], [data-nv-mode="dark"] *))` only matches an explicit
choice. With the default `mode="system"` on a dark OS, the tokens switch to dark (via `light-dark()`) but every
consumer `dark:` utility keeps its light styles. `tailwind.css` advertises `dark:` as supported.
Fix: match `[data-nv-mode=dark]` OR `@media (prefers-color-scheme: dark)` scoped to `:not([data-nv-mode=light])`, or document that `dark:` requires an explicit mode.

**Status:** `dark:` now matches an explicit `[data-nv-mode=dark]` on the element or an ancestor, **or** `prefers-color-scheme: dark` when no `data-nv-mode` is set anywhere above. A compile test checks both branches.

**M-10. ✅ Fixed — `styles.css` changes the host page's `color-scheme`.**
Generated by `packages/tokens/scripts/build-css.ts:37` (`:where(:root) { color-scheme: light dark }`)
`packages/ui/src/styles/index.css` promises that "nothing here restyles elements outside a `.nv-theme` subtree",
but the root rule turns the host page's native scrollbars, form controls and canvas default to dark on a dark OS.
Fix: move `color-scheme: light dark` to `.nv-theme, [data-nv-theme]`.

**Status:** `color-scheme: light dark` moved from `:root` to theme roots that have no mode set on them or an ancestor, via the shared `COLOR_SCHEME_CSS` export from tokens. The host page stays `normal` (checked in the docs: `<html>` `normal`, theme root `light dark`, explicit dark `dark`).

**M-11. ✅ Fixed — `defaultMode` plus `storageKey` still flashes, even with `ThemeScript`.**
`packages/ui/src/theme/theme-provider.tsx:177-181,232-244`
The first render uses `defaultMode` and writes it to the provider's `data-nv-mode`, which overrides the
stored value that `ThemeScript` set on `<html>`. The stored mode is only applied in an effect, so a user
who chose "dark" sees one light frame (and SSR markup disagrees with the client). It's flash-free only when `defaultMode` is left unset.
Fix: when `storageKey` is set, leave `data-nv-mode` unset on the first render (inherit from `<html>`), or have `ThemeScript` also tag the provider.

**Status:** A persisted provider writes no `data-nv-mode` until it has read storage, so the server markup inherits what `ThemeScript` put on `<html>`. The read happens in a layout effect, so client-only apps apply it before first paint. `ThemeScript` and `getThemeScript` take `defaultMode`, so a first visit also paints in the default.

**M-12. ✅ Fixed — Semantic overrides aren't contrast-checked or re-derived.**
`packages/tokens/src/semantic/resolve.ts:217-224`
Overriding e.g. `primary-solid` keeps the old `primary-on-solid` / `-hover` / `-active`, and produces no
warning or `adjustments` entry. A brand override can silently ship white text on a pale button.
Non-hex values (`oklch()`, `var()`) are accepted without any check.
Fix: after applying overrides, run `auditContrast` and push failures into `warnings` (surfaced by `devWarn`); optionally re-derive the dependent tokens.

**Status:** After applying overrides, the resolver checks every `contrastPairs()` pair that involves an overridden token and adds a warning for each one below the required ratio; `ThemeProvider` logs these via `devWarn`. Dependent tokens aren't re-derived; the warning tells you to override the paired token.

**M-13. ✅ Fixed — `getThemeCss` writes override values into CSS without escaping.**
`packages/ui/src/theme/static.ts`, `packages/tokens/src/semantic/resolve.ts:223`
Override strings are copied verbatim into a server-rendered `<style>` block. If a multi-tenant app takes
brand overrides from user input, a value like `red;} body{display:none} x{` breaks out of the declaration (CSS injection).
`brand` is validated as hex; `overrides` are not.
Fix: reject values containing `;{}<` or validate them with `CSS.supports('color', v)` on the client and a strict parser on the server.

**Status:** Override values containing `;`, `{`, `}`, `<`, `>`, a backslash or `/*` are refused with a warning. CSS color functions still work. As a side fix, 4- and 8-digit hex overrides now keep their alpha; before, they were normalized to opaque.

### Packaging

**M-14. ✅ Fixed (breaking) — Tiptap and ProseMirror are hard dependencies of `@darkalpha/nova-ui`.**
`packages/ui/package.json` dependencies
Sixteen `@tiptap/*` packages (plus `@tiptap/pm` → ProseMirror) are installed for every consumer, even though
the editor sits behind a separate `./rich-text-editor` entry. That inflates install size, lockfile churn and
audit surface. `react-hook-form` already uses the right pattern.
Fix: make the Tiptap packages optional `peerDependencies` (`peerDependenciesMeta.optional`) and document installing them.

**Status:** The 16 `@tiptap/*` packages are now optional `peerDependencies` (and `devDependencies` for building and testing); the docs app installs them itself. The package README lists the install command. `verify-install` now checks that a fresh install has no Tiptap, that only the rich-text-editor files import it, and that the editor entry loads once the peers are installed. Released as a minor bump (breaking in 0.x).

**M-15. ⏸ Deferred — A heavy per-component baseline.**
`pnpm size`: Button alone is **50.8 kB min / 13.7 kB gz**, Dialog 128 kB, Select 190 kB, Toast 121 kB.
Most of the Button cost is `tailwind-merge` plus Radix Toggle/ToggleGroup (in the same module as Button) and the Spinner.
Fix: split `Toggle`/`ToggleGroup` out of `button.tsx`, consider a tailwind-merge config limited to the classes the components use, and add the per-component budget from ROADMAP "Toward 1.0".

**Status:** Most of the cost is `tailwind-merge` and Radix, which every component shares. This needs measuring with a bundle analyzer, not a quick fix.

**M-16. ✅ Fixed (breaking) — Brand-specific Kaveh kit and seasonal pages ship in the main entry.**
`packages/ui/src/index.ts:193-196`; `brand.tsx` (1020 lines), `kaveh-kit.tsx` (1209), `seasonal.tsx` (562)
One company's logos, artwork and page sections (with ~120 hard-coded hex colors that bypass tokens) are part of the
general-purpose public API, and three Kaveh themes are in `presets`/`themes.css`. Tree-shaking removes the JS, but the
API surface, docs, types and CSS are all larger for every consumer, and it will be hard to remove after 1.0.
Fix: move them to `@darkalpha/nova-ui/kaveh` (or a separate package) before the API freeze.

**Status:** `brand.tsx`, `kaveh-kit.tsx` and `seasonal.tsx` (114 exports) moved to the new `@darkalpha/nova-ui/kaveh` entry. A codemod rewrote the imports in 6 docs files and 3 test files, and the 13 docs registry entries show the new import path. The API extractor reads the new entry. The "Everything" bundle dropped from 842.9 kB to 751.3 kB minified (222.3 → 198.1 kB gzip). The three Kaveh **themes** stay in `@darkalpha/nova-tokens` presets: they're small data, and moving them would mean a side-effect registration import. Released as a minor bump (breaking in 0.x).

### CI / release

**M-17. ✅ Fixed — Releases don't wait for e2e.**
`.github/workflows/release.yml`
`release.yml` runs `pnpm check` (unit tests only) and publishes. The Playwright a11y/keyboard/visual suite runs in a
separate workflow, so a version can reach npm while e2e is red.
Fix: trigger release on `workflow_run` of CI (success), or add the e2e job as a `needs:` dependency.

**Status:** `release.yml` now runs on `workflow_run` of CI, only when it succeeded on a push to `main`, so unit tests, the React 18 job, the examples and Playwright must all pass before anything is versioned or published.

**M-18. ✅ Fixed — React 18 is in the peer range but never tested** (ROADMAP P0.3, still open).
`packages/ui/package.json` peers `^18.2.0 || ^19.0.0`; CI installs React 19 only.
Fix: add a matrix job with `react@18`/`react-dom@18` running `pnpm test`.

**Status:** New `react18` CI job: build, swap in `react@18`/`react-dom@18`, assert the version, run the UI tests. Run locally on React 18.3.1, 389 of 390 passed, and the one failure was the editor timeout fixed below. Closes ROADMAP P0.3.

**M-19. ✅ Fixed — The Node engine range is wrong for contributors.**
`package.json` `"engines": { "node": ">=20.19" }`
Build scripts run `node scripts/*.ts` (native type stripping), which needs Node ≥ 22.18. On Node 20, `pnpm build` fails immediately.
Fix: set `>=22.18` (or add `--experimental-strip-types` and document it).

**Status:** `engines.node` is now `>=22.18`, and the README says why.

**M-20. ✅ Fixed — The example apps can't be installed from a fresh clone.**
`examples/next-app/package.json`, `examples/vite-app/package.json`
Both depend on timestamped tarballs in `vendor/`, which is git-ignored (`.gitignore`), and they point at different
builds (`20261102…` and `20261029…`). Neither example is built in CI, so they can rot without notice.
Fix: use `workspace:` / `link:` deps (add `examples/*` to the workspace), or document running `pnpm install:local` first; build both in CI.

**Status:** The READMEs already say to run the installer first. CI now builds both examples (`examples` matrix job) from freshly packed tarballs. I built both locally with this branch's code before adding the job.

---

## Low

### Accessibility & i18n
- **L-1.** ✅ Fixed: `Rating` read-only label is hard-coded English: `` `${current} out of ${max}` `` (`chip.tsx:199`), and it can't be localized like `getOptionLabel`. There are about 21 other English default label strings. They can all be overridden, but a single `labels`/locale dictionary in `ThemeProvider` would beat per-component props. **Status:** Added `getValueLabel(value, max)`.
- **L-2.** ⏸ Deferred: `Rating` is missing `disabled` and clearing, and it rounds fractional read-only values (`Math.round`), so 3.4 shows as 3 stars. There are no half stars. **Status:** `disabled` was added with H-4. Clearing a rating and half stars are new features.
- **L-3.** ✅ Fixed: `aria-selected` on `<tr>` in `DataTable` (`table.tsx:419`) isn't valid for `role="table"` rows; it's only supported in `grid`/`treegrid`. Use a checkbox's checked state (already present) or switch to `role="grid"`. **Status:** Rows no longer get `aria-selected`; each row's labelled checkbox carries the state.
- **L-4.** ✅ Fixed: `Fieldset` sets `aria-invalid` on `<fieldset>` (not supported on `group`), and its `description` isn't linked via `aria-describedby` (`field.tsx:249-263`). **Status:** Fieldset uses `aria-describedby` for its description and error, with no `aria-invalid` (`data-invalid` is kept for styling).
- **L-5.** ✅ Fixed: When there's no message, the `FormField` live region uses `display: contents` (`field.tsx:232`). Some engines (older Safari/VoiceOver) drop accessibility info for `display:contents` elements, so the first announcement can be missed. A visually-hidden but always-present box is safer. **Status:** Empty live regions (FormField and Fieldset) use `sr-only` instead of `display: contents`.
- **L-6.** ✅ Fixed: `Label` uses `peer-disabled:opacity-50` (`field.tsx:79`), but the label comes *before* the control, so `peer-*` never matches. The disabled styling comes only from `data-disabled` on the field. **Status:** `Label` uses `in-data-disabled:opacity-50`, so it dims inside a disabled FormField. This is a visual change for disabled fields.
- **L-7.** ✅ Fixed: Each `<Tooltip>` creates its own `TooltipProvider` (`overlay.tsx:57`), so moving between adjacent tooltips never uses Radix's skip-delay. Toolbars feel sluggish. **Status:** `TooltipProvider` is now a component that marks its subtree; `<Tooltip>` joins an enclosing provider instead of nesting its own. The rich text toolbar is wrapped in one.
- **L-8.** ⏸ Deferred: Dialog/Sheet close buttons are `absolute` inside the `overflow-y-auto` content (`overlay.tsx:92`), so they scroll out of view in long dialogs. **Status:** Making the close button sticky changes dialog layout and every dialog/sheet baseline. It needs a design pass.
- **L-9.** ✅ Fixed: Contrast gap for unusual neutrals: with a saturated neutral seed (e.g. `brand.neutral="#ff0000"`), light `foreground-muted` on `surface-sunken`/`surface-hover` drops to 4.24:1. `contrastPairs()` (`validate.ts:18`) doesn't cover any `surface-raised`, `surface-sunken`, `surface-hover`, `*-solid-active` or `*-text` on `*-subtle` pairs, so the audit can't catch this. Add those pairs to `resolveSurfaces` and `contrastPairs`. **Status:** `foreground-secondary`/`-muted` are walked against sunken and hovered surfaces too; `input`, `focus-ring` and `*-text` against `surface-raised`. `contrastPairs()` gained those pairs plus `on-solid`/`solid-active` and `on-subtle`/`subtle-hover`. All 11 presets resolve to **identical** colors and pass; the red-neutral case now passes.
- **L-10.** ✅ Fixed: `parseHex` silently drops alpha (`convert.ts:33`), so the contrast of an 8-digit override is computed as if it were opaque and can pass when the rendered color fails. **Status:** Added `parseHexAlpha`; `contrastRatio` composites a translucent foreground over the background.

### API consistency
- **L-11.** ✅ Fixed: `AlertDialogTitle` lacks the `tracking-(--nv-tracking-tight)` that `DialogTitle` has (`overlay.tsx:172` vs `106`).
- **L-12.** ➖ Left as is: The `clay` Button variant hard-codes `rounded-(--nv-radius-xl)`, ignoring `--nv-button-radius` (`button.tsx:52`). **Status:** Clay is deliberately puffier than the theme's button radius. Changing it is a design call, not a bug.
- **L-13.** ✅ Fixed: `cn()` can't resolve custom `animate-nv-*` classes against each other: `twMerge("animate-nv-pop-in animate-spin")` keeps both, so a consumer can't override a component's animation via `className`. Register the `nv-*` animations (and the `shadow-glow-*` family) with `extendTailwindMerge`. **Status:** `cn()` uses `extendTailwindMerge` with `animate-nv-*` in the animate group. That exposed one real conflict: Button passed `animate-nv-fade-in` to a Spinner that has `animate-nv-spin`, so the spinner now sits in a fading `<span>`. A test checks it still spins.
- **L-14.** ✅ Fixed: `Countdown` with an invalid `to` renders `NaN` digits instead of nothing or `completed`. **Status:** It renders nothing and logs a dev warning; the timer doesn't run.
- **L-15.** ✅ Fixed: `Countdown` builds `Intl.ListFormat`/`NumberFormat` on every tick (`countdown.tsx:88`). Memoize them with the other formatters. **Status:** The number and list formatters are cached per locale.

### Performance / hygiene
- **L-16.** ✅ Fixed: `fallbackContext` calls `getResolvedTheme(defaultTheme)` at module load (`theme-provider.tsx:278`; `dist/theme/theme-provider.js:135`, not marked `/*#__PURE__*/`). Every import, including on the server, resolves both modes eagerly. Make it lazy. **Status:** The fallback context is built on first use.
- **L-17.** ➖ Left as is: `@darkalpha/nova-tokens` publishes `src/` as well as `dist/` (`packages/tokens/package.json` `files`). Nothing in `exports` points at `src/`, so it's dead weight in the tarball. **Status:** *Correction:* `src/` isn't dead weight. The published `.d.ts.map` files point into it, so editors' "Go to definition" lands on real source.
- **L-18.** ✅ Fixed: `useRipple`'s cleanup `setTimeout` isn't cleared on unmount (`button.tsx:100`). It's harmless in React 18+, but it's the only uncleared component timer.
- **L-19.** ✅ Fixed (PR #13): The ESLint config enables only two `react-hooks` rules. The v7 plugin's recommended set (refs during render, purity, etc.) is off; `countdown.tsx:54` (`onCompleteRef.current = onComplete` during render) would be flagged. There's also no `jsx-a11y`, so a11y relies entirely on the axe unit tests and Playwright. **Status:** The React Compiler rules (`recommended-latest`) are on as **warnings**: 27 sites, mostly latest-value refs read during render and setState inside effects, in `rich-text-editor`, `react-hook-form`, `kanban`, `sortable`, `countdown`, `color-picker`, `tour`, `media`, `upload-list`, `charts`, `compose-refs`, `create-icon` and two docs examples. Fix those, then raise the rules to `error`. `jsx-a11y` isn't added. **Update:** all 27 sites are fixed (a `useLatestRef` helper, state adjusted during render), the compiler rules and `exhaustive-deps` are errors, `jsx-a11y` runs with the recommended preset, and `pnpm lint` fails on any warning.
- **L-20.** ✅ Fixed: GitHub Actions are pinned by tag (`@v4`), not commit SHA, in a workflow that holds `NPM_TOKEN` and `id-token: write`. **Status:** Every action in all four workflows is pinned to a commit SHA, with the major tag in a comment.
- **L-21.** ✅ Fixed: The docs deploy (`docs.yml`) doesn't wait for CI, so a broken `main` still deploys. **Status:** `docs.yml` runs on `workflow_run` of CI (success on `main`) and deploys the tested SHA; manual dispatch still works.

### Docs
- **L-22.** ✅ Fixed: `ROADMAP.md` is stale. It reports "351 passing" unit tests (now 491). P0.1 "Seed the Linux visual baselines" is done (`e2e/__screenshots__/linux` is committed). P1.1 (console guard, `e2e/helpers.ts:14`) and P1.4 (canvas stub, `tests/setup.ts`) are implemented but still listed as to-do. *Correction:* P1.2 is only partly done (`docs.spec.ts:273` checks one route), not fully as first stated. **Status:** ROADMAP status table and P0/P1/P2 items updated.
- **L-23.** ⏸ Deferred: Hash routing breaks in-page anchors and indexing (ROADMAP P3.2, still open). The docs entry chunks are still large (P3.1). **Status:** Path-based routing with prerendering is a docs-site project of its own.

---

## Still-open roadmap items (confirmed against the code)

| Roadmap | Status |
| --- | --- |
| P0.2 Toast swipe for centered positions | Fixed (M-8) |
| P0.3 React 18 CI job | Fixed (M-18) |
| P2.1 `toast.promise`, `onDismiss`, `<Toaster max>` | Fixed (PR #16) |
| P2.3 Carousel hover/focus pause | Fixed (H-2) |
| P2.6 Cross-tab mode sync (`storage` event) | Fixed (`storage` listener in `ThemeProvider`) |
