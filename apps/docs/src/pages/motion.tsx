import { primitives } from "@darkalpha/nova-tokens";
import {
  Button,
  Checkbox,
  FormField,
  Grid,
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
} from "@darkalpha/nova-ui";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { CodeBlock, Example, Page, Prose, Section, to } from "../docs/kit.tsx";

function MotionSample({ style }: { style: MotionStyle }) {
  const [tab, setTab] = useState("a");
  return (
    <ThemeProvider motionStyle={style} className="min-h-0! rounded-(--nv-card-radius) border border-border p-4">
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

export function MotionPage() {
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
            <code>--nv-hover-lift</code>), how much they squash when pressed (<code>--nv-press-scale</code>), the spring curve (
            <code>--nv-ease-interactive</code>) and a duration multiplier (<code>--nv-motion-scale</code>). Try the controls below — same components, three
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
              ["Press", "Buttons, toggles, chips and checkboxes squash to --nv-press-scale on the theme's spring. Optional ink ripple."],
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
          code={`<div className="nv-lift">Lift</div>
<button className="nv-press">Press</button>
<img className="nv-grow" />
<a className="nv-underline">Underline</a>
<div className="nv-shine">Shine</div>
<button className="nv-glow">Glow</button>
<span className="nv-float">Float</span>`}
        >
          {[
            ["nv-lift", "Lift"],
            ["nv-press", "Press"],
            ["nv-grow", "Grow"],
            ["nv-shine", "Shine"],
            ["nv-glow", "Glow"],
            ["nv-float", "Float"],
          ].map(([cls, label]) => (
            <button key={cls} type="button" className={`${cls} rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus-ring`}>
              {label}
              <code className="ms-2 text-2xs text-foreground-muted">.{cls}</code>
            </button>
          ))}
          <a href={to("motion")} className="nv-underline text-sm font-semibold text-primary-text">
            Animated underline
          </a>
        </Example>
      </Section>

      <Section title="Motion components">
        <Prose>
          <p>
            Each has its own page with examples and props: <a href={to("components/reveal")}>Reveal</a>, <a href={to("components/animated-number")}>AnimatedNumber</a>,{" "}
            <a href={to("components/marquee")}>Marquee</a>, and <a href={to("components/effects")}>GradientText, SpotlightCard and AnimatedBorder</a>.
          </p>
        </Prose>
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
                <TableCell className="font-mono text-xs">--nv-{k}</TableCell>
                {(["subtle", "standard", "expressive"] as const).map((s) => (
                  <TableCell key={s} className="font-mono text-xs">
                    {primitives.motionStyles[s][k]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {Object.entries(primitives.duration).map(([k, v]) => (
              <TableRow key={k}>
                <TableCell className="font-mono text-xs">--nv-duration-{k}</TableCell>
                <TableCell colSpan={3} className="font-mono text-xs text-foreground-secondary">
                  {v} × --nv-motion-scale
                </TableCell>
              </TableRow>
            ))}
            {["standard", "out", "in", "inOut", "emphasized", "spring", "bounce"].map((k) => (
              <TableRow key={k}>
                <TableCell className="font-mono text-xs">--nv-ease-{k}</TableCell>
                <TableCell colSpan={3}>
                  <span className="flex items-center gap-3">
                    <span className="relative h-2 w-40 rounded-full bg-surface-active">
                      <span className="nv-ease-demo absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary" style={{ animationTimingFunction: `var(--nv-ease-${k})` }} />
                    </span>
                    <code className="truncate text-2xs text-foreground-muted">{k === "spring" || k === "bounce" ? "linear(…) spring" : (primitives.easing as Record<string, string>)[k]}</code>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {[
              ["--nv-shadow-glow-{intent}", "Colored glow per intent (primary, secondary, accent, success, danger…)"],
              ["--nv-focus-glow", "Soft halo around focused or hovered controls"],
              ["--nv-blur-sm … xl", "4px · 12px · 24px · 48px"],
              ["--nv-gradient-mesh", "Layered radial gradients in theme colors"],
              ["--nv-stagger", "40ms — default step for staggered lists"],
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
