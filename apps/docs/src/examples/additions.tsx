import {
  Avatar,
  Badge,
  Button,
  CalendarHeatmap,
  ColorInput,
  ColorPicker,
  CopyButton,
  CurrencyInput,
  DescriptionItem,
  DescriptionList,
  FormField,
  Image,
  ImageGallery,
  InlineEdit,
  PhoneInput,
  RelativeTime,
  SegmentedControl,
  SegmentedControlItem,
  SortableList,
  Spinner,
  Stack,
  Text,
  Tour,
  VirtualList,
} from "@darkalpha/nova-ui";
import { Columns3, LayoutGrid, List } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Example } from "../docs/kit.tsx";

/** Offline placeholder photos: a gradient with a label, as an SVG data URI. */
const photo = (from: string, to: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><text x="600" y="420" font-family="sans-serif" font-size="64" fill="white" text-anchor="middle" opacity=".85">${label}</text></svg>`,
  )}`;

const harbor = photo("#6d4aff", "#00c2a8", "Harbor");

const photos = [
  { src: harbor, alt: "Harbor at dawn", caption: "Morning light over the harbor." },
  { src: photo("#ff6b6b", "#ffb86b", "Desert"), alt: "Desert road", caption: "A long road through the dunes." },
  { src: photo("#0ea5e9", "#22c55e", "Lake"), alt: "Mountain lake" },
  { src: photo("#f59e0b", "#ef4444", "Canyon"), alt: "Red canyon" },
  { src: photo("#8b5cf6", "#ec4899", "Dusk"), alt: "City at dusk" },
  { src: photo("#14b8a6", "#3b82f6", "Coast"), alt: "Rocky coast" },
];

/* ----------------------------------------------------------------- Actions */

export function SegmentedControlExamples() {
  const [view, setView] = useState("grid");
  return (
    <Example
      title="SegmentedControl"
      description="Pick one of a few options. A radio group underneath, with the highlight gliding to the choice. Use Tabs when each option has its own panel."
      code={`<SegmentedControl aria-label="View" value={view} onValueChange={setView}>
  <SegmentedControlItem value="list" icon={<List />}>List</SegmentedControlItem>
  <SegmentedControlItem value="grid" icon={<LayoutGrid />}>Grid</SegmentedControlItem>
  <SegmentedControlItem value="board" icon={<Columns3 />}>Board</SegmentedControlItem>
</SegmentedControl>`}
    >
      <Stack gap={4}>
        <SegmentedControl aria-label="View" value={view} onValueChange={setView}>
          <SegmentedControlItem value="list" icon={<List />}>
            List
          </SegmentedControlItem>
          <SegmentedControlItem value="grid" icon={<LayoutGrid />}>
            Grid
          </SegmentedControlItem>
          <SegmentedControlItem value="board" icon={<Columns3 />}>
            Board
          </SegmentedControlItem>
        </SegmentedControl>
        <SegmentedControl aria-label="Range" defaultValue="7d" size="sm">
          {["24h", "7d", "30d", "90d"].map((r) => (
            <SegmentedControlItem key={r} value={r}>
              {r}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </Stack>
    </Example>
  );
}

/* ------------------------------------------------------------------- Forms */

export function CurrencyInputExamples() {
  return (
    <Example
      title="CurrencyInput"
      description="Money formats with Intl and rounds to the currency's minor units."
      code={`<CurrencyInput currency="EUR" defaultValue={1499.5} />`}
    >
      <Stack gap={4} className="w-full max-w-sm">
        <FormField label="Price">
          <CurrencyInput currency="EUR" defaultValue={1499.5} min={0} />
        </FormField>
        <FormField label="Price in yen" description="JPY has no minor units, so 99.6 rounds to 100.">
          <CurrencyInput currency="JPY" defaultValue={12000} min={0} />
        </FormField>
      </Stack>
    </Example>
  );
}

export function PhoneInputExamples() {
  const [phone, setPhone] = useState("");
  const [valid, setValid] = useState(false);
  return (
    <Example
      title="PhoneInput"
      description="Formats as you type, keeps the caret in place, and stores E.164."
      code={`<PhoneInput defaultCountry="US" value={phone}
  onValueChange={(e164, { valid }) => …} />`}
    >
      <Stack gap={4} className="w-full max-w-sm">
        <FormField label="Phone" description={phone ? `Stored as ${phone}${valid ? "" : " (incomplete)"}` : "Paste +44 7911 123456 to switch country."}>
          <PhoneInput
            value={phone}
            onValueChange={(next, details) => {
              setPhone(next);
              setValid(details.valid);
            }}
          />
        </FormField>
      </Stack>
    </Example>
  );
}

export function ColorPickerExamples() {
  const [brand, setBrand] = useState("#6d4aff");
  return (
    <Example
      title="ColorPicker and ColorInput"
      description="Saturation/brightness area, hue, hex, swatches and an eyedropper where supported, with a live WCAG contrast check and the tonal scale Nova UI's engine would build from the color."
      code={`<ColorInput value={brand} onValueChange={setBrand} showScale />
<ColorPicker value={brand} onValueChange={setBrand} showScale />`}
      className="items-start"
    >
      <Stack gap={4} className="w-full max-w-xs">
        <FormField label="Brand color">
          <ColorInput value={brand} onValueChange={setBrand} showScale />
        </FormField>
        <Text size="sm" tone="muted">
          The inline picker below is the same color, controlled.
        </Text>
      </Stack>
      <ColorPicker value={brand} onValueChange={setBrand} showScale />
    </Example>
  );
}

export function InlineEditExamples() {
  const [name, setName] = useState("Nova UI launch");
  return (
    <Example
      title="InlineEdit"
      description="Click the text (or Tab to it and press Enter) to edit. Enter saves, Escape cancels, focus comes back. Async saves show a spinner; failures keep the field open."
      code={`<InlineEdit label="Project name" value={name}
  validate={(v) => (v.trim() ? undefined : "Name is required")}
  onSave={async (next) => { await save(next); setName(next); }} />`}
    >
      <Stack gap={2} className="w-full max-w-sm">
        <Text size="sm" tone="muted">
          Project name
        </Text>
        <InlineEdit
          label="Project name"
          size="lg"
          value={name}
          validate={(v) => (v.trim() ? undefined : "Name is required")}
          onSave={async (next) => {
            await new Promise((r) => setTimeout(r, 600));
            if (next.toLowerCase() === "taken") return "That name is already in use";
            setName(next);
          }}
        />
        <Text size="xs" tone="muted">
          Try saving “taken” or an empty name.
        </Text>
      </Stack>
    </Example>
  );
}

/* -------------------------------------------------------------------- Data */

const tasks = [
  { id: "1", title: "Write the launch post", owner: "Mina" },
  { id: "2", title: "Record the demo video", owner: "Arash" },
  { id: "3", title: "Update pricing page", owner: "Sara" },
  { id: "4", title: "Email beta customers", owner: "Kian" },
];

/** A deterministic year of activity, so the heatmap looks the same on every visit. */
function activity(end: Date) {
  const out: { date: Date; value: number }[] = [];
  let seed = 7;
  for (let i = 0; i < 364; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const date = new Date(end);
    date.setDate(end.getDate() - i);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const value = Math.floor((seed / 233280) * (weekend ? 3 : 12)) - (weekend ? 1 : 2);
    if (value > 0) out.push({ date, value });
  }
  return out;
}

export function DescriptionListExamples() {
  const [now] = useState(() => Date.now());
  return (
    <Example
      title="DescriptionList"
      description="Label–value pairs for detail pages, as a real <dl>. Stacked in columns or inline, with optional rules and per-row actions."
      code={`<DescriptionList columns={2}>
  <DescriptionItem term="Status"><Badge variant="success">Active</Badge></DescriptionItem>
  <DescriptionItem term="Account ID" action={<CopyButton value="acc_9f2" />}>acc_9f2</DescriptionItem>
  <DescriptionItem term="Notes" fullWidth>…</DescriptionItem>
</DescriptionList>`}
    >
      <Stack gap={8} className="w-full">
        <DescriptionList columns={2} className="w-full">
          <DescriptionItem term="Status">
            <Badge variant="success">Active</Badge>
          </DescriptionItem>
          <DescriptionItem term="Owner">
            <span className="inline-flex items-center gap-2">
              <Avatar name="Mina Rahimi" size="xs" /> Mina Rahimi
            </span>
          </DescriptionItem>
          <DescriptionItem term="Account ID" action={<CopyButton value="acc_9f2c41" size="xs" />}>
            <code className="font-mono text-xs">acc_9f2c41</code>
          </DescriptionItem>
          <DescriptionItem term="Last active">
            <RelativeTime date={now - 1000 * 60 * 42} />
          </DescriptionItem>
          <DescriptionItem term="Notes" fullWidth>
            Renewal due next quarter; prefers invoices in EUR.
          </DescriptionItem>
        </DescriptionList>
        <DescriptionList layout="inline" divided className="w-full max-w-lg">
          <DescriptionItem term="Plan">Team (annual)</DescriptionItem>
          <DescriptionItem term="Seats">24 of 30</DescriptionItem>
          <DescriptionItem term="Billing email">billing@kaveh-marine.com</DescriptionItem>
        </DescriptionList>
      </Stack>
    </Example>
  );
}

export function RelativeTimeExamples() {
  const [now] = useState(() => Date.now());
  return (
    <Example
      title="RelativeTime"
      description="Localized with Intl.RelativeTimeFormat and kept current; hover for the exact time. It re-renders only as often as the text can change."
      code={`<RelativeTime date={comment.createdAt} />
<RelativeTime date={deadline} locale="fa-IR" />`}
    >
      <Stack gap={2}>
        {[20, 60 * 7, 60 * 60 * 3, 60 * 60 * 26, 60 * 60 * 24 * 12].map((s) => (
          <Text key={s} size="sm">
            <RelativeTime date={now - s * 1000} />
            <span className="text-foreground-muted"> · </span>
            <RelativeTime date={now - s * 1000} locale="fa-IR" />
          </Text>
        ))}
        <Text size="sm">
          Deadline <RelativeTime date={now + 1000 * 60 * 60 * 24 * 3} />
        </Text>
      </Stack>
    </Example>
  );
}

export function SortableListExamples() {
  const [items, setItems] = useState(tasks);
  return (
    <Example
      title="SortableList"
      description="Drag the handle, or focus it and press Space, move with the arrow keys, Space to drop, Escape to cancel. Every step is announced."
      code={`<SortableList aria-label="Launch tasks" items={items}
  getKey={(t) => t.id} getLabel={(t) => t.title}
  onReorder={setItems}
  renderItem={(t) => <span>{t.title}</span>} />`}
    >
      <SortableList
        aria-label="Launch tasks"
        className="w-full max-w-md"
        items={items}
        getKey={(t) => t.id}
        getLabel={(t) => t.title}
        onReorder={setItems}
        renderItem={(t, { index }) => (
          <span className="flex items-center justify-between gap-3">
            <span>
              <span className="me-2 text-foreground-muted tabular-nums">{index + 1}.</span>
              {t.title}
            </span>
            <span className="text-xs text-foreground-muted">{t.owner}</span>
          </span>
        )}
      />
    </Example>
  );
}

export function VirtualListExamples() {
  const [rows, setRows] = useState(() => Array.from({ length: 200 }, (_, i) => i + 1));
  const [loading, setLoading] = useState(false);
  const loadMore = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setRows((r) => (r.length >= 100_000 ? r : [...r, ...Array.from({ length: 200 }, (_, i) => r.length + i + 1)]));
      setLoading(false);
    }, 400);
  }, []);
  return (
    <Example
      title="VirtualList"
      description="Only the rows in view are rendered. Scroll to the end to load 200 more each time."
      code={`<VirtualList aria-label="Invoices" items={rows} itemHeight={40} height={320}
  onEndReached={loadMore} footer={loading && <Spinner />}
  renderItem={(row) => <span>Invoice #{row}</span>} />`}
    >
      <div className="flex w-full max-w-md flex-col gap-2">
        <VirtualList
          aria-label="Invoices"
          items={rows}
          itemHeight={40}
          height={320}
          onEndReached={loadMore}
          className="border border-border bg-surface"
          itemClassName="justify-between border-b border-border px-4 text-sm"
          footer={loading ? <div className="flex justify-center py-3"><Spinner size="sm" label="Loading more" /></div> : null}
          renderItem={(row) => (
            <>
              <span>Invoice #{String(row).padStart(6, "0")}</span>
              <span className="text-foreground-muted tabular-nums">€{((row * 37) % 900) + 100}.00</span>
            </>
          )}
        />
        <Text size="xs" tone="muted">
          {rows.length.toLocaleString()} rows loaded
        </Text>
      </div>
    </Example>
  );
}

