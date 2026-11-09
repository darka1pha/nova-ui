import { primitives } from "@darkalpha/nova-tokens";
import { Badge, SearchInput, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tooltip, contrastRatio, useTheme, type SemanticColorName } from "@darkalpha/nova-ui";
import { useMemo, useState } from "react";
import { CopyButton, Page, Prose, Section } from "../docs/kit.tsx";

function Swatch({ color }: { color: string }) {
  return (
    <Tooltip content={color}>
      <span className="inline-block size-6 rounded-sm border border-border-strong align-middle" style={{ background: color }} aria-label={color} role="img" />
    </Tooltip>
  );
}

const scaleNames = Object.keys(primitives.palette) as (keyof typeof primitives.palette)[];

export function TokensPage() {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const names = useMemo(() => (Object.keys(theme.light) as SemanticColorName[]).filter((n) => n.includes(query.trim().toLowerCase())), [theme, query]);

  return (
    <Page eyebrow="Foundations" title="Token reference" lead="Live values for the active theme. Change the preset in the header and this page updates.">
      <Section title="Semantic colors">
        <Prose>
          <p>
            Use them as CSS variables (<code>var(--nv-color-primary-solid)</code>) or, with the Tailwind preset, as utilities (<code>bg-primary</code>,{" "}
            <code>text-primary-on-subtle</code>, <code>border-border-strong</code>). <code>solid</code> maps to the bare intent name.
          </p>
        </Prose>
        <SearchInput aria-label="Filter tokens" placeholder="Filter tokens, e.g. danger" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} className="max-w-sm" />
        <Table density="compact" stickyHeader containerClassName="max-h-[36rem]">
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Light</TableHead>
              <TableHead>Dark</TableHead>
              <TableHead>Variable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {names.map((name) => (
              <TableRow key={name}>
                <TableCell className="font-mono text-[13px] font-semibold">{name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-mono text-xs">
                    <Swatch color={theme.light[name]} /> {theme.light[name]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-mono text-xs">
                    <Swatch color={theme.dark[name]} /> {theme.dark[name]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-foreground-muted">
                    --nv-color-{name}
                    <CopyButton text={`var(--nv-color-${name})`} label="Copy variable" />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="Primitive palette">
        <Prose>
          <p>
            Twenty OKLCH scales with 12 steps each. Themes reference them by name (<code>colors: {"{ primary: \"violet\" }"}</code>). The number under each swatch
            is its contrast against white.
          </p>
        </Prose>
        <div className="flex flex-col gap-2 overflow-x-auto pb-2">
          {scaleNames.map((name) => {
            const scale = primitives.palette[name];
            return (
              <div key={name} className="grid min-w-[44rem] grid-cols-[6rem_repeat(12,minmax(0,1fr))] items-center gap-1">
                <span className="font-mono text-xs font-semibold text-foreground-secondary">{name}</span>
                {Object.entries(scale).map(([step, hex]) => (
                  <Tooltip key={step} content={`${name}-${step} · ${hex}`}>
                    <div className="flex h-10 flex-col items-center justify-center rounded-sm text-[10px] font-semibold" style={{ background: hex, color: contrastRatio(hex, "#ffffff") >= 3 ? "#fff" : "#111" }}>
                      {step}
                    </div>
                  </Tooltip>
                ))}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Scales">
        {/* min-w-0: the Motion table's long easing values would otherwise widen the single column past a phone screen. */}
        <div className="grid gap-4 *:min-w-0 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Badge variant="neutral" className="w-fit">Radius (from --nv-radius-base)</Badge>
            <div className="flex flex-wrap items-end gap-3">
              {["xs", "sm", "md", "lg", "xl", "2xl", "full"].map((r) => (
                <div key={r} className="flex flex-col items-center gap-1">
                  <div className="size-12 border-2 border-primary bg-primary-subtle" style={{ borderRadius: `var(--nv-radius-${r})` }} />
                  <code className="text-2xs text-foreground-muted">{r}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="neutral" className="w-fit">Elevation</Badge>
            <div className="flex flex-wrap gap-4 p-2">
              {["xs", "sm", "md", "lg", "xl"].map((s) => (
                <div key={s} className="flex size-14 items-center justify-center rounded-md bg-surface-raised text-2xs font-semibold text-foreground-muted" style={{ boxShadow: `var(--nv-shadow-${s})` }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Badge variant="neutral" className="w-fit">Type scale</Badge>
            {Object.entries(primitives.fontSize)
              .reverse()
              .slice(1, 9)
              .map(([k, [size]]) => (
                <div key={k} className="flex items-baseline gap-4">
                  <code className="w-24 shrink-0 text-xs text-foreground-muted">
                    {k} · {size}
                  </code>
                  <span className="truncate font-display font-semibold" style={{ fontSize: size, lineHeight: 1.2 }}>
                    Colorful by default
                  </span>
                </div>
              ))}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Badge variant="neutral" className="w-fit">Motion</Badge>
            <Table density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Object.entries(primitives.duration).map(([k, v]) => [`--nv-duration-${k}`, v]), ...Object.entries(primitives.easing).map(([k, v]) => [`--nv-ease-${k}`, v])].map(([k, v]) => (
                  <TableRow key={k}>
                    <TableCell className="font-mono text-xs">{k}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground-secondary">{v}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Section>
    </Page>
  );
}
