import { primitives } from "@kaleido/tokens";
import {
  AnimatedBorder,
  AnimatedNumber,
  Badge,
  Button,
  Card,
  Checkbox,
  FormField,
  GradientText,
  Grid,
  Heading,
  Marquee,
  Reveal,
  SpotlightCard,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  ThemeProvider,
  type MotionStyle,
} from "@kaleido/ui";
import { ArrowRight, Boxes, Cloud, Cpu, Gem, Globe, Layers, Rocket, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { CodeBlock, Example, Page, Prose, Section } from "../docs/kit.tsx";

function MotionSample({ style }: { style: MotionStyle }) {
  const [tab, setTab] = useState("a");
  return (
    <ThemeProvider motionStyle={style} className="min-h-0! rounded-(--ks-card-radius) border border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Text weight="semibold" className="capitalize">
            {style}
          </Text>
          <code className="text-xs text-foreground-muted">press {primitives.motionStyles[style]["press-scale"]}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" endIcon={<ArrowRight />}>
            Hover me
          </Button>
          <Button size="sm" variant="gradient">
            Press
          </Button>
        </div>
        <Tabs value={tab} onValueChange={setTab} variant="segmented">
          <TabsList aria-label={`${style} tabs`}>
            <TabsTrigger value="a">Day</TabsTrigger>
            <TabsTrigger value="b">Week</TabsTrigger>
            <TabsTrigger value="c">Month</TabsTrigger>
          </TabsList>
          {["a", "b", "c"].map((v) => (
            <TabsContent key={v} value={v} className="sr-only">
              {v === "a" ? "Day" : v === "b" ? "Week" : "Month"} view
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex items-center gap-4">
          <FormField label="Notify" inline>
            <Switch defaultChecked />
          </FormField>
          <FormField label="Agree" inline>
            <Checkbox />
          </FormField>
        </div>
      </div>
    </ThemeProvider>
  );
}

const logos = [
  [Rocket, "Launchpad"],
  [Cloud, "Nimbus"],
  [Cpu, "Corefield"],
  [Globe, "Worldline"],
  [Gem, "Facet"],
  [Layers, "Stackwise"],
  [Boxes, "Crate"],
  [Zap, "Voltage"],
] as const;

export function MotionPage() {
  const [revenue, setRevenue] = useState(48250);
  const [revealKey, setRevealKey] = useState(0);
  return (
    <Page
      eyebrow="Foundations"
      title="Motion & interaction"
      lead="Every hover, press and focus uses the same motion tokens. Pick a personality per theme — subtle, standard or expressive — and every component follows."
    >
      <Section title="Motion personalities">
        <Prose>
          <p>
            Themes set <code>motion</code>; any provider can override it with <code>motionStyle</code>. It controls how far things lift on hover (
            <code>--ks-hover-lift</code>), how much they squash when pressed (<code>--ks-press-scale</code>), the spring curve (
            <code>--ks-ease-interactive</code>) and a duration multiplier (<code>--ks-motion-scale</code>). Try the controls below — same components, three
            personalities.
          </p>
        </Prose>
        <Grid columns={3} gap={4}>
          {(["subtle", "standard", "expressive"] as const).map((s) => (
            <MotionSample key={s} style={s} />
          ))}
        </Grid>
        <CodeBlock code={`<ThemeProvider theme="vibrant" motionStyle="expressive">…</ThemeProvider>\n\n// or in a custom theme\ncreateTheme({ id: "acme", extends: "ocean", motion: "subtle" });`} />
      </Section>

      <Section title="What moves, and how">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Interaction</TableHead>
              <TableHead>Behavior</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["Hover", "Filled buttons lift and glow in their own hue; cards lift; icons grow or nudge; menu rows slide their highlight."],
              ["Press", "Buttons, toggles, chips and checkboxes squash to --ks-press-scale on the theme's spring. Optional ink ripple."],
              ["Focus", "The focus ring pops in from a wider offset so keyboard users can follow where focus went."],
              ["Selection", "Checkmarks draw themselves, radio dots and toggled icons spring in, switch thumbs stretch while pressed."],
              ["Navigation", "Tab indicators glide between tabs; calendar months slide in from the direction you travel."],
              ["Feedback", "Invalid fields shake once, alerts and toasts slide in, toasts show a countdown that pauses on hover."],
              ["Overlays", "Dialogs, menus and popovers scale in from their trigger; close buttons rotate on hover."],
            ].map(([a, b]) => (
              <TableRow key={a}>
                <TableCell className="font-semibold">{a}</TableCell>
                <TableCell className="text-foreground-secondary">{b}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="Interaction classes">
        <Prose>
          <p>
            Plain CSS classes from <code>styles.css</code> — no Tailwind required — that apply the same motion to your own elements.
          </p>
        </Prose>
        <Example
          code={`<div className="ks-lift">Lift</div>
<button className="ks-press">Press</button>
<img className="ks-grow" />
<a className="ks-underline">Underline</a>
<div className="ks-shine">Shine</div>
<button className="ks-glow">Glow</button>
<span className="ks-float">Float</span>`}
        >
          {[
            ["ks-lift", "Lift"],
            ["ks-press", "Press"],
            ["ks-grow", "Grow"],
            ["ks-shine", "Shine"],
            ["ks-glow", "Glow"],
            ["ks-float", "Float"],
          ].map(([cls, label]) => (
            <button key={cls} type="button" className={`${cls} rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus-ring`}>
              {label}
              <code className="ms-2 text-2xs text-foreground-muted">.{cls}</code>
            </button>
          ))}
          <a href="#/motion" className="ks-underline text-sm font-semibold text-primary-text">
            Animated underline
          </a>
        </Example>
      </Section>

      <Section title="Motion components">
        <Example
          title="Reveal"
          description="Animates content in as it scrolls into view. Server-rendered content is always visible; nothing can get stuck hidden."
          code={`{features.map((f, i) => (
  <Reveal key={f.id} animation="up" delay={i * 80}>
    <Card>{f.title}</Card>
  </Reveal>
))}`}
        >
          <div className="flex w-full flex-col gap-3">
            <Button size="sm" variant="outline" className="w-fit" onClick={() => setRevealKey((k) => k + 1)}>
              Replay
            </Button>
            <Grid key={revealKey} columns={4} gap={3}>
              {(["up", "fade", "zoom", "blur"] as const).map((a, i) => (
                <Reveal key={a} animation={a} delay={i * 90}>
                  <Card variant="tinted" className="items-center p-4 text-center font-semibold">
                    {a}
                  </Card>
                </Reveal>
              ))}
            </Grid>
          </div>
        </Example>
        <Example
          title="AnimatedNumber"
          description="Counts to new values; screen readers hear only the final number."
          code={`<AnimatedNumber value={revenue} format={{ style: "currency", currency: "USD" }} />`}
        >
          <Heading level={3} size="xl">
            <AnimatedNumber value={revenue} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
          </Heading>
          <Button size="sm" variant="soft" onClick={() => setRevenue((r) => r + Math.round(Math.random() * 9000 + 1000))}>
            Add revenue
          </Button>
        </Example>
        <Example
          title="Marquee"
          description="An endless row that pauses on hover and focus and becomes static under reduced motion."
          code={`<Marquee duration={25}>{logos.map(...)}</Marquee>`}
        >
          <Marquee duration={25} className="w-full">
            {logos.map(([Glyph, name]) => (
              <span key={name} className="flex items-center gap-2 whitespace-nowrap text-lg font-semibold text-foreground-muted">
                <Glyph aria-hidden className="size-5 text-primary-text" /> {name}
              </span>
            ))}
          </Marquee>
        </Example>
        <Example
          title="GradientText, SpotlightCard and AnimatedBorder"
          code={`<GradientText animate>Interfaces that feel alive</GradientText>
<SpotlightCard>…</SpotlightCard>
<AnimatedBorder>…</AnimatedBorder>`}
        >
          <div className="flex w-full flex-col gap-4">
            <Heading level={3} size="xl">
              <GradientText animate>Interfaces that feel alive</GradientText>
            </Heading>
            <Grid columns={2} gap={4}>
              <SpotlightCard className="flex flex-col gap-2">
                <Sparkles aria-hidden className="size-5 text-primary-text" />
                <Text weight="semibold">Spotlight card</Text>
                <Text size="sm" tone="muted">
                  Move your pointer across me.
                </Text>
              </SpotlightCard>
              <AnimatedBorder className="flex flex-col gap-2 p-(--ks-card-padding)">
                <Badge variant="gradient" className="w-fit">
                  Most popular
                </Badge>
                <Text weight="semibold">Animated border</Text>
                <Text size="sm" tone="muted">
                  A rotating gradient frame for featured items.
                </Text>
              </AnimatedBorder>
            </Grid>
          </div>
        </Example>
        <Example title="Ripple" description="Opt-in ink ripple from the press point." code={`<Button ripple>Ripple</Button>`}>
          <Button ripple>Ripple</Button>
          <Button ripple variant="outline">
            Outline ripple
          </Button>
          <Button ripple variant="secondary">
            Secondary
          </Button>
        </Example>
      </Section>

      <Section title="Motion tokens">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Subtle</TableHead>
              <TableHead>Standard</TableHead>
              <TableHead>Expressive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(["motion-scale", "hover-lift", "hover-scale", "press-scale"] as const).map((k) => (
              <TableRow key={k}>
                <TableCell className="font-mono text-xs">--ks-{k}</TableCell>
                {(["subtle", "standard", "expressive"] as const).map((s) => (
                  <TableCell key={s} className="font-mono text-xs">
                    {primitives.motionStyles[s][k]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {Object.entries(primitives.duration).map(([k, v]) => (
              <TableRow key={k}>
                <TableCell className="font-mono text-xs">--ks-duration-{k}</TableCell>
                <TableCell colSpan={3} className="font-mono text-xs text-foreground-secondary">
                  {v} × --ks-motion-scale
                </TableCell>
              </TableRow>
            ))}
            {["standard", "out", "in", "inOut", "emphasized", "spring", "bounce"].map((k) => (
              <TableRow key={k}>
                <TableCell className="font-mono text-xs">--ks-ease-{k}</TableCell>
                <TableCell colSpan={3}>
                  <span className="flex items-center gap-3">
                    <span className="relative h-2 w-40 rounded-full bg-surface-active">
                      <span className="ks-ease-demo absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary" style={{ animationTimingFunction: `var(--ks-ease-${k})` }} />
                    </span>
                    <code className="truncate text-2xs text-foreground-muted">{k === "spring" || k === "bounce" ? "linear(…) spring" : (primitives.easing as Record<string, string>)[k]}</code>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {[
              ["--ks-shadow-glow-{intent}", "Colored glow per intent (primary, secondary, accent, success, danger…)"],
              ["--ks-focus-glow", "Soft halo around focused or hovered controls"],
              ["--ks-blur-sm … xl", "4px · 12px · 24px · 48px"],
              ["--ks-gradient-mesh", "Layered radial gradients in theme colors"],
              ["--ks-stagger", "40ms — default step for staggered lists"],
            ].map(([k, v]) => (
              <TableRow key={k}>
                <TableCell className="font-mono text-xs">{k}</TableCell>
                <TableCell colSpan={3} className="text-foreground-secondary">
                  {v}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="Reduced motion">
        <Prose>
          <p>
            Under <code>prefers-reduced-motion: reduce</code> (or <code>{'<ThemeProvider motion="reduce">'}</code>) durations collapse to ~0, lifts and scales are
            disabled, Marquee and Reveal stand still, ripples are skipped and Carousel autoplay stops. State changes stay visible — only the movement goes.
          </p>
        </Prose>
      </Section>
    </Page>
  );
}
