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

## Medium

### Components

**M-1. Overlays opened on first render go to `document.body`, outside the theme.**
`packages/ui/src/theme/theme-provider.tsx:219,246`, `packages/ui/src/components/portal.tsx:20`
`portalContainer` is set with a ref callback, so it is `null` during the first render. A
`defaultOpen` Dialog/Popover/Tooltip (or one opened from a mount effect) first portals into `body`,
without theme variables, mode or `dir`, and then re-mounts into the portal root once the state updates.
That shows up as a flash of unthemed content, a replayed entrance animation, and lost focus.
Fix: render children only once the container exists when anything is open, or use a `useLayoutEffect` plus a stable container.

**M-2. The portal root lives inside the provider's `<div>`.**
`packages/ui/src/theme/theme-provider.tsx:246`
If an app gives the `ThemeProvider` `overflow:hidden`, `transform`, `filter`, `contain` or a `z-index`
(common for scoped/previews/embedded widgets), `position:fixed` modals, sheets and toasts are clipped or trapped under other content.
Fix: document the constraint, or offer `portalContainer` / `portalTarget="body"` that portals into a body-level host that copies the provider's `data-*` attributes and variables.

**M-3. `RichTextViewer` renders nothing on the server.**
`packages/ui/src/components/rich-text-editor.tsx:769,1843-1858`
The viewer is a full read-only Tiptap editor with `immediatelyRender: false`, so SSR/SSG output is empty.
That's bad for SEO, causes a layout shift, and pulls the whole ProseMirror engine into the bundle just to display content.
Fix: render static HTML for the viewer (`generateHTML` from `@tiptap/html`, or a small JSON→React renderer) and keep the editor for editing.

**M-4. Link URL normalization doesn't block dangerous schemes.**
`packages/ui/src/components/rich-text-editor.tsx:387-393,1628,1659`
`normalizeUrl` passes through any `scheme:` (e.g. `javascript:`, `data:`). The `insertContent` path at
L1628 builds a link mark directly instead of going through `setLink`. Today the app relies on Tiptap's
`isAllowedUri` (in `renderHTML`) to strip it. That wasn't checked in this audit, and the "open link" button
at L1659 renders `href={current}` straight from the mark attributes.
Fix: allow-list `http`, `https`, `mailto`, `tel` and relative URLs in `normalizeUrl`, and add a test that `javascript:alert(1)` never reaches an `href`.

**M-5. `asChild` Button silently ignores `loading`, `startIcon`, `endIcon`, `ripple`, and `disabled` doesn't block activation.**
`packages/ui/src/components/button.tsx:153-159`
With `asChild` (e.g. a router `<Link>`), `disabled`/`loading` only set `aria-disabled` and `pointer-events:none`.
The element can still be activated with the keyboard (Enter on a focused link), and the icon/spinner props are dropped without a warning.
Fix: on `aria-disabled`, `preventDefault` on click/keydown and set `tabIndex={-1}`; render `Slottable` with the icons, or `devWarn` about props that aren't supported.

**M-6. Tooltips never show on disabled buttons.**
`packages/ui/src/components/shared.ts:9`
`disabledState` applies `pointer-events-none` to `:disabled` and `[aria-disabled]`, so a tooltip trigger
that is a disabled Button never gets hover/focus. "Why is this disabled?" tooltips are a common pattern.
That rule also makes `cursor: not-allowed` in `base.css:33` dead code.
Fix: drop `pointer-events-none` for `aria-disabled` (block clicks in JS), or document wrapping disabled triggers in a `<span tabIndex={0}>`.

**M-7. The Toast countdown bar drifts from the real timer.**
`packages/ui/src/components/toast.tsx:150-160`
The progress bar is a CSS animation paused on hover/focus-within. Radix also pauses the timer when the window loses focus,
but the CSS animation keeps running, so the bar can be empty while the toast stays open. Updating a toast with the same `id` doesn't restart the bar either.
Fix: drive the bar from Radix's pause/resume events (`onPause`/`onResume`), and key the bar on an update counter.

