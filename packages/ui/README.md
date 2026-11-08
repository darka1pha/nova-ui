# @darkalpha/nova-ui

Colorful, accessible, themeable React components.

```bash
pnpm add @darkalpha/nova-ui
```

```tsx
import { Button, ThemeProvider } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

<ThemeProvider theme="ocean" brand={{ primary: "#0f766e" }}>
  <Button>Get started</Button>
</ThemeProvider>;
```

## Entry points

| Import | Contents |
| --- | --- |
| `@darkalpha/nova-ui` | Components, `ThemeProvider`, `ThemeScript`, hooks, `cn`, and the token API (`createTheme`, `registerTheme`, `auditContrast`…) |
| `@darkalpha/nova-ui/styles.css` | Required once (unless you use `tailwind.css`). Tokens, a reset scoped to `.nv-theme`, and component styles. No global preflight. |
| `@darkalpha/nova-ui/themes.css` | Optional. All presets as `[data-nv-theme="…"]` blocks for zero-JS theming. |
| `@darkalpha/nova-ui/react-hook-form` | Optional bindings for react-hook-form (any resolver, e.g. zod). Requires `react-hook-form` ≥ 7.55; never loaded by the main entry. |
| `@darkalpha/nova-ui/rich-text-editor` | `RichTextEditor` and `RichTextViewer`, built on Tiptap/ProseMirror. Tiptap is an optional peer dependency: install it only if you use the editor (command below). Its styles are already in `styles.css`. |
| `@darkalpha/nova-ui/kaveh` | The Kaveh brand kit (logo family, brand elements, page sections, cards) and the Yalda/Nowruz seasonal artwork. Use with the `kaveh`, `kaveh-yalda` and `kaveh-nowruz` themes. |
| `@darkalpha/nova-ui/tailwind.css` | For Tailwind v4 apps, **instead of** `styles.css`: `@import "tailwindcss"; @import "@darkalpha/nova-ui/tailwind.css";` |

### Rich text editor

Tiptap is not installed with Nova UI. Apps that import `@darkalpha/nova-ui/rich-text-editor` add it themselves:

```bash
pnpm add @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit @tiptap/extensions @tiptap/suggestion @tiptap/extension-bubble-menu @tiptap/extension-highlight @tiptap/extension-image @tiptap/extension-list @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-table @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-typography
```

## Apps that use Tailwind CSS v4

Import `tailwind.css` from your CSS entry and drop the `styles.css` import:

```css
@import "tailwindcss";
@import "@darkalpha/nova-ui/tailwind.css";
```

It ships Nova UI as source (tokens, scoped base, materials, token utilities such
as `bg-primary`) plus an `@source` for the components, so your build generates
the component utilities together with yours. Loading the precompiled
`styles.css` as well gives you two separately sorted `utilities` layers: your
`.flex-col` can then follow the library's `sm:flex-row` and win at every width.
With a class prefix (`prefix(tw)`), use `styles.css` instead; prefixed
utilities can't collide with the components'.

## ThemeProvider

| Prop | Type | Default |
| --- | --- | --- |
| `theme` | preset name, registered id, or `ThemeDefinition` | `"vibrant"` |
| `brand` | `{ primary?, secondary?, accent?, neutral? }` (hex) | — |
| `overrides` | `{ light?: {...}, dark?: {...} }` semantic tokens | — |
| `mode` / `defaultMode` / `onModeChange` | `"light" \| "dark" \| "system"` | theme preference, else `"system"` |
| `storageKey` | persist the mode (pair with `<ThemeScript>`) | — |
| `radius` | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | from theme |
| `density` | `"compact" \| "comfortable" \| "spacious"` | from theme |
| `fonts` | `{ sans?, display?, mono? }` | from theme |
| `motion` | `"system" \| "reduce"` | `"system"` |
| `dir` | `"ltr" \| "rtl"` | inherited, else `"ltr"` |

Full documentation, the token reference and the theme playground are in `apps/docs`.

Peer dependencies: `react` and `react-dom` 18.2+ or 19.
