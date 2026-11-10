import {
  AspectRatio,
  Avatar,
  Banner,
  Button,
  Calendar,
  Card,
  DateRangePicker,
  TimeInput,
  TreeView,
  NotificationCenter,
  type NotificationItem,
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  MenuShortcut,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  RangeCalendar,
  Carousel,
  Chip,
  CircularProgress,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CopyButton,
  DatePicker,
  FileDropzone,
  FormField,
  Grid,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Inline,
  Link,
  PinInput,
  Rating,
  ScrollArea,
  Sparkline,
  Stack,
  Stat,
  Stepper,
  TagInput,
  Text,
  Timeline,
  toast,
  type DateRange,
} from "@darkalpha/nova-ui";
import { AlignCenter, AlignLeft, AlignRight, Anchor, Bold, Building2, ChevronsUpDown, Italic, Printer, Share2, CircleCheck, Container, DollarSign, GitCommit, Package, Ship, Truck, Users } from "lucide-react";
import { useState } from "react";
import { Example, to } from "../docs/kit.tsx";

/* ------------------------------------------------------------------ Actions */

export function CopyButtonExamples() {
  return (
    <Example
      title="CopyButton"
      description="The icon morphs into a check and a live region announces the copy."
      code={`<CopyButton value="pnpm add @darkalpha/nova-ui" label="Copy command" />
<CopyButton value={apiKey} aria-label="Copy API key" />`}
    >
      <CopyButton value="pnpm add @darkalpha/nova-ui" label="Copy command" />
      <CopyButton value="sk_test_nova" aria-label="Copy API key" variant="ghost" />
    </Example>
  );
}

export function ChipExamples() {
  return (
    <Example
      title="Chip"
      description="Selectable chips are toggle buttons; the check slides in. Removable chips have a labelled remove button."
      code={`<Chip selected={on} onSelectedChange={setOn}>Design</Chip>
<Chip onRemove={() => remove("react")}>react</Chip>`}
    >
      <ChipDemo />
    </Example>
  );
}

function ChipDemo() {
  const [selected, setSelected] = useState<string[]>(["Design"]);
  const [tags, setTags] = useState(["react", "typescript", "a11y"]);
  return (
    <Stack gap={3}>
      <Inline>
        {["Design", "Engineering", "Marketing", "Sales"].map((c) => (
          <Chip key={c} selected={selected.includes(c)} onSelectedChange={(on) => setSelected((s) => (on ? [...s, c] : s.filter((x) => x !== c)))}>
            {c}
          </Chip>
        ))}
      </Inline>
      <Inline>
        {tags.map((t) => (
          <Chip key={t} size="sm" onRemove={() => setTags((s) => s.filter((x) => x !== t))}>
            {t}
          </Chip>
        ))}
        {tags.length === 0 ? (
          <Button size="xs" variant="ghost" onClick={() => setTags(["react", "typescript", "a11y"])}>
            Reset
          </Button>
        ) : null}
      </Inline>
    </Stack>
  );
}

/* -------------------------------------------------------------------- Forms */

export function DatePickerExamples() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="DatePicker and Calendar"
      description="Locale-aware names and first day of the week; full keyboard grid navigation; months slide in the direction you travel."
      code={`<FormField label="Check-in">
  <DatePicker value={date} onValueChange={setDate} min={new Date()} clearable />
</FormField>
<Calendar defaultValue={new Date()} locale="fr-FR" />`}
      className="items-start"
    >
      <Stack gap={3} className="w-full max-w-xs">
        <FormField label="Check-in" description="Weekends are unavailable.">
          <DatePicker value={date} onValueChange={setDate} onClear={() => setDate(null)} min={new Date()} isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6} clearable />
        </FormField>
      </Stack>
      <Card variant="outline" className="w-fit p-3">
        <Calendar defaultValue={new Date()} />
      </Card>
    </Example>
  );
}

