import { themeVariables } from "@darkalpha/nova-tokens";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
  Heading,
  Input,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  ThemeProvider,
  ToggleGroup,
  ToggleGroupItem,
  auditContrast,
  getResolvedTheme,
  isHexColor,
  presets,
  type BrandColors,
  type ColorMode,
} from "@darkalpha/nova-ui";
import type { Density, MotionStyle, RadiusPreset } from "@darkalpha/nova-tokens";
import { Check, Moon, RotateCcw, Sun, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { capitalize, CodeBlock } from "../docs/kit.tsx";

type BrandKey = "primary" | "secondary" | "accent";

function ColorField({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const shown = value || fallback;
  const invalid = draft !== "" && !isHexColor(draft);
  return (
    <FormField label={label} error={invalid ? "Use a hex color like #6d4aff" : undefined}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={shown.length === 7 ? shown : "#000000"}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          className="h-(--nv-control-h-md) w-12 shrink-0 cursor-pointer rounded-(--nv-input-radius) border border-input bg-surface p-1"
        />
        <Input
          value={draft}
          placeholder={fallback}
          dir="ltr"
          className="font-mono"
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value === "" || isHexColor(e.target.value)) onChange(e.target.value);
          }}
        />
      </div>
    </FormField>
  );
}

function Preview() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs>
          <BreadcrumbItem href="#/playground">Workspace</BreadcrumbItem>
          <BreadcrumbItem current>Billing</BreadcrumbItem>
        </Breadcrumbs>
        <div className="flex items-center gap-2">
          <Badge variant="accent" dot>
            New
          </Badge>
          <Avatar name="Rosa Parks" size="sm" status="online" />
        </div>
      </div>
      <Heading level={2} size="lg">
        Plan & usage
      </Heading>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Preview sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card variant="featured">
              <CardHeader>
                <CardTitle>Pro plan</CardTitle>
                <CardDescription>Billed yearly · renews Mar 2027</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold">$24</span>
                  <Text tone="muted" as="span">
                    / seat / month
                  </Text>
                </div>
                <Progress aria-label="Seats used" value={72} />
                <Text size="sm" tone="muted">
                  18 of 25 seats used
                </Text>
              </CardContent>
              <CardFooter>
                <Button size="sm">Upgrade</Button>
                <Button size="sm" variant="ghost">
                  Manage
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardTitle>Status</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Paid</Badge>
                <Badge variant="warning">Expiring</Badge>
                <Badge variant="danger">Failed</Badge>
                <Badge variant="info">Pending</Badge>
                <Badge variant="primary" appearance="solid">
                  Solid
                </Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <Alert variant="warning" title="Card expires soon">
                Update your payment method to avoid interruption.
              </Alert>
            </Card>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="gradient">Gradient</Button>
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Workspace name">
                <Input defaultValue="Nova UI Labs" />
              </FormField>
              <FormField label="Billing email" error="This email is not verified">
                <Input defaultValue="billing@novaui" />
              </FormField>
              <FormField label="Region">
                <Select defaultValue="eu">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eu">Europe (Frankfurt)</SelectItem>
                    <SelectItem value="us">United States (Ohio)</SelectItem>
                    <SelectItem value="ap">Asia Pacific (Tokyo)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <div className="flex flex-col gap-3">
                <Label>Usage alerts at</Label>
                <Slider defaultValue={[80]} thumbLabels={["Alert threshold"]} />
              </div>
            </div>
            <FormField label="Email me invoices" inline description="Sent on the first of each month.">
              <Switch defaultChecked />
            </FormField>
            <FormField label="I agree to the updated terms" inline>
              <Checkbox defaultChecked />
            </FormField>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const radii: RadiusPreset[] = ["none", "sm", "md", "lg", "xl"];
const densities: Density[] = ["compact", "comfortable", "spacious"];