**M-8. Toast swipe doesn't follow the finger for centered positions** (ROADMAP P0.2, still open).
`packages/ui/src/components/toast.tsx:129,156`
`top-center`/`bottom-center` set `swipeDirection` to up/down, but only `--radix-toast-swipe-move-x` is applied.
Fix: add `data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y)` for vertical swipes.

### Theming & tokens

**M-9. The Tailwind preset's `dark:` variant ignores the OS ("system") mode.**
`packages/ui/src/styles/motion.css:98`
`@custom-variant dark (&:where([data-nv-mode="dark"], [data-nv-mode="dark"] *))` only matches an explicit
choice. With the default `mode="system"` on a dark OS, the tokens switch to dark (via `light-dark()`) but every
consumer `dark:` utility keeps its light styles. `tailwind.css` advertises `dark:` as supported.
Fix: match `[data-nv-mode=dark]` OR `@media (prefers-color-scheme: dark)` scoped to `:not([data-nv-mode=light])`, or document that `dark:` requires an explicit mode.

**M-10. `styles.css` changes the host page's `color-scheme`.**
Generated by `packages/tokens/scripts/build-css.ts:37` (`:where(:root) { color-scheme: light dark }`)
`packages/ui/src/styles/index.css` promises that "nothing here restyles elements outside a `.nv-theme` subtree",
but the root rule turns the host page's native scrollbars, form controls and canvas default to dark on a dark OS.
Fix: move `color-scheme: light dark` to `.nv-theme, [data-nv-theme]`.

**M-11. `defaultMode` plus `storageKey` still flashes, even with `ThemeScript`.**
`packages/ui/src/theme/theme-provider.tsx:177-181,232-244`
The first render uses `defaultMode` and writes it to the provider's `data-nv-mode`, which overrides the
stored value that `ThemeScript` set on `<html>`. The stored mode is only applied in an effect, so a user
who chose "dark" sees one light frame (and SSR markup disagrees with the client). It's flash-free only when `defaultMode` is left unset.
Fix: when `storageKey` is set, leave `data-nv-mode` unset on the first render (inherit from `<html>`), or have `ThemeScript` also tag the provider.

**M-12. Semantic overrides aren't contrast-checked or re-derived.**
`packages/tokens/src/semantic/resolve.ts:217-224`
Overriding e.g. `primary-solid` keeps the old `primary-on-solid` / `-hover` / `-active`, and produces no
warning or `adjustments` entry. A brand override can silently ship white text on a pale button.
Non-hex values (`oklch()`, `var()`) are accepted without any check.
Fix: after applying overrides, run `auditContrast` and push failures into `warnings` (surfaced by `devWarn`); optionally re-derive the dependent tokens.

**M-13. `getThemeCss` writes override values into CSS without escaping.**
`packages/ui/src/theme/static.ts`, `packages/tokens/src/semantic/resolve.ts:223`
Override strings are copied verbatim into a server-rendered `<style>` block. If a multi-tenant app takes
brand overrides from user input, a value like `red;} body{display:none} x{` breaks out of the declaration (CSS injection).
`brand` is validated as hex; `overrides` are not.
Fix: reject values containing `;{}<` or validate them with `CSS.supports('color', v)` on the client and a strict parser on the server.

### Packaging

**M-14. Tiptap and ProseMirror are hard dependencies of `@darkalpha/nova-ui`.**
`packages/ui/package.json` dependencies
Sixteen `@tiptap/*` packages (plus `@tiptap/pm` → ProseMirror) are installed for every consumer, even though
the editor sits behind a separate `./rich-text-editor` entry. That inflates install size, lockfile churn and
audit surface. `react-hook-form` already uses the right pattern.
Fix: make the Tiptap packages optional `peerDependencies` (`peerDependenciesMeta.optional`) and document installing them.

**M-15. A heavy per-component baseline.**
`pnpm size`: Button alone is **50.8 kB min / 13.7 kB gz**, Dialog 128 kB, Select 190 kB, Toast 121 kB.
Most of the Button cost is `tailwind-merge` plus Radix Toggle/ToggleGroup (in the same module as Button) and the Spinner.
Fix: split `Toggle`/`ToggleGroup` out of `button.tsx`, consider a tailwind-merge config limited to the classes the components use, and add the per-component budget from ROADMAP "Toward 1.0".

