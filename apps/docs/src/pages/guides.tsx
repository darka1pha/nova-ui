import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Badge,
  Button,
  Calendar,
  Card,
  DatePicker,
  FormField,
  Input,
  NumberInput,
  Pagination,
  Stat,
  Text,
  ThemeProvider,
} from "@darkalpha/nova-ui";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { CodeBlock, Example, Page, Prose, Section } from "../docs/kit.tsx";

export function AccessibilityPage() {
  return (
    <Page eyebrow="Guides" title="Accessibility" lead="WCAG 2.2 AA is the baseline. Accessibility lives in the architecture: tokens, primitives and defaults — not in a checklist at the end.">
      <Section title="What the system guarantees">
        <Prose>
          <ul>
            <li>
              <strong>Contrast by construction.</strong> The theme resolver checks every rendered pair (text on surfaces, text on solid and subtle fills, input
              borders, focus ring) and moves along the scale until it passes: 4.5:1 for text, 3:1 for UI boundaries and focus. Every preset ships with zero failures,
              enforced by a unit test.
            </li>
            <li>
              <strong>Keyboard and focus.</strong> Complex widgets use Radix primitives (menus, dialogs, tabs, select, slider…). Focus is visible on every
              interactive element and never removed.
            </li>
            <li>
              <strong>Names and descriptions.</strong> FormField wires labels, help text and errors. IconButton requires <code>aria-label</code> in its type.
            </li>
            <li>
              <strong>Not color alone.</strong> Status components combine color with an icon, a dot plus text, or a label.
            </li>
            <li>
              <strong>Motion.</strong> All motion uses duration tokens that collapse under <code>prefers-reduced-motion</code> or <code>motion="reduce"</code>.
            </li>
            <li>
              <strong>Targets.</strong> Default control height is 40px; compact density stays above the 24px minimum target size (WCAG 2.5.8).
            </li>
          </ul>
        </Prose>
      </Section>
      <Section title="Checking your own themes">
        <CodeBlock
          code={`import { auditContrast, getResolvedTheme } from "@darkalpha/nova-ui";

test("our brand theme is accessible", () => {
  const theme = getResolvedTheme("vibrant", { brand: { primary: "#e11d48" } });
  expect(auditContrast(theme).filter((c) => !c.pass)).toEqual([]);
});`}
        />
      </Section>
      <Section title="Manual checks before release">
        <Prose>
          <ul>
            <li>Tab through every screen: order is logical, focus is always visible, nothing traps focus except open modals.</li>
            <li>Operate menus, selects, comboboxes, tabs and sliders with the keyboard only.</li>
            <li>Screen readers: VoiceOver (Safari, macOS/iOS) and NVDA (Firefox/Chrome, Windows). Dialog titles announce; errors announce once.</li>
            <li>Zoom to 200% and 400% (reflow at 320px width) — layouts use logical properties and wrap.</li>
            <li>Enable reduced motion and Windows High Contrast / forced colors; focus outlines use real outlines so they survive forced colors.</li>
          </ul>
        </Prose>
      </Section>
    </Page>
  );
}

function PersianDemo() {
  const [arrival, setArrival] = useState<Date | null>(new Date());
  return (
    <div className="grid w-full gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
      <Calendar value={arrival} onValueChange={setArrival} labels={{ previousMonth: "ماه قبل", nextMonth: "ماه بعد" }} className="rounded-lg border border-border bg-surface" />
      <div className="flex min-w-0 flex-col gap-3">
        <FormField label="تاریخ ورود کشتی" description="تاریخ به شمسی نمایش داده و به میلادی ذخیره می‌شود.">
          <DatePicker value={arrival} onValueChange={setArrival} placeholder="انتخاب تاریخ" clearable onClear={() => setArrival(null)} />
        </FormField>
        <FormField label="وزن محموله (تن)">
          <NumberInput defaultValue={1250.5} step={0.5} incrementLabel="افزایش" decrementLabel="کاهش" />
        </FormField>
        <Stat label="کشتی‌های فعال" value={48} delta={12.5} />
        <div className="flex flex-wrap items-center gap-2">
          <Button>ثبت ورود</Button>
          <Badge variant="success">تأیید شده</Badge>
          <Text size="sm" tone="muted">
            {arrival ? (
              <>
                ذخیره: <bdi dir="ltr">{arrival.toLocaleDateString("en-CA")}</bdi>
              </>
            ) : (
              "بدون تاریخ"
            )}
          </Text>
        </div>
      </div>
    </div>
  );
}

