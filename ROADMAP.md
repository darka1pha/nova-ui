# Nova UI roadmap

Status as of 2026-11-09 (`0.5.0` plus the lint and e2e route-sweep work; audit findings in `issues.md`).
The 0.2.0 pass below is kept for history.

## Where things stand

| Check | Result |
| --- | --- |
| `pnpm build` / `typecheck` | Clean |
| `pnpm lint` | Clean with `--max-warnings 0`; React Compiler rules and `jsx-a11y` are errors (issues.md L-19) |
| Unit tests (tokens + ui) | 527 passing (121 + 406) |
| CI jobs | check, React 18 unit tests, example builds (Vite, Next), Playwright; release and docs deploy wait for CI |
| Playwright on Windows (a11y, keyboard, visual) | 129 passing at 0.2.0; not re-run for the audit fixes |
| Docs at 375px and in RTL, all 25 routes | No horizontal overflow, no runtime warnings (checked by hand at 0.2.0) |

### Fixed in this pass

- **`toast.dismiss()` leaked closed toasts.** They stayed in the store, counted toward the
  five-toast limit, and a new toast could push out an open `duration: Infinity` one.
  Closing now goes through one path that removes the record after the exit animation, and
  the limit counts open toasts only. Regression test added.
- **Toast swipe ignored RTL.** `bottom-end` sits on the left in RTL but still swiped right.
- **`Countdown` rendered a `<div>`.** Its `variant="inline"` is meant for sentences, so the
  docs logged invalid `<p><div>` nesting. It's now a `<span>` (ref type `HTMLSpanElement`).
- **Docs: "Skip to content" sent you to the home page.** `#main` changed the hash, which is
  the router. The link now focuses `<main>` directly.
- **Docs: unknown routes silently showed the home page.** There's a "Page not found" state now.
- **Docs: every page was titled "Nova UI".** Titles are now per page (WCAG 2.4.2).
- **Docs: the header overflowed at phone width** ("Nova UI" wrapped onto two lines). The
  version badge hides below `sm` and the logo no longer shrinks.
- **Docs: version shown as "v0.1" after the 0.2.0 release.** The header, hero and the
  "pin a minor range" hint now read the version from `packages/ui/package.json`.

## P0: before the next release

1. ~~**Seed the Linux visual baselines.**~~ Done: `e2e/__screenshots__/linux` is committed.
   Regenerate after the audit fixes (empty rating stars, disabled field labels, AlertDialog
   title tracking) with the *Update visual baselines* workflow.
2. ~~**Make toast swipe work for the centered positions.**~~ Done (issues.md M-8): the toast
   follows `--radix-toast-swipe-move-y` too. `e2e/interactions.spec.ts` swipes toasts with real touch
   events for bottom-end (LTR and RTL), top-center and bottom-center.
3. ~~**Add a React 18 CI job.**~~ Done (issues.md M-18): the `react18` job in `ci.yml`.
4. ~~**Repository name.**~~ Done: the repository is now `github.com/darka1pha/nova-ui` (the old
   `Kaleido` URL redirects), and both `package.json` files point at it.

## P1: catch this class of bug automatically

Every docs bug fixed above was visible in the browser but invisible to the test suite.

1. ~~**Console guard in e2e.**~~ Done: `open()` in `e2e/helpers.ts` fails on any console
   error or page error.
2. ~~**Route sweep at 375px and in RTL.**~~ Done: `e2e/routes.spec.ts` opens every nav
   entry (read from `src/pages/index.tsx` and the registry, so new pages are covered) at
   375px in LTR and RTL. It checks for no horizontal overflow, exactly one `h1` and a
   page-specific title, and a separate test checks that every title is unique. RTL
   overflow is found by checking element boxes, since content past the left edge is cut
   off rather than scrollable. The first run found and fixed overflow on Tokens, the
   Sidebar demo, the Kaveh header demos and `KavehContactCard`, plus extra `h1`s from
   `KavehPageHeader` demos (new `headingLevel` prop).
   It also found that a `TabsList` wider than a phone pushed the page wide. Underline and
   segmented bars now scroll sideways and keep the active tab in view, with an e2e test in
   LTR and RTL; pills still wrap.
