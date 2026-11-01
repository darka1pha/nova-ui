import { Badge, Button, Card, Grid, Text, ThemeProvider, presets } from "@darkalpha/nova-ui";
import { CodeBlock, Page, Prose, Section } from "../docs/kit.tsx";

export function ThemingPage() {
  return (
    <Page
      eyebrow="Foundations"
      title="Theming & color"
      lead="Every color in Nova UI comes from a semantic role. Themes decide what those roles look like — components never hardcode a palette."
    >
      <Section title="How color flows">
        <Prose>
          <p>
            <strong>Primitive tokens</strong> are 12-step tonal scales (50 → 975) generated in OKLCH for even, perceptual steps. <strong>Semantic tokens</strong>{" "}
            describe purpose — <code>background</code>, <code>surface-raised</code>, <code>primary-solid</code>, <code>danger-on-subtle</code>,{" "}
            <code>focus-ring</code> — and resolve to a primitive per mode. <strong>Component tokens</strong> such as <code>--nv-button-radius</code> or{" "}
            <code>--nv-card-padding</code> are narrow knobs that default to global tokens.
          </p>
          <p>
            Each intent (<code>primary</code>, <code>secondary</code>, <code>accent</code>, <code>neutral</code>, <code>success</code>, <code>warning</code>,{" "}
            <code>danger</code>, <code>info</code>) exposes the same nine roles: <code>solid</code>, <code>solid-hover</code>, <code>solid-active</code>,{" "}
            <code>on-solid</code>, <code>subtle</code>, <code>subtle-hover</code>, <code>on-subtle</code>, <code>border</code> and <code>text</code>.
          </p>
        </Prose>
      </Section>

      <Section title="Presets">
        <Grid columns={2} gap={4}>
          {Object.values(presets).map((p) => (
            <ThemeProvider key={p.id} theme={p.id} className="min-h-0! rounded-(--nv-card-radius)">
              <Card variant="outline" className="h-full gap-3">
                <div className="flex items-center justify-between">
                  <Text weight="bold" className="font-display">{p.label}</Text>
                  <code className="text-xs text-foreground-muted">theme="{p.id}"</code>
                </div>
                <Text size="sm" tone="muted">
                  {p.description}
                </Text>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Primary</Button>
                  <Button size="sm" variant="secondary">
                    Secondary
                  </Button>
                  <Button size="sm" variant="accent">
                    Accent
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["success", "warning", "danger", "info"] as const).map((t) => (
                    <Badge key={t} variant={t} size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              </Card>
            </ThemeProvider>
          ))}
        </Grid>
      </Section>

      <Section title="Brand colors">
        <CodeBlock code={`<ThemeProvider theme="vibrant" brand={{ primary: "#e11d48", secondary: "#0ea5e9", accent: "#f59e0b" }}>`} />
        <Prose>
          <p>
            Each brand hex becomes a full tonal scale. The exact color is kept at its natural step and used for solid fills wherever text on it reaches 4.5:1;
            otherwise the resolver walks the scale to the nearest passing tone. Invalid values are ignored with a development warning, and the theme's own color is kept.
          </p>
        </Prose>
      </Section>

      <Section title="Overriding individual tokens">
        <CodeBlock
          code={`<ThemeProvider
  overrides={{
    light: { background: "#ffffff", "primary-text": "#4c1d95" },
    dark: { background: "#0b0b12" },
  }}
/>`}
        />
        <Prose>
          <p>
            Overrides apply after derivation, are typed against the token names, and accept any CSS color. Unknown keys are ignored with a warning. Run{" "}
            <code>auditContrast(getResolvedTheme(…))</code> in a test to make sure overrides stay accessible.
          </p>
        </Prose>
      </Section>

      <Section title="Creating and registering a theme">
        <CodeBlock
          code={`import { createTheme, registerTheme } from "@darkalpha/nova-ui";

export const acme = createTheme({
  id: "acme",
  extends: "ocean",             // inherit everything else
  colors: { primary: "#0f766e", accent: "coral" }, // hex or palette name
  radius: "lg",
  shadow: "crisp",
  fonts: { display: '"Space Grotesk", sans-serif' },
});

registerTheme(acme);            // then <ThemeProvider theme="acme">`}
        />
      </Section>

      <Section title="Modes, radius, density and motion">
        <CodeBlock
          code={`<ThemeProvider
  mode="system"          // "light" | "dark" | "system" — or omit and use defaultMode
  radius="xl"            // none · sm · md · lg · xl
  density="compact"      // compact · comfortable · spacious
  surface="glass"        // classic · glass · clay · neomorphic
  motion="reduce"        // force reduced motion
  fonts={{ sans: '"Inter", system-ui' }}
/>`}
        />
        <Prose>
          <p>
            Providers nest. An inner provider can switch the theme for one region (a marketing banner, a preview) while inheriting mode and direction. Overlays
            portal into the nearest provider, so a dialog opened inside a "sunset" region is themed "sunset" too.
          </p>
        </Prose>
      </Section>

      <Section title="Modern surface styles (Glassmorphism, Claymorphism, Neumorphism)">
        <Prose>
          <p>
            Nova UI ships with first-class surface materiality primitives. You can activate them through component variants (<code>&lt;Card variant="glass"&gt;</code>, <code>&lt;Button variant="clay"&gt;</code>) or compose them on any element with utility classes (<code>.nv-glass</code>, <code>.nv-clay</code>, <code>.nv-neomorph</code>, <code>.nv-glow-halo</code>).
          </p>
        </Prose>

        <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-5 p-6 rounded-2xl border border-border bg-surface-sunken">
          {/* Glassmorphic Card */}
          <Card variant="glass" interactive className="p-5 gap-3">
            <div className="flex items-center justify-between">
              <Text weight="bold" className="font-display">Glassmorphism</Text>
              <Badge appearance="glass">Frosted</Badge>
            </div>
            <Text size="sm" tone="muted">
              Translucent frosted backdrop with specular rim highlights, edge reflection, and diffuse ambient blur.
            </Text>
            <div className="pt-2 flex gap-2">
              <Button size="sm" variant="glass">Glass Action</Button>
            </div>
          </Card>

          {/* Claymorphic Card */}
          <Card variant="clay" interactive className="p-5 gap-3">
            <div className="flex items-center justify-between">
              <Text weight="bold" className="font-display">Claymorphism</Text>
              <Badge appearance="clay">3D Tactile</Badge>
            </div>
            <Text size="sm" tone="muted">
              Friendly, inflated cushion aesthetic with dual top-left specular highlight and bottom-right inner shadow.
            </Text>
            <div className="pt-2 flex gap-2">
              <Button size="sm" variant="clay">Clay Button</Button>
            </div>
          </Card>

          {/* Neumorphic Card */}
          <Card variant="neomorphic" interactive className="p-5 gap-3">
            <div className="flex items-center justify-between">
              <Text weight="bold" className="font-display">Neumorphism</Text>
              <Badge variant="neutral">Embossed</Badge>
            </div>
            <Text size="sm" tone="muted">
              Continuous material extrusion with soft directional ambient shadows that seamlessly emerge from the plane.
            </Text>
            <div className="pt-2 flex gap-2">
              <Button size="sm" variant="neomorphic">Neomorph</Button>
            </div>
          </Card>
        </div>

        <CodeBlock
          code={`// Component variants
<Card variant="glass">...</Card>
<Card variant="clay" interactive>...</Card>
<Card variant="neomorphic">...</Card>

<Button variant="glass">Frosted Glass</Button>
<Button variant="clay">Tactile 3D Clay</Button>
<Button variant="neomorphic">Soft Embossed</Button>
<Badge appearance="glass">Live Glass</Badge>
<Badge appearance="clay">Tactile Pill</Badge>

// Universal CSS classes
<div className="nv-glass p-6 rounded-xl">...</div>
<div className="nv-clay p-6">...</div>
<div className="nv-neomorph p-6 rounded-2xl">...</div>
<div className="nv-glow-halo">...</div>`}
        />
      </Section>

      <Section title="Zero-JavaScript theming">
        <CodeBlock
          code={`import "@darkalpha/nova-ui/styles.css";
import "@darkalpha/nova-ui/themes.css";   // every preset as [data-nv-theme] blocks

<div class="nv-theme" data-nv-theme="forest" data-nv-mode="dark">…</div>`}
        />
        <CodeBlock
          code={`// Or generate CSS for a custom theme on the server
import { getThemeCss } from "@darkalpha/nova-ui";
const css = getThemeCss("acme", { brand: { primary: "#0f766e" }, selector: ":root" });`}
        />
      </Section>
    </Page>
  );
}
