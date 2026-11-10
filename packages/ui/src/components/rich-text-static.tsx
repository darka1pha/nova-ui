import type { JSONContent } from "@tiptap/core";
import { forwardRef, Fragment, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { normalizeUrl, safeImageSrc } from "../utils/safe-url.ts";

/*
 * Renders editor JSON (`editor.getJSON()`) as plain React elements, with no Tiptap or
 * ProseMirror code. It works on the server, so stored rich text is in the HTML a crawler
 * or a slow device gets, with no layout shift and no editor engine in the bundle.
 *
 * The markup mirrors what the editor's schema serializes (checked against `getHTML()` in
 * the tests), so `styles/rich-text.css` styles it the same way. Only known node and mark
 * types render; unknown nodes render their children and unknown marks are dropped. Every
 * URL and style value is checked, so the JSON can come from an untrusted source.
 */

type Attrs = Record<string, unknown>;

const ALIGNMENTS = new Set(["left", "right", "start", "center", "end", "justify"]);
const DIRECTIONS = new Set(["ltr", "rtl", "auto"]);

/** A CSS color the renderer will put in a style: hex, rgb()/hsl() or a plain keyword. */
function safeColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (/^#[\da-f]{3,8}$/i.test(v)) return v;
  if (/^(rgb|hsl)a?\(\s*[\d.%\s,/-]+\)$/i.test(v)) return v;
  if (/^[a-z]{3,20}$/i.test(v)) return v;
  return undefined;
}

function blockProps(attrs: Attrs | undefined): { style?: CSSProperties; dir?: string } {
  const out: { style?: CSSProperties; dir?: string } = {};
  const align = attrs?.textAlign;
  if (typeof align === "string" && ALIGNMENTS.has(align)) out.style = { textAlign: align as CSSProperties["textAlign"] };
  const dir = attrs?.dir;
  if (typeof dir === "string" && DIRECTIONS.has(dir)) out.dir = dir;
  return out;
}

function positiveInt(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}
const positiveIntOr = (v: unknown, fallback: number) => positiveInt(v) ?? fallback;

function textContent(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textContent).join("");
}

type Mark = NonNullable<JSONContent["marks"]>[number];

const sameMark = (a: Mark | undefined, b: Mark | undefined) => !!a && !!b && a.type === b.type && JSON.stringify(a.attrs ?? {}) === JSON.stringify(b.attrs ?? {});

/** Wraps already rendered content in one mark's element, or returns it as is for an unknown or refused mark. */
function wrapMark(mark: Mark, children: ReactNode, key: string): ReactNode {
  const attrs = (mark.attrs ?? {}) as Attrs;
  switch (mark.type) {
    case "bold":
      return <strong key={key}>{children}</strong>;
    case "italic":
      return <em key={key}>{children}</em>;
    case "underline":
      return <u key={key}>{children}</u>;
    case "strike":
      return <s key={key}>{children}</s>;
    case "code":
      return <code key={key}>{children}</code>;
    case "subscript":
      return <sub key={key}>{children}</sub>;
    case "superscript":
      return <sup key={key}>{children}</sup>;
    case "link": {
      const href = typeof attrs.href === "string" ? normalizeUrl(attrs.href) : "";
      // A refused href (javascript: and the like) keeps the text and drops the link.
      return href ? (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
          {children}
        </a>
      ) : (
        <Fragment key={key}>{children}</Fragment>
      );
    }
    case "textStyle": {
      const color = safeColor(attrs.color);
      return color ? (
        <span key={key} style={{ color }}>
          {children}
        </span>
      ) : (
        <Fragment key={key}>{children}</Fragment>
      );
    }
    case "highlight": {
      const color = safeColor(attrs.color);
      return color ? (
        <mark key={key} data-color={color} style={{ backgroundColor: color, color: "inherit" }}>
          {children}
        </mark>
      ) : (
        <mark key={key}>{children}</mark>
      );
    }
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}

/**
 * Inline content with marks merged the way ProseMirror serializes them: neighbouring nodes
 * that share their first marks share one element ("<strong>b<em>bi</em></strong>").
 */
function renderInline(nodes: JSONContent[], depth: number, key: string, labels: Required<RichTextContentLabels>): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i] as JSONContent;
    const mark = node.marks?.[depth];
    if (!mark) {
      out.push(node.type === "text" ? <Fragment key={`${key}.${i}`}>{node.text ?? ""}</Fragment> : renderNode(node, `${key}.${i}`, labels));
      i++;
      continue;
    }
    let j = i + 1;
    while (j < nodes.length && sameMark(nodes[j]?.marks?.[depth], mark)) j++;
    out.push(wrapMark(mark, renderInline(nodes.slice(i, j), depth + 1, `${key}.${i}m`, labels), `${key}.${i}`));
    i = j;
  }
  return out;
}

