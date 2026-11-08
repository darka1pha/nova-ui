"use client";

import { Extension, type Content, type Editor, type Extensions, type JSONContent, type Range } from "@tiptap/core";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { CharacterCount, Placeholder, Selection } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { StarterKit } from "@tiptap/starter-kit";
import { Suggestion, type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import {
  Baseline,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Bold,
  Check,
  ChevronDown,
  Code,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  ListTodo,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Minus,
  PanelTopDashed,
  Pilcrow,
  PilcrowLeft,
  PilcrowRight,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  TableCellsMerge,
  TableCellsSplit,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  TextQuote,
  Trash,
  Underline,
  Undo2,
  Unlink,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Direction, Toolbar as ToolbarPrimitive } from "radix-ui";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { devWarn } from "../utils/dev.ts";
import { Button } from "./button.tsx";
import { toggleVariants } from "./button.tsx";
import { useFormField, useFormFieldContext } from "./field.tsx";
import { Input } from "./input.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./menu.tsx";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger, Tooltip, TooltipProvider } from "./overlay.tsx";
import { Portal } from "./portal.tsx";
import { floatingSurface, menuItem, transition } from "./shared.ts";

/* ------------------------------------------------------------------ Labels */

/** Every piece of UI text the editor shows. English and Persian are built in. */
export interface RichTextEditorLabels {
  toolbar: string;
  undo: string;
  redo: string;
  blockType: string;
  paragraph: string;
  heading: (level: number) => string;
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  code: string;
  subscript: string;
  superscript: string;
  textColor: string;
  highlight: string;
  defaultColor: string;
  noHighlight: string;
  link: string;
  linkUrl: string;
  linkApply: string;
  linkRemove: string;
  linkOpen: string;
  image: string;
  imageUrl: string;
  imageAlt: string;
  imageInsert: string;
  imageUpload: string;
  uploading: string;
  align: string;
  alignStart: string;
  alignCenter: string;
  alignEnd: string;
  alignJustify: string;
  bulletList: string;
  orderedList: string;
  taskList: string;
  indent: string;
  outdent: string;
  blockquote: string;
  codeBlock: string;
  horizontalRule: string;
  table: string;
  insertTable: (rows: number, cols: number) => string;
  addRowBefore: string;
  addRowAfter: string;
  addColumnBefore: string;
  addColumnAfter: string;
  deleteRow: string;
  deleteColumn: string;
  toggleHeaderRow: string;
  mergeCells: string;
  splitCell: string;
  deleteTable: string;
  direction: string;
  directionAuto: string;
  directionLtr: string;
  directionRtl: string;
  clearFormatting: string;
  fullscreen: string;
  exitFullscreen: string;
  words: (n: number) => string;
  characters: (n: number) => string;
  slashHint: string;
  slashEmpty: string;
  commands: string;
}

const enLabels: RichTextEditorLabels = {
  toolbar: "Formatting",
  undo: "Undo",
  redo: "Redo",
  blockType: "Text style",
  paragraph: "Paragraph",
  heading: (l) => `Heading ${l}`,
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  code: "Inline code",
  subscript: "Subscript",
  superscript: "Superscript",
  textColor: "Text color",
  highlight: "Highlight",
  defaultColor: "Default",
  noHighlight: "None",
  link: "Link",
  linkUrl: "URL",
  linkApply: "Apply",
  linkRemove: "Remove link",
  linkOpen: "Open link",
  image: "Image",
  imageUrl: "Image URL",
  imageAlt: "Alt text",
  imageInsert: "Insert",
  imageUpload: "Upload from device",
  uploading: "Uploading…",
  align: "Align",
  alignStart: "Align start",
  alignCenter: "Center",
  alignEnd: "Align end",
  alignJustify: "Justify",
  bulletList: "Bulleted list",
  orderedList: "Numbered list",
  taskList: "Checklist",
  indent: "Indent",
  outdent: "Outdent",
  blockquote: "Quote",
  codeBlock: "Code block",
  horizontalRule: "Divider",
  table: "Table",
  insertTable: (r, c) => `Insert ${r} × ${c} table`,
  addRowBefore: "Insert row above",
  addRowAfter: "Insert row below",
  addColumnBefore: "Insert column before",
  addColumnAfter: "Insert column after",
  deleteRow: "Delete row",
  deleteColumn: "Delete column",
  toggleHeaderRow: "Toggle header row",
  mergeCells: "Merge cells",
  splitCell: "Split cell",
  deleteTable: "Delete table",
  direction: "Text direction",
  directionAuto: "Auto",
  directionLtr: "Left to right",
  directionRtl: "Right to left",
  clearFormatting: "Clear formatting",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  words: (n) => `${n} ${n === 1 ? "word" : "words"}`,
  characters: (n) => `${n} ${n === 1 ? "character" : "characters"}`,
  slashHint: "Type / for commands",
  slashEmpty: "No matching blocks",
  commands: "Insert block",
};

const faLabels: RichTextEditorLabels = {
  toolbar: "قالب‌بندی",
  undo: "واگرد",
  redo: "ازنو",
  blockType: "سبک متن",
  paragraph: "پاراگراف",
  heading: (l) => `عنوان ${l.toLocaleString("fa")}`,
  bold: "پررنگ",
  italic: "مورب",
  underline: "زیرخط",
  strike: "خط‌خورده",
  code: "کد درون‌خطی",
  subscript: "زیرنویس",
  superscript: "بالانویس",
  textColor: "رنگ متن",
  highlight: "برجسته‌سازی",
  defaultColor: "پیش‌فرض",
  noHighlight: "هیچ",
  link: "پیوند",
  linkUrl: "نشانی",
  linkApply: "اعمال",
  linkRemove: "حذف پیوند",
  linkOpen: "باز کردن پیوند",
  image: "تصویر",
  imageUrl: "نشانی تصویر",
  imageAlt: "متن جایگزین",
  imageInsert: "درج",
  imageUpload: "بارگذاری از دستگاه",
  uploading: "در حال بارگذاری…",
  align: "تراز",
  alignStart: "تراز به آغاز",
  alignCenter: "وسط‌چین",
  alignEnd: "تراز به پایان",
  alignJustify: "هم‌تراز",
  bulletList: "فهرست نشانه‌دار",
  orderedList: "فهرست شماره‌دار",
  taskList: "فهرست کارها",
  indent: "افزایش تورفتگی",
  outdent: "کاهش تورفتگی",
  blockquote: "نقل‌قول",
  codeBlock: "بلوک کد",
  horizontalRule: "جداکننده",
  table: "جدول",
  insertTable: (r, c) => `درج جدول ${r.toLocaleString("fa")} × ${c.toLocaleString("fa")}`,
  addRowBefore: "درج ردیف در بالا",
  addRowAfter: "درج ردیف در پایین",
  addColumnBefore: "درج ستون پیش از این",
  addColumnAfter: "درج ستون پس از این",
  deleteRow: "حذف ردیف",
  deleteColumn: "حذف ستون",
  toggleHeaderRow: "ردیف سرستون",
  mergeCells: "ادغام خانه‌ها",
  splitCell: "تقسیم خانه",
  deleteTable: "حذف جدول",
  direction: "جهت متن",
  directionAuto: "خودکار",
  directionLtr: "چپ به راست",
  directionRtl: "راست به چپ",
  clearFormatting: "پاک کردن قالب‌بندی",
  fullscreen: "تمام‌صفحه",
  exitFullscreen: "خروج از تمام‌صفحه",
  words: (n) => `${n.toLocaleString("fa")} واژه`,
  characters: (n) => `${n.toLocaleString("fa")} نویسه`,
  slashHint: "برای فرمان‌ها / را بزنید",
  slashEmpty: "موردی یافت نشد",
  commands: "درج بلوک",
};

/* ----------------------------------------------------------------- Toolbar */