export function I18nPage() {
  const [page, setPage] = useState(2);
  return (
    <Page eyebrow="Guides" title="RTL & internationalization" lead="Components use logical properties (start/end), direction-aware icons and Intl APIs. No user-facing strings are hardcoded without a prop to replace them.">
      <Example
        title="Right-to-left"
        description="Set dir on the provider. Radix primitives, layouts, sheets and arrows all follow."
        code={`<ThemeProvider dir="rtl" fonts={{ sans: '"Noto Sans Arabic", system-ui' }}>
  <App />
</ThemeProvider>`}
      >
        <ThemeProvider dir="rtl" theme="sunset" className="min-h-0! w-full rounded-lg border border-border p-4" lang="ar">
          <div className="flex flex-col gap-3">
            <FormField label="البريد الإلكتروني" description="لن نشارك بريدك أبدًا.">
              <Input placeholder="name@example.com" dir="ltr" />
            </FormField>
            <div className="flex flex-wrap items-center gap-2">
              <Button endIcon={<ArrowRight className="rtl:-scale-x-100" />}>متابعة</Button>
              <Badge variant="success">مكتمل</Badge>
            </div>
            <Pagination page={page} pageCount={8} onPageChange={setPage} label="ترقيم الصفحات" previousLabel="الصفحة السابقة" nextLabel="الصفحة التالية" pageLabel={(n) => `الصفحة ${n}`} />
          </div>
        </ThemeProvider>
      </Example>
      <Example
        title="Persian (fa-IR) and the Jalali calendar"
        description="Set locale on the provider. Calendars switch to Jalali months with Saturday first and Friday marked, numbers use Persian digits, and number fields accept what people type on a Persian keyboard. Values stay plain Dates and numbers."
        code={`<ThemeProvider dir="rtl" locale="fa-IR" theme="kaveh">
  <DatePicker placeholder="انتخاب تاریخ" />   // stores 2026-10-31, shows ۹ آبان ۱۴۰۵
  <Calendar />
  <NumberInput defaultValue={1250.5} />      // shows ۱۲۵۰٫۵, accepts ۱۲۵۰ or 1250
  <Stat label="کشتی‌های فعال" value={48} delta={12.5} />
</ThemeProvider>

// Opt out per component or per locale:
<Calendar calendar="gregory" />
<ThemeProvider locale="fa-IR-u-ca-gregory-nu-latn" />`}
      >
        <ThemeProvider dir="rtl" locale="fa-IR" theme="kaveh" className="min-h-0! w-full rounded-lg border border-border p-4">
          <PersianDemo />
        </ThemeProvider>
      </Example>
      <Section title="Rules the components follow">
        <Prose>
          <ul>
            <li>
              Spacing and positioning use logical utilities (<code>ps-*</code>, <code>me-*</code>, <code>start-*</code>, <code>border-s</code>).
            </li>
            <li>
              Directional icons (chevrons, arrows) mirror with <code>rtl:-scale-x-100</code>. Use <code>{"<Icon flipInRtl />"}</code> for your own.
            </li>
            <li>Sheet sides <code>start</code>/<code>end</code> follow reading direction; <code>left</code>/<code>right</code> stay physical.</li>
            <li>
              <code>locale</code> on ThemeProvider reaches Calendar, DatePicker, NumberInput, Stat, AnimatedNumber and DataTable; a component's own{" "}
              <code>locale</code> prop still wins. It is also written to <code>lang</code>.
            </li>
            <li>
              NumberInput formats with <code>Intl.NumberFormat</code> and parses Persian (۰–۹) and Arabic-Indic digits; DataTable sorts with{" "}
              <code>Intl.Collator</code>.
            </li>
            <li>
              <code>toJalali</code>, <code>fromJalali</code>, <code>toPersianDigits</code> and <code>toLatinDigits</code> are exported for your own formatting
              and parsing.
            </li>
            <li>Every built-in label ("Close", "Clear search", "Next page", "Loading") is a prop with an English default.</li>
          </ul>
        </Prose>
      </Section>
      <Section title="Fonts for other scripts">
        <Prose>
          <p>
            Pass <code>fonts</code> to the provider per locale. Different scripts need different metrics, so components size with line-heights and padding rather
            than fixed heights for text, and labels wrap instead of truncating where content length varies.
          </p>
        </Prose>
        <CodeBlock
          code={`const fontsByLocale = {
  ar: { sans: '"Noto Sans Arabic", system-ui', display: '"Noto Kufi Arabic", system-ui' },
  ja: { sans: '"Noto Sans JP", system-ui' },
};
<ThemeProvider dir={locale === "ar" ? "rtl" : "ltr"} fonts={fontsByLocale[locale]} />`}
        />
      </Section>
    </Page>
  );
}