export function DateRangePickerExamples() {
  const [voyage, setVoyage] = useState<DateRange | null>(null);
  return (
    <Example
      title="DateRangePicker and RangeCalendar"
      description="Preset rows for the ranges people reach for, then two months for a custom range. The first click sets one end, the second the other (in either order), with a live preview under the pointer or keyboard focus. Follows the provider's locale and Jalali calendar."
      code={`<FormField label="Voyage window">
  <DateRangePicker value={range} onValueChange={setRange} clearable name="voyage" />
</FormField>
// Submits voyageStart / voyageEnd as YYYY-MM-DD.
<RangeCalendar defaultValue={{ start, end }} />`}
      className="items-start"
    >
      <Stack gap={3} className="w-full max-w-sm">
        <FormField label="Voyage window" description="ETD to ETA. Pick a preset or two days.">
          <DateRangePicker value={voyage} onValueChange={setVoyage} onClear={() => setVoyage(null)} clearable name="voyage" />
        </FormField>
      </Stack>
      <Card variant="outline" className="w-fit max-w-full overflow-x-auto p-3">
        <RangeCalendar defaultValue={{ start: new Date(new Date().setDate(new Date().getDate() - 3)), end: new Date(new Date().setDate(new Date().getDate() + 4)) }} />
      </Card>
    </Example>
  );
}

export function TimeInputExamples() {
  const [eta, setEta] = useState<string | null>("14:30");
  return (
    <Example
      title="TimeInput"
      description="Hour, minute and — for 12-hour locales — AM/PM segments. Arrows step (Page Up/Down jump), digits type straight in and advance on their own, and phones get a numeric keyboard. The value is plain HH:mm in 24-hour time."
      code={`<FormField label="ETA" description="Local port time">
  <TimeInput value={eta} onValueChange={setEta} minuteStep={5} clearable name="eta" />
</FormField>
<TimeInput locale="en-US" defaultValue="09:15" />   // 09:15 AM`}
      className="items-start"
    >
      <Stack gap={3} className="w-full max-w-xs">
        <FormField label="ETA" description={eta ? `Stored as ${eta}` : "Local port time"}>
          <TimeInput value={eta} onValueChange={setEta} minuteStep={5} clearable name="eta" />
        </FormField>
        <FormField label="Pilot boarding (12-hour)">
          <TimeInput locale="en-US" defaultValue="09:15" />
        </FormField>
      </Stack>
    </Example>
  );
}

export function PinInputExamples() {
  return (
    <Example
      title="PinInput"
      description="Auto-advance, Backspace to go back, paste to fill. Boxes pop as they fill."
      code={`<FormField label="Verification code">
  <PinInput length={6} onComplete={verify} />
</FormField>`}
    >
      <FormField label="Verification code" description="Try pasting 123456.">
        <PinInput length={6} onComplete={(v) => toast.success(`Code ${v} entered`)} />
      </FormField>
    </Example>
  );
}

export function TagInputExamples() {
  return (
    <Example
      title="TagInput"
      description="Enter or comma adds a tag; Backspace on an empty field removes the last one."
      code={`<FormField label="Skills">
  <TagInput defaultValue={["react"]} max={8} />
</FormField>`}
    >
      <FormField label="Skills" className="w-full max-w-md">
        <TagInput defaultValue={["react", "design systems"]} max={8} />
      </FormField>
    </Example>
  );
}

export function FileDropzoneExamples() {
  return (
    <Example
      title="FileDropzone"
      description="Drag files over it to see it react. It's a real button, so it works from the keyboard too."
      code={`<FileDropzone accept="image/*,.pdf" maxSize={5_000_000} description="PNG, JPG or PDF up to 5 MB"
  onReject={(r) => toast.error(\`\${r.length} file(s) rejected\`)} />`}
    >
      <FileDropzone
        className="w-full"
        accept="image/*,.pdf"
        maxSize={5_000_000}
        description="PNG, JPG or PDF up to 5 MB"
        onReject={(r) => toast.error(`${r.length} file${r.length > 1 ? "s" : ""} rejected`, { description: r.map((x) => `${x.file.name}: ${x.reason}`).join(", ") })}
      />
    </Example>
  );
}

export function RatingExamples() {
  return (
    <Example
      title="Rating"
      description="Native radio inputs underneath: arrow keys and forms work as usual. Stars preview on hover."
      code={`<Rating label="Rate this recipe" defaultValue={4} />
<Rating readOnly value={4} size="sm" />`}
    >
      <Rating label="Rate this recipe" defaultValue={4} size="lg" />
      <Rating readOnly value={4} size="sm" />
    </Example>
  );
}