**M-16. Brand-specific Kaveh kit and seasonal pages ship in the main entry.**
`packages/ui/src/index.ts:193-196`; `brand.tsx` (1020 lines), `kaveh-kit.tsx` (1209), `seasonal.tsx` (562)
One company's logos, artwork and page sections (with ~120 hard-coded hex colors that bypass tokens) are part of the
general-purpose public API, and three Kaveh themes are in `presets`/`themes.css`. Tree-shaking removes the JS, but the
API surface, docs, types and CSS are all larger for every consumer, and it will be hard to remove after 1.0.
Fix: move them to `@darkalpha/nova-ui/kaveh` (or a separate package) before the API freeze.

### CI / release

**M-17. Releases don't wait for e2e.**
`.github/workflows/release.yml`
`release.yml` runs `pnpm check` (unit tests only) and publishes. The Playwright a11y/keyboard/visual suite runs in a
separate workflow, so a version can reach npm while e2e is red.
Fix: trigger release on `workflow_run` of CI (success), or add the e2e job as a `needs:` dependency.

**M-18. React 18 is in the peer range but never tested** (ROADMAP P0.3, still open).
`packages/ui/package.json` peers `^18.2.0 || ^19.0.0`; CI installs React 19 only.
Fix: add a matrix job with `react@18`/`react-dom@18` running `pnpm test`.

**M-19. The Node engine range is wrong for contributors.**
`package.json` `"engines": { "node": ">=20.19" }`
Build scripts run `node scripts/*.ts` (native type stripping), which needs Node ≥ 22.18. On Node 20, `pnpm build` fails immediately.
Fix: set `>=22.18` (or add `--experimental-strip-types` and document it).

**M-20. The example apps can't be installed from a fresh clone.**
`examples/next-app/package.json`, `examples/vite-app/package.json`
Both depend on timestamped tarballs in `vendor/`, which is git-ignored (`.gitignore`), and they point at different
builds (`20261102…` and `20261029…`). Neither example is built in CI, so they can rot without notice.
Fix: use `workspace:` / `link:` deps (add `examples/*` to the workspace), or document running `pnpm install:local` first; build both in CI.

---

## Low

### Accessibility & i18n
- **L-1.** `Rating` read-only label is hard-coded English: `` `${current} out of ${max}` `` (`chip.tsx:199`), and it can't be localized like `getOptionLabel`. There are about 21 other English default label strings. They can all be overridden, but a single `labels`/locale dictionary in `ThemeProvider` would beat per-component props.
- **L-2.** `Rating` is missing `disabled` and clearing, and it rounds fractional read-only values (`Math.round`), so 3.4 shows as 3 stars. There are no half stars.
- **L-3.** `aria-selected` on `<tr>` in `DataTable` (`table.tsx:419`) isn't valid for `role="table"` rows; it's only supported in `grid`/`treegrid`. Use a checkbox's checked state (already present) or switch to `role="grid"`.
- **L-4.** `Fieldset` sets `aria-invalid` on `<fieldset>` (not supported on `group`), and its `description` isn't linked via `aria-describedby` (`field.tsx:249-263`).
- **L-5.** When there's no message, the `FormField` live region uses `display: contents` (`field.tsx:232`). Some engines (older Safari/VoiceOver) drop accessibility info for `display:contents` elements, so the first announcement can be missed. A visually-hidden but always-present box is safer.
- **L-6.** `Label` uses `peer-disabled:opacity-50` (`field.tsx:79`), but the label comes *before* the control, so `peer-*` never matches. The disabled styling comes only from `data-disabled` on the field.
- **L-7.** Each `<Tooltip>` creates its own `TooltipProvider` (`overlay.tsx:57`), so moving between adjacent tooltips never uses Radix's skip-delay. Toolbars feel sluggish.
- **L-8.** Dialog/Sheet close buttons are `absolute` inside the `overflow-y-auto` content (`overlay.tsx:92`), so they scroll out of view in long dialogs.
- **L-9.** Contrast gap for unusual neutrals: with a saturated neutral seed (e.g. `brand.neutral="#ff0000"`), light `foreground-muted` on `surface-sunken`/`surface-hover` drops to 4.24:1. `contrastPairs()` (`validate.ts:18`) doesn't cover any `surface-raised`, `surface-sunken`, `surface-hover`, `*-solid-active` or `*-text` on `*-subtle` pairs, so the audit can't catch this. Add those pairs to `resolveSurfaces` and `contrastPairs`.
- **L-10.** `parseHex` silently drops alpha (`convert.ts:33`), so the contrast of an 8-digit override is computed as if it were opaque and can pass when the rendered color fails.

