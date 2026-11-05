---
"@darkalpha/nova-ui": minor
---

Add `RichTextEditor` and `RichTextViewer` in a new entry, `@darkalpha/nova-ui/rich-text-editor` (built on Tiptap/ProseMirror, so apps that don't import it never load the engine).

- Toolbar presets (`"full"`, `"basic"`, `"minimal"`), a custom item list or none: undo/redo, paragraph and heading styles, bold, italic, underline, strike, inline code, sub/superscript, text color, highlight, links, images, tables (size picker, then row/column/header/merge/split/delete actions), logical alignment, bulleted/numbered/check lists with indent, quotes, code blocks, dividers, per-block text direction, clear formatting and full screen.
- A bubble menu over selected text, a `/` command menu (replaceable), markdown shortcuts and `Mod+K` for links.
- Image upload through `onImageUpload` from the toolbar, the `/` menu, paste or drop; images resize from their corners.
- HTML or JSON in, HTML out (`""` for an empty document), controlled or uncontrolled, `maxLength` with word and character counts, `name` for native form posts, `disabled` / `readOnly`, and FormField wiring.
- `dir="auto"` gives each block the direction of its own text; English and Persian UI text built in, overridable through `labels`.
