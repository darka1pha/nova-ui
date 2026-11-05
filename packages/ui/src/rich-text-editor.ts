/**
 * Rich text editing: `@darkalpha/nova-ui/rich-text-editor`.
 *
 * A separate entry so apps that don't edit rich text never load the editor
 * engine (Tiptap / ProseMirror). Styles ship in the main styles.css.
 */
export { RichTextEditor, RichTextViewer } from "./components/rich-text-editor.tsx";
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