export function CalendarHeatmapExamples() {
  const end = useMemo(() => new Date(2026, 9, 29), []);
  const data = useMemo(() => activity(end), [end]);
  return (
    <Example
      title="CalendarHeatmap"
      description="A year of activity. Tab into the grid, then use the arrow keys: every day reads its full date and value."
      code={`<CalendarHeatmap aria-label="Contributions" data={data}
  formatLabel={(v, _, date) => \`\${v} contributions on \${date}\`} />`}
    >
      <CalendarHeatmap aria-label="Contributions" data={data} end={end} formatLabel={(v, _, date) => `${v} contribution${v === 1 ? "" : "s"} on ${date}`} />
    </Example>
  );
}

export function ImageExamples() {
  return (
    <Example
      title="Image and ImageGallery"
      description="Images reserve their space, shimmer while loading and fall back if they fail. The gallery opens a Lightbox: arrows, swipes, zoom, Escape."
      code={`<Image src={src} alt="Harbor at dawn" ratio={16 / 9} />
<ImageGallery images={photos} columns={3} />`}
    >
      <Stack gap={4} className="w-full">
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <Image src={harbor} alt="Harbor at dawn" ratio={16 / 9} loading="eager" />
          <Image src="/does-not-exist.jpg" alt="A photo that failed to load" ratio={16 / 9} />
        </div>
        <ImageGallery images={photos} columns={3} />
      </Stack>
    </Example>
  );
}

