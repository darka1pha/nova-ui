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
   follows `--radix-toast-swipe-move-y` too. Still open: a Playwright test with a touch drag.
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

1. **Toast API:** `toast.promise(promise, { loading, success, error })`, an `onDismiss`
   callback, and a configurable limit on `<Toaster max>` instead of the fixed five.
2. **Countdown:** an `as` prop (or `asChild`) for block layouts that want a `<div>`, and
   a `format` render prop for custom layouts like `02:15:09`.
3. ~~**Carousel.**~~ Done in PR #7 (issues.md H-2). Originally: pausing on hover and on focus are tracked by one flag, so moving the pointer
   out while a slide button has focus resumes autoplay. Track the two separately.
4. **Data:** column virtualization and row selection for `Table`, built on `VirtualList`.
5. **Forms:** `Combobox` with async search and creatable options; a `FileDrop` that pairs
   with `FileUploadList`.
6. **Theming:** cross-tab sync of the stored mode (`storage` event in `ThemeProvider`) and a
   `useThemeVariables()` hook for canvas and chart libraries that can't read CSS variables.

## P3: docs site

1. **Bundle size.** The entry chunk is 275 kB, `icons` 230 kB, `components` 212 kB and
   `surfaces` 201 kB (minified). Split `components.tsx` per page, load the icon catalog
   on demand, and lazy-load the template preview's heavy sections.
2. **Path-based routing with prerendering** so pages are indexable and shareable with headings
   (`/forms#select`) — hash routing can't do in-page anchors without breaking the router,
   which is the root cause of the skip-link bug.
3. **Search** (Cmd+K) over pages, components and props, reusing the `Command` component.
4. **Generated prop tables** from the TypeScript types instead of hand-written ones, so docs
   can't drift from the API.

## Toward 1.0

- Freeze the public API: audit every export in `packages/ui/src/index.ts` and mark anything
  experimental under a separate entry point.
- Write a 0.x → 1.0 migration guide (the Upgrading page has a placeholder).
- Publish the tokens as Figma variables from the existing DTCG output.
- ~~Set a bundle budget per component in `size-report.ts` and fail CI when it's exceeded.~~
  Done: each case has a gzip budget about 5% over its size, and the CI step fails when one is over.
