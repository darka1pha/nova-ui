import { Button, FormField, ThemeProvider } from "@darkalpha/nova-ui";
import { RichTextEditor, RichTextViewer } from "@darkalpha/nova-ui/rich-text-editor";
import { useState } from "react";
import { Example } from "../docs/kit.tsx";

const article = `<h2>Release notes</h2>
<p>This release brings <strong>tables</strong>, <em>checklists</em> and <mark data-color="#bbf7d0" style="background-color: #bbf7d0">colored highlights</mark> to the editor. Select any text to see the bubble menu, or type <code>/</code> on an empty line.</p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Draft the announcement</p></li>
  <li data-type="taskItem" data-checked="false"><p>Review with the team</p></li>
</ul>
<table><tbody>
  <tr><th><p>Feature</p></th><th><p>Shortcut</p></th></tr>
  <tr><td><p>Bold</p></td><td><p>Ctrl+B</p></td></tr>
  <tr><td><p>Link</p></td><td><p>Ctrl+K</p></td></tr>
</tbody></table>
<blockquote><p>Good tools disappear while you write.</p></blockquote>`;

const persian = `<h2>یادداشت جلسه</h2>
<p>در این جلسه دربارهٔ <strong>برنامهٔ انتشار</strong> و هماهنگی با تیم <span style="color: light-dark(#1d4ed8, #60a5fa)">Design System</span> گفت‌وگو شد.</p>
<ol><li><p>بازبینی طرح‌ها تا پایان هفته</p></li><li><p>انتشار نسخهٔ آزمایشی</p></li></ol>`;

/** A stand-in upload that reads the file as a data URL after a short delay. */
const fakeUpload = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => setTimeout(() => resolve(String(reader.result)), 600);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function RichTextEditorExamples() {
  const [html, setHtml] = useState("<p>Edit me — the HTML below updates as you type.</p>");
  const [error, setError] = useState<string>();

  return (
    <>
      <Example
        title="Full editor"
        description="Headings, marks, colors, links, images, tables, checklists, alignment, per-block direction and full screen. Select text for the bubble menu; type / for blocks; Tab and Shift+Tab nest lists; markdown shortcuts like ## and - [ ] work as you type."
        code={`import { RichTextEditor } from "@darkalpha/nova-ui/rich-text-editor";

<RichTextEditor
  defaultValue={html}
  onChange={(html) => save(html)}
  onImageUpload={async (file) => (await uploadToCdn(file)).url}
  maxHeight="28rem"
/>`}
      >
        <RichTextEditor aria-label="Release notes" defaultValue={article} onImageUpload={fakeUpload} maxHeight="28rem" className="w-full" />
      </Example>

      <Example
        title="In a form"
        description="Inside FormField it is labelled, described and marked invalid like any other control. onChange gives HTML, and an empty document gives an empty string, so required checks are a plain comparison. name posts the HTML with native forms."
        code={`<FormField label="Description" description="Shown on the product page" error={error} required>
  <RichTextEditor toolbar="basic" name="description" maxLength={500} onChange={setHtml} />
</FormField>`}
      >
        <form
          className="flex w-full flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(html ? undefined : "Add a description");
          }}
        >
          <FormField label="Description" description="Shown on the product page" error={error} required>
            <RichTextEditor toolbar="basic" name="description" maxLength={500} placeholder="Describe the product…" defaultValue={html} onChange={(v) => (setHtml(v), v && setError(undefined))} />
          </FormField>
          <div className="flex items-start justify-between gap-3">
            <code className="min-w-0 flex-1 truncate rounded bg-surface-sunken px-2 py-1 text-xs text-foreground-secondary">{html || '""'}</code>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      </Example>

      <Example
        title="Toolbars"
        description={'toolbar takes a preset ("full", "basic", "minimal"), your own list of items with "|" between groups, or false.'}
        code={`<RichTextEditor toolbar="minimal" />
<RichTextEditor toolbar={["bold", "italic", "highlight", "|", "link", "|", "taskList"]} />
<RichTextEditor toolbar={false} placeholder="Just type — select text to format it" />`}
      >
        <div className="grid w-full gap-4">
          <RichTextEditor aria-label="Minimal toolbar" toolbar="minimal" minHeight="5rem" placeholder="Minimal toolbar" showCount={false} />
          <RichTextEditor aria-label="Custom toolbar" toolbar={["bold", "italic", "highlight", "|", "link", "|", "taskList"]} minHeight="5rem" placeholder="Custom items" showCount={false} />
          <RichTextEditor aria-label="No toolbar" toolbar={false} minHeight="5rem" placeholder="No toolbar: select text to format it, or type /" showCount={false} />
        </div>
      </Example>

      <Example
        title="Persian and right-to-left"
        description='Under a fa locale the UI is in Persian. dir="auto" sets each paragraph’s direction from its own text, so Persian and English lines sit side by side; the direction menu overrides it per block. Alignment is logical (start/end), so it follows the text.'
        code={`<ThemeProvider dir="rtl" locale="fa-IR">
  <RichTextEditor dir="auto" defaultValue={notes} />
</ThemeProvider>`}
      >
        <ThemeProvider dir="rtl" locale="fa-IR" className="w-full">
          <RichTextEditor aria-label="یادداشت" dir="auto" defaultValue={persian} toolbar="full" />
        </ThemeProvider>
      </Example>

      <Example
        title="Viewer"
        description="RichTextViewer renders saved HTML with the same typography. It goes through the editor schema, so scripts, event handlers and javascript: links are dropped."
        code={`<RichTextViewer value={post.html} />`}
      >
        <RichTextViewer aria-label="Release notes" value={article} className="w-full" />
      </Example>

      <Example
        title="States"
        description="disabled and readOnly. Read-only hides the toolbar and keeps text selectable."
        code={`<RichTextEditor disabled defaultValue="…" />
<RichTextEditor readOnly defaultValue="…" />`}
      >
        <div className="grid w-full gap-4 md:grid-cols-2">
          <RichTextEditor aria-label="Disabled" disabled toolbar="minimal" minHeight="4rem" defaultValue="<p>Disabled editor</p>" />
          <RichTextEditor aria-label="Read only" readOnly minHeight="4rem" defaultValue="<p>Read-only editor with <a href='https://example.com'>a link</a></p>" />
        </div>
      </Example>
    </>
  );
}
