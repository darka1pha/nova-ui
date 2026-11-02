# Nova UI roadmap

Status as of 2026-11-02, after a full project check at `0.2.0`.

## Where things stand

| Check | Result |
| --- | --- |
| `pnpm build` / `typecheck` / `lint` | Clean |
| Unit tests (tokens + ui) | 351 passing |
| Playwright on Windows (a11y, keyboard, visual) | 129 passing |
| Docs at 375px and in RTL, all 25 routes | No horizontal overflow, no runtime warnings (after the fixes below) |

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

1. **Seed the Linux visual baselines.** Only `e2e/__screenshots__/win32` is committed, so the CI
   e2e job (Linux container) has nothing to compare against and fails on every visual test.
   Run the *Update visual baselines* workflow once on `main`, or `pnpm test:e2e:linux
   visual.spec.ts --update-snapshots=all` with Docker.
2. **Make toast swipe work for the centered positions.** `top-center` / `bottom-center` swipe
   up/down, but the toast only applies `--radix-toast-swipe-move-x`, so it doesn't follow the
   finger. Add the `y` translate for those positions and a Playwright test with a touch drag.
3. **Add a React 18 CI job.** The peer range includes 18.2+, but only 19 is tested. A matrix
   job that installs `react@18` / `react-dom@18` and runs `pnpm test` is enough.
4. **Repository name.** The packages point at `github.com/darka1pha/Kaleido`. Rename the GitHub
   repository to match Nova UI (GitHub redirects the old URL), then update `homepage`,
   `repository` and `bugs` in both `package.json` files.

## P1: catch this class of bug automatically

Every docs bug fixed above was visible in the browser but invisible to the test suite.

1. **Console guard in e2e.** A Playwright fixture that fails any test whose page logs
   `console.error` or a React warning. The `<p><div>` nesting would have failed CI.
2. **Route sweep at 375px and in RTL.** One spec that visits every entry in `nav`, in LTR and
   RTL at Pixel 7 width, and asserts `scrollWidth <= clientWidth`, a unique `document.title`
   and exactly one `h1`.
3. **Skip-link and 404 tests.** Assert the skip link keeps the route and moves focus to
   `<main>`, and that an unknown route shows "Page not found".
4. **Silence jsdom canvas noise.** Seven "getContext not implemented" lines in every unit run
   hide real warnings. Stub `HTMLCanvasElement.prototype.getContext` in `tests/setup.ts`.
5. **Manual screen-reader pass** (NVDA + Firefox, VoiceOver + Safari) with the checklist on the
   Accessibility page, recorded per component before 1.0.

## P2: components and API

1. **Toast API:** `toast.promise(promise, { loading, success, error })`, an `onDismiss`
   callback, and a configurable limit on `<Toaster max>` instead of the fixed five.
2. **Countdown:** an `as` prop (or `asChild`) for block layouts that want a `<div>`, and
   a `format` render prop for custom layouts like `02:15:09`.
3. **Carousel:** pausing on hover and on focus are tracked by one flag, so moving the pointer
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
- Set a bundle budget per component in `size-report.ts` and fail CI when it's exceeded.
