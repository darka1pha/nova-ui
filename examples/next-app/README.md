# Nova UI Next.js example

A Next.js App Router app that uses Nova UI from local tarballs (no npm registry).
It shows the patterns most apps need:

- **Server Components render Nova UI directly.** `app/layout.tsx` and `app/page.tsx`
  have no `"use client"`: `ThemeProvider`, `Toaster`, `Card`, `Stat` and friends ship
  with their own `"use client"` boundary, so plain props are all they need.
- **No flash of the wrong mode.** `<ThemeScript storageKey>` in `<head>` applies the
  stored light/dark mode before hydration; `ThemeProvider` uses the same key.
- **Client islands for functions and state.** `app/board.tsx` (KanbanBoard) takes
  server data as props and owns the drag state.
- **Server Actions with native forms.** `app/booking-form.tsx` posts DateTimePicker,
  MultiSelect and SignaturePad values through their hidden inputs to `app/actions.ts`,
  and shows field errors with `FormField error`.

```bash
# from the repository root: build, pack and install into this app
node scripts/install-local.mjs examples/next-app

# then run it
cd examples/next-app
npm run dev
```

Re-run the installer after changing the library. In an app that installs Nova UI from
npm, the setup is the same minus the installer: `npm install @darkalpha/nova-ui`.