const INLINE = new Set(["text", "hardBreak"]);

/** The `<colgroup>` and table width Tiptap's table node writes, from the first row's `colwidth`s. */
function tableLayout(node: JSONContent): { cols: (number | undefined)[]; style: CSSProperties } {
  const cellMinWidth = 25;
  const cols: (number | undefined)[] = [];
  for (const cell of node.content?.[0]?.content ?? []) {
    const span = positiveIntOr(cell.attrs?.colspan, 1);
    const widths = Array.isArray(cell.attrs?.colwidth) ? (cell.attrs.colwidth as unknown[]) : [];
    for (let i = 0; i < span; i++) cols.push(positiveInt(widths[i]));
  }
  const total = cols.reduce<number>((sum, w) => sum + (w ?? cellMinWidth), 0);
  const fixed = cols.length > 0 && cols.every((w) => w !== undefined);
  return { cols, style: fixed ? { width: `${total}px` } : { minWidth: `${total}px` } };
}

function renderNodes(nodes: JSONContent[] | undefined, key: string, labels: Required<RichTextContentLabels>): ReactNode[] {
  const list = nodes ?? [];
  if (list.length > 0 && list.every((n) => INLINE.has(n.type ?? ""))) return renderInline(list, 0, key, labels);
  return list.map((node, i) => renderNode(node, `${key}.${i}`, labels));
}

