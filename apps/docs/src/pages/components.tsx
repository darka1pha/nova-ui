import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarGroup,
  Badge,
  BarList,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Code,
  Combobox,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPalette,
  CommandShortcut,
  Container,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DataTable,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Fieldset,
  FormField,
  Grid,
  Heading,
  IconButton,
  Inline,
  Input,
  InputGroup,
  Kbd,
  Link,
  LoadingState,
  MenuShortcut,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NumberInput,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Radio,
  RadioGroup,
  SearchInput,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sidebar,
  SidebarItem,
  SidebarSection,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  StatusIndicator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  chartColors,
  toast,
  type DataTableColumn,
} from "@kaleido/ui";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
  Calendar,
  Copy,
  CreditCard,
  Download,
  Heart,
  Home,
  Inbox,
  Italic,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Underline,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { A11yNotes, capitalize, Example, Page, PropsTable } from "../docs/kit.tsx";
import { ActionsExtras, DataExtras, FeedbackExtras, FormsExtras, NavigationExtras } from "./extras.tsx";

/* ---------------------------------------------------------- Layout & type */

export function LayoutPage() {
  return (
    <Page eyebrow="Foundations" title="Layout & typography" lead="Primitives for consistent spacing, responsive grids and a type scale with expressive display sizes.">
      <Example
        title="Headings"
        description="Semantic level and visual size are independent. Display sizes use the theme's display font."
        code={`<Heading level={1} size="display" gradient>Make it vivid</Heading>
<Heading level={2} size="xl">Section heading</Heading>
<Heading level={3}>Card heading</Heading>`}
      >
        <Stack gap={3}>
          <Heading level={2} size="2xl" gradient>
            Make it vivid
          </Heading>
          <Heading level={3} size="xl">
            Section heading
          </Heading>
          <Heading level={4}>Card heading</Heading>
        </Stack>
      </Example>
      <Example
        title="Text"
        code={`<Text size="lg">Lead paragraph</Text>
<Text tone="muted" size="sm">Helper text</Text>
<Text tone="danger" weight="semibold">Something went wrong</Text>
<Link href="#">Inline link</Link> · <Code>npm i</Code> · <Kbd>Ctrl</Kbd><Kbd>K</Kbd>`}
      >
        <Stack gap={2}>
          <Text size="lg">Lead paragraph that sets the scene with comfortable measure.</Text>
          <Text tone="muted" size="sm">
            Helper text for secondary information.
          </Text>
          <Text tone="danger" weight="semibold">
            Something went wrong
          </Text>
          <Text>
            <Link href="#/layout">Inline link</Link> · <Code>pnpm add @kaleido/ui</Code> · <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
          </Text>
        </Stack>
      </Example>
      <Example
        title="Stack, Inline and Grid"
        description="Gaps follow the spacing scale. Grid columns collapse on small screens; columns='auto' fills by a minimum width."
        code={`<Grid columns="auto" minColumnWidth="10rem" gap={3}>
  {items.map((item) => <Card key={item}>{item}</Card>)}
</Grid>`}
      >
        <Grid columns="auto" minColumnWidth="10rem" gap={3} className="w-full">
          {["Design", "Build", "Ship", "Learn"].map((x, i) => (
            <Card key={x} variant={i === 0 ? "tinted" : "outline"} className="items-center p-4 text-center font-semibold">
              {x}
            </Card>
          ))}
        </Grid>
      </Example>
      <Example title="Separator, Skeleton and Spinner" code={`<Separator />\n<Skeleton className="h-4 w-48" />\n<Spinner tone="primary" />`}>
        <Stack gap={3} className="w-full">
          <Inline gap={3}>
            <Skeleton shape="circle" className="size-10" />
            <Stack gap={2} className="flex-1">
              <Skeleton shape="text" className="w-1/2" />
              <Skeleton shape="text" className="w-1/3" />
            </Stack>
          </Inline>
          <Separator />
          <Inline gap={4}>
            <Spinner size="sm" tone="primary" />
            <Spinner tone="primary" />
            <Spinner size="lg" tone="primary" />
          </Inline>
        </Stack>
      </Example>
      <PropsTable
        props={[
          { name: "Stack.gap", type: "0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16", default: "4", description: "Spacing between children (× 0.25rem)." },
          { name: "Grid.columns", type: '1 | 2 | 3 | 4 | 6 | "auto"', default: '"auto"', description: "Responsive column count." },
          { name: "Container.size", type: '"sm" | "md" | "lg" | "xl" | "prose" | "full"', default: '"lg"', description: "Max width with responsive gutters." },
          { name: "Heading.level", type: "1–6", default: "2", description: "Semantic heading element." },
          { name: "Heading.size", type: '"xs" … "2xl" | "display"', default: "from level", description: "Visual size." },
          { name: "Text.tone", type: '"default" | "secondary" | "muted" | "primary" | status', default: '"default"', description: "Semantic text color." },
          { name: "asChild", type: "boolean", default: "false", description: "Render your own element with these styles." },
        ]}
      />
      <Container size="full" className="px-0!" />
    </Page>
  );
}

