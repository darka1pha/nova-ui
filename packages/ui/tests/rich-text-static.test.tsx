import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { ThemeProvider } from "../src/index.ts";
import { RichTextContentView, RichTextEditor, RichTextViewer, type RichTextEditorInstance, type RichTextJSONContent } from "../src/rich-text-editor.ts";
import { axeViolations } from "./axe.ts";

beforeAll(() => {
  const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect;
  const list = Object.assign([rect], { item: () => rect }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () => rect;
  Range.prototype.getClientRects ??= () => list;
  (document as unknown as { elementFromPoint: () => null }).elementFromPoint ??= () => null;
});

const t = (text: string, marks?: RichTextJSONContent["marks"]): RichTextJSONContent => ({ type: "text", text, ...(marks ? { marks } : {}) });
const p = (...content: RichTextJSONContent[]): RichTextJSONContent => ({ type: "paragraph", content });

/** One of every node and mark the editor schema has. */
const fixture: RichTextJSONContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2, textAlign: "center", dir: "rtl" }, content: [t("Title")] },
    {
      type: "paragraph",
      attrs: { textAlign: "justify" },
      content: [
        t("b", [{ type: "bold" }]),
        t("bi", [{ type: "bold" }, { type: "italic" }]),
        t("u", [{ type: "underline" }]),
        t("s", [{ type: "strike" }]),
        t("c", [{ type: "code" }]),
        t("l", [{ type: "link", attrs: { href: "https://x.com", target: "_blank", rel: "noopener noreferrer nofollow", class: null } }]),
        t("col", [{ type: "textStyle", attrs: { color: "#ff0000" } }]),
        t("hl", [{ type: "highlight", attrs: { color: "#ffff00" } }]),
        t("hl2", [{ type: "highlight" }]),
        t("sub", [{ type: "subscript" }]),
        t("sup", [{ type: "superscript" }]),
        { type: "hardBreak" },
        t("after"),
      ],
    },
    { type: "paragraph" },
    { type: "blockquote", content: [p(t("q"))] },
    { type: "bulletList", content: [{ type: "listItem", content: [p(t("a"))] }] },
    { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p(t("n"))] }] },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [p(t("done")), { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [p(t("open"))] }] }],
        },
      ],
    },
    { type: "codeBlock", attrs: { language: "ts" }, content: [t("const a = 1;\nb")] },
    { type: "horizontalRule" },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", attrs: { colspan: 1, rowspan: 1, colwidth: [120] }, content: [p(t("H"))] },
            { type: "tableHeader", content: [p(t("H2"))] },
          ],
        },
        { type: "tableRow", content: [{ type: "tableCell", attrs: { colspan: 2, rowspan: 1 }, content: [p(t("C"))] }] },
      ],
    },
    { type: "image", attrs: { src: "https://x.com/a.png", alt: "A", title: "T", width: 200, height: 100 } },
  ],
};

/** Element tree as a comparable string: sorted attributes, styles normalized by the CSS parser. */
function canon(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof Element)) return "";
  const attrs = [...node.attributes]
    .map((a) => (a.name === "style" ? `style=${(node as HTMLElement).style.cssText}` : `${a.name}=${a.value}`))
    .sort()
    .join(" ");
  return `<${node.tagName.toLowerCase()}${attrs ? ` ${attrs}` : ""}>${[...node.childNodes].map(canon).join("")}</${node.tagName.toLowerCase()}>`;
}

/** The static view's markup with its deliberate extras removed, to compare with getHTML(). */
function staticAsEditorHtml(root: Element): string {
  const clone = root.cloneNode(true) as Element;
  clone.querySelectorAll(".tableWrapper").forEach((w) => w.replaceWith(...w.childNodes));
  clone.querySelectorAll("br.ProseMirror-trailingBreak").forEach((b) => b.remove());
  clone.querySelectorAll("input").forEach((i) => {
    i.removeAttribute("disabled");
    i.removeAttribute("aria-label");
    i.removeAttribute("readonly");
    i.removeAttribute("checked");
  });
  clone.querySelectorAll("img").forEach((i) => {
    i.removeAttribute("loading");
    i.removeAttribute("decoding");
  });
  return [...clone.childNodes].map(canon).join("");
}