export function StylingPage() {
  return (
    <Page eyebrow="Guides" title="Styling overrides" lead="Customize at the right level: theme first, then component tokens, then className. You should never need to fork.">
      <Section title="1. Theme-level (preferred)">
        <Prose>
          <p>Brand colors, radius, density, fonts, shadows and semantic overrides on ThemeProvider change every component consistently. See Theming.</p>
        </Prose>
      </Section>
      <Section title="2. Component tokens">
        <CodeBlock
          language="css"
          code={`/* Pill-shaped buttons and roomier cards, everywhere */
.nv-theme {
  --nv-button-radius: var(--nv-radius-full);
  --nv-card-padding: 2rem;
  --nv-input-radius: var(--nv-radius-sm);
  --nv-dialog-shadow: var(--nv-shadow-lg);
}`}
        />
        <Prose>
          <p>
            Available component tokens: <code>--nv-button-radius</code>, <code>--nv-input-radius</code>, <code>--nv-card-radius</code>,{" "}
            <code>--nv-card-padding</code>, <code>--nv-dialog-radius</code>, <code>--nv-dialog-shadow</code>, <code>--nv-popover-radius</code>,{" "}
            <code>--nv-popover-shadow</code>, <code>--nv-badge-radius</code>, <code>--nv-control-h-*</code>, <code>--nv-control-px-*</code>,{" "}
            <code>--nv-focus-ring-width</code>, <code>--nv-focus-ring-offset</code>.
          </p>
        </Prose>
      </Section>
      <Section title="3. className on a single instance">
        <Example code={`<Button className="rounded-full px-8 shadow-lg">Custom action</Button>`}>
          <Button className="rounded-full px-8 shadow-lg">Custom action</Button>
          <Button variant="outline" className="border-dashed">
            Dashed outline
          </Button>
        </Example>
        <Prose>
          <p>
            Classes are merged with <code>tailwind-merge</code>: when your class conflicts with a default (<code>px-8</code> vs the size padding), yours wins and
            the default is removed. Non-conflicting core styles (focus ring, disabled state) stay intact. The stylesheet uses cascade layers, so your unlayered CSS
            always beats library CSS without <code>!important</code>.
          </p>
          <p>
            Responsive classes work the same way (<code>className="sm:flex-col"</code>). In a Tailwind app this relies on one build generating both your
            utilities and the components': import <code>@darkalpha/nova-ui/tailwind.css</code> instead of <code>styles.css</code> (see Getting started).
          </p>
        </Prose>
      </Section>
      <Section title="4. Extending variants">
        <CodeBlock
          code={`import { Button, buttonVariants, cn, type ButtonProps } from "@darkalpha/nova-ui";

// Wrap, don't fork: a project-specific variant built from tokens.
export function UpgradeButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      variant="gradient"
      className={cn("rounded-full uppercase tracking-wide", props.className)}
    />
  );
}

// Or reuse button styles on any element:
<a className={buttonVariants({ variant: "outline", size: "sm" })} href="/docs">Docs</a>`}
        />
      </Section>
    </Page>
  );
}

