import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef, useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { FormField } from "../src/index.ts";
import { RichTextEditor, RichTextViewer, type RichTextEditorInstance } from "../src/rich-text-editor.ts";
import { axeViolations } from "./axe.ts";

// ProseMirror measures text through ranges, which jsdom doesn't lay out.
beforeAll(() => {
  const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect;
  const list = Object.assign([rect], { item: () => rect }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () => rect;
  Range.prototype.getClientRects ??= () => list;
  (document as unknown as { elementFromPoint: () => null }).elementFromPoint ??= () => null;
});

async function setup(ui: React.ReactElement) {
  const result = render(ui);
  const textbox = await screen.findByRole("textbox");
  return { ...result, textbox };
}

describe("RichTextEditor", () => {
  it("is a labelled multiline textbox with a formatting toolbar, wired to FormField", async () => {
    const { container, textbox } = await setup(
      <FormField label="Body" description="Shown on the post page" error="Required">
        <RichTextEditor placeholder="Write something…" />
      </FormField>,
    );
    expect(textbox).toHaveAccessibleName("Body");
    expect(textbox).toHaveAttribute("aria-multiline", "true");
    expect(textbox).toHaveAttribute("aria-invalid", "true");
    expect(textbox).toHaveAccessibleDescription(/Shown on the post page/);
    expect(textbox).toHaveAttribute("contenteditable", "true");
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    expect(toolbar).toHaveAttribute("aria-controls", textbox.id);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false");
    expect(textbox.querySelector("p")).toHaveAttribute("data-placeholder", "Write something…");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders defaultValue and reports HTML on change, with an empty document as an empty string", async () => {
    const onChange = vi.fn();
    const editorRef = createRef<RichTextEditorInstance | null>();
    const { textbox } = await setup(<RichTextEditor aria-label="Notes" defaultValue="<p>Hello <strong>world</strong></p>" onChange={onChange} editorRef={editorRef} />);
    expect(textbox.querySelector("strong")).toHaveTextContent("world");
    act(() => {
      editorRef.current?.commands.insertContentAt(editorRef.current.state.doc.content.size - 1, "!");
    });
    expect(onChange).toHaveBeenLastCalledWith("<p>Hello <strong>world!</strong></p>", editorRef.current);
    act(() => {
      editorRef.current?.commands.clearContent(true);
    });
    expect(onChange).toHaveBeenLastCalledWith("", editorRef.current);
  });

  it("toolbar buttons format the selection and reflect active marks", async () => {
    const onChange = vi.fn();
    const editorRef = createRef<RichTextEditorInstance | null>();
    await setup(<RichTextEditor aria-label="Notes" defaultValue="<p>Make me bold</p>" onChange={onChange} editorRef={editorRef} />);
    act(() => {
      editorRef.current?.commands.selectAll();
    });
    const bold = screen.getByRole("button", { name: "Bold" });
    fireEvent.click(bold);
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Make me bold</strong></p>", expect.anything());
    await waitFor(() => expect(bold).toHaveAttribute("aria-pressed", "true"));

    fireEvent.click(screen.getByRole("button", { name: "Bulleted list" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining("<ul><li><p><strong>"), expect.anything());

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Make me bold</strong></p>", expect.anything());
  });

  it("follows a controlled value without echoing it back through onChange", async () => {
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("<p>One</p>");
      return (
        <>
          <button type="button" onClick={() => setValue("<h2>Two</h2>")}>
            replace
          </button>
          <RichTextEditor aria-label="Doc" value={value} onChange={(html) => (onChange(html), setValue(html))} />
        </>
      );
    }
    const { textbox } = await setup(<Controlled />);
    expect(textbox).toHaveTextContent("One");
    fireEvent.click(screen.getByRole("button", { name: "replace" }));
    await waitFor(() => expect(textbox.querySelector("h2")).toHaveTextContent("Two"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports toolbar presets, custom items and no toolbar", async () => {
    const { unmount } = await setup(<RichTextEditor aria-label="A" toolbar={["bold", "|", "link"]} />);
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar.querySelectorAll("button")).toHaveLength(2);
    unmount();
    await setup(<RichTextEditor aria-label="B" toolbar={false} />);
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("inserts tables, then offers table actions inside one", async () => {
    const editorRef = createRef<RichTextEditorInstance | null>();
    const { textbox } = await setup(<RichTextEditor aria-label="T" editorRef={editorRef} />);
    act(() => {
      editorRef.current?.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run();
    });
    expect(textbox.querySelectorAll("th")).toHaveLength(3);
    expect(textbox.querySelectorAll("td")).toHaveLength(3);
    await waitFor(() => expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute("aria-haspopup", "menu"));
  });

  it("adds dir to every block with dir=auto, and none otherwise", async () => {
    const { textbox, unmount } = await setup(<RichTextEditor aria-label="A" dir="auto" defaultValue="<p>Hello</p><ol><li><p>سلام</p></li></ol>" />);
    expect([...textbox.querySelectorAll("p")].map((p) => p.getAttribute("dir"))).toEqual(["auto", "auto"]);
    // Wrappers stay unset: an auto wrapper around auto paragraphs would resolve to ltr.
    expect(textbox.querySelector("ol")).not.toHaveAttribute("dir");
    expect(textbox.querySelector("li")).not.toHaveAttribute("dir");
    unmount();
    const r = await setup(<RichTextEditor aria-label="B" defaultValue="<p>Hello</p>" />);
    expect(r.textbox.querySelector("p")).not.toHaveAttribute("dir");
  });

  it("sets per-block text direction and aligns to logical sides", async () => {
    const editorRef = createRef<RichTextEditorInstance | null>();
    const { textbox } = await setup(<RichTextEditor aria-label="D" defaultValue="<p>سلام</p>" editorRef={editorRef} />);
    act(() => {
      editorRef.current?.chain().focus().setTextDirection("rtl").setTextAlign("end").run();
    });
    const p = textbox.querySelector("p");
    expect(p).toHaveAttribute("dir", "rtl");
    expect(p?.getAttribute("style")).toContain("text-align: end");
  });

  it("shows counts and enforces maxLength", async () => {
    const editorRef = createRef<RichTextEditorInstance | null>();
    await setup(<RichTextEditor aria-label="C" maxLength={10} defaultValue="<p>two words</p>" editorRef={editorRef} />);
    expect(screen.getByText("2 words")).toBeInTheDocument();
    expect(screen.getByText("9 / 10")).toBeInTheDocument();
    act(() => {
      editorRef.current?.commands.insertContent(" and many more");
    });
    expect(editorRef.current?.storage.characterCount.characters()).toBeLessThanOrEqual(10);
  });

  it("is read-only without a toolbar, and the viewer drops unsafe markup", async () => {
    const { textbox, unmount } = await setup(<RichTextEditor aria-label="R" readOnly defaultValue="<p>Fixed</p>" />);
    expect(textbox).toHaveAttribute("contenteditable", "false");
    expect(textbox).toHaveAttribute("aria-readonly", "true");
    expect(screen.queryByRole("toolbar")).toBeNull();
    unmount();

    const { container } = render(
      <RichTextViewer aria-label="Post" defaultValue={'<p>Safe <a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)"></p><script>alert(1)</script>'} />,
    );
    const view = await screen.findByRole("textbox");
    await waitFor(() => expect(view).toHaveTextContent("Safe"));
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector('a[href^="javascript"]')).toBeNull();
  });

  it("uses Persian labels for the fa locale", async () => {
    await setup(<RichTextEditor aria-label="متن" locale="fa" />);
    expect(screen.getByRole("toolbar", { name: "قالب‌بندی" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "پررنگ" })).toBeInTheDocument();
  });

  it("posts HTML with native forms through a hidden input", async () => {
    const editorRef = createRef<RichTextEditorInstance | null>();
    const { container } = await setup(<RichTextEditor aria-label="F" name="body" defaultValue="<p>Hi</p>" editorRef={editorRef} />);
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="body"]');
    await waitFor(() => expect(hidden?.value).toBe("<p>Hi</p>"));
    act(() => {
      editorRef.current?.commands.setContent("<p>Bye</p>", { emitUpdate: true });
    });
    expect(hidden?.value).toBe("<p>Bye</p>");
  });

  it("opens the slash menu on / and runs the chosen command", async () => {
    const editorRef = createRef<RichTextEditorInstance | null>();
    const { textbox } = await setup(<RichTextEditor aria-label="S" editorRef={editorRef} />);
    act(() => {
      editorRef.current?.chain().focus().insertContent("/head").run();
    });
    const listbox = await screen.findByRole("listbox", { name: "Insert block" });
    expect(textbox).toHaveAttribute("aria-controls", listbox.id);
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Heading 1");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("option", { name: "Heading 2" }));
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(textbox.querySelector("h2")).not.toBeNull();
    expect(textbox).not.toHaveTextContent("/head");
  });

  it("uploads pasted or picked images through onImageUpload", async () => {
    const onImageUpload = vi.fn(async (file: File) => `https://cdn.example.com/${file.name}`);
    const { container, textbox } = await setup(<RichTextEditor aria-label="I" onImageUpload={onImageUpload} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    const file = new File(["x"], "cat.png", { type: "image/png" });
    await act(async () => {
      fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
    });
    expect(onImageUpload).toHaveBeenCalledWith(file);
    await waitFor(() => expect(textbox.querySelector("img")).toHaveAttribute("src", "https://cdn.example.com/cat.png"));
  });
});