/* ----------------------------------------------------------------- Actions */

export function ActionsPage() {
  const [loading, setLoading] = useState(false);
  return (
    <Page eyebrow="Components" title="Actions" lead="Buttons, toggles and menus. Variants express intent; the active theme decides how they look.">
      <Example
        title="Variants"
        code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="accent">Accent</Button>
<Button variant="soft">Soft</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="gradient">Gradient</Button>
<Button variant="link">Link</Button>`}
      >
        {(["primary", "secondary", "accent", "neutral", "soft", "outline", "ghost", "danger", "success", "gradient", "link"] as const).map((v) => (
          <Button key={v} variant={v}>
            {capitalize(v)}
          </Button>
        ))}
      </Example>
      <Example title="Sizes" code={`<Button size="xs">XS</Button> … <Button size="xl">XL</Button>`}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
          <Button key={s} size={s}>
            Size {s}
          </Button>
        ))}
      </Example>
      <Example
        title="Icons, loading and disabled"
        code={`<Button startIcon={<Plus />}>New project</Button>
<Button variant="outline" endIcon={<ArrowRight />}>Continue</Button>
<Button loading loadingText="Saving…">Save</Button>
<Button disabled>Disabled</Button>
<IconButton aria-label="Settings"><Settings /></IconButton>`}
      >
        <Button startIcon={<Plus />}>New project</Button>
        <Button variant="outline" endIcon={<ArrowRight className="rtl:-scale-x-100" />}>
          Continue
        </Button>
        <Button
          loading={loading}
          loadingText="Saving…"
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1600);
          }}
        >
          Click to save
        </Button>
        <Button disabled>Disabled</Button>
        <Tooltip content="Settings">
          <IconButton aria-label="Settings">
            <Settings />
          </IconButton>
        </Tooltip>
        <IconButton aria-label="Favorite" variant="soft">
          <Heart />
        </IconButton>
      </Example>
      <Example
        title="ButtonGroup"
        code={`<ButtonGroup variant="outline" attached>
  <Button>Day</Button><Button>Week</Button><Button>Month</Button>
</ButtonGroup>`}
      >
        <ButtonGroup variant="outline" attached>
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="ghost">Cancel</Button>
          <Button>Save changes</Button>
        </ButtonGroup>
      </Example>
      <Example
        title="Toggle and ToggleGroup"
        code={`<ToggleGroup type="multiple" aria-label="Formatting">
  <ToggleGroupItem value="bold" aria-label="Bold"><Bold /></ToggleGroupItem>
  …
</ToggleGroup>`}
      >
        <Toggle aria-label="Bold" variant="outline">
          <Bold />
        </Toggle>
        <ToggleGroup type="multiple" aria-label="Formatting">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <Underline />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" defaultValue="left" aria-label="Alignment">
          <ToggleGroupItem value="left" aria-label="Align start">
            <AlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align end">
            <AlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </Example>
      <Example
        title="DropdownMenu and ContextMenu"
        code={`<DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="outline">Options</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Project</DropdownMenuLabel>
    <DropdownMenuItem>Rename <MenuShortcut>F2</MenuShortcut></DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" endIcon={<MoreHorizontal />}>
              Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Project</DropdownMenuLabel>
            <DropdownMenuItem>
              <Copy /> Duplicate <MenuShortcut>Ctrl D</MenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download /> Export
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem checked>Show in sidebar</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border-strong text-sm text-foreground-muted">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Open</ContextMenuItem>
            <ContextMenuItem>Rename</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem destructive>Move to trash</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Example>
      <ActionsExtras />
      <PropsTable
        title="Button props"
        props={[
          { name: "variant", type: '"primary" | "secondary" | "accent" | "neutral" | "soft" | "outline" | "ghost" | "danger" | "success" | "gradient" | "link"', default: '"primary"', description: "Visual intent." },
          { name: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: "Height follows control-height tokens and density." },
          { name: "loading", type: "boolean", default: "false", description: "Spinner, aria-busy, disabled." },
          { name: "loadingText", type: "string", description: "Label while loading." },
          { name: "startIcon / endIcon", type: "ReactNode", description: "Icons before/after the label. The end icon nudges forward on hover." },
          { name: "ripple", type: "boolean", default: "false", description: "Ink ripple from the press point." },
          { name: "fullWidth", type: "boolean", default: "false", description: "Stretch to the container." },
          { name: "asChild", type: "boolean", default: "false", description: "Style a child element (e.g. a router link)." },
          { name: "className", type: "string", description: "Merged with tailwind-merge; your classes win conflicts." },
        ]}
      />
      <A11yNotes
        items={[
          "Buttons render a native <button type=\"button\"> so Enter and Space work and forms are not submitted by accident.",
          "IconButton requires aria-label at the type level.",
          "Menus support arrow keys, typeahead, Home/End and Escape, and return focus to the trigger.",
          "Use a link (asChild with <a>) for navigation and a button for actions.",
        ]}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------- Forms */

export function FormsPage() {
  const [email, setEmail] = useState("");
  const invalid = email.length > 0 && !email.includes("@");
  const [fw, setFw] = useState<string | null>("react");
  return (
    <Page eyebrow="Components" title="Forms" lead="Inputs and controls that wire up labels, descriptions and errors automatically through FormField.">
      <Example
        title="FormField"
        description="Wrap any control. It receives id, aria-describedby, aria-invalid, required and disabled."
        code={`<FormField label="Email" description="We'll send a confirmation." error={error} required>
  <Input type="email" />
</FormField>`}
        className="items-start"
      >
        <Stack gap={4} className="w-full max-w-sm">
          <FormField label="Email" description="We'll send a confirmation." error={invalid ? "Enter a valid email address" : undefined} required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </FormField>
          <FormField label="Bio">
            <Textarea placeholder="Tell us a little about yourself" autoResize />
          </FormField>
        </Stack>
      </Example>
      <Example
        title="Input sizes, groups and states"
        code={`<InputGroup start={<Mail />}><Input placeholder="Email" /></InputGroup>
<SearchInput placeholder="Search…" aria-label="Search" />
<Input size="sm" disabled placeholder="Disabled" />`}
      >
        <Stack gap={3} className="w-full max-w-sm">
          <Input size="sm" placeholder="Small" aria-label="Small input" />
          <Input placeholder="Medium" aria-label="Medium input" />
          <Input size="lg" placeholder="Large" aria-label="Large input" />
          <InputGroup start={<Mail />}>
            <Input placeholder="Email" aria-label="Email with icon" />
          </InputGroup>
          <SearchInput placeholder="Search projects…" aria-label="Search projects" />
          <Input disabled placeholder="Disabled" aria-label="Disabled input" />
          <Input readOnly value="Read only" aria-label="Read-only input" />
        </Stack>
      </Example>
      <Example
        title="NumberInput"
        description="Arrow keys, Page Up/Down, Home/End; formats with Intl when not focused."
        code={`<NumberInput defaultValue={1200} min={0} step={50}
  formatOptions={{ style: "currency", currency: "EUR" }} />`}
      >
        <Stack gap={3} className="w-full max-w-xs">
          <FormField label="Budget">
            <NumberInput defaultValue={1200} min={0} step={50} formatOptions={{ style: "currency", currency: "EUR" }} />
          </FormField>
          <FormField label="Seats">
            <NumberInput defaultValue={5} min={1} max={50} />
          </FormField>
        </Stack>
      </Example>
      <Example
        title="Checkbox, Radio and Switch"
        code={`<FormField label="Email me updates" inline><Checkbox /></FormField>
<RadioGroup defaultValue="pro">…</RadioGroup>
<FormField label="Dark mode" inline><Switch /></FormField>`}
        className="items-start"
      >
        <Stack gap={3}>
          <FormField label="Email me product updates" description="About once a month." inline>
            <Checkbox defaultChecked />
          </FormField>
          <FormField label="Partially selected" inline>
            <Checkbox checked="indeterminate" />
          </FormField>
          <FormField label="Enable notifications" inline>
            <Switch defaultChecked />
          </FormField>
        </Stack>
        <Fieldset legend="Plan">
          <RadioGroup defaultValue="pro" aria-label="Plan">
            {["Starter", "Pro", "Enterprise"].map((p) => (
              <div key={p} className="flex items-center gap-2">
                <Radio value={p.toLowerCase()} id={`plan-${p}`} />
                <label htmlFor={`plan-${p}`} className="text-sm font-medium">
                  {p}
                </label>
              </div>
            ))}
          </RadioGroup>
        </Fieldset>
      </Example>
      <Example
        title="Select and Combobox"
        description="Use Select for short lists, Combobox when people need to search."
        code={`<Select defaultValue="eu">
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="eu">Europe</SelectItem>
  </SelectContent>
</Select>

<Combobox options={frameworks} value={fw} onValueChange={setFw} />`}
      >
        <Stack gap={3} className="w-full max-w-xs">
          <FormField label="Region">
            <Select defaultValue="eu">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Regions</SelectLabel>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="ap">Asia Pacific</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Framework">
            <Combobox
              value={fw}
              onValueChange={setFw}
              options={["React", "Next.js", "Remix", "Astro", "Vite", "Gatsby", "Expo"].map((l) => ({ value: l.toLowerCase(), label: l }))}
            />
          </FormField>
        </Stack>
      </Example>
      <Example title="Slider" code={`<Slider defaultValue={[20, 80]} thumbLabels={["Minimum", "Maximum"]} />`}>
        <Stack gap={6} className="w-full max-w-sm">
          <Slider defaultValue={[40]} thumbLabels={["Volume"]} />
          <Slider defaultValue={[20, 80]} thumbLabels={["Minimum price", "Maximum price"]} />
        </Stack>
      </Example>
      <FormsExtras />
      <PropsTable
        title="FormField props"
        props={[
          { name: "label", type: "ReactNode", description: "Visible label, linked with htmlFor." },
          { name: "description", type: "ReactNode", description: "Helper text, linked via aria-describedby." },
          { name: "error", type: "ReactNode", description: "Marks the control invalid; announced with role=alert." },
          { name: "required / disabled", type: "boolean", default: "false", description: "Forwarded to the control." },
          { name: "inline", type: "boolean", default: "false", description: "Label beside the control (checkbox, switch)." },
        ]}
      />
      <A11yNotes
        items={[
          "Every control has a visible focus ring with ≥3:1 contrast, and input borders meet 3:1 against their surface.",
          "Errors use an icon and text, never color alone.",
          "Use Fieldset with a legend to name groups of radios or checkboxes.",
          "Calendar follows the WAI-ARIA date grid pattern: arrows, Home/End, Page Up/Down (Shift for years); arrows mirror in RTL.",
          "PinInput labels every box (\"Character 2 of 6\") and uses autocomplete=\"one-time-code\" so phones can fill SMS codes.",
        ]}
      />
    </Page>
  );
}

/* ---------------------------------------------------------------- Feedback */

export function FeedbackPage() {
  const [progress, setProgress] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 10 : p + 10)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <Page eyebrow="Components" title="Feedback" lead="Status, messages and progress. Every status pairs color with an icon or text, so meaning never depends on color alone.">
      <Example
        title="Alert"
        code={`<Alert variant="success" title="Deployed">Your site is live.</Alert>
<Alert variant="danger" title="Payment failed" action={<Button size="sm" variant="danger">Retry</Button>} />`}
      >
        <Stack gap={3} className="w-full">
          <Alert variant="info" title="Heads up">
            A new version is available. <a href="#/migration">See what changed</a>.
          </Alert>
          <Alert variant="success" title="Deployed successfully" onDismiss={() => toast("Dismissed")}>
            Your site is live at kaleido.dev.
          </Alert>
          <Alert variant="warning" title="Review required" />
          <Alert
            variant="danger"
            title="Payment failed"
            action={
              <Button size="sm" variant="danger">
                Retry payment
              </Button>
            }
          >
            Your card was declined.
          </Alert>
          <Alert variant="primary" title="Tip">
            Press <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> to open the command palette.
          </Alert>
        </Stack>
      </Example>
      <Example
        title="Badge"
        code={`<Badge variant="success">Completed</Badge>
<Badge variant="primary" appearance="solid">New</Badge>
<Badge variant="warning" dot>Pending</Badge>
<Badge variant="gradient">Pro</Badge>`}
      >
        <Stack gap={3}>
          <Inline>
            {(["neutral", "primary", "secondary", "accent", "success", "warning", "danger", "info"] as const).map((t) => (
              <Badge key={t} variant={t}>
                {t}
              </Badge>
            ))}
          </Inline>
          <Inline>
            {(["primary", "secondary", "accent", "success", "warning", "danger"] as const).map((t) => (
              <Badge key={t} variant={t} appearance="solid">
                {t}
              </Badge>
            ))}
          </Inline>
          <Inline>
            <Badge variant="success" dot>
              Online
            </Badge>
            <Badge variant="danger" appearance="outline">
              Outline
            </Badge>
            <Badge variant="gradient">Pro</Badge>
            <Badge size="sm">sm</Badge>
            <Badge size="lg">lg</Badge>
          </Inline>
        </Stack>
      </Example>
      <Example
        title="Toast"
        description="Call toast() from anywhere. Mount <Toaster /> once inside your ThemeProvider."
        code={`toast.success("Changes saved", { description: "All good." });
toast.error("Upload failed", { action: { label: "Retry", altText: "Retry upload", onClick: retry } });`}
      >
        <Button variant="outline" onClick={() => toast("Event created", { description: "Friday, 10:00 AM" })}>
          Default
        </Button>
        <Button variant="success" onClick={() => toast.success("Changes saved", { description: "Everything is up to date." })}>
          Success
        </Button>
        <Button variant="danger" onClick={() => toast.error("Upload failed", { action: { label: "Retry", altText: "Retry the upload", onClick: () => toast.info("Retrying…") } })}>
          Error with action
        </Button>
      </Example>
      <Example title="Progress" code={`<Progress aria-label="Upload" value={60} />\n<Progress aria-label="Syncing" /> {/* indeterminate */}`}>
        <Stack gap={4} className="w-full max-w-md">
          <Progress aria-label="Animated progress" value={progress} />
          <Progress aria-label="Success" value={100} tone="success" size="sm" />
          <Progress aria-label="Warning" value={45} tone="warning" />
          <Progress aria-label="Syncing" size="lg" tone="primary" />
        </Stack>
      </Example>
      <Example title="StatusIndicator" code={`<StatusIndicator status="online" label="Online" pulse />`}>
        <StatusIndicator status="online" label="Online" pulse />
        <StatusIndicator status="away" label="Away" />
        <StatusIndicator status="busy" label="Do not disturb" />
        <StatusIndicator status="offline" label="Offline" />
      </Example>
      <Example
        title="Empty, error and loading states"
        code={`<EmptyState title="No projects yet" description="…" actions={<Button>Create project</Button>} />
<ErrorState title="Couldn't load" actions={<Button variant="outline">Try again</Button>} />
<LoadingState title="Loading projects…" />`}
      >
        <Grid columns={3} gap={3} className="w-full">
          <Card variant="outline" className="p-0">
            <EmptyState size="sm" title="No projects yet" description="Projects you create will show up here." actions={<Button size="sm" startIcon={<Plus />}>New project</Button>} />
          </Card>
          <Card variant="outline" className="p-0">
            <ErrorState size="sm" title="Couldn't load data" description="Check your connection." actions={<Button size="sm" variant="outline">Try again</Button>} />
          </Card>
          <Card variant="outline" className="p-0">
            <LoadingState size="sm" title="Loading projects…" />
          </Card>
        </Grid>
      </Example>
      <A11yNotes
        items={[
          "Danger and warning alerts use role=\"alert\"; others use role=\"status\" (polite).",
          "Toasts render in a labelled region (F8 jumps to it), pause on hover/focus and can be swiped away. Error toasts are announced assertively.",
          "Progress exposes aria-valuenow; give it an aria-label. Omit value for an indeterminate state.",
          "Under prefers-reduced-motion, durations collapse to near zero; state still changes visibly.",
        ]}
      />
      <FeedbackExtras />
    </Page>
  );
}

