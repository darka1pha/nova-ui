---
"@darkalpha/nova-ui": minor
---

Rich text renders on the server:

- New `RichTextContentView` (from `@darkalpha/nova-ui/rich-text-editor`) renders editor JSON (`editor.getJSON()`) as plain elements with no Tiptap or ProseMirror code, so it works in server rendering and adds about 13 kB gzip instead of the editor engine. The markup matches the editor's, so the same styles apply. Link and image URLs, colors and alignments are checked, and unknown nodes keep only their text, so the JSON can come from users.
- `RichTextViewer` uses it automatically when `value` or `defaultValue` is JSON. HTML strings keep the previous behavior (parsed by the editor on the client). Store JSON to render rich text on the server.
- Task list checkboxes are named in the editor and the viewer through a new `taskItem` label ("Task: …", Persian "کار: …").