export function PlaygroundPage() {
  const [preset, setPreset] = useState<string>("vibrant");
  const [brand, setBrand] = useState<Record<BrandKey, string>>({ primary: "", secondary: "", accent: "" });
  const [mode, setMode] = useState<ColorMode>("light");
  const [radius, setRadius] = useState<RadiusPreset>("md");
  const [density, setDensity] = useState<Density>("comfortable");
  const [motionStyle, setMotionStyle] = useState<MotionStyle>("standard");
  const [panel, setPanel] = useState("contrast");

  const brandProp = useMemo<BrandColors | undefined>(() => {
    const entries = Object.entries(brand).filter(([, v]) => isHexColor(v));
    return entries.length ? Object.fromEntries(entries) : undefined;
  }, [brand]);
  // Keep typing in color fields responsive; the heavy preview re-renders a beat later.
  const deferredBrand = useDeferredValue(brandProp);

  const base = getResolvedTheme(preset);
  const resolved = useMemo(() => getResolvedTheme(preset, { brand: deferredBrand }), [preset, deferredBrand]);
  const audit = useMemo(() => auditContrast(resolved), [resolved]);
  const failures = audit.filter((a) => !a.pass);

  const cssVars = useMemo(() => {
    const vars = themeVariables({ ...resolved, radius, density, motion: motionStyle });
    return `.nv-theme {\n${Object.entries(vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n")}\n}`;
  }, [resolved, radius, density, motionStyle]);

  const config = `<ThemeProvider
  theme="${preset}"${deferredBrand ? `\n  brand={${JSON.stringify(deferredBrand).replace(/"(\w+)":/g, "$1: ")}}` : ""}
  radius="${radius}"
  density="${density}"
  motionStyle="${motionStyle}"
  defaultMode="${mode}"
>
  <App />
</ThemeProvider>`;

  const fallback = (k: BrandKey) => base.light[`${k}-solid`];

  return (
    <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <Badge variant="gradient" className="w-fit">
          Theme playground
        </Badge>
        <Heading level={1} size="xl">
          Design your theme
        </Heading>
        <Text tone="secondary" size="lg">
          Pick a preset, drop in brand colors and tune the shape. Copy the result straight into your app.
        </Text>
      </header>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card variant="outline" className="h-fit gap-5 lg:sticky lg:top-20">
          <FormField label="Preset">
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(presets).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {(["primary", "secondary", "accent"] as const).map((k) => (
            <ColorField key={`${preset}-${k}`} label={`${capitalize(k)} color`} value={brand[k]} fallback={fallback(k)} onChange={(v) => setBrand((b) => ({ ...b, [k]: v }))} />
          ))}
          <div className="flex flex-col gap-2">
            <Label id="pg-mode">Mode</Label>
            <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as ColorMode)} aria-labelledby="pg-mode" className="w-fit">
              <ToggleGroupItem value="light">
                <Sun /> Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark">
                <Moon /> Dark
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Label id="pg-radius">Radius</Label>
            <ToggleGroup type="single" value={radius} onValueChange={(v) => v && setRadius(v as RadiusPreset)} aria-labelledby="pg-radius" className="w-fit">
              {radii.map((r) => (
                <ToggleGroupItem key={r} value={r}>
                  {r}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Label id="pg-density">Density</Label>
            <ToggleGroup type="single" value={density} onValueChange={(v) => v && setDensity(v as Density)} aria-labelledby="pg-density" className="w-fit">
              {densities.map((d) => (
                <ToggleGroupItem key={d} value={d}>
                  {d}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Label id="pg-motion">Motion</Label>
            <ToggleGroup type="single" value={motionStyle} onValueChange={(v) => v && setMotionStyle(v as MotionStyle)} aria-labelledby="pg-motion" className="w-fit">
              {(["subtle", "standard", "expressive"] as const).map((m) => (
                <ToggleGroupItem key={m} value={m}>
                  {m}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Button
            variant="outline"
            startIcon={<RotateCcw />}
            onClick={() => {
              setBrand({ primary: "", secondary: "", accent: "" });
              setRadius("md");
              setDensity("comfortable");
              setMotionStyle("standard");
            }}
          >
            Reset
          </Button>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <ThemeProvider theme={preset} brand={deferredBrand} radius={radius} density={density} motionStyle={motionStyle} mode={mode} className="min-h-0! overflow-hidden rounded-xl border border-border shadow-lg" data-testid="playground-preview">
            <Preview />
          </ThemeProvider>

          <Tabs value={panel} onValueChange={setPanel} variant="pills">
            <TabsList aria-label="Theme output">
              <TabsTrigger value="contrast">
                Contrast {failures.length ? <Badge variant="danger" size="sm">{failures.length}</Badge> : <Badge variant="success" size="sm" appearance="solid">AA</Badge>}
              </TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="css">CSS variables</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>
            <TabsContent value="contrast" className="flex flex-col gap-3">
              {resolved.adjustments.length ? (
                <Alert variant="info" title={`${resolved.adjustments.length} automatic contrast adjustments`}>
                  Nova UI moved some tokens along their scale so every rendered pair meets WCAG AA. Your exact colors are kept where they pass.
                </Alert>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {audit
                  .filter((a) => a.mode === mode && (a.foreground.endsWith("on-solid") || a.foreground.startsWith("foreground")) && !a.background.endsWith("hover"))
                  .map((a) => {
                    const colors = resolved[a.mode];
                    return (
                      <div key={`${a.foreground}-${a.background}`} className="flex items-center gap-3 rounded-md border border-border bg-surface p-2">
                        <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-sm text-sm font-bold" style={{ background: colors[a.background], color: colors[a.foreground] }}>
                          Aa
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs">{a.foreground}</p>
                          <p className="truncate font-mono text-2xs text-foreground-muted">on {a.background}</p>
                        </div>
                        <Badge variant={a.pass ? "success" : "danger"} size="sm">
                          {a.pass ? <Check /> : <X />}
                          {a.ratio}:1
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
            <TabsContent value="tokens">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {Object.entries(resolved[mode]).map(([name, value]) => (
                  <div key={name} className="flex items-center gap-2 rounded-md border border-border bg-surface p-2">
                    <span className="size-7 shrink-0 rounded-sm border border-border" style={{ background: value }} />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-2xs font-semibold">{name}</p>
                      <p className="font-mono text-2xs text-foreground-muted">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="css">
              <CodeBlock language="css" code={cssVars} className="max-h-[28rem] overflow-auto" />
            </TabsContent>
            <TabsContent value="config">
              <CodeBlock code={config} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