### API consistency
- **L-11.** `AlertDialogTitle` lacks the `tracking-(--nv-tracking-tight)` that `DialogTitle` has (`overlay.tsx:172` vs `106`).
- **L-12.** The `clay` Button variant hard-codes `rounded-(--nv-radius-xl)`, ignoring `--nv-button-radius` (`button.tsx:52`).
- **L-13.** `cn()` can't resolve custom `animate-nv-*` classes against each other: `twMerge("animate-nv-pop-in animate-spin")` keeps both, so a consumer can't override a component's animation via `className`. Register the `nv-*` animations (and the `shadow-glow-*` family) with `extendTailwindMerge`.
- **L-14.** `Countdown` with an invalid `to` renders `NaN` digits instead of nothing or `completed`.
- **L-15.** `Countdown` builds `Intl.ListFormat`/`NumberFormat` on every tick (`countdown.tsx:88`). Memoize them with the other formatters.

### Performance / hygiene
- **L-16.** `fallbackContext` calls `getResolvedTheme(defaultTheme)` at module load (`theme-provider.tsx:278`; `dist/theme/theme-provider.js:135`, not marked `/*#__PURE__*/`). Every import, including on the server, resolves both modes eagerly. Make it lazy.
- **L-17.** `@darkalpha/nova-tokens` publishes `src/` as well as `dist/` (`packages/tokens/package.json` `files`). Nothing in `exports` points at `src/`, so it's dead weight in the tarball.
- **L-18.** `useRipple`'s cleanup `setTimeout` isn't cleared on unmount (`button.tsx:100`). It's harmless in React 18+, but it's the only uncleared component timer.
- **L-19.** The ESLint config enables only two `react-hooks` rules. The v7 plugin's recommended set (refs during render, purity, etc.) is off; `countdown.tsx:54` (`onCompleteRef.current = onComplete` during render) would be flagged. There's also no `jsx-a11y`, so a11y relies entirely on the axe unit tests and Playwright.
- **L-20.** GitHub Actions are pinned by tag (`@v4`), not commit SHA, in a workflow that holds `NPM_TOKEN` and `id-token: write`.
- **L-21.** The docs deploy (`docs.yml`) doesn't wait for CI, so a broken `main` still deploys.

### Docs
- **L-22.** `ROADMAP.md` is stale. It reports "351 passing" unit tests (now 491). P0.1 "Seed the Linux visual baselines" is done (`e2e/__screenshots__/linux` is committed). P1.1 (console guard, `e2e/helpers.ts:14`), P1.2 (overflow sweep, `docs.spec.ts:273`) and P1.4 (canvas stub, `tests/setup.ts`) are implemented but still listed as to-do.
- **L-23.** Hash routing breaks in-page anchors and indexing (ROADMAP P3.2, still open). The docs entry chunks are still large (P3.1).

---

## Still-open roadmap items (confirmed against the code)

| Roadmap | Status |
| --- | --- |
| P0.2 Toast swipe for centered positions | Open (M-8) |
| P0.3 React 18 CI job | Open (M-18) |
| P2.1 `toast.promise`, `onDismiss`, `<Toaster max>` | Open (`MAX_OPEN = 5` is still fixed, `toast.tsx:37`) |
| P2.3 Carousel hover/focus pause | Fixed (H-2) |
| P2.6 Cross-tab mode sync (`storage` event) | Open (no listener in `theme-provider.tsx`) |