/* ----------------------------------------------------------------- Feedback */

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);
const portNotifications = (): NotificationItem[] => [
  { id: "n1", title: "Iran Shahr berthed at Berth 2", description: "Shahid Rajaee terminal · 14 containers to discharge", time: minutesAgo(4), tone: "success", category: "vessels", icon: <Ship /> },
  { id: "n2", title: "Customs hold on MSKU 482117", description: "Documents requested by Bandar Abbas customs", time: minutesAgo(38), tone: "warning", category: "customs" },
  { id: "n3", title: "Berth 3 maintenance moved to 18:00", time: minutesAgo(130), tone: "info", category: "vessels" },
  { id: "n4", title: "Reefer alarm cleared on CMAU 220931", time: minutesAgo(60 * 22), tone: "success", category: "cargo", read: true },
  { id: "n5", title: "Payment overdue: INV-2026-079", description: "Kish Freight Lines · $42,800", time: minutesAgo(60 * 50), tone: "danger", category: "billing", read: true },
];
const notificationCategories = [
  { id: "vessels", label: "Vessels" },
  { id: "customs", label: "Customs" },
  { id: "cargo", label: "Cargo" },
  { id: "billing", label: "Billing" },
];

export function CircularProgressExamples() {
  const [value, setValue] = useState(35);
  return (
    <Example title="CircularProgress" code={`<CircularProgress aria-label="Upload" value={65} />\n<CircularProgress aria-label="Syncing" />`}>
      <CircularProgress aria-label="Upload" value={value} size={72} />
      <CircularProgress aria-label="Storage" value={82} tone="warning" size={56} />
      <CircularProgress aria-label="Syncing" tone="primary" size={40} thickness={4} />
      <Button size="sm" variant="outline" onClick={() => setValue((v) => (v >= 100 ? 10 : v + 15))}>
        Advance
      </Button>
    </Example>
  );
}

export function BannerExamples() {
  const [banner, setBanner] = useState(true);
  return (
    <Example
      title="Banner"
      description="A page-level announcement. The gradient variant pans slowly."
      code={`<Banner variant="gradient" action={<Button size="xs">Learn more</Button>} onDismiss={hide}>
  Nova UI 1.0 is here
</Banner>`}
      className="p-0! sm:p-0!"
    >
      <Stack gap={0} className="w-full overflow-hidden rounded-t-(--nv-card-radius)">
        {banner ? (
          <Banner
            onDismiss={() => setBanner(false)}
            action={
              <Button size="xs" variant="neutral">
                Learn more
              </Button>
            }
          >
            Nova UI 1.0 is here — motion, 25 new components and local installs.
          </Banner>
        ) : (
          <div className="p-4">
            <Button size="sm" variant="outline" onClick={() => setBanner(true)}>
              Show banner again
            </Button>
          </div>
        )}
        <Banner variant="warning">Scheduled maintenance on Sunday, 02:00–03:00 UTC.</Banner>
      </Stack>
    </Example>
  );
}

export function NotificationCenterExamples() {
  const [notifications, setNotifications] = useState(portNotifications);
  return (
    <Example
      title="NotificationCenter"
      description="A bell with an unread count that opens recent notifications grouped by day. Filter by unread or category, mark one or all as read, dismiss, and open an item. New arrivals are announced to screen readers; times use the locale."
      code={`<NotificationCenter
  items={items}
  categories={[{ id: "vessels", label: "Vessels" }, { id: "customs", label: "Customs" }]}
  onMarkRead={(id, read) => …}
  onMarkAllRead={() => …}
  onDismiss={(id) => …}
  onItemClick={(item) => router.push(…)}
  footer={<Link href="/notifications">View all</Link>}
/>`}
    >
      <NotificationCenter
        items={notifications}
        categories={notificationCategories}
        onMarkRead={(id, read) => setNotifications((all) => all.map((n) => (n.id === id ? { ...n, read } : n)))}
        onMarkAllRead={() => setNotifications((all) => all.map((n) => ({ ...n, read: true })))}
        onDismiss={(id) => setNotifications((all) => all.filter((n) => n.id !== id))}
        footer={
          <Button size="xs" variant="link">
            View all notifications
          </Button>
        }
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          setNotifications((all) => [
            { id: `n${Date.now()}`, title: "Pilot boarded Kish Star", description: "ETA Berth 5 in 40 minutes", time: new Date(), tone: "info", category: "vessels" },
            ...all,
          ])
        }
      >
        Simulate an arrival
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setNotifications(portNotifications())}>
        Reset
      </Button>
    </Example>
  );
}

/* --------------------------------------------------------------- Navigation */