/* ---------------------------------------------------------------- Overlays */

export function TourExamples() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Example
      title="Tour"
      description="Step-by-step onboarding. A popover points at each target while the page is dimmed; Escape or Skip ends it."
      code={`<Tour open={open} onOpenChange={setOpen} onFinish={markSeen} steps={[
  { target: "#tour-new", title: "Create", content: "Start a project here." },
  { target: "#tour-search", title: "Search", content: "Find anything.", side: "top" },
]} />`}
    >
      <div className="flex w-full flex-wrap items-center gap-3">
        <Button id="tour-new" variant="primary">
          New project
        </Button>
        <input id="tour-search" aria-label="Search projects" placeholder="Search projects…" className="h-9 rounded-(--nv-input-radius) border border-input bg-surface px-3 text-sm" />
        <Button id="tour-share" variant="outline">
          Share
        </Button>
        <Button variant="soft" className="ms-auto" onClick={() => setOpen(true)}>
          Start tour
        </Button>
        {done ? <Text size="sm" tone="muted">Tour finished.</Text> : null}
      </div>
      <Tour
        open={open}
        onOpenChange={setOpen}
        onFinish={() => setDone(true)}
        steps={[
          { target: "#tour-new", title: "Create a project", content: "Every project gets its own theme, members and history." },
          { target: "#tour-search", title: "Find anything", content: "Search projects, people and settings. Press / from anywhere.", side: "top" },
          { target: "#tour-share", title: "Invite your team", content: "Share with view or edit access. You can change it later." },
        ]}
      />
    </Example>
  );
}