/* ---------------------------------------------------------------- Overlays */

export function OverlaysPage() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Page eyebrow="Components" title="Overlays" lead="Dialogs, sheets, popovers, tooltips and the command palette. All trap or manage focus correctly and inherit the theme they open from.">
      <Example
        title="Dialog"
        code={`<Dialog>
  <DialogTrigger asChild><Button>Edit profile</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Changes are saved to your account.</DialogDescription>
    </DialogHeader>
    …
    <DialogFooter>
      <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button>Edit profile</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Changes are saved to your account.</DialogDescription>
            </DialogHeader>
            <Stack gap={3}>
              <FormField label="Name">
                <Input defaultValue="Ada Lovelace" />
              </FormField>
              <FormField label="Username">
                <Input defaultValue="@ada" />
              </FormField>
            </Stack>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="danger" startIcon={<Trash2 />}>
              Delete project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
              <AlertDialogDescription>This permanently removes the project and its data. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="danger" onClick={() => toast.error("Project deleted")}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Example>
      <Example
        title="Sheet and Drawer"
        description="Sheets slide from any edge — start/end follow reading direction. Drawer is the bottom sheet for mobile."
        code={`<Sheet>
  <SheetTrigger asChild><Button variant="outline">Filters</Button></SheetTrigger>
  <SheetContent side="end">…</SheetContent>
</Sheet>`}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open sheet</Button>
          </SheetTrigger>
          <SheetContent side="end">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Narrow down the results.</SheetDescription>
            </SheetHeader>
            <Stack gap={4}>
              <FormField label="Only active" inline>
                <Switch defaultChecked />
              </FormField>
              <FormField label="Owner">
                <Input placeholder="Anyone" />
              </FormField>
            </Stack>
            <SheetFooter className="mt-auto">
              <Button fullWidth>Apply filters</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Share</DrawerTitle>
            <DrawerDescription>Anyone with the link can view.</DrawerDescription>
            <Inline>
              <Input readOnly value="https://kaleido.dev/s/x7Hk" aria-label="Share link" className="flex-1" />
              <Button startIcon={<Copy />}>Copy</Button>
            </Inline>
          </DrawerContent>
        </Drawer>
      </Example>
      <Example
        title="Popover and Tooltip"
        code={`<Popover>
  <PopoverTrigger asChild><Button variant="outline">Details</Button></PopoverTrigger>
  <PopoverContent>…</PopoverContent>
</Popover>
<Tooltip content="Copy link"><IconButton aria-label="Copy link"><Copy /></IconButton></Tooltip>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" startIcon={<Calendar />}>
              Schedule
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-3">
            <Text weight="semibold">Schedule post</Text>
            <FormField label="Date">
              <Input type="date" />
            </FormField>
            <Button size="sm">Schedule</Button>
          </PopoverContent>
        </Popover>
        <Tooltip content="Copy link">
          <IconButton aria-label="Copy link" variant="outline">
            <Copy />
          </IconButton>
        </Tooltip>
        <Tooltip content="Tooltips also appear on keyboard focus" side="bottom">
          <Button variant="ghost">Hover or focus me</Button>
        </Tooltip>
      </Example>
      <Example
        title="CommandPalette"
        description="Press Ctrl/⌘ K anywhere on this page."
        code={`<CommandPalette open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command…" />
  <CommandList>
    <CommandEmpty>No results.</CommandEmpty>
    <CommandGroup heading="Navigation">
      <CommandItem onSelect={…}>Dashboard</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandPalette>`}
      >
        <Button variant="outline" startIcon={<Search />} onClick={() => setPaletteOpen(true)}>
          Search… <Kbd className="ms-4">Ctrl K</Kbd>
        </Button>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen}>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {[
                ["Overview", "home", Home],
                ["Theme playground", "playground", Settings],
                ["Token reference", "tokens", Inbox],
              ].map(([label, id, Glyph]) => {
                const I = Glyph as typeof Home;
                return (
                  <CommandItem
                    key={id as string}
                    onSelect={() => {
                      window.location.hash = `#/${id as string}`;
                      setPaletteOpen(false);
                    }}
                  >
                    <I /> {label as string}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => { setPaletteOpen(false); toast.success("Invite sent"); }}>
                <Users /> Invite teammate <CommandShortcut>Ctrl I</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setPaletteOpen(false); toast.info("Billing opened"); }}>
                <CreditCard /> Billing
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandPalette>
      </Example>
      <A11yNotes
        items={[
          "Dialogs trap focus, close on Escape, restore focus to the trigger and need a DialogTitle (a dev warning appears if missing).",
          "AlertDialog does not close on outside click and focuses the least destructive action first.",
          "Tooltips show on hover and keyboard focus. Never put essential content only in a tooltip.",
          "Overlays portal into the nearest ThemeProvider, keeping its theme, mode and dir.",
        ]}
      />
    </Page>
  );
}

