import {
  Badge,
  Button,
  Card,
  GradientText,
  Link,
  Progress,
  ThemeProvider,
} from "@darkalpha/nova-ui";
import {
  HaftSeen,
  KavehLogo,
  haftSeenItems,
  PersianStar,
  PersianVerse,
  SeasonalGreeting,
  SeasonalPattern,
  yaldaMotifs,
  type SeasonalPatternName,
} from "@darkalpha/nova-ui/kaveh";
import { Example } from "../docs/kit.tsx";


export function SeasonalThemeExamples() {
  return (
    <>
      <Example
        title="Seasonal presets"
        description="A strict two-color rule. KMS navy is the base: headers, text, links, badges, tints and the dark-mode page. Kaveh orange is for action only: the main button, progress, switches, focus and selection. Yalda and Nowruz add one seasonal accent (pomegranate red, sabzeh green) for campaign moments."
        code={`<ThemeProvider theme="kaveh">…</ThemeProvider>
<ThemeProvider theme="kaveh-yalda">…</ThemeProvider>   // Yalda campaign, dark-first
<ThemeProvider theme="kaveh-nowruz">…</ThemeProvider>  // Nowruz campaign, light-first`}
      >
        <div className="grid w-full gap-4 md:grid-cols-3">
          {(["kaveh", "kaveh-yalda", "kaveh-nowruz"] as const).map((theme) => (
            <ThemeProvider key={theme} theme={theme} mode={theme === "kaveh-yalda" ? "dark" : "light"} className="min-h-0! rounded-lg border border-border p-4">
              <Card className="gap-3 p-4">
                <div className="-mx-4 -mt-4 mb-1 flex items-center justify-between rounded-t-[inherit] bg-neutral px-4 py-3 text-neutral-on-solid">
                  <KavehLogo size={22} tagline={false} tone="reversed" />
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{theme === "kaveh" ? "core" : theme.replace("kaveh-", "")}</span>
                </div>
                <p className="text-sm">
                  Vessel <b>MV Persian Gulf</b> berths at 14:30. <Link href="#/components/seasonal-themes">View documents</Link>
                </p>
                <Progress value={72} tone="primary" aria-label="Clearance progress" />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Berth 12</Badge>
                  <Badge variant="primary">Agency</Badge>
                  {theme === "kaveh" ? null : <Badge variant="accent">{theme === "kaveh-yalda" ? "Yalda" : "Nowruz"}</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Request quote</Button>
                  <Button size="sm" variant="outline">Track vessel</Button>
                </div>
              </Card>
            </ThemeProvider>
          ))}
        </div>
      </Example>
      <Example
        title="Gradients"
        description="Kaveh presets draw their own gradients: a harbour sunset. Fills that carry text (gradient buttons, badges, progress) stay in the warm orange band so navy text keeps 4.5:1; ambient ones (mesh, tinted cards, animated borders) let navy meet the orange. Yalda burns toward candle red, Nowruz turns from the sun to new leaf."
        code={`<Button variant="gradient">Request quote</Button>
<Progress value={64} />            // the default tone is the vivid gradient
<GradientText>Since 1948</GradientText>
<div className="bg-(image:--nv-gradient-mesh)">…</div>`}
      >
        <div className="grid w-full gap-4 md:grid-cols-3">
          {(["kaveh", "kaveh-yalda", "kaveh-nowruz"] as const).map((theme) => (
            <ThemeProvider key={theme} theme={theme} mode={theme === "kaveh-yalda" ? "dark" : "light"} className="min-h-0! overflow-hidden rounded-lg border border-border">
              <div className="flex flex-col gap-4 bg-surface bg-(image:--nv-gradient-mesh) p-5">
                <p className="font-display text-3xl font-extrabold leading-none">
                  <GradientText>Since 1948</GradientText>
                </p>
                <div className="h-14 rounded-md bg-(image:--nv-gradient-vivid)" />
                <Progress value={64} aria-label="Gradient progress" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="gradient">Request quote</Button>
                  <Badge variant="gradient">{theme === "kaveh" ? "core" : theme.replace("kaveh-", "")}</Badge>
                </div>
                <Card variant="tinted" className="p-3 text-sm">Tinted card on the subtle gradient</Card>
              </div>
            </ThemeProvider>
          ))}
        </div>
      </Example>
    </>
  );
}

export function SeasonalGreetingExamples() {
  return (
    <>
      <Example
        title="Yalda card"
        description="The default Yalda art: watermelon, candle and pomegranate under a starry night. Bring your own copy, logo and action."
        code={`<SeasonalGreeting
  season="yalda"
  eyebrow="Yalda 1405 · ۳۰ آذر"
  title="The longest night, the brightest harbour."
  description="Our port teams work through the longest night."
  logo={<KavehLogo tone="reversed" size={28} tagline={false} />}
/>`}
      >
        <SeasonalGreeting
          season="yalda"
          eyebrow="Yalda 1405 · ۳۰ آذر"
          title="The longest night, the brightest harbour."
          description="Our port teams work through the longest night."
          logo={<KavehLogo tone="reversed" size={28} tagline={false} />}
          className="w-full max-w-sm"
        />
      </Example>
      <Example
        title="Nowruz banner"
        description="layout=&quot;banner&quot; puts text and art side by side for hero sections. It stacks on small screens and mirrors in RTL."
        code={`<SeasonalGreeting
  season="nowruz"
  layout="banner"
  eyebrow="Nowruz 1406 · نوروز ۱۴۰۶"
  titleFa="سالی نو، افقی تازه"
  title="A new year, a new horizon."
  action={<Button>Holiday hours</Button>}
/>
// Inside <ThemeProvider theme="kaveh-nowruz"> the button picks up Kaveh navy.`}
      >
        <ThemeProvider theme="kaveh-nowruz" className="min-h-0! w-full bg-transparent">
          <SeasonalGreeting
            season="nowruz"
            layout="banner"
            eyebrow="Nowruz 1406 · نوروز ۱۴۰۶"
            titleFa="سالی نو، افقی تازه"
            title="A new year, a new horizon."
            action={<Button>Holiday hours</Button>}
            logo={<KavehLogo tone="brand" size={28} tagline={false} />}
          />
        </ThemeProvider>
      </Example>
      <Example
        title="Custom art"
        description="Pass art to arrange any motifs yourself, here an open pomegranate with Hafez."
        code={`<SeasonalGreeting season="yalda" layout="banner" art={<><PomegranateOpen size={140} /><DivanOfHafez size={110} /></>} />`}
      >
        <SeasonalGreeting
          season="yalda"
          layout="banner"
          title="Fal-e Hafez"
          description={<PersianVerse lines={["صبح امید که بُد معتکف پردهٔ غیب", "گو برون آی که کار شب تار آخر شد"]} attribution="Hafez" className="text-start" />}
          art={yaldaMotifs.filter((m) => m.name === "pomegranate-open" || m.name === "divan-of-hafez").map(({ name, component: M }) => <M key={name} size={130} />)}
          className="w-full"
        />
      </Example>
    </>
  );
}

export function SeasonalMotifExamples() {
  return (
    <>
      <Example
        title="Yalda motifs"
        description="Flat, filled illustrations in fixed seasonal colors. Decorative unless you pass title."
        code={`<Pomegranate size={64} />
<PomegranateOpen />
<Watermelon title="Watermelon" />
<YaldaCandle /> <DivanOfHafez /> <CrescentMoon />`}
      >
        <div className="flex w-full flex-wrap gap-3 rounded-lg p-4" style={{ background: "#081430" }}>
          {yaldaMotifs.map(({ name, component: M, label, labelFa }) => (
            <div key={name} className="flex w-24 flex-col items-center gap-1 text-center text-xs text-white">
              <M size={56} />
              <span>{label}</span>
              <span lang="fa" dir="rtl" className="opacity-75">{labelFa}</span>
            </div>
          ))}
        </div>
      </Example>
      <Example
        title="Nowruz motifs"
        description="The Haft-Seen items plus goldfish, mirror and painted egg. haftSeenItems carries each item's English and Persian name and meaning."
        code={`<Sabzeh /> <Samanu /> <Senjed /> <Seer /> <Seeb /> <Somagh /> <Serkeh />
<Goldfish /> <NowruzMirror /> <PaintedEgg /> <Blossom />`}
      >
        <div className="flex w-full flex-wrap gap-3 rounded-lg p-4" style={{ background: "#fff8ec" }}>
          {haftSeenItems.map(({ name, component: M, label, meaning }) => (
            <div key={name} className="flex w-24 flex-col items-center gap-1 text-center text-xs" style={{ color: "#0b1f3f" }} title={meaning}>
              <M size={56} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Example>
      <Example
        title="Persian star"
        description="PersianStar follows currentColor, so it takes any text color."
        code={`<PersianStar className="text-accent" size={40} />`}
      >
        <PersianStar size={40} className="text-accent" />
        <PersianStar size={28} className="text-primary" />
        <PersianStar size={20} className="text-secondary" />
      </Example>
    </>
  );
}

export function HaftSeenExamples() {
  return (
    <Example
      title="HaftSeen"
      description="The seven S items on one table. labels picks Persian, English, both or none (then each item is named for screen readers); extras adds goldfish, mirror and painted egg."
      code={`<HaftSeen labels="both" extras />`}
    >
      <HaftSeen labels="both" extras itemSize={52} className="w-full" />
    </Example>
  );
}

const patterns: [SeasonalPatternName, string, string][] = [
  ["yalda-stars", "#081430", "#e8a33d"],
  ["pomegranate-seeds", "#b3122e", "#6e0b1f"],
  ["blossom", "#fff8ec", "#f6b5c4"],
  ["girih", "#f6f2ec", "#295097"],
  ["tide", "#0b1f3f", "#ffffff"],
];

export function SeasonalPatternExamples() {
  return (
    <Example
      title="SeasonalPattern"
      description="Seamless decorative layers. Place one first inside a relative container; keep opacity low behind text. seasonalPatternUrl returns the same tile as a CSS background-image."
      code={`<div className="relative">
  <SeasonalPattern pattern="pomegranate-seeds" color="#6e0b1f" opacity={0.5} />
  …content
</div>`}
    >
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
        {patterns.map(([name, bg, color]) => (
          <div key={name} className="relative flex h-28 items-end overflow-hidden rounded-lg p-2" style={{ background: bg }}>
            <SeasonalPattern pattern={name} color={color} opacity={0.6} />
            <span className="relative rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-black">{name}</span>
          </div>
        ))}
      </div>
    </Example>
  );
}