export function CustomComponentsPage() {
  return (
    <Page eyebrow="Guides" title="Custom components" lead="Build project-specific components with the same tokens, utilities and patterns as the library.">
      <Example
        title="A stat card built from tokens"
        code={`import { Card, cn } from "@darkalpha/nova-ui";

export function StatCard({ label, value, delta }: { label: string; value: string; delta: number }) {
  const up = delta >= 0;
  return (
    <Card className="gap-1">
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className={cn("text-sm font-semibold", up ? "text-success-text" : "text-danger-text")}>
        {up ? "▲" : "▼"} {Math.abs(delta)}% vs last month
      </p>
    </Card>
  );
}`}
      >
        {[
          ["Revenue", "$48.2k", 12.4],
          ["Churn", "2.1%", -0.6],
          ["Active users", "9,812", 4.1],
        ].map(([label, value, delta]) => (
          <Card key={label as string} className="min-w-44 flex-1 gap-1">
            <p className="text-sm text-foreground-muted">{label}</p>
            <p className="font-display text-3xl font-bold">{value}</p>
            <p className={(delta as number) >= 0 ? "text-sm font-semibold text-success-text" : "text-sm font-semibold text-danger-text"}>
              {(delta as number) >= 0 ? "▲" : "▼"} {Math.abs(delta as number)}% vs last month
            </p>
          </Card>
        ))}
      </Example>
      <Section title="Guidelines">
        <Prose>
          <ul>
            <li>
              Use semantic utilities (<code>bg-surface</code>, <code>text-foreground-muted</code>, <code>border-border</code>) — never raw hex or palette names.
            </li>
            <li>
              Without Tailwind, use variables directly: <code>background: var(--nv-color-primary-subtle)</code>.
            </li>
            <li>
              Reuse <code>buttonVariants</code>, <code>fieldVariants</code> and <code>cn</code> instead of copying classes.
            </li>
            <li>
              Wire custom inputs to FormField with <code>useFormField(props)</code>, and portal overlays with <code>{"<Portal>"}</code> so they inherit the theme.
            </li>
            <li>
              Read theme state with <code>useTheme()</code> (resolved colors, mode, dir) — for example to color a canvas chart.
            </li>
          </ul>
        </Prose>
      </Section>
      <Section title="Adding project tokens">
        <CodeBlock
          language="css"
          code={`/* Project tokens should reference system tokens, so they follow themes and modes. */
.nv-theme {
  --app-sidebar-bg: var(--nv-color-surface-sunken);
  --app-highlight: color-mix(in oklab, var(--nv-color-accent-solid) 18%, transparent);
}`}
        />
        <Prose>
          <p>
            Create a <strong>primitive</strong> only for a genuinely new raw value (a new hue scale). Create a <strong>semantic</strong> token when a purpose
            repeats across components and must change per theme or mode. Create a <strong>component</strong> token when one component needs a narrow, documented
            knob. If you are reaching for a component token to change color everywhere, change the theme instead.
          </p>
        </Prose>
      </Section>
    </Page>
  );
}

export function MigrationPage() {
  return (
    <Page eyebrow="Guides" title="Upgrading" lead="Nova UI follows semantic versioning. Releases are managed with Changesets and every change is listed in the package changelogs.">
      <Section title="Versioning policy">
        <Prose>
          <ul>
            <li>
              <strong>Patch</strong>: bug fixes, accessibility fixes, visual refinements that keep token names and props.
            </li>
            <li>
              <strong>Minor</strong>: new components, props, tokens or presets. Existing APIs keep working.
            </li>
            <li>
              <strong>Major</strong>: removals or renames of public exports, props, token names or CSS variables — always with a migration section here and a
              deprecation period with development warnings in the prior minor.
            </li>
          </ul>
          <p>
            <code>@darkalpha/nova-tokens</code> and <code>@darkalpha/nova-ui</code> are versioned together, so you never need to match versions by hand.
          </p>
        </Prose>
      </Section>
      <Section title="Upgrading">
        <CodeBlock language="bash" code={`pnpm up @darkalpha/nova-ui@latest\n# then run your type check — removed or renamed props surface as TypeScript errors`} />
      </Section>
      <Section title="0.x → 1.0 (planned)">
        <Alert variant="info" title="Pre-1.0">
          0.x minors may contain small breaking changes, always called out in the changelog. Pin a minor range (<code>~{__NOVA_VERSION__.replace(/\.\d+$/, ".0")}</code>) until 1.0.
        </Alert>
      </Section>
    </Page>
  );
}

