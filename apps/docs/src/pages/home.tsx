import {
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  BarList,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FormField,
  Grid,
  Heading,
  Input,
  Progress,
  StatusIndicator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  ThemeProvider,
  presets,
  toast,
} from "@kaleido/ui";
import { ArrowRight, Palette, Sparkles, Accessibility, Layers, Gauge, Languages } from "lucide-react";
import { CodeBlock } from "../docs/kit.tsx";

function MiniPreview({ theme }: { theme: string }) {
  return (
    <ThemeProvider theme={theme} className="min-h-0! rounded-(--ks-card-radius) border border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Text weight="semibold" size="sm">
            {presets[theme as keyof typeof presets].label}
          </Text>
          <Badge variant="success" dot>
            Live
          </Badge>
        </div>
        <Progress aria-label={`${theme} progress`} value={64} size="sm" />
        <div className="flex gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="soft">
            Soft
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
}

const features = [
  { icon: Palette, title: "A real color engine", body: "OKLCH tonal scales from any brand hex, with WCAG contrast fixed automatically — not opacity hacks." },
  { icon: Layers, title: "Tokens all the way down", body: "Primitive → semantic → component tokens, shipped as CSS variables and typed TypeScript." },
  { icon: Accessibility, title: "Accessible by default", body: "Radix primitives, wired-up labels, visible focus and every preset audited against WCAG 2.2 AA." },
  { icon: Gauge, title: "Fast and SSR-safe", body: "Themes switch through CSS variables and light-dark(). No flash, no hydration mismatch." },
  { icon: Languages, title: "Ready for every language", body: "Logical properties, RTL-aware icons, Intl formatting and swappable fonts per script." },
  { icon: Sparkles, title: "Expressive, not loud", body: "Purposeful gradients, soft depth and motion that respects reduced-motion preferences." },
];

export function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="absolute inset-0 bg-(image:--ks-gradient-glow)" />
        <div aria-hidden className="absolute -end-32 -top-32 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="absolute -start-24 top-40 size-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="primary" dot>
              Design system for React · v0.1
            </Badge>
            <Heading level={1} size="display">
              Interfaces that feel <span className="bg-(image:--ks-gradient-vivid) bg-clip-text text-transparent">alive</span>.
            </Heading>
            <Text size="xl" tone="secondary" className="max-w-xl">
              Kaleido is a colorful, accessible design system built on design tokens. Bring your brand color — it builds a complete, contrast-checked theme in light and dark.
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gradient">
                <a href="#/getting-started">
                  Get started <ArrowRight className="rtl:-scale-x-100" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#/playground">Open the playground</a>
              </Button>
            </div>
            <CodeBlock language="bash" code="pnpm add @kaleido/ui" className="w-full max-w-md" />
          </div>

          <Card variant="featured" className="self-center">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Welcome back</CardTitle>
                <Badge variant="success" dot>
                  Ready
                </Badge>
              </div>
              <CardDescription>Your workspace is set up and synced.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="team" variant="segmented">
                <TabsList aria-label="Workspace views">
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                </TabsList>
                <TabsContent value="team" className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <AvatarGroup max={4} size="sm">
                      {["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson", "Linus Torvalds"].map((n) => (
                        <Avatar key={n} name={n} size="sm" />
                      ))}
                    </AvatarGroup>
                    <StatusIndicator status="online" label="3 online" pulse />
                  </div>
                  <FormField label="Invite by email">
                    <Input type="email" placeholder="name@company.com" />
                  </FormField>
                  <FormField label="Send weekly digest" inline>
                    <Switch defaultChecked />
                  </FormField>
                </TabsContent>
                <TabsContent value="usage">
                  <BarList
                    aria-label="Usage by product"
                    data={[
                      { label: "Analytics", value: 4820 },
                      { label: "Messaging", value: 3120 },
                      { label: "Storage", value: 2210 },
                      { label: "Automations", value: 1290 },
                    ]}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="ghost" size="sm">
                Later
              </Button>
              <Button size="sm" onClick={() => toast.success("Invitation sent", { description: "They will receive an email shortly." })}>
                Send invite
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-8">
        <div className="flex max-w-2xl flex-col gap-2">
          <Heading level={2} size="lg">
            One system, many identities
          </Heading>
          <Text tone="secondary">
            {Object.keys(presets).length} presets share one implementation. Each is a complete semantic theme — surfaces, text, intents, focus, charts — not just a new button color.
          </Text>
        </div>
        <Grid columns={4} gap={4}>
          {Object.keys(presets).map((id) => (
            <MiniPreview key={id} theme={id} />
          ))}
        </Grid>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-20 sm:px-8">
        <Grid columns={3} gap={4}>
          {features.map(({ icon: Glyph, title, body }) => (
            <Card key={title} variant="outline" className="gap-3">
              <span aria-hidden className="flex size-10 items-center justify-center rounded-lg bg-(image:--ks-gradient-subtle) text-primary-text ring-1 ring-primary-border">
                <Glyph className="size-5" />
              </span>
              <Heading level={3} size="xs">
                {title}
              </Heading>
              <Text size="sm" tone="muted">
                {body}
              </Text>
            </Card>
          ))}
        </Grid>
        <Alert variant="primary" title="Tip: everything on this site is built with Kaleido itself." action={<Button asChild size="sm" variant="soft"><a href="#/playground">Try your brand colors</a></Button>}>
          Switch the preset, color mode or direction in the header — every page updates instantly.
        </Alert>
      </section>
    </div>
  );
}