function renderNode(node: JSONContent, key: string, labels: Required<RichTextContentLabels>): ReactNode {
  const attrs = (node.attrs ?? {}) as Attrs;
  const children = () => renderNodes(node.content, key, labels);
  switch (node.type) {
    case "doc":
      return <>{children()}</>;
    case "text":
      return renderInline([node], 0, key, labels);
    case "paragraph":
      return (
        <p key={key} {...blockProps(attrs)}>
          {/* An empty paragraph keeps its line, as it does in the editor. */}
          {node.content?.length ? children() : <br className="ProseMirror-trailingBreak" />}
        </p>
      );
    case "heading": {
      const level = Math.min(4, Math.max(1, positiveIntOr(attrs.level, 1)));
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      return (
        <Tag key={key} {...blockProps(attrs)}>
          {children()}
        </Tag>
      );
    }
    case "blockquote":
      return (
        <blockquote key={key} {...blockProps(attrs)}>
          {children()}
        </blockquote>
      );
    case "bulletList":
      return (
        <ul key={key} {...blockProps(attrs)}>
          {children()}
        </ul>
      );
    case "orderedList": {
      const start = positiveIntOr(attrs.start, 1);
      return (
        <ol key={key} start={start === 1 ? undefined : start} {...blockProps(attrs)}>
          {children()}
        </ol>
      );
    }
    case "listItem":
      return (
        <li key={key} {...blockProps(attrs)}>
          {children()}
        </li>
      );
    case "taskList":
      return (
        <ul key={key} data-type="taskList" {...blockProps(attrs)}>
          {children()}
        </ul>
      );
    case "taskItem": {
      const checked = attrs.checked === true;
      return (
        <li key={key} data-type="taskItem" data-checked={checked ? "true" : "false"} {...blockProps(attrs)}>
          <label>
            <input type="checkbox" checked={checked} disabled readOnly aria-label={labels.taskItem(textContent(node.content?.[0] ?? {}))} />
            <span />
          </label>
          <div>{children()}</div>
        </li>
      );
    }
    case "codeBlock": {
      const language = typeof attrs.language === "string" && /^[\w+#.-]{1,32}$/.test(attrs.language) ? attrs.language : undefined;
      return (
        <pre key={key} {...blockProps(attrs)}>
          <code className={language ? `language-${language}` : undefined}>{textContent(node)}</code>
        </pre>
      );
    }
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "table": {
      const { cols, style } = tableLayout(node);
      return (
        <div key={key} className="tableWrapper">
          <table style={style}>
            <colgroup>
              {cols.map((w, i) => (
                <col key={i} style={w ? { width: `${w}px` } : { minWidth: "25px" }} />
              ))}
            </colgroup>
            <tbody>{children()}</tbody>
          </table>
        </div>
      );
    }
    case "tableRow":
      return <tr key={key}>{children()}</tr>;
    case "tableHeader":
    case "tableCell": {
      const Tag = node.type === "tableHeader" ? "th" : "td";
      const colSpan = positiveIntOr(attrs.colspan, 1);
      const rowSpan = positiveIntOr(attrs.rowspan, 1);
      return (
        <Tag key={key} colSpan={colSpan > 1 ? colSpan : undefined} rowSpan={rowSpan > 1 ? rowSpan : undefined} {...blockProps(attrs)}>
          {children()}
        </Tag>
      );
    }
    case "image": {
      const src = typeof attrs.src === "string" ? safeImageSrc(attrs.src) : "";
      if (!src) return null;
      const width = positiveInt(attrs.width);
      const height = positiveInt(attrs.height);
      return (
        <img
          key={key}
          src={src}
          alt={typeof attrs.alt === "string" ? attrs.alt : ""}
          title={typeof attrs.title === "string" ? attrs.title : undefined}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
      );
    }
    default:
      // A node from a custom extension: keep its text, drop the wrapper.
      return node.content ? <span key={key}>{children()}</span> : null;
  }
}

export interface RichTextContentLabels {
  /** Name of a task item's checkbox, from the item's text. */
  taskItem?: (text: string) => string;
}

export interface RichTextContentViewProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "content"> {
  /** Editor JSON, as `editor.getJSON()` or the editor's `RichTextJSONContent` returns it. */
  content: JSONContent | null | undefined;
  /** Draws the field border. Default false. */
  bordered?: boolean;
  /** Base direction. "auto" leaves it to each block. */
  dir?: "ltr" | "rtl" | "auto";
  minHeight?: string | number;
  maxHeight?: string | number;
  contentClassName?: string;
  labels?: RichTextContentLabels;
}

const cssLength = (v: string | number | undefined) => (typeof v === "number" ? `${v}px` : v);

/**
 * Read-only rendering of editor JSON without the editor engine. Renders on the server.
 * Use it (or `RichTextViewer`, which switches to it for JSON content) to display stored
 * rich text; store `editor.getJSON()` rather than HTML to get server rendering.
 */
export const RichTextContentView = forwardRef<HTMLDivElement, RichTextContentViewProps>(function RichTextContentView(
  { content, bordered = false, dir, minHeight, maxHeight, className, contentClassName, labels, ...rest },
  ref,
) {
  const l: Required<RichTextContentLabels> = { taskItem: labels?.taskItem ?? ((text) => (text ? `Task: ${text}` : "Task")) };
  return (
    <div
      ref={ref}
      data-slot="rich-text-editor"
      data-readonly
      className={cn(
        "nv-field relative flex min-w-0 flex-col rounded-(--nv-input-radius) border border-input bg-surface text-foreground shadow-xs",
        !bordered && "border-0 bg-transparent shadow-none",
        className,
      )}
      {...rest}
    >
      <div
        className={cn("nv-rte-content min-h-0 flex-1 overflow-y-auto px-4 py-3", !bordered && "p-0", contentClassName)}
        data-editable="false"
        style={{ minHeight: cssLength(minHeight), maxHeight: cssLength(maxHeight) }}
        dir={dir && dir !== "auto" ? dir : undefined}
      >
        <div className="ProseMirror">
          {content ? renderNode(content.type ? content : { type: "doc", content: [] }, "n", l) : null}
        </div>
      </div>
    </div>
  );
});