/** A toolbar control, or `"|"` for a separator. */
export type RichTextToolbarItem =
  | "undo"
  | "redo"
  | "blockType"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "subscript"
  | "superscript"
  | "textColor"
  | "highlight"
  | "link"
  | "image"
  | "table"
  | "align"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "outdent"
  | "indent"
  | "blockquote"
  | "codeBlock"
  | "horizontalRule"
  | "direction"
  | "clearFormatting"
  | "fullscreen"
  | "|";

export type RichTextToolbarPreset = "full" | "basic" | "minimal";

const toolbarPresets: Record<RichTextToolbarPreset, RichTextToolbarItem[]> = {
  full: [
    "undo", "redo", "|",
    "blockType", "|",
    "bold", "italic", "underline", "strike", "code", "|",
    "textColor", "highlight", "|",
    "link", "image", "table", "|",
    "align", "|",
    "bulletList", "orderedList", "taskList", "outdent", "indent", "|",
    "blockquote", "codeBlock", "horizontalRule", "|",
    "subscript", "superscript", "direction", "clearFormatting", "|",
    "fullscreen",
  ],
  basic: ["undo", "redo", "|", "blockType", "|", "bold", "italic", "underline", "|", "link", "|", "bulletList", "orderedList", "|", "blockquote"],
  minimal: ["bold", "italic", "|", "link", "|", "bulletList", "orderedList"],
};