describe("RichTextContentView", { timeout: 20_000 }, () => {
  it("renders the same markup as the editor for every node and mark", async () => {
    let editor: RichTextEditorInstance | null = null;
    const { unmount } = render(<RichTextEditor aria-label="E" readOnly defaultValue={fixture} editorRef={(e) => {
      editor = e;
    }} />);
    await waitFor(() => expect(editor).not.toBeNull());
    const html = (editor as unknown as RichTextEditorInstance).getHTML();
    unmount();

    const expected = document.createElement("div");
    expected.innerHTML = html;
    // getHTML() keeps colwidth on cells and the "checked" attribute; the DOM view has neither.
    expected.querySelectorAll("[colwidth]").forEach((c) => c.removeAttribute("colwidth"));
    expected.querySelectorAll("input[checked]").forEach((i) => i.removeAttribute("checked"));

    const { container } = render(<RichTextContentView content={fixture} />);
    const root = container.querySelector(".ProseMirror");
    if (!root) throw new Error("no content root");
    expect(staticAsEditorHtml(root)).toBe([...expected.childNodes].map(canon).join(""));
    // Task checkboxes carry their state as a property.
    expect(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[0]?.checked).toBe(true);
  });

  it("renders on the server with no editor engine", () => {
    const html = renderToString(
      <ThemeProvider>
        <RichTextViewer defaultValue={fixture} />
      </ThemeProvider>,
    );
    expect(html).toContain("<h2");
    expect(html).toContain("Title");
    expect(html).toContain('class="tableWrapper"');
    expect(html).not.toContain('role="textbox"');
  });

  it("drops unsafe URLs, styles and unknown nodes", () => {
    const evil: RichTextJSONContent = {
      type: "doc",
      content: [
        p(
          t("js", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]),
          t("tab", [{ type: "link", attrs: { href: "java\tscript:alert(1)" } }]),
          t("css", [{ type: "textStyle", attrs: { color: "red;background:url(https://x/y)" } }]),
          t("hl", [{ type: "highlight", attrs: { color: "expression(alert(1))" } }]),
          t("mark", [{ type: "mysteryMark" }]),
        ),
        { type: "image", attrs: { src: "javascript:alert(1)" } },
        { type: "image", attrs: { src: "data:text/html;base64,PHNjcmlwdD4=" } },
        { type: "image", attrs: { src: "data:image/png;base64,iVBORw0KGgo=", alt: "ok" } },
        { type: "script", content: [t("inside")] },
        { type: "codeBlock", attrs: { language: '"><script>' }, content: [t("<script>alert(1)</script>")] },
      ],
    };
    const { container } = render(<RichTextContentView content={evil} />);
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("jstabcsshlmark");
    expect(container.querySelector("[style*='url']")).toBeNull();
    expect(container.querySelector("[style*='expression']")).toBeNull();
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("alt", "ok");
    expect(container.querySelector("script")).toBeNull();
    expect(container).toHaveTextContent("inside");
    expect(container.querySelector("pre code")).not.toHaveAttribute("class");
  });

  it("is accessible and names task checkboxes in the locale", async () => {
    const { container } = render(
      <ThemeProvider locale="fa-IR" dir="rtl">
        <RichTextViewer defaultValue={fixture} />
      </ThemeProvider>,
    );
    expect(screen.getByRole("checkbox", { name: "کار: done" })).toBeDisabled();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("keeps the editor path for HTML strings", async () => {
    render(<RichTextViewer aria-label="Post" defaultValue="<p>Hello</p>" />);
    const view = await screen.findByRole("textbox");
    await waitFor(() => expect(view).toHaveTextContent("Hello"));
  });

  it("names the editor's task checkboxes with the same label", async () => {
    render(<RichTextEditor aria-label="E" defaultValue={fixture} />);
    expect(await screen.findByRole("checkbox", { name: "Task: done" })).toBeInTheDocument();
  });
});