export function TroubleshootingPage() {
  const items: [string, string][] = [
    ["Components look unstyled", "Import \"@darkalpha/nova-ui/styles.css\" once at your app root, and render components inside <ThemeProvider> (the scoped reset and font apply under .nv-theme)."],
    ["A dialog or menu ignores my theme", "Overlays portal into the nearest ThemeProvider. If you render your own Radix portal, pass container={usePortalContainer()} or use <Portal>."],
    ["Dark mode flashes on load", "When using storageKey, render <ThemeScript storageKey=\"…\" /> in <head>. Without storageKey, 'system' mode is pure CSS and cannot flash."],
    ["Hydration warning on <html>", "Add suppressHydrationWarning to <html>; ThemeScript sets data-nv-mode before React hydrates."],
    ["My Tailwind classes like bg-primary don't exist", "Import \"@darkalpha/nova-ui/tailwind.css\" after \"tailwindcss\" in your CSS entry (Tailwind v4), in place of styles.css."],
    ["Responsive layouts ignore the breakpoint (a dialog footer stays stacked on desktop)", "Your app runs Tailwind and also loads \"@darkalpha/nova-ui/styles.css\": two builds each sort their own utilities, so your sheet's base utility (flex-col) can follow the library's sm:flex-row and win at every width. Import \"@darkalpha/nova-ui/tailwind.css\" after \"tailwindcss\" instead of styles.css, so one build orders everything."],
    ["My className doesn't override", "Check for a conflicting variant prop; tailwind-merge resolves conflicts within the same utility group. For plain CSS, unlayered rules always win over the library's layered CSS."],
    ["Brand color looks darker than my hex", "Text on it would fail 4.5:1, so the resolver chose a nearby readable tone. In development a warning lists every adjustment; see the playground's Contrast tab."],
    ["Colors don't switch in an old browser", "light-dark() requires 2024+ browsers. For older targets, set an explicit mode — explicit light/dark still works where color-scheme is supported."],
  ];
  return (
    <Page eyebrow="Guides" title="Troubleshooting" lead="Common problems and their fixes.">
      <Accordion type="multiple" className="max-w-3xl">
        {items.map(([q, a]) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent>{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Page>
  );
}

export function ContributingPage() {
  return (
    <Page eyebrow="Guides" title="Contributing" lead="How the repository is organized and what a change needs before it merges.">
      <Section title="Repository layout">
        <CodeBlock
          language="text"
          code={`packages/
  tokens/   @darkalpha/nova-tokens — primitives, color engine, semantic resolver, presets, CSS generation
  ui/       @darkalpha/nova-ui     — React components, ThemeProvider, styles.css build
apps/
  docs/     this site + theme playground + Playwright suites
scripts/    install verification and bundle size report`}
        />
      </Section>
      <Section title="Workflow">
        <CodeBlock
          language="bash"
          code={`pnpm install
pnpm build          # tokens → ui (JS, types, CSS)
pnpm dev            # docs at http://localhost:5173
pnpm test           # unit + accessibility tests
pnpm check          # everything CI runs
pnpm changeset      # describe your change for the changelog`}
        />
      </Section>
      <Section title="Definition of done for a component">
        <Card variant="tinted" className="gap-2">
          <Prose>
            <ul>
              <li>Styles only use semantic tokens and component tokens — no hex values, no palette names.</li>
              <li>Typed props with sensible defaults; forwards refs and className; uses variants rather than boolean pileups.</li>
              <li>Keyboard support, correct ARIA, visible focus, works in RTL and with reduced motion.</li>
              <li>Unit tests for behavior plus an axe check; a docs example with variants, sizes, states and accessibility notes.</li>
              <li>A changeset describing the change.</li>
            </ul>
          </Prose>
        </Card>
      </Section>
      <Section title="Documenting a component">
        <Prose>
          <p>
            Each component has its own page at <code>/components/&lt;id&gt;</code>. To add one, write an <code>&lt;Name&gt;Examples</code> function in{" "}
            <code>apps/docs/src/examples/</code> and add an entry to <code>apps/docs/src/docs/registry.ts</code> with its category, summary, the exports
            to document and any accessibility notes.
          </p>
          <p>
            The API reference is generated from the TypeScript source: types, required flags and defaults come from the code, and descriptions come from
            each prop's JSDoc. Write a <code>/** … */</code> comment on every prop of your own; common props such as <code>value</code>, <code>open</code>{" "}
            and <code>asChild</code> share a standard description.
          </p>
        </Prose>
      </Section>
    </Page>
  );
}
