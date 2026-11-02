import {
  Badge,
  Card,
  DateTimePicker,
  FormField,
  InfiniteScroll,
  KanbanBoard,
  Masonry,
  MultiSelect,
  SignaturePad,
  Text,
  type ComboboxOption,
  type KanbanColumn,
} from "@darkalpha/nova-ui";
import { useState } from "react";
import { Example } from "../docs/kit.tsx";

/* ------------------------------------------------------------------- Forms */

const skills: ComboboxOption[] = [
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "css", label: "CSS" },
  { value: "a11y", label: "Accessibility", keywords: ["a11y", "wcag"] },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design systems" },
  { value: "node", label: "Node.js" },
];

export function MultiSelectExamples() {
  const [value, setValue] = useState(["react", "a11y"]);
  const [tags, setTags] = useState<string[]>([]);
  return (
    <>
      <Example
        title="MultiSelect"
        description="Search, pick several, remove with the chip's button or Backspace on the field."
        code={`<FormField label="Skills">
  <MultiSelect options={skills} value={value} onValueChange={setValue} />
</FormField>`}
      >
        <FormField label="Skills" className="w-full max-w-md">
          <MultiSelect options={skills} value={value} onValueChange={setValue} />
        </FormField>
      </Example>
      <Example
        title="Creatable, with a limit"
        description="onCreate adds values that aren't listed; max caps how many can be chosen."
        code={`<MultiSelect options={skills} max={3}
  onCreate={(q) => ({ value: q.toLowerCase(), label: q })} />`}
      >
        <FormField label="Tags" description="Up to three. Type to add your own." className="w-full max-w-md">
          <MultiSelect options={skills} value={tags} onValueChange={setTags} max={3} onCreate={(q) => ({ value: q.toLowerCase(), label: q })} />
        </FormField>
      </Example>
    </>
  );
}

export function DateTimePickerExamples() {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <Example
      title="DateTimePicker"
      description="A calendar and a time field in one popover. Picking a day keeps the time; Done closes it."
      code={`<FormField label="Meeting">
  <DateTimePicker value={value} onValueChange={setValue} minuteStep={15} clearable />
</FormField>`}
    >
      <FormField label="Meeting" className="w-full max-w-xs">
        <DateTimePicker value={value} onValueChange={setValue} minuteStep={15} min={new Date()} clearable />
      </FormField>
    </Example>
  );
}

export function SignaturePadExamples() {
  const [signed, setSigned] = useState(false);
  return (
    <Example
      title="SignaturePad"
      description="Draw with a mouse, pen or finger. Type instead renders the name in a script font, so signing never needs a drag."
      code={`<FormField label="Signature">
  <SignaturePad name="signature" onChange={(url) => setSigned(url !== null)} />
</FormField>`}
    >
      <FormField label="Signature" description={signed ? "Signed." : "Sign to accept the agreement."} className="w-full max-w-md">
        <SignaturePad name="signature" onChange={(url) => setSigned(url !== null)} />
      </FormField>
    </Example>
  );
}

/* -------------------------------------------------------------------- Data */

interface Task {
  id: string;
  title: string;
  tag: string;
}

const initialBoard: KanbanColumn<Task>[] = [
  {
    id: "backlog",
    title: "Backlog",
    items: [
      { id: "t1", title: "Audit icon sizes", tag: "Design" },
      { id: "t2", title: "Dark mode charts", tag: "Charts" },
    ],
  },
  {
    id: "progress",
    title: "In progress",
    limit: 2,
    items: [
      { id: "t3", title: "Toast promise API", tag: "Feedback" },
      { id: "t4", title: "Next.js example", tag: "Docs" },
    ],
  },
  { id: "review", title: "Review", items: [{ id: "t5", title: "SignaturePad", tag: "Forms" }] },
  { id: "done", title: "Done", items: [] },
];

export function KanbanBoardExamples() {
  const [columns, setColumns] = useState(initialBoard);
  return (
    <Example
      title="KanbanBoard"
      description="Drag a card's handle, or focus it and press Space: up/down within a column, left/right across, Space to drop. Columns over their limit show a warning count."
      code={`<KanbanBoard aria-label="Sprint" columns={columns}
  getKey={(t) => t.id} getLabel={(t) => t.title}
  onMove={setColumns}
  renderItem={(t) => <span>{t.title}</span>} />`}
    >
      <KanbanBoard
        aria-label="Sprint"
        className="w-full"
        columns={columns}
        getKey={(t) => t.id}
        getLabel={(t) => t.title}
        onMove={setColumns}
        renderItem={(t) => (
          <span className="flex flex-col gap-1.5">
            <span className="font-medium">{t.title}</span>
            <Badge size="sm" variant="neutral" className="self-start">
              {t.tag}
            </Badge>
          </span>
        )}
      />
    </Example>
  );
}

const heights = [120, 180, 90, 220, 140, 100, 200, 160, 110];

export function MasonryExamples() {
  return (
    <Example
      title="Masonry"
      description="Each item goes into the shortest column. DOM order stays the source order, so Tab follows reading order. Columns follow the container width."
      code={`<Masonry columns={{ base: 2, md: 3 }} gap={12}>
  {photos.map((p) => <Card key={p.id}>…</Card>)}
</Masonry>`}
    >
      <Masonry className="w-full" columns={{ base: 2, md: 3 }} gap={12}>
        {heights.map((h, i) => (
          <Card key={i} variant="outline" className="flex flex-col justify-end p-3" style={{ height: h }}>
            <Text size="sm" tone="muted">
              Item {i + 1}
            </Text>
          </Card>
        ))}
      </Masonry>
    </Example>
  );
}

export function InfiniteScrollExamples() {
  const [rows, setRows] = useState(() => Array.from({ length: 10 }, (_, i) => i + 1));
  const [loading, setLoading] = useState(false);
  const hasMore = rows.length < 50;
  return (
    <Example
      title="InfiniteScroll"
      description="Loads the next page as the end nears. After three automatic pages a Load more button takes over, so content below stays reachable."
      code={`<InfiniteScroll hasMore={hasMore} loading={loading} onLoadMore={loadMore} autoLoadPages={3}>
  {rows.map((r) => <div key={r}>Row {r}</div>)}
</InfiniteScroll>`}
    >
      {/* Focusable, so keyboard users can scroll it. */}
      <div tabIndex={0} role="region" aria-label="Rows" className="h-72 w-full max-w-md overflow-y-auto rounded-(--nv-card-radius) border border-border outline-none focus-visible:outline-2 focus-visible:outline-focus-ring">
        <InfiniteScroll
          hasMore={hasMore}
          loading={loading}
          autoLoadPages={3}
          onLoadMore={() => {
            setLoading(true);
            setTimeout(() => {
              setRows((r) => [...r, ...Array.from({ length: 10 }, (_, i) => r.length + i + 1)]);
              setLoading(false);
            }, 600);
          }}
        >
          {rows.map((r) => (
            <div key={r} className="border-b border-border px-4 py-3 text-sm">
              Row {r}
            </div>
          ))}
        </InfiniteScroll>
      </div>
    </Example>
  );
}