const portTree = [
  {
    id: "bandar-abbas",
    label: "Bandar Abbas",
    icon: <Building2 />,
    badge: "3",
    children: [
      {
        id: "shahid-rajaee",
        label: "Shahid Rajaee",
        icon: <Container />,
        badge: "24",
        children: [
          { id: "sr-berth-1", label: "Berth 1", icon: <Anchor />, badge: "MSC Aurora" },
          { id: "sr-berth-2", label: "Berth 2", icon: <Anchor />, badge: "Iran Shahr" },
          { id: "sr-berth-3", label: "Berth 3", icon: <Anchor /> },
        ],
      },
      { id: "shahid-bahonar", label: "Shahid Bahonar", icon: <Container />, badge: "8" },
      { id: "old-jetty", label: "Old jetty (closed)", icon: <Anchor />, disabled: true },
    ],
  },
  {
    id: "bushehr",
    label: "Bushehr",
    icon: <Building2 />,
    children: [{ id: "bushehr-ct", label: "Container terminal", icon: <Container />, badge: "6" }],
  },
  { id: "chabahar", label: "Chabahar", icon: <Building2 />, children: [{ id: "shahid-beheshti", label: "Shahid Beheshti", icon: <Ship />, badge: "4" }] },
];

export function HoverCardExamples() {
  return (
    <Example
      title="HoverCard"
      description="A preview for sighted pointer and keyboard users. Keep it supplementary: the link must still work on its own."
      code={`<HoverCard>
  <HoverCardTrigger asChild><Link href="/u/ada">@ada</Link></HoverCardTrigger>
  <HoverCardContent>…</HoverCardContent>
</HoverCard>`}
      className="items-start"
    >
      <Text size="sm">
        Built by{" "}
        <HoverCard openDelay={150}>
          <HoverCardTrigger asChild>
            <Link href={to("navigation")}>@ada</Link>
          </HoverCardTrigger>
          <HoverCardContent className="flex gap-3">
            <Avatar name="Ada Lovelace" status="online" />
            <div className="flex flex-col gap-1">
              <Text weight="semibold" size="sm">
                Ada Lovelace
              </Text>
              <Text size="xs" tone="muted">
                Writes the first algorithms. Joined 1843.
              </Text>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
        — hover or focus the name.
      </Text>
    </Example>
  );
}

