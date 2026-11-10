/**
 * Rich text editing: `@darkalpha/nova-ui/rich-text-editor`.
 *
 * A separate entry so apps that don't edit rich text never load the editor
 * engine (Tiptap / ProseMirror). Styles ship in the main styles.css.
 *
 * `RichTextContentView` renders stored editor JSON without the engine, so it works in
 * server-rendered pages; importing only it keeps Tiptap out of the bundle.
 */
export { RichTextEditor, RichTextViewer } from "./components/rich-text-editor.tsx";
export { RichTextContentView, type RichTextContentViewProps, type RichTextContentLabels } from "./components/rich-text-static.tsx";
export type {
  RichTextEditorProps,
  RichTextViewerProps,
  RichTextEditorLabels,
  RichTextToolbarItem,
  RichTextToolbarPreset,
  RichTextSlashCommand,
  RichTextEditorInstance,
  RichTextJSONContent,
  RichTextContent,
} from "./components/rich-text-editor.tsx";