/** Text colors: mid tones that read on light and dark surfaces. */
const textColors = [
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#d97706" },
  { name: "Green", value: "#16a34a" },
  { name: "Teal", value: "#0d9488" },
  { name: "Blue", value: "#2563eb" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Pink", value: "#db2777" },
];

/** Highlights: light tints. Highlighted text stays dark in both modes (see rich-text.css). */
const highlightColors = [
  { name: "Yellow", value: "#fde68a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Violet", value: "#ddd6fe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Gray", value: "#e5e7eb" },
];

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const mod = isMac ? "⌘" : "Ctrl+";
const shift = isMac ? "⇧" : "Shift+";

/** Adds https:// to bare domains; leaves relative, anchor, mailto: and tel: links alone. */
/** Schemes a link may use. Anything else (javascript:, data:, vbscript:…) is refused. */
const SAFE_LINK_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Turns what the user typed into a link href: bare domains get https://, bare
 * emails get mailto:. Returns "" for a scheme outside {@link SAFE_LINK_SCHEMES},
 * which removes the link instead of storing a script URL.
 */
export function normalizeUrl(raw: string): string {
  // Browsers ignore ASCII whitespace and control characters inside a scheme ("java\tscript:").
  // eslint-disable-next-line no-control-regex
  const url = raw.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (!url) return url;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(url)?.[1];
  if (scheme) return SAFE_LINK_SCHEMES.has(`${scheme.toLowerCase()}:`) ? url : "";
  if (/^[/#?]/.test(url)) return url;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) return `mailto:${url}`;
  return `https://${url}`;
}

/* ---------------------------------------------------------- Slash commands */

/** One entry in the "/" menu. */
export interface RichTextSlashCommand {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Extra words the filter matches. */
  keywords?: string[];
  run: (editor: Editor, range: Range) => void;
}

function defaultSlashCommands(l: RichTextEditorLabels, pickImage: (() => void) | null): RichTextSlashCommand[] {
  const cmds: RichTextSlashCommand[] = [
    { id: "paragraph", title: l.paragraph, icon: Pilcrow, keywords: ["text", "p"], run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
    { id: "h1", title: l.heading(1), icon: Heading1, keywords: ["h1", "title"], run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run() },
    { id: "h2", title: l.heading(2), icon: Heading2, keywords: ["h2", "subtitle"], run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run() },
    { id: "h3", title: l.heading(3), icon: Heading3, keywords: ["h3"], run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run() },
    { id: "bulletList", title: l.bulletList, icon: List, keywords: ["ul", "bullet", "unordered"], run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
    { id: "orderedList", title: l.orderedList, icon: ListOrdered, keywords: ["ol", "number", "ordered"], run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
    { id: "taskList", title: l.taskList, icon: ListTodo, keywords: ["todo", "task", "check"], run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
    { id: "blockquote", title: l.blockquote, icon: TextQuote, keywords: ["quote", "blockquote"], run: (e, r) => e.chain().focus().deleteRange(r).setBlockquote().run() },
    { id: "codeBlock", title: l.codeBlock, icon: SquareCode, keywords: ["code", "pre"], run: (e, r) => e.chain().focus().deleteRange(r).setCodeBlock().run() },
    { id: "table", title: l.table, icon: TableIcon, keywords: ["table", "grid"], run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { id: "divider", title: l.horizontalRule, icon: Minus, keywords: ["hr", "divider", "rule", "line"], run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
  ];
  if (pickImage) {
    cmds.push({
      id: "image",
      title: l.image,
      icon: ImageIcon,
      keywords: ["image", "picture", "photo", "upload"],
      run: (e, r) => {
        e.chain().focus().deleteRange(r).run();
        pickImage();
      },
    });
  }
  return cmds;
}

function filterCommands(cmds: RichTextSlashCommand[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return cmds;
  return cmds.filter((c) => [c.title, c.id, ...(c.keywords ?? [])].some((s) => s.toLowerCase().includes(q)));
}

interface SlashState {
  items: RichTextSlashCommand[];
  rect: DOMRect | null;
  selected: number;
  command: (item: RichTextSlashCommand) => void;
}

/* -------------------------------------------------------------------- Props */

export interface RichTextEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "dir" | "autoFocus" | "onFocus" | "onBlur"> {
  /** Controlled content: HTML string or Tiptap JSON. */
  value?: Content;
  /** Initial content when uncontrolled. */
  defaultValue?: Content;
  /** Called on every change with the HTML (an empty document gives ""). Use `editor.getJSON()` for JSON. */
  onChange?: (html: string, editor: Editor) => void;
  placeholder?: string;
  /** A preset, a list of items (`"|"` separates groups) or `false` for no toolbar. */
  toolbar?: RichTextToolbarPreset | RichTextToolbarItem[] | false;
  /** Keeps the toolbar visible while the page scrolls. */
  stickyToolbar?: boolean;
  /** A floating formatting bar over selected text. Default true. */
  bubbleMenu?: boolean;
  /** Type "/" to insert blocks. `true` (default) uses the built-in commands; pass your own list to replace them. */
  slashCommands?: boolean | RichTextSlashCommand[];
  /** Word and character counts under the content. Default true when editable. */
  showCount?: boolean;
  /** Maximum characters; typing and pasting stop at the limit. */
  maxLength?: number;
  /** CSS length for the content area. Default "10rem". */
  minHeight?: string | number;
  /** CSS length; the content scrolls beyond it. */
  maxHeight?: string | number;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean | "start" | "end";
  /** Writing direction for the whole document. "auto" sets each block's direction from its text. */
  dir?: "ltr" | "rtl" | "auto";
  /**
   * Uploads an image and resolves to its URL. When set, the image menu gets an
   * upload button and images can be pasted or dropped into the editor.
   */
  onImageUpload?: (file: File) => Promise<string>;
  onImageUploadError?: (error: unknown, file: File) => void;
  /** Submits the HTML with native forms under this name. */
  name?: string;
  /** UI text. Defaults to English, or Persian when the locale is `fa`. */
  labels?: Partial<RichTextEditorLabels>;
  locale?: string;
  /** More Tiptap extensions. Read once when the editor is created. */
  extensions?: Extensions;
  /** Receives the Tiptap editor instance once created. */
  editorRef?: Ref<Editor | null>;
  /** Classes for the scrollable content area. */
  contentClassName?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  required?: boolean;
  id?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const cssLength = (v: string | number | undefined) => (typeof v === "number" ? `${v}px` : v);

function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T }).current = value;
}

/* --------------------------------------------------------------- Component */

/**
 * A full-featured rich text editor built on Tiptap (ProseMirror): headings,
 * marks, colors, links, images, tables, checklists, alignment, per-block text
 * direction, a "/" command menu, a selection bubble menu, counts and full screen.
 * Wires itself to a surrounding FormField.
 */
export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(function RichTextEditor(props, ref) {
  const fieldProps = useFormField({
    id: props.id,
    "aria-describedby": props["aria-describedby"],
    "aria-invalid": props["aria-invalid"],
    required: props.required,
    disabled: props.disabled,
  }) as { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean | string; required?: boolean; disabled?: boolean; "data-status"?: string };
  const field = useFormFieldContext();
  const {
    value,
    defaultValue,
    onChange,
    placeholder,
    toolbar = "full",
    stickyToolbar,
    bubbleMenu = true,
    slashCommands = true,
    showCount,
    maxLength,
    minHeight = "10rem",
    maxHeight,
    readOnly,
    autoFocus,
    dir,
    onImageUpload,
    onImageUploadError,
    name,
    labels: labelOverrides,
    locale: localeProp,
    extensions: extraExtensions,
    editorRef,
    contentClassName,
    className,
    style,
    onFocus,
    onBlur,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    id: _id,
    "aria-describedby": _describedBy,
    "aria-invalid": _invalid,
    required: _required,
    disabled: _disabled,
    ...rest
  } = props;
  const disabled = !!fieldProps.disabled;
  const editable = !disabled && !readOnly;
  const invalid = fieldProps["aria-invalid"] === true || fieldProps["aria-invalid"] === "true";

  const { locale } = useLocale(localeProp);
  const labels = useMemo<RichTextEditorLabels>(
    () => ({ ...(locale?.toLowerCase().startsWith("fa") ? faLabels : enLabels), ...labelOverrides }),
    [locale, labelOverrides],
  );

  const autoId = useId();
  const editorId = fieldProps.id ?? `nv-rte-${autoId.replace(/:/g, "")}`;
  const contextDir = Direction.useDirection();

  const [fullscreen, setFullscreen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkAnchor, setLinkAnchor] = useState<CSSProperties>({});
  const [uploading, setUploading] = useState(0);
  const [html, setHtml] = useState("");
  const [slash, setSlashState] = useState<SlashState | null>(null);
  const slashRef = useRef<SlashState | null>(null);
  const setSlash = useCallback((next: SlashState | null) => {
    slashRef.current = next;
    setSlashState(next);
  }, []);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Latest values for callbacks that the editor captured at creation.
  const latest = useRef({ onChange, onImageUpload, onImageUploadError, placeholder, labels, onFocus, onBlur, name });
  latest.current = { onChange, onImageUpload, onImageUploadError, placeholder, labels, onFocus, onBlur, name };
  const openLinkRef = useRef<() => void>(() => {});
  const editorInstance = useRef<Editor | null>(null);

  const uploadFiles = useCallback(async (files: File[], pos?: number) => {
    const upload = latest.current.onImageUpload;
    const editor = editorInstance.current;
    if (!upload || !editor) return;
    for (const file of files.filter((f) => f.type.startsWith("image/"))) {
      setUploading((n) => n + 1);
      try {
        const src = await upload(file);
        if (editor.isDestroyed) return;
        const chain = editor.chain().focus();
        if (pos !== undefined) chain.insertContentAt(pos, { type: "image", attrs: { src, alt: file.name.replace(/\.[^.]+$/, "") } });
        else chain.setImage({ src, alt: file.name.replace(/\.[^.]+$/, "") });
        chain.run();
      } catch (error) {
        if (latest.current.onImageUploadError) latest.current.onImageUploadError(error, file);
        else devWarn(`RichTextEditor: image upload failed (${String(error)}). Pass onImageUploadError to handle it.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }, []);

  const pickImage = useCallback(() => fileInputRef.current?.click(), []);
  const hasUpload = !!onImageUpload;

  const slashEnabled = slashCommands !== false;
  const slashItemsRef = useRef<RichTextSlashCommand[]>([]);
  slashItemsRef.current = Array.isArray(slashCommands) ? slashCommands : defaultSlashCommands(labels, hasUpload ? pickImage : null);

  const extensions = useMemo<Extensions>(() => {
    const list: Extensions = [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
        undoRedo: { depth: 200 },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["start", "center", "end", "justify"] }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: true, allowTableNodeSelection: true } }),
      Image.configure({ allowBase64: true, resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 48, minHeight: 48 } }),
      Typography,
      Selection,
      Placeholder.configure({
        includeChildren: false,
        placeholder: ({ editor, node }) => {
          if (editor.isEmpty) return latest.current.placeholder ?? "";
          if (node.type.name === "heading") return latest.current.labels.heading(node.attrs.level as number);
          if (node.type.name === "paragraph" && slashEnabled) return latest.current.labels.slashHint;
          return "";
        },
      }),
      CharacterCount.configure({ limit: maxLength ?? null }),
      // Per-block direction. Core's textDirection option writes `dir` onto every node; this keeps
      // the attribute optional, so only blocks set from the direction menu (or all of them with
      // dir="auto") carry one.
      Extension.create({
        name: "nvTextDirection",
        addGlobalAttributes() {
          // dir="auto" goes on text blocks only. A browser resolves `auto` from text that isn't
          // inside an element with its own dir, so on a list or quote wrapping auto paragraphs it
          // would find nothing and fall back to ltr. Wrappers inherit unless set from the menu.
          const textBlocks = ["paragraph", "heading"];
          const attribute = (fallback: string | null) => ({
            dir: {
              default: fallback,
              parseHTML: (el: HTMLElement) => {
                const d = el.getAttribute("dir");
                return d === "ltr" || d === "rtl" || d === "auto" ? d : fallback;
              },
              renderHTML: (attrs: Record<string, unknown>) => (attrs.dir ? { dir: attrs.dir } : {}),
            },
          });
          const nodes = this.extensions.filter((e) => e.type === "node" && e.name !== "text" && e.name !== "doc").map((e) => e.name);
          return [
            { types: nodes.filter((n) => textBlocks.includes(n)), attributes: attribute(dir === "auto" ? "auto" : null) },
            { types: nodes.filter((n) => !textBlocks.includes(n)), attributes: attribute(null) },
          ];
        },
      }),
      Extension.create({
        name: "nvRichTextKeymap",
        addKeyboardShortcuts() {
          return {
            "Mod-k": () => {
              openLinkRef.current();
              return true;
            },
          };
        },
      }),
    ];
    if (slashEnabled) {
      list.push(
        Extension.create({
          name: "nvSlashCommand",
          addProseMirrorPlugins() {
            return [
              Suggestion<RichTextSlashCommand, RichTextSlashCommand>({
                editor: this.editor,
                char: "/",
                allow: ({ state }) => !state.selection.$from.parent.type.spec.code,
                items: ({ query }) => filterCommands(slashItemsRef.current, query).slice(0, 12),
                command: ({ editor, range, props: item }) => item.run(editor, range),
                render: () => {
                  const open = (p: SuggestionProps<RichTextSlashCommand, RichTextSlashCommand>) => {
                    const prev = slashRef.current;
                    const keep = prev && prev.items.length === p.items.length ? Math.min(prev.selected, p.items.length - 1) : 0;
                    setSlash({ items: p.items, rect: p.clientRect?.() ?? null, selected: Math.max(0, keep), command: p.command });
                  };
                  return {
                    onStart: open,
                    onUpdate: open,
                    onExit: () => setSlash(null),
                    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
                      const s = slashRef.current;
                      if (!s) return false;
                      if (event.key === "Escape") {
                        setSlash(null);
                        return true;
                      }
                      if (!s.items.length) return false;
                      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        const step = event.key === "ArrowDown" ? 1 : -1;
                        setSlash({ ...s, selected: (s.selected + step + s.items.length) % s.items.length });
                        return true;
                      }
                      if (event.key === "Enter" || event.key === "Tab") {
                        const item = s.items[s.selected];
                        if (item) s.command(item);
                        return true;
                      }
                      return false;
                    },
                  };
                },
              }),
            ];
          },
        }),
      );
    }
    if (extraExtensions) list.push(...extraExtensions);
    return list;
    // Extensions are fixed for the editor's lifetime; only options that change the schema or plugins recreate it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLength, slashEnabled, dir]);

  const editor = useEditor(
    {
      extensions,
      content: value ?? defaultValue ?? "",
      editable,
      autofocus: autoFocus === true ? "end" : autoFocus || false,
      immediatelyRender: false,
      editorProps: {
        handlePaste: (_view, event) => {
          const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
          if (!files.length || !latest.current.onImageUpload) return false;
          void uploadFiles(files);
          return true;
        },
        handleDrop: (view, event, _slice, moved) => {
          if (moved) return false;
          const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
          if (!files.length || !latest.current.onImageUpload) return false;
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
          void uploadFiles(files, pos);
          return true;
        },
      },
      onCreate: ({ editor }) => {
        if (latest.current.name) setHtml(editor.isEmpty ? "" : editor.getHTML());
      },
      onUpdate: ({ editor }) => {
        const out = editor.isEmpty ? "" : editor.getHTML();
        if (latest.current.name) setHtml(out);
        latest.current.onChange?.(out, editor);
      },
      onFocus: () => latest.current.onFocus?.(),
      onBlur: () => latest.current.onBlur?.(),
    },
    [extensions],
  );

  useEffect(() => {
    editorInstance.current = editor;
    setRef(editorRef, editor);
    return () => setRef(editorRef, null);
  }, [editor, editorRef]);

  // Controlled value: replace the content only when it differs, without emitting an update.
  useEffect(() => {
    if (!editor || editor.isDestroyed || value === undefined) return;
    if (typeof value === "string") {
      const current = editor.isEmpty ? "" : editor.getHTML();
      if (value === current || (value === "" && editor.isEmpty)) return;
    } else if (JSON.stringify(value) === JSON.stringify(editor.getJSON())) return;
    editor.commands.setContent(value, { emitUpdate: false });
    if (latest.current.name) setHtml(editor.isEmpty ? "" : editor.getHTML());
  }, [editor, value]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable !== editable) editor.setEditable(editable, false);
  }, [editor, editable]);

  // Accessible name, description and state on the editable element itself.
  const describedBy = fieldProps["aria-describedby"];
  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const attrs: Record<string, string> = {
      id: editorId,
      role: "textbox",
      "aria-multiline": "true",
      class: "ProseMirror",
    };
    if (ariaLabel) attrs["aria-label"] = ariaLabel;
    if (labelledBy) attrs["aria-labelledby"] = labelledBy;
    if (describedBy) attrs["aria-describedby"] = describedBy;
    if (invalid) attrs["aria-invalid"] = "true";
    if (fieldProps.required) attrs["aria-required"] = "true";
    if (readOnly) attrs["aria-readonly"] = "true";
    if (disabled) attrs["aria-disabled"] = "true";
    if (slash) attrs["aria-controls"] = `${editorId}-commands`;
    if (slash?.items[slash.selected]) attrs["aria-activedescendant"] = `${editorId}-cmd-${slash.items[slash.selected]?.id ?? ""}`;
    editor.setOptions({ editorProps: { ...editor.options.editorProps, attributes: attrs } });
  }, [editor, editorId, ariaLabel, labelledBy, describedBy, invalid, fieldProps.required, readOnly, disabled, slash]);

  const openLinkEditor = useCallback(() => {
    const ed = editorInstance.current;
    const root = rootRef.current;
    if (!ed || !root || !ed.isEditable) return;
    const { from, to } = ed.state.selection;
    try {
      const start = ed.view.coordsAtPos(from);
      const end = ed.view.coordsAtPos(to);
      const box = root.getBoundingClientRect();
      setLinkAnchor({ left: Math.min(start.left, end.left) - box.left, top: start.top - box.top, width: Math.max(1, Math.abs(end.right - start.left)), height: end.bottom - start.top });
    } catch {
      setLinkAnchor({ left: 16, top: 16, width: 1, height: 1 });
    }
    setLinkOpen(true);
  }, []);
  openLinkRef.current = openLinkEditor;

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const items = toolbar === false ? [] : Array.isArray(toolbar) ? toolbar : toolbarPresets[toolbar];
  const showToolbar = toolbar !== false && !readOnly && items.length > 0;
  const counting = showCount ?? (editable || maxLength !== undefined);

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        setRef(ref, node);
      }}
      data-slot="rich-text-editor"
      data-status={fieldProps["data-status"]}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-fullscreen={fullscreen || undefined}
      className={cn(
        `nv-field relative flex min-w-0 flex-col rounded-(--nv-input-radius) border border-input bg-surface text-foreground shadow-xs ${transition}`,
        editable && "hover:border-foreground-muted focus-within:border-focus-ring focus-within:ring-3 focus-within:ring-focus-ring/25",
        "data-[invalid]:border-danger-text data-[invalid]:focus-within:ring-danger-text/25",
        "data-[status=warning]:border-warning-text data-[status=valid]:border-success-text",
        "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-sunken data-[disabled]:opacity-60",
        "data-[fullscreen]:fixed data-[fullscreen]:inset-0 data-[fullscreen]:z-(--nv-z-modal) data-[fullscreen]:rounded-none data-[fullscreen]:border-0 data-[fullscreen]:ring-0",
        className,
      )}
      style={style}
      onKeyDown={(e) => {
        if (e.key === "Escape" && fullscreen && !e.defaultPrevented && !slashRef.current) {
          setFullscreen(false);
          editor?.commands.focus();
        }
      }}
      {...rest}
    >
      {showToolbar && (
        <RichTextToolbar
          editor={editor}
          items={items}
          labels={labels}
          controls={editorId}
          disabled={disabled}
          sticky={stickyToolbar && !fullscreen}
          fullscreen={fullscreen}
          onToggleFullscreen={() => {
            setFullscreen((f) => !f);
            requestAnimationFrame(() => editorInstance.current?.commands.focus());
          }}
          onOpenLink={openLinkEditor}
          onPickImage={hasUpload ? pickImage : undefined}
          uploading={uploading > 0}
        />
      )}

      <div
        className={cn("nv-rte-content min-h-0 flex-1 overflow-y-auto px-4 py-3", disabled && "pointer-events-none", contentClassName)}
        data-editable={editable}
        style={{ minHeight: cssLength(minHeight), maxHeight: fullscreen ? undefined : cssLength(maxHeight) }}
        dir={dir && dir !== "auto" ? dir : undefined}
        onMouseDown={(e) => {
          // Clicking the padding below the last line focuses the end of the document.
          if (editor && e.target === e.currentTarget) {
            e.preventDefault();
            editor.commands.focus("end");
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {(counting || uploading > 0) && editor && <RichTextFooter editor={editor} labels={labels} maxLength={maxLength} uploading={uploading > 0} showCount={counting} />}

      {editor && bubbleMenu && editable && (
        <BubbleMenu
          editor={editor}
          pluginKey="nvBubbleMenu"
          options={{ placement: "top", offset: 8 }}
          shouldShow={({ editor: ed, view, state, from, to }) => {
            if (ed.isDestroyed || !ed.isEditable || from === to || linkOpen) return false;
            const sel = state.selection as { node?: unknown };
            if (sel.node) return false;
            if (ed.isActive("codeBlock")) return false;
            return view.hasFocus();
          }}
          className={cn(floatingSurface, "flex items-center gap-0.5 p-1 data-[state=open]:animate-none")}
        >
          <BubbleMenuButtons editor={editor} labels={labels} onOpenLink={openLinkEditor} />
        </BubbleMenu>
      )}

      {editor && (
        <LinkEditor
          editor={editor}
          labels={labels}
          open={linkOpen}
          onOpenChange={(open) => {
            setLinkOpen(open);
            if (!open) requestAnimationFrame(() => editorInstance.current?.commands.focus());
          }}
          anchorStyle={linkAnchor}
        />
      )}

      {slash && editor && <SlashMenu state={slash} labels={labels} idPrefix={editorId} dir={dir === "rtl" || dir === "ltr" ? dir : contextDir} onHover={(i) => setSlash({ ...slash, selected: i })} />}

      {hasUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          tabIndex={-1}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void uploadFiles(files);
          }}
        />
      )}
      {name && <input type="hidden" name={name} value={html} disabled={disabled} />}
    </div>
  );
});

/* ------------------------------------------------------------- Toolbar UI */

const toolButton = cn(toggleVariants({ variant: "ghost", size: "sm" }), "h-8 min-w-8 px-1.5 [&_svg]:size-4");

interface ToolButtonProps {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Rendered as a toggle (aria-pressed). */
  toggle?: boolean;
  children?: ReactNode;
}

const ToolButton = forwardRef<HTMLButtonElement, ToolButtonProps & HTMLAttributes<HTMLButtonElement>>(function ToolButton(
  { label, shortcut, icon: Icon, active, disabled, onClick, toggle, children, className, ...props },
  ref,
) {
  return (
    <Tooltip content={shortcut ? `${label} (${shortcut})` : label}>
      <ToolbarPrimitive.Button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={toggle ? !!active : undefined}
        data-state={active ? "on" : "off"}
        disabled={disabled}
        className={cn(toolButton, className)}
        // Keep the editor's selection while clicking.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        {...props}
      >
        <Icon aria-hidden />
        {children}
      </ToolbarPrimitive.Button>
    </Tooltip>
  );
});

function useToolbarState(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const heading = [1, 2, 3, 4].find((level) => e.isActive("heading", { level }));
      const align = (["center", "end", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "start";
      const { $from } = e.state.selection;
      let blockDir: string | null = null;
      for (let d = $from.depth; d > 0; d--) {
        const attr = $from.node(d).attrs.dir as string | undefined;
        if (attr) {
          blockDir = attr;
          break;
        }
      }
      return {
        editable: e.isEditable,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        heading: heading ?? 0,
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        subscript: e.isActive("subscript"),
        superscript: e.isActive("superscript"),
        link: e.isActive("link"),
        color: (e.getAttributes("textStyle").color as string | undefined) ?? null,
        highlight: e.isActive("highlight") ? ((e.getAttributes("highlight").color as string | undefined) ?? "#fde68a") : null,
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        taskList: e.isActive("taskList"),
        canSink: e.can().sinkListItem("listItem") || e.can().sinkListItem("taskItem"),
        canLift: e.can().liftListItem("listItem") || e.can().liftListItem("taskItem"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        inCode: e.isActive("codeBlock"),
        table: e.isActive("table"),
        canMerge: e.can().mergeCells(),
        canSplit: e.can().splitCell(),
        align,
        dir: blockDir,
      };
    },
  });
}

interface RichTextToolbarProps {
  editor: Editor | null;
  items: RichTextToolbarItem[];
  labels: RichTextEditorLabels;
  controls: string;
  disabled: boolean;
  sticky?: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenLink: () => void;
  onPickImage?: () => void;
  uploading: boolean;
}

function RichTextToolbar({ editor, items, labels: l, controls, disabled, sticky, fullscreen, onToggleFullscreen, onOpenLink, onPickImage, uploading }: RichTextToolbarProps) {
  const s = useToolbarState(editor);
  const off = disabled || !editor || !s;
  const chain = () => (editor as Editor).chain().focus();
  const inCode = !!s?.inCode;

  const render = (item: RichTextToolbarItem, i: number): ReactNode => {
    const key = `${item}-${i}`;
    switch (item) {
      case "|":
        return <ToolbarPrimitive.Separator key={key} className="mx-1 h-5 w-px shrink-0 bg-border" />;
      case "undo":
        return <ToolButton key={key} label={l.undo} shortcut={`${mod}Z`} icon={Undo2} disabled={off || !s.canUndo} onClick={() => chain().undo().run()} />;
      case "redo":
        return <ToolButton key={key} label={l.redo} shortcut={isMac ? `${shift}${mod}Z` : `${mod}Y`} icon={Redo2} disabled={off || !s.canRedo} onClick={() => chain().redo().run()} />;
      case "bold":
        return <ToolButton key={key} toggle label={l.bold} shortcut={`${mod}B`} icon={Bold} active={s?.bold} disabled={off || inCode} onClick={() => chain().toggleBold().run()} />;
      case "italic":
        return <ToolButton key={key} toggle label={l.italic} shortcut={`${mod}I`} icon={Italic} active={s?.italic} disabled={off || inCode} onClick={() => chain().toggleItalic().run()} />;
      case "underline":
        return <ToolButton key={key} toggle label={l.underline} shortcut={`${mod}U`} icon={Underline} active={s?.underline} disabled={off || inCode} onClick={() => chain().toggleUnderline().run()} />;
      case "strike":
        return <ToolButton key={key} toggle label={l.strike} shortcut={`${mod}${shift}S`} icon={Strikethrough} active={s?.strike} disabled={off || inCode} onClick={() => chain().toggleStrike().run()} />;
      case "code":
        return <ToolButton key={key} toggle label={l.code} shortcut={`${mod}E`} icon={Code} active={s?.code} disabled={off || inCode} onClick={() => chain().toggleCode().run()} />;
      case "subscript":
        return <ToolButton key={key} toggle label={l.subscript} shortcut={`${mod},`} icon={SubscriptIcon} active={s?.subscript} disabled={off || inCode} onClick={() => chain().toggleSubscript().run()} />;
      case "superscript":
        return <ToolButton key={key} toggle label={l.superscript} shortcut={`${mod}.`} icon={SuperscriptIcon} active={s?.superscript} disabled={off || inCode} onClick={() => chain().toggleSuperscript().run()} />;
      case "bulletList":
        return <ToolButton key={key} toggle label={l.bulletList} shortcut={`${mod}${shift}8`} icon={List} active={s?.bulletList} disabled={off} onClick={() => chain().toggleBulletList().run()} />;
      case "orderedList":
        return <ToolButton key={key} toggle label={l.orderedList} shortcut={`${mod}${shift}7`} icon={ListOrdered} active={s?.orderedList} disabled={off} onClick={() => chain().toggleOrderedList().run()} />;
      case "taskList":
        return <ToolButton key={key} toggle label={l.taskList} shortcut={`${mod}${shift}9`} icon={ListTodo} active={s?.taskList} disabled={off} onClick={() => chain().toggleTaskList().run()} />;
      case "indent":
        return (
          <ToolButton
            key={key}
            label={l.indent}
            shortcut="Tab"
            icon={ListIndentIncrease}
            disabled={off || !s.canSink}
            onClick={() => (editor?.can().sinkListItem("taskItem") ? chain().sinkListItem("taskItem") : chain().sinkListItem("listItem")).run()}
          />
        );
      case "outdent":
        return (
          <ToolButton
            key={key}
            label={l.outdent}
            shortcut={`${shift}Tab`}
            icon={ListIndentDecrease}
            disabled={off || !s.canLift}
            onClick={() => (editor?.can().liftListItem("taskItem") ? chain().liftListItem("taskItem") : chain().liftListItem("listItem")).run()}
          />
        );
      case "blockquote":
        return <ToolButton key={key} toggle label={l.blockquote} shortcut={`${mod}${shift}B`} icon={TextQuote} active={s?.blockquote} disabled={off} onClick={() => chain().toggleBlockquote().run()} />;
      case "codeBlock":
        return <ToolButton key={key} toggle label={l.codeBlock} shortcut={`${mod}${isMac ? "⌥" : "Alt+"}C`} icon={SquareCode} active={s?.codeBlock} disabled={off} onClick={() => chain().toggleCodeBlock().run()} />;
      case "horizontalRule":
        return <ToolButton key={key} label={l.horizontalRule} icon={Minus} disabled={off} onClick={() => chain().setHorizontalRule().run()} />;
      case "clearFormatting":
        return <ToolButton key={key} label={l.clearFormatting} icon={RemoveFormatting} disabled={off} onClick={() => chain().unsetAllMarks().clearNodes().run()} />;
      case "link":
        return <ToolButton key={key} toggle label={l.link} shortcut={`${mod}K`} icon={LinkIcon} active={s?.link} disabled={off || inCode} onClick={onOpenLink} />;
      case "fullscreen":
        return (
          <ToolButton
            key={key}
            toggle
            label={fullscreen ? l.exitFullscreen : l.fullscreen}
            shortcut={fullscreen ? "Esc" : undefined}
            icon={fullscreen ? Minimize2 : Maximize2}
            active={fullscreen}
            disabled={!editor}
            onClick={onToggleFullscreen}
          />
        );
      case "blockType":
        return <BlockTypeMenu key={key} editor={editor} heading={s?.heading ?? 0} disabled={off || inCode} labels={l} />;
      case "align":
        return <AlignMenu key={key} editor={editor} align={s?.align ?? "start"} disabled={off} labels={l} />;
      case "direction":
        return <DirectionMenu key={key} editor={editor} dir={s?.dir ?? null} disabled={off} labels={l} />;
      case "textColor":
        return (
          <ColorPopover
            key={key}
            label={l.textColor}
            icon={Baseline}
            colors={textColors}
            current={s?.color ?? null}
            resetLabel={l.defaultColor}
            disabled={off || inCode}
            onPick={(c) => (c ? chain().setColor(c).run() : chain().unsetColor().run())}
          />
        );
      case "highlight":
        return (
          <ColorPopover
            key={key}
            label={l.highlight}
            shortcut={`${mod}${shift}H`}
            icon={Highlighter}
            colors={highlightColors}
            current={s?.highlight ?? null}
            resetLabel={l.noHighlight}
            disabled={off || inCode}
            swatch="fill"
            onPick={(c) => (c ? chain().setHighlight({ color: c }).run() : chain().unsetHighlight().run())}
          />
        );
      case "image":
        return <ImagePopover key={key} editor={editor} labels={l} disabled={off || inCode} onPickImage={onPickImage} uploading={uploading} />;
      case "table":
        return s?.table ? (
          <TableMenu key={key} editor={editor as Editor} labels={l} disabled={off} canMerge={s.canMerge} canSplit={s.canSplit} />
        ) : (
          <TablePicker key={key} editor={editor} labels={l} disabled={off || inCode} />
        );
      default:
        return null;
    }
  };

  return (
    // One provider: moving along the toolbar opens each tooltip without the delay again.
    <TooltipProvider delayDuration={300}>
      <ToolbarPrimitive.Root
        aria-label={l.toolbar}
        aria-controls={controls}
        className={cn(
          "flex flex-wrap items-center gap-0.5 rounded-t-[inherit] border-b border-border bg-surface px-1.5 py-1",
          sticky && "sticky top-0 z-(--nv-z-raised)",
        )}
      >
        {items.map(render)}
      </ToolbarPrimitive.Root>
    </TooltipProvider>
  );
}

/** A toolbar button that opens a menu or popover: icon, optional text and a chevron. */
const MenuToolButton = forwardRef<HTMLButtonElement, { label: string; icon?: LucideIcon; text?: ReactNode; disabled?: boolean; active?: boolean; shortcut?: string; iconStyle?: CSSProperties } & HTMLAttributes<HTMLButtonElement>>(
  function MenuToolButton({ label, icon: Icon, text, disabled, active, shortcut, iconStyle, className, ...props }, ref) {
    return (
      <ToolbarPrimitive.Button
        ref={ref}
        type="button"
        aria-label={label}
        title={undefined}
        disabled={disabled}
        data-state={active ? "on" : "off"}
        className={cn(toolButton, "gap-0.5 pe-1", className)}
        {...props}
        // Radix sets data-state="open" on menu triggers; keep pressed styling from `active`.
        data-active={active || undefined}
      >
        {Icon && <Icon aria-hidden style={iconStyle} />}
        {text}
        <ChevronDown aria-hidden className="size-3! opacity-60" />
        {shortcut && <span className="sr-only">{shortcut}</span>}
      </ToolbarPrimitive.Button>
    );
  },
);

function BlockTypeMenu({ editor, heading, disabled, labels: l }: { editor: Editor | null; heading: number; disabled: boolean; labels: RichTextEditorLabels }) {
  const paragraph = { level: 0, label: l.paragraph, icon: Pilcrow, cls: "text-sm" };
  const options = [
    paragraph,
    { level: 1, label: l.heading(1), icon: Heading1, cls: "text-xl font-bold" },
    { level: 2, label: l.heading(2), icon: Heading2, cls: "text-lg font-bold" },
    { level: 3, label: l.heading(3), icon: Heading3, cls: "text-md font-semibold" },
    { level: 4, label: l.heading(4), icon: Heading4, cls: "text-sm font-semibold" },
  ];
  const current = options.find((o) => o.level === heading) ?? paragraph;
  return (
    <DropdownMenu modal={false}>
      <Tooltip content={l.blockType}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <MenuToolButton label={`${l.blockType}: ${current.label}`} text={<span className="w-[5.5rem] truncate text-start text-sm">{current.label}</span>} disabled={disabled} className="px-2" />
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start" className="min-w-48" onCloseAutoFocus={(e) => (e.preventDefault(), editor?.commands.focus())}>
        {options.map((o) => (
          <DropdownMenuItem
            key={o.level}
            onSelect={() => {
              if (!editor) return;
              const c = editor.chain().focus();
              (o.level === 0 ? c.setParagraph() : c.setHeading({ level: o.level as 1 | 2 | 3 | 4 })).run();
            }}
          >
            <o.icon aria-hidden />
            <span className={cn("flex-1", o.cls)}>{o.label}</span>
            {o.level === heading && <Check aria-hidden className="text-primary-text" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AlignMenu({ editor, align, disabled, labels: l }: { editor: Editor | null; align: string; disabled: boolean; labels: RichTextEditorLabels }) {
  const start = { value: "start", label: l.alignStart, icon: TextAlignStart, shortcut: `${mod}${shift}L` };
  const options = [
    start,
    { value: "center", label: l.alignCenter, icon: TextAlignCenter, shortcut: `${mod}${shift}E` },
    { value: "end", label: l.alignEnd, icon: TextAlignEnd, shortcut: `${mod}${shift}R` },
    { value: "justify", label: l.alignJustify, icon: TextAlignJustify, shortcut: `${mod}${shift}J` },
  ];
  const current = options.find((o) => o.value === align) ?? start;
  return (
    <DropdownMenu modal={false}>
      <Tooltip content={l.align}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <MenuToolButton label={`${l.align}: ${current.label}`} icon={current.icon} disabled={disabled} />
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start" onCloseAutoFocus={(e) => (e.preventDefault(), editor?.commands.focus())}>
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => editor?.chain().focus().setTextAlign(o.value).run()}>
            <o.icon aria-hidden />
            <span className="flex-1">{o.label}</span>
            {o.value === align && <Check aria-hidden className="text-primary-text" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DirectionMenu({ editor, dir, disabled, labels: l }: { editor: Editor | null; dir: string | null; disabled: boolean; labels: RichTextEditorLabels }) {
  const options = [
    { value: "auto" as const, label: l.directionAuto, icon: Pilcrow },
    { value: "ltr" as const, label: l.directionLtr, icon: PilcrowRight },
    { value: "rtl" as const, label: l.directionRtl, icon: PilcrowLeft },
  ];
  const current = options.find((o) => o.value === dir);
  return (
    <DropdownMenu modal={false}>
      <Tooltip content={l.direction}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <MenuToolButton label={`${l.direction}${current ? `: ${current.label}` : ""}`} icon={current?.icon ?? PilcrowRight} disabled={disabled} active={!!current && current.value !== "auto"} />
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start" onCloseAutoFocus={(e) => (e.preventDefault(), editor?.commands.focus())}>
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => editor?.chain().focus().setTextDirection(o.value).run()}>
            <o.icon aria-hidden />
            <span className="flex-1">{o.label}</span>
            {o.value === dir && <Check aria-hidden className="text-primary-text" />}
          </DropdownMenuItem>
        ))}
        {dir && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => editor?.chain().focus().unsetTextDirection().run()}>
              <RemoveFormatting aria-hidden />
              {l.defaultColor}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ColorPopoverProps {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  colors: { name: string; value: string }[];
  current: string | null;
  resetLabel: string;
  disabled: boolean;
  swatch?: "text" | "fill";
  onPick: (color: string | null) => void;
}

function ColorPopover({ label, shortcut, icon: Icon, colors, current, resetLabel, disabled, swatch = "text", onPick }: ColorPopoverProps) {
  const [open, setOpen] = useState(false);
  const pick = (c: string | null) => {
    onPick(c);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <Tooltip content={shortcut ? `${label} (${shortcut})` : label}>
        <PopoverTrigger asChild disabled={disabled}>
          <ToolbarPrimitive.Button
            type="button"
            aria-label={label}
            disabled={disabled}
            className={cn(toolButton, "relative flex-col gap-0 py-1")}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Icon aria-hidden className="size-3.5!" />
            <span aria-hidden className="h-1 w-4 rounded-full border border-border/60" style={{ background: current ?? (swatch === "fill" ? "transparent" : "currentColor") }} />
          </ToolbarPrimitive.Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="start" className="w-auto p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div role="group" aria-label={label} className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            aria-label={resetLabel}
            aria-pressed={!current}
            title={resetLabel}
            onClick={() => pick(null)}
            className={cn("relative grid size-7 place-items-center rounded-md border border-border bg-surface text-xs text-foreground-secondary hover:bg-surface-hover", transition, "aria-pressed:ring-2 aria-pressed:ring-focus-ring")}
          >
            <span aria-hidden className="absolute inset-x-1 top-1/2 h-px -rotate-45 bg-danger-text" />
          </button>
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.name}
              aria-pressed={current?.toLowerCase() === c.value}
              title={c.name}
              onClick={() => pick(c.value)}
              className={cn(
                "grid size-7 place-items-center rounded-md border border-border/70 text-sm font-semibold outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-focus-ring",
                transition,
                "aria-pressed:ring-2 aria-pressed:ring-focus-ring aria-pressed:ring-offset-1",
              )}
              style={swatch === "fill" ? { background: c.value, color: "#1c1917" } : { color: c.value, background: "var(--nv-color-surface)" }}
            >
              A
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TablePicker({ editor, labels: l, disabled }: { editor: Editor | null; labels: RichTextEditorLabels; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<[number, number]>([1, 1]);
  const size = 8;
  const gridRef = useRef<HTMLDivElement>(null);
  const insert = (rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setOpen(false);
  };
  const move = (e: ReactKeyboardEvent) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let [r, c] = hover;
    if (e.key === "ArrowDown") r = Math.min(size, r + 1);
    else if (e.key === "ArrowUp") r = Math.max(1, r - 1);
    else if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) c = Math.min(size, c + 1);
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) c = Math.max(1, c - 1);
    else return;
    e.preventDefault();
    setHover([r, c]);
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${r}-${c}"]`)?.focus();
  };
  return (
    <Popover open={open} onOpenChange={(o) => (setOpen(o), o && setHover([1, 1]))} modal={false}>
      <Tooltip content={l.table}>
        <PopoverTrigger asChild disabled={disabled}>
          <ToolbarPrimitive.Button type="button" aria-label={l.table} disabled={disabled} className={toolButton} onMouseDown={(e) => e.preventDefault()}>
            <TableIcon aria-hidden />
          </ToolbarPrimitive.Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="start" className="w-auto p-2.5" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div ref={gridRef} role="grid" aria-label={l.table} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} onKeyDown={move}>
          {Array.from({ length: size * size }, (_, i) => {
            const r = Math.floor(i / size) + 1;
            const c = (i % size) + 1;
            const on = r <= hover[0] && c <= hover[1];
            return (
              <button
                key={i}
                type="button"
                data-cell={`${r}-${c}`}
                tabIndex={r === hover[0] && c === hover[1] ? 0 : -1}
                aria-label={l.insertTable(r, c)}
                onMouseEnter={() => setHover([r, c])}
                onFocus={() => setHover([r, c])}
                onClick={() => insert(r, c)}
                className={cn("size-4 rounded-[3px] border outline-none", on ? "border-primary-border bg-primary-subtle" : "border-border bg-surface", "focus-visible:ring-2 focus-visible:ring-focus-ring")}
              />
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-foreground-secondary tabular-nums" aria-hidden>
          {hover[0]} × {hover[1]}
        </p>
      </PopoverContent>
    </Popover>
  );
}

function TableMenu({ editor, labels: l, disabled, canMerge, canSplit }: { editor: Editor; labels: RichTextEditorLabels; disabled: boolean; canMerge: boolean; canSplit: boolean }) {
  const run = (fn: (c: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => fn(editor.chain().focus()).run();
  return (
    <DropdownMenu modal={false}>
      <Tooltip content={l.table}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <MenuToolButton label={l.table} icon={TableIcon} disabled={disabled} active />
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start" className="min-w-52" onCloseAutoFocus={(e) => (e.preventDefault(), editor.commands.focus())}>
        <DropdownMenuItem onSelect={() => run((c) => c.addRowBefore())}>
          <BetweenHorizontalStart aria-hidden />
          {l.addRowBefore}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.addRowAfter())}>
          <BetweenHorizontalEnd aria-hidden />
          {l.addRowAfter}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.addColumnBefore())}>
          <BetweenVerticalStart aria-hidden />
          {l.addColumnBefore}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.addColumnAfter())}>
          <BetweenVerticalEnd aria-hidden />
          {l.addColumnAfter}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run((c) => c.toggleHeaderRow())}>
          <PanelTopDashed aria-hidden />
          {l.toggleHeaderRow}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canMerge} onSelect={() => run((c) => c.mergeCells())}>
          <TableCellsMerge aria-hidden />
          {l.mergeCells}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canSplit} onSelect={() => run((c) => c.splitCell())}>
          <TableCellsSplit aria-hidden />
          {l.splitCell}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run((c) => c.deleteRow())}>
          <Trash aria-hidden />
          {l.deleteRow}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run((c) => c.deleteColumn())}>
          <Trash aria-hidden />
          {l.deleteColumn}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-danger-text" onSelect={() => run((c) => c.deleteTable())}>
          <Trash aria-hidden />
          {l.deleteTable}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ImagePopover({ editor, labels: l, disabled, onPickImage, uploading }: { editor: Editor | null; labels: RichTextEditorLabels; disabled: boolean; onPickImage?: () => void; uploading: boolean }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = normalizeUrl(src);
    if (!url || !editor) return;
    editor.chain().focus().setImage({ src: url, alt: alt.trim() || undefined }).run();
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setSrc("");
          setAlt("");
        }
      }}
      modal={false}
    >
      <Tooltip content={l.image}>
        <PopoverTrigger asChild disabled={disabled}>
          <ToolbarPrimitive.Button type="button" aria-label={l.image} disabled={disabled} className={toolButton} onMouseDown={(e) => e.preventDefault()}>
            {uploading ? <LoaderCircle aria-hidden className="animate-spin" /> : <ImageIcon aria-hidden />}
          </ToolbarPrimitive.Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="start" className="w-80 p-3" onCloseAutoFocus={(e) => e.preventDefault()}>
        <form className="flex flex-col gap-2" onSubmit={submit}>
          <Input size="sm" type="url" dir="ltr" inputMode="url" placeholder="https://" aria-label={l.imageUrl} value={src} onChange={(e) => setSrc(e.target.value)} autoFocus />
          <Input size="sm" placeholder={l.imageAlt} aria-label={l.imageAlt} value={alt} onChange={(e) => setAlt(e.target.value)} />
          <div className="flex items-center justify-between gap-2">
            {onPickImage ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                startIcon={<Upload aria-hidden />}
                onClick={() => {
                  setOpen(false);
                  onPickImage();
                }}
              >
                {l.imageUpload}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="sm" disabled={!src.trim()}>
              {l.imageInsert}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function LinkEditor({ editor, labels: l, open, onOpenChange, anchorStyle }: { editor: Editor; labels: RichTextEditorLabels; open: boolean; onOpenChange: (open: boolean) => void; anchorStyle: CSSProperties }) {
  const [href, setHref] = useState("");
  const current = open ? ((editor.getAttributes("link").href as string | undefined) ?? "") : "";
  // Content can come from saved HTML: never hand an unsafe stored href to the "open" button.
  const openHref = current ? normalizeUrl(current) : "";
  useEffect(() => {
    if (open) setHref((editor.getAttributes("link").href as string | undefined) ?? "");
  }, [open, editor]);
  const apply = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = normalizeUrl(href);
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else if (editor.state.selection.empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: href.trim(), marks: [{ type: "link", attrs: { href: url } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    onOpenChange(false);
  };
  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverAnchor asChild>
        <span aria-hidden className="pointer-events-none absolute" style={anchorStyle} />
      </PopoverAnchor>
      <PopoverContent side="bottom" align="start" className="w-80 p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
        <form className="flex items-center gap-1.5" onSubmit={apply}>
          <Input
            size="sm"
            dir="ltr"
            inputMode="url"
            placeholder="https://"
            aria-label={l.linkUrl}
            value={href}
            onChange={(e) => setHref(e.target.value)}
            autoFocus
            className="flex-1"
          />
          <Button type="submit" size="sm" aria-label={l.linkApply}>
            <Check aria-hidden />
          </Button>
          {current && (
            <>
              <Tooltip content={l.linkOpen}>
                <Button asChild size="sm" variant="ghost" aria-label={l.linkOpen} className="px-2" disabled={!openHref}>
                  <a href={openHref || undefined} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden />
                  </a>
                </Button>
              </Tooltip>
              <Tooltip content={l.linkRemove}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={l.linkRemove}
                  className="px-2"
                  onClick={() => {
                    editor.chain().focus().extendMarkRange("link").unsetLink().run();
                    onOpenChange(false);
                  }}
                >
                  <Unlink aria-hidden />
                </Button>
              </Tooltip>
            </>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}

function BubbleMenuButtons({ editor, labels: l, onOpenLink }: { editor: Editor; labels: RichTextEditorLabels; onOpenLink: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      highlight: e.isActive("highlight"),
    }),
  });
  const btn = (label: string, Icon: LucideIcon, active: boolean, run: () => void, shortcut?: string) => (
    <Tooltip content={shortcut ? `${label} (${shortcut})` : label}>
      <button type="button" aria-label={label} aria-pressed={active} data-state={active ? "on" : "off"} className={toolButton} onMouseDown={(e) => e.preventDefault()} onClick={run}>
        <Icon aria-hidden />
      </button>
    </Tooltip>
  );
  const c = () => editor.chain().focus();
  return (
    <div role="toolbar" aria-label={l.toolbar} className="flex items-center gap-0.5">
      {btn(l.bold, Bold, s.bold, () => c().toggleBold().run(), `${mod}B`)}
      {btn(l.italic, Italic, s.italic, () => c().toggleItalic().run(), `${mod}I`)}
      {btn(l.underline, Underline, s.underline, () => c().toggleUnderline().run(), `${mod}U`)}
      {btn(l.strike, Strikethrough, s.strike, () => c().toggleStrike().run())}
      {btn(l.code, Code, s.code, () => c().toggleCode().run(), `${mod}E`)}
      <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
      {btn(l.highlight, Highlighter, s.highlight, () => c().toggleHighlight({ color: highlightColors[0]?.value ?? "#fde68a" }).run())}
      {btn(l.link, LinkIcon, s.link, onOpenLink, `${mod}K`)}
    </div>
  );
}

function SlashMenu({ state, labels: l, idPrefix, dir, onHover }: { state: SlashState; labels: RichTextEditorLabels; idPrefix: string; dir: "ltr" | "rtl"; onHover: (i: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [state.selected]);
  const rect = state.rect;
  if (!rect) return null;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const height = 320;
  const width = 256;
  const above = rect.bottom + height + 8 > vh && rect.top > height;
  const style: CSSProperties = {
    position: "fixed",
    top: above ? undefined : rect.bottom + 6,
    bottom: above ? vh - rect.top + 6 : undefined,
    left: dir === "rtl" ? Math.max(8, rect.right - width) : Math.min(rect.left, vw - width - 8),
    width,
    maxHeight: height,
  };
  return (
    <Portal>
      <div
        ref={listRef}
        id={`${idPrefix}-commands`}
        role="listbox"
        aria-label={l.commands}
        dir={dir}
        style={style}
        data-state="open"
        className={cn(floatingSurface, "overflow-y-auto p-1")}
        onMouseDown={(e) => e.preventDefault()}
      >
        {state.items.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-foreground-muted">{l.slashEmpty}</p>
        ) : (
          state.items.map((item, i) => {
            const Icon = item.icon ?? Pilcrow;
            return (
              <div
                key={item.id}
                id={`${idPrefix}-cmd-${item.id}`}
                role="option"
                aria-selected={i === state.selected}
                data-highlighted={i === state.selected ? "" : undefined}
                className={menuItem}
                onMouseEnter={() => onHover(i)}
                onClick={() => state.command(item)}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-surface">
                  <Icon aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{item.title}</span>
                  {item.description && <span className="truncate text-xs text-foreground-muted">{item.description}</span>}
                </span>
              </div>
            );
          })
        )}
      </div>
    </Portal>
  );
}

function RichTextFooter({ editor, labels: l, maxLength, uploading, showCount }: { editor: Editor; labels: RichTextEditorLabels; maxLength?: number; uploading: boolean; showCount: boolean }) {
  // Subscribed by hand: the editor's first content arrives without a transaction, so a
  // transaction-driven selector would show 0 until the first edit.
  const read = useCallback(() => {
    const storage = editor.storage as unknown as { characterCount?: { characters: () => number; words: () => number } };
    return { chars: storage.characterCount?.characters() ?? 0, words: storage.characterCount?.words() ?? 0 };
  }, [editor]);
  const [counts, setCounts] = useState(read);
  useEffect(() => {
    const sync = () => setCounts((prev) => {
      const next = read();
      return next.chars === prev.chars && next.words === prev.words ? prev : next;
    });
    sync();
    editor.on("update", sync);
    editor.on("create", sync);
    return () => {
      editor.off("update", sync);
      editor.off("create", sync);
    };
  }, [editor, read]);
  const near = maxLength !== undefined && counts.chars >= maxLength * 0.9;
  return (
    <div className="flex items-center justify-between gap-3 rounded-b-[inherit] border-t border-border px-3 py-1.5 text-xs text-foreground-muted">
      <span className="flex items-center gap-1.5" aria-live="polite">
        {uploading && (
          <>
            <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
            {l.uploading}
          </>
        )}
      </span>
      {showCount && (
        <span className="flex items-center gap-3 tabular-nums">
          <span>{l.words(counts.words)}</span>
          <span className={cn(near && "font-medium text-warning-text", maxLength !== undefined && counts.chars >= maxLength && "text-danger-text")}>
            {maxLength !== undefined ? `${counts.chars.toLocaleString()} / ${maxLength.toLocaleString()}` : l.characters(counts.chars)}
          </span>
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Viewer */

export interface RichTextViewerProps extends Omit<RichTextEditorProps, "toolbar" | "readOnly" | "bubbleMenu" | "slashCommands" | "showCount" | "onChange" | "placeholder"> {
  /** Draws the field border. Default false. */
  bordered?: boolean;
}

/**
 * Read-only rendering of editor content with the same typography. Content is
 * parsed through the editor schema, so unknown tags, scripts and event
 * handlers in the HTML are dropped rather than rendered.
 */
export const RichTextViewer = forwardRef<HTMLDivElement, RichTextViewerProps>(function RichTextViewer({ bordered = false, minHeight = 0, className, contentClassName, ...props }, ref) {
  return (
    <RichTextEditor
      ref={ref}
      readOnly
      toolbar={false}
      bubbleMenu={false}
      slashCommands={false}
      showCount={false}
      minHeight={minHeight}
      className={cn(!bordered && "border-0 bg-transparent shadow-none", className)}
      contentClassName={cn(!bordered && "p-0", contentClassName)}
      {...props}
    />
  );
});

export type { Editor as RichTextEditorInstance, JSONContent as RichTextJSONContent, Content as RichTextContent };
