import { AnimatedBorder, AnimatedNumber, Badge, Button, Card, GradientText, Grid, Heading, Marquee, Reveal, SpotlightCard, Text } from "@darkalpha/nova-ui";
import { Boxes, Cloud, Cpu, Gem, Globe, Layers, Rocket, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Example } from "../docs/kit.tsx";

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

export function RevealExamples() {
  const [revealKey, setRevealKey] = useState(0);
  return (
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
  );
}

export function AnimatedNumberExamples() {
  const [revenue, setRevenue] = useState(48250);
  return (
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
  );
}

export function MarqueeExamples() {
  return (
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
  );
}

export function EffectsExamples() {
  return (
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
          <AnimatedBorder className="flex flex-col gap-2 p-(--nv-card-padding)">
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
  );
}