3. ~~**Skip-link and 404 tests.**~~ Done: the skip link keeps the route, focuses `<main>`,
   and the next Tab stays in the content; unknown pages and unknown components show
   "Page not found" with its title, and the link back goes to the overview.
4. ~~**Silence jsdom canvas noise.**~~ Done: `tests/setup.ts` stubs `getContext`.
5. **Manual screen-reader pass** (NVDA + Firefox, VoiceOver + Safari) with the checklist on the
   Accessibility page, recorded per component before 1.0.

## P2: components and API

1. ~~**Toast API:**~~ Done: `toast.promise(promise, { loading, success, error })`, an
   `onDismiss` callback, and `<Toaster max>` (default 5) instead of the fixed five.
2. ~~**Countdown:**~~ Done: `as="div"` for block layouts and a `format` render prop for
   custom layouts like `02:15:09`.
3. ~~**Carousel.**~~ Done in PR #7 (issues.md H-2). Originally: pausing on hover and on focus are tracked by one flag, so moving the pointer
   out while a slide button has focus resumes autoplay. Track the two separately.
4. ~~**Data:**~~ Done: `VirtualTable` virtualizes rows and (opt-in) columns, with pinned
   columns, range selection across all rows and sorting; it shares `virtualRange` with `VirtualList`.
5. ~~**Forms:**~~ Done in 0.7.0: `Combobox` `loadOptions` and `creatable`, and `FileUploader`/
   `useFileUploads` paired with `FileUploadList`.
6. ~~**Theming:**~~ Done in 0.7.0: cross-tab sync of the stored mode in `ThemeProvider` and
   `useThemeVariables()`.

## P3: docs site

1. ~~**Bundle size.**~~ Done: component pages load only their own props (about 1 kB per
   export instead of the 246 kB API file), the icons page dropped `react-dom/server` (229 →
   28 kB), and search loads on first use. Pages were already split per route. The entry is
   304 kB, 199 kB of it `react-dom`; `surfaces` (212 kB) is the shared Nova UI chunk.
2. ~~**Path-based routing with prerendering**~~ Done: routes are paths (`/components/button#api`)
   under `DOCS_BASE`, and `pnpm build:docs` prerenders all of them to static HTML (plus a
   `404.html` for GitHub Pages), which the client hydrates. Old `#/…` links redirect.
3. ~~**Search**~~ Done: ⌘K / Ctrl+K (or the header button) opens a `CommandPalette` over
   pages, components and every prop, ranked by name; a prop opens its API table.
4. ~~**Generated prop tables**~~ Done: `scripts/api-extractor.ts` reads props, defaults and
   JSDoc from the TypeScript source for every component page's API reference.

## Toward 1.0

- ~~Freeze the public API.~~ Decided for 0.8: `packages/ui/api-report.md` lists every export
  and `pnpm check` (CI) fails when it's out of date, so any API change is a reviewed diff.
  - `useComposedRefs` and `getPageItems` are internal now. `buttonVariants`, `fieldVariants`,
    `useRipple` and `TooltipRoot` stay public; the variant class strings are not frozen.
  - `@darkalpha/nova-ui/experimental` holds `VirtualTable`, `virtualRange`, `FileUploader` and
    `useFileUploads`, outside semver until they graduate. The other candidates (KanbanBoard,
    Tour, SignaturePad, chat kit, charts) stay in the main entry.
  - The token helpers stay exported from both packages, documented as the same functions.
- ~~Write a 0.x → 1.0 migration guide.~~ Done: the Upgrading page lists every breaking or
  behavior change since 0.3 with what to do, and what 1.0 freezes.
- ~~Publish the tokens as Figma variables.~~ Done: `figmaVariables()` and
  `dist/figma/<theme>.json` (Variables REST API bodies, palette aliases kept), and
  `pnpm --filter @darkalpha/nova-tokens figma:sync` to push or update a file.
- ~~Set a bundle budget per component in `size-report.ts` and fail CI when it's exceeded.~~
  Done: each case has a gzip budget about 5% over its size, and the CI step fails when one is over.