export function CollapsibleExamples() {
  return (
    <Example
      title="Collapsible"
      code={`<Collapsible>
  <CollapsibleTrigger asChild><Button variant="ghost">3 more files</Button></CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`}
      className="items-start"
    >
      <Collapsible className="w-64">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Text size="sm" weight="semibold">
            nova-ui — 4 files
          </Text>
          <CollapsibleTrigger asChild>
            <Button size="xs" variant="ghost" aria-label="Toggle files">
              <ChevronsUpDown />
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="mt-2 rounded-md border border-border px-3 py-2 font-mono text-xs">button.tsx</div>
        <CollapsibleContent className="flex flex-col gap-2 pt-2">
          {["calendar.tsx", "motion.tsx", "display.tsx"].map((f) => (
            <div key={f} className="rounded-md border border-border px-3 py-2 font-mono text-xs">
              {f}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </Example>
  );
}

export function MenubarExamples() {
  const [showBerths, setShowBerths] = useState(true);
  const [units, setUnits] = useState("teu");
  return (
    <Example
      title="Menubar"
      description="Application menus with one tab stop: Left/Right move between menus (mirrored in RTL), Down or Enter opens one, and submenus, checkbox and radio items work as in DropdownMenu."
      code={`<Menubar aria-label="Application">
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New voyage <MenuShortcut>Ctrl+N</MenuShortcut></MenubarItem>
      <MenubarSub>
        <MenubarSubTrigger>Export</MenubarSubTrigger>
        <MenubarSubContent>…</MenubarSubContent>
      </MenubarSub>
    </MenubarContent>
  </MenubarMenu>
  …
</Menubar>`}
    >
      <Menubar aria-label="Application">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New voyage <MenuShortcut>Ctrl+N</MenuShortcut>
            </MenubarItem>
            <MenubarItem>
              Open manifest… <MenuShortcut>Ctrl+O</MenuShortcut>
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Export</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Manifest (CSV)</MenubarItem>
                <MenubarItem>Bill of lading (PDF)</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem destructive>Cancel voyage</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={showBerths} onCheckedChange={setShowBerths}>
              Show berths
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarRadioGroup value={units} onValueChange={setUnits}>
              <MenubarRadioItem value="teu">Volume in TEU</MenubarRadioItem>
              <MenubarRadioItem value="tonnes">Volume in tonnes</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Keyboard shortcuts</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Example>
  );
}

export function ToolbarExamples() {
  return (
    <Example
      title="Toolbar"
      description="A row of actions and toggles with one tab stop; arrow keys move between them. Toggle groups take single or multiple selection. Label the toolbar and every icon-only control."
      code={`<Toolbar aria-label="Report formatting">
  <ToolbarToggleGroup type="multiple" aria-label="Text style">
    <ToolbarToggleItem value="bold" aria-label="Bold"><Bold /></ToolbarToggleItem>
    …
  </ToolbarToggleGroup>
  <ToolbarSeparator />
  <ToolbarButton><Printer /> Print</ToolbarButton>
</Toolbar>`}
    >
      <Toolbar aria-label="Report formatting">
        <ToolbarToggleGroup type="multiple" aria-label="Text style" defaultValue={["bold"]}>
          <ToolbarToggleItem value="bold" aria-label="Bold">
            <Bold />
          </ToolbarToggleItem>
          <ToolbarToggleItem value="italic" aria-label="Italic">
            <Italic />
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarToggleGroup type="single" aria-label="Alignment" defaultValue="left">
          <ToolbarToggleItem value="left" aria-label="Align start">
            <AlignLeft className="rtl:-scale-x-100" />
          </ToolbarToggleItem>
          <ToolbarToggleItem value="center" aria-label="Align center">
            <AlignCenter />
          </ToolbarToggleItem>
          <ToolbarToggleItem value="right" aria-label="Align end">
            <AlignRight className="rtl:-scale-x-100" />
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton>
          <Printer /> Print
        </ToolbarButton>
        <ToolbarButton>
          <Share2 /> Share
        </ToolbarButton>
      </Toolbar>
    </Example>
  );
}

export function TreeViewExamples() {
  return (
    <>
      <TreeViewSingleExample />
      <TreeViewCheckableExample />
    </>
  );
}

function TreeViewSingleExample() {
  const [berth, setBerth] = useState<string | null>("sr-berth-2");
  return (
    <Example
      title="TreeView"
      description="Hierarchies that expand and collapse: ports, terminals, berths. One tab stop; arrows move and open, Home/End jump, Enter/Space select, * opens every sibling, and typing jumps to a matching label. Left and Right mirror in RTL."
      code={`<TreeView
  label="Ports"
  items={[{ id: "bandar-abbas", label: "Bandar Abbas", icon: <Building2 />, children: […] }, …]}
  defaultExpanded={["bandar-abbas", "shahid-rajaee"]}
  selected={berth}
  onSelectedChange={setBerth}
/>`}
      className="items-start"
    >
      <TreeView
        label="Ports"
        items={portTree}
        defaultExpanded={["bandar-abbas", "shahid-rajaee"]}
        selected={berth}
        onSelectedChange={(id) => setBerth(id)}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-1.5"
      />
      <Text size="sm" tone="muted">
        Selected: <code>{berth ?? "none"}</code>
      </Text>
    </Example>
  );
}

function TreeViewCheckableExample() {
  const [checked, setChecked] = useState<string[]>(["sr-berth-2"]);
  return (
    <Example
      title="Checkboxes"
      description="checkable picks several items. Checking a branch checks every leaf under it, and a branch shows checked, mixed or unchecked from its leaves. Space toggles; clicking a branch row still opens it. The value is the checked leaf ids."
      code={`<TreeView label="Berths" items={portTree} checkable checkedIds={checked} onCheckedIdsChange={setChecked} />`}
      className="items-start"
    >
      <TreeView
        label="Berths"
        items={portTree}
        checkable
        defaultExpanded={["bandar-abbas"]}
        checkedIds={checked}
        onCheckedIdsChange={setChecked}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-1.5"
      />
      <Text size="sm" tone="muted">
        Checked: <code>{checked.length ? checked.join(", ") : "none"}</code>
      </Text>
    </Example>
  );
}

export function StepperExamples() {
  const [step, setStep] = useState(1);
  const steps = [
    { title: "Account", description: "Email & password" },
    { title: "Workspace", description: "Name your team" },
    { title: "Invite", description: "Add teammates" },
    { title: "Done" },
  ];
  return (
    <Example
      title="Stepper"
      description="Checkmarks draw in, the current step pulses, connectors fill as you advance. Completed steps can be clickable."
      code={`<Stepper steps={steps} current={step} onStepClick={setStep} />`}
    >
      <Stack gap={4} className="w-full">
        <Stepper steps={steps} current={step} onStepClick={setStep} />
        <Inline justify="center">
          <Button size="sm" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          <Button size="sm" disabled={step === steps.length} onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        </Inline>
      </Stack>
    </Example>
  );
}

/* --------------------------------------------------------------------- Data */

export function ScrollAreaExamples() {
  return (
    <Example title="ScrollArea" code={`<ScrollArea className="h-48">…</ScrollArea>`} className="items-start">
      <ScrollArea className="h-48 w-56 rounded-lg border border-border">
        <div className="flex flex-col p-3">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} className="border-b border-border py-1.5 text-sm last:border-0">
              Release v0.{24 - i}.0
            </span>
          ))}
        </div>
      </ScrollArea>
    </Example>
  );
}