/* -------------------------------------------------------------- Navigation */

export function NavigationPage() {
  const [page, setPage] = useState(4);
  return (
    <Page eyebrow="Components" title="Navigation" lead="Tabs, accordions, breadcrumbs, pagination, menus and sidebar primitives.">
      <Example
        title="Tabs"
        description="Three looks: underline, pills and segmented. Arrow keys move between tabs."
        code={`<Tabs defaultValue="overview" variant="pills">
  <TabsList aria-label="Project">
    <TabsTrigger value="overview">Overview</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
</Tabs>`}
      >
        <Stack gap={6} className="w-full">
          {(["underline", "pills", "segmented"] as const).map((variant) => (
            <Tabs key={variant} defaultValue="overview" variant={variant}>
              <TabsList aria-label={`${variant} tabs`}>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="disabled" disabled>
                  Disabled
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Text tone="muted" size="sm">
                  {variant} · Overview content
                </Text>
              </TabsContent>
              <TabsContent value="activity">
                <Text tone="muted" size="sm">
                  Recent activity
                </Text>
              </TabsContent>
              <TabsContent value="settings">
                <Text tone="muted" size="sm">
                  Settings
                </Text>
              </TabsContent>
            </Tabs>
          ))}
        </Stack>
      </Example>
      <Example title="Accordion" code={`<Accordion type="single" collapsible>…</Accordion>`}>
        <Accordion type="single" collapsible className="w-full" defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>Can I use my own brand colors?</AccordionTrigger>
            <AccordionContent>Yes — pass them to ThemeProvider. Kaleido generates complete scales and keeps contrast accessible.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Does it work with Next.js?</AccordionTrigger>
            <AccordionContent>Yes, including the App Router and server rendering with no theme flash.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="c">
            <AccordionTrigger>Do I need Tailwind?</AccordionTrigger>
            <AccordionContent>No. styles.css is precompiled. If you do use Tailwind v4, import the preset to share tokens.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Example>
      <Example
        title="Breadcrumbs and Pagination"
        code={`<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem current>Settings</BreadcrumbItem>
</Breadcrumbs>
<Pagination page={page} pageCount={12} onPageChange={setPage} />`}
      >
        <Stack gap={4}>
          <Breadcrumbs>
            <BreadcrumbItem href="#/home">Home</BreadcrumbItem>
            <BreadcrumbItem href="#/navigation">Projects</BreadcrumbItem>
            <BreadcrumbItem current>Kaleido</BreadcrumbItem>
          </Breadcrumbs>
          <Pagination page={page} pageCount={12} onPageChange={setPage} />
        </Stack>
      </Example>
      <Example
        title="NavigationMenu"
        code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Products</NavigationMenuTrigger>
      <NavigationMenuContent>…</NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`}
        className="min-h-64 items-start"
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(80vw,28rem)] gap-1 sm:grid-cols-2">
                  {[
                    ["Analytics", "Understand your audience"],
                    ["Automations", "Workflows that run themselves"],
                    ["Messaging", "Reach people where they are"],
                    ["Storage", "Fast, global, durable"],
                  ].map(([t, d]) => (
                    <li key={t}>
                      <NavigationMenuLink variant="card" href="#/navigation">
                        <span className="font-semibold text-foreground">{t}</span>
                        <span className="text-foreground-muted">{d}</span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#/getting-started">Docs</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#/playground">Pricing</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </Example>
      <Example
        title="Sidebar primitives"
        code={`<Sidebar>
  <SidebarSection title="Workspace">
    <SidebarItem href="/" icon={<Home />} active>Home</SidebarItem>
    <SidebarItem href="/inbox" icon={<Inbox />} badge={<Badge size="sm">4</Badge>}>Inbox</SidebarItem>
  </SidebarSection>
</Sidebar>`}
      >
        <Card variant="outline" className="h-80 w-full flex-row overflow-hidden p-0">
          <Sidebar label="Demo" className="h-full w-56">
            <SidebarSection title="Workspace">
              <SidebarItem href="#/navigation" icon={<Home />} active>
                Home
              </SidebarItem>
              <SidebarItem href="#/navigation" icon={<Inbox />} badge={<Badge size="sm" variant="primary">4</Badge>}>
                Inbox
              </SidebarItem>
              <SidebarItem href="#/navigation" icon={<Users />}>
                Team
              </SidebarItem>
            </SidebarSection>
            <SidebarSection title="Account">
              <SidebarItem href="#/navigation" icon={<Settings />}>
                Settings
              </SidebarItem>
            </SidebarSection>
          </Sidebar>
          <div className="flex flex-1 items-center justify-center p-6">
            <Text tone="muted">Page content</Text>
          </div>
        </Card>
      </Example>
      <NavigationExtras />
      <A11yNotes
        items={[
          "Breadcrumbs, Pagination and Sidebar render <nav> landmarks with labels; the current item gets aria-current=\"page\".",
          "Chevrons and arrows flip in RTL; Tabs and menus reverse arrow-key direction automatically.",
          "Pagination labels (\"Page 3\", \"Next page\") are props, so they can be localized.",
        ]}
      />
    </Page>
  );
}

/* -------------------------------------------------------------------- Data */

interface Invoice {
  id: string;
  customer: string;
  email: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: Date;
}

const invoices: Invoice[] = [
  { id: "INV-1042", customer: "Ada Lovelace", email: "ada@analytical.io", amount: 1280, status: "paid", date: new Date("2026-09-12") },
  { id: "INV-1043", customer: "Grace Hopper", email: "grace@cobol.dev", amount: 340.5, status: "pending", date: new Date("2026-09-18") },
  { id: "INV-1044", customer: "Alan Turing", email: "alan@enigma.uk", amount: 2210, status: "overdue", date: new Date("2026-08-30") },
  { id: "INV-1045", customer: "Katherine Johnson", email: "kj@orbit.space", amount: 760, status: "paid", date: new Date("2026-10-02") },
  { id: "INV-1046", customer: "Margaret Hamilton", email: "mh@apollo.app", amount: 4100, status: "pending", date: new Date("2026-10-11") },
];

const statusVariant = { paid: "success", pending: "warning", overdue: "danger" } as const;

export function DataPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const columns: DataTableColumn<Invoice>[] = [
    { id: "id", header: "Invoice", sortable: true, cell: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span> },
    {
      id: "customer",
      header: "Customer",
      sortable: true,
      cell: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={r.customer} size="xs" />
          <span className="flex flex-col">
            <span className="font-medium">{r.customer}</span>
            <span className="text-xs text-foreground-muted">{r.email}</span>
          </span>
        </span>
      ),
    },
    { id: "status", header: "Status", sortable: true, cell: (r) => <Badge variant={statusVariant[r.status]} dot>{r.status}</Badge> },
    { id: "date", header: "Date", sortable: true, cell: (r) => r.date.toLocaleDateString(undefined, { dateStyle: "medium" }) },
    { id: "amount", header: "Amount", sortable: true, align: "end", cell: (r) => <span className="tabular-nums font-medium">{r.amount.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span> },
  ];
  return (
    <Page eyebrow="Components" title="Data display" lead="Cards, avatars, tables and lightweight charts for real product screens.">
      <Example
        title="Card"
        description="Five surfaces: elevated, outline, filled, tinted and featured (gradient frame). interactive adds hover lift."
        code={`<Card variant="featured">
  <CardHeader>
    <CardTitle>Pro plan</CardTitle>
    <CardDescription>Everything in Starter, plus…</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter><Button>Upgrade</Button></CardFooter>
</Card>`}
      >
        <Grid columns="auto" minColumnWidth="13rem" gap={4} className="w-full">
          {(["elevated", "outline", "filled", "tinted", "featured"] as const).map((v) => (
            <Card key={v} variant={v}>
              <CardHeader>
                <CardTitle>{capitalize(v)}</CardTitle>
                <CardDescription>variant="{v}"</CardDescription>
              </CardHeader>
              <CardContent>
                <Text size="sm" tone="secondary">
                  Content sits on the theme's surface tokens.
                </Text>
              </CardContent>
            </Card>
          ))}
          <Card interactive>
            <a href="#/data" className="flex flex-col gap-1 outline-none">
              <Text weight="semibold">Interactive</Text>
              <Text size="sm" tone="muted">
                Hover me, or tab to the link.
              </Text>
            </a>
          </Card>
        </Grid>
      </Example>
      <Example title="Avatar and AvatarGroup" code={`<Avatar name="Ada Lovelace" status="online" />\n<AvatarGroup max={3}>…</AvatarGroup>`}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
          <Avatar key={s} name="Ada Lovelace" size={s} status={s === "xl" ? "online" : undefined} />
        ))}
        <Avatar name="Square Co" shape="square" size="lg" />
        <AvatarGroup max={3}>
          {invoices.map((i) => (
            <Avatar key={i.id} name={i.customer} />
          ))}
        </AvatarGroup>
      </Example>
      <Example
        title="DataTable"
        description="Sortable columns (aria-sort), row selection, loading and empty states. Sorting uses Intl.Collator for the user's locale."
        code={`<DataTable
  data={invoices}
  columns={columns}
  getRowId={(row) => row.id}
  selectable
  onSelectionChange={setSelected}
/>`}
      >
        <Stack gap={3} className="w-full">
          {selected.length ? (
            <Inline className="rounded-md bg-primary-subtle px-3 py-2 text-sm text-primary-on-subtle">
              <span className="font-semibold">{selected.length} selected</span>
              <Button size="xs" variant="ghost" className="ms-auto" onClick={() => setSelected([])}>
                Clear
              </Button>
            </Inline>
          ) : null}
          <DataTable data={invoices} columns={columns} getRowId={(r) => r.id} selectable selectedIds={selected} onSelectionChange={setSelected} caption="Recent invoices" />
        </Stack>
      </Example>
      <Example
        title="BarList"
        description="A dependency-free chart primitive. For full charts, use any library with chartColors so series follow the theme."
        code={`import { BarList, chartColors } from "@kaleido/ui";
<BarList data={[{ label: "Direct", value: 4120 }, …]} />`}
      >
        <Grid columns={2} gap={6} className="w-full">
          <BarList
            aria-label="Traffic sources"
            data={[
              { label: "Direct", value: 4120 },
              { label: "Search", value: 3480 },
              { label: "Social", value: 2210 },
              { label: "Referral", value: 1240 },
              { label: "Email", value: 860 },
            ]}
          />
          <div className="flex flex-col gap-2">
            <Text size="sm" weight="semibold">
              chartColors
            </Text>
            <div className="flex gap-2">
              {chartColors.map((c, i) => (
                <span key={c} className="flex h-12 flex-1 items-end justify-center rounded-md pb-1 text-2xs font-bold text-white" style={{ background: c }}>
                  {i + 1}
                </span>
              ))}
            </div>
            <Text size="xs" tone="muted">
              Decorative — always pair series with labels or patterns.
            </Text>
          </div>
        </Grid>
      </Example>
      <DataExtras />
      <A11yNotes
        items={[
          "DataTable uses native table semantics, scope=\"col\" headers, aria-sort on sortable columns and labelled checkboxes.",
          "Avatars without images expose the person's name as role=\"img\"; status dots have an accessible label.",
          "BarList is a list with visible values, so it reads correctly with a screen reader.",
        ]}
      />
    </Page>
  );
}