export function AspectRatioExamples() {
  return (
    <Example title="AspectRatio" code={`<AspectRatio ratio={16 / 9}><img src="…" alt="…" /></AspectRatio>`} className="items-start">
      <AspectRatio ratio={16 / 9} className="w-72 bg-(image:--nv-gradient-mesh) ring-1 ring-border">
        <div className="flex size-full items-center justify-center font-display text-lg font-bold text-foreground">16 : 9</div>
      </AspectRatio>
    </Example>
  );
}

export function StatExamples() {
  return (
    <Example
      title="Stat and Sparkline"
      description="Numbers count up, sparklines draw themselves, cards lift on hover."
      code={`<Stat label="Revenue" value={48200} format={{ style: "currency", currency: "USD" }} delta={12.4}
  trend={[12, 18, 15, 22, 28, 26, 34]} icon={<DollarSign />} />`}
    >
      <Grid columns={3} gap={4} className="w-full">
        <Stat label="Revenue" value={48200} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} delta={12.4} helpText="vs last month" icon={<DollarSign />} trend={[12, 18, 15, 22, 28, 26, 34]} />
        <Stat label="Active users" value={9812} delta={4.1} icon={<Users />} trend={[40, 42, 41, 45, 47, 46, 50]} />
        <Stat label="Churn" value="2.1%" delta={0.6} invertDelta helpText="lower is better" icon={<CircleCheck />} trend={[2, 1.8, 1.9, 2, 2.2, 2.1, 2.4]} />
      </Grid>
      <Sparkline data={[3, 5, 4, 8, 6, 9, 12, 10, 14]} label="Signups over 9 weeks, trending up" tone="success" className="max-w-xs" />
    </Example>
  );
}

export function TimelineExamples() {
  return (
    <Example
      title="Timeline"
      code={`<Timeline items={[{ title: "Order placed", time: "9:41", tone: "primary", icon: <Package /> }, …]} />`}
      className="items-start"
    >
      <Timeline
        className="w-full max-w-md"
        items={[
          { title: "Order placed", description: "2 items · $128.00", time: "Mon 9:41", tone: "primary", icon: <Package /> },
          { title: "Shipped", description: "Tracking 1Z 999 AA1", time: "Tue 14:02", tone: "info", icon: <Truck /> },
          { title: "Delivered", description: "Left at the front door", time: "Thu 11:20", tone: "success", icon: <CircleCheck /> },
          { title: "Review requested", time: "Thu 18:00", icon: <GitCommit /> },
        ]}
      />
    </Example>
  );
}

export function CarouselExamples() {
  return (
    <Example
      title="Carousel"
      description="Scroll-snap based: swipe, trackpad and keyboard scrolling work natively; buttons and dots animate."
      code={`<Carousel label="Featured" slideSize="80%">
  {slides.map((s) => <Card key={s.id}>…</Card>)}
</Carousel>`}
    >
      <Carousel label="Featured themes" slideSize="min(80%, 22rem)" className="w-full">
        {["Vibrant", "Ocean", "Sunset", "Forest", "Berry"].map((name, i) => (
          <Card key={name} variant={i % 2 ? "tinted" : "featured"} className="h-40 justify-end">
            <Text weight="bold" className="font-display text-xl">
              {name}
            </Text>
            <Text size="sm" tone="muted">
              Slide {i + 1}
            </Text>
          </Card>
        ))}
      </Carousel>
    </Example>
  );
}
