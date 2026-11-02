import { Badge, Button, Card, cn, EmptyState, Heading, Kbd, SearchInput, Slider, Text, toast, ToggleGroup, ToggleGroupItem, Tooltip } from "@darkalpha/nova-ui";
import {
  Anchor,
  BillOfLading,

  CheckCircle,
  ContainerShip,
  Copy,
  Download,
  IconProvider,
  PortCrane,
  Search,
  Tugboat,
  type IconComponent,
  type IconVariant,
} from "@darkalpha/nova-ui/icons";
import { iconCatalog, iconCategories, type IconEntry } from "@darkalpha/nova-ui/icons/catalog";
import { createElement, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ApiSection } from "../docs/api.tsx";
import { CodeBlock, Example, Page, Prose, Section } from "../docs/kit.tsx";

/* ----------------------------------------------------------------- Helpers */

const VARIANTS: { id: IconVariant; label: string }[] = [
  { id: "linear", label: "Linear" },
  { id: "duotone", label: "Duotone" },
  { id: "soft", label: "Soft" },
];
const SIZES = [16, 20, 24, 32] as const;
const COLORS = [
  { id: "foreground", label: "Ink", className: "text-foreground", swatch: "bg-foreground" },
  { id: "primary", label: "Primary", className: "text-primary-text", swatch: "bg-primary-solid" },
  { id: "accent", label: "Accent", className: "text-accent-text", swatch: "bg-accent-solid" },
  { id: "secondary", label: "Secondary", className: "text-secondary-text", swatch: "bg-secondary-solid" },
] as const;
type ColorId = (typeof COLORS)[number]["id"];

const categoryLabel = (id: string) => iconCategories.find((c) => c.id === id)?.label ?? id;

/** Lowercased words and their camel-case pieces, so "ship" finds "ContainerShip". */
const searchText = (entry: IconEntry) =>
  [entry.name, entry.name.replace(/([a-z])([A-Z])/g, "$1 $2"), categoryLabel(entry.category), ...entry.tags].join(" ").toLowerCase();
const index = iconCatalog.map((entry) => ({ entry, text: searchText(entry) }));

function matches(query: string): IconEntry[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return iconCatalog;
  return index.filter(({ text }) => words.every((w) => text.includes(w))).map(({ entry }) => entry);
}

function svgMarkup(Icon: IconComponent, variant: IconVariant, strokeWidth: number) {
  return renderToStaticMarkup(createElement(Icon, { variant, strokeWidth, "aria-hidden": undefined, focusable: undefined }))
    .replace(/ (class|data-variant|focusable|aria-hidden)="[^"]*"/g, "");
}

function jsxSnippet(name: string, variant: IconVariant, size: number, strokeWidth: number) {
  const props = [variant !== "linear" && `variant="${variant}"`, size !== 24 && `size={${size}}`, strokeWidth !== 1.5 && `strokeWidth={${strokeWidth}}`].filter(Boolean);
  return `<${name}${props.length ? ` ${props.join(" ")}` : ""} />`;
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} copied`, { variant: "success" });
  } catch {
    toast("Couldn't copy", { description: "Your browser blocked clipboard access.", variant: "danger" });
  }
}

/* ---------------------------------------------------------------- Explorer */

function IconExplorer() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<string>("all");
  const [variant, setVariant] = useState<IconVariant>("linear");
  const [size, setSize] = useState<number>(24);
  const [stroke, setStroke] = useState(1.5);
  const [color, setColor] = useState<ColorId>("foreground");
  const [selectedName, setSelectedName] = useState("ContainerShip");
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // "/" jumps to search from anywhere on the page, like most icon sites.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || target.closest("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const found = useMemo(() => matches(deferredQuery), [deferredQuery]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of found) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, [found]);
  const visible = category === "all" ? found : found.filter((e) => e.category === category);
  const grouped = category === "all" && !deferredQuery.trim();
  const selected = iconCatalog.find((e) => e.name === selectedName) ?? (iconCatalog[0] as IconEntry);
  const colorClass = COLORS.find((c) => c.id === color)?.className;

  // Arrow keys move between tiles; the grid is one tab stop away from the toolbar.
  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key) || !gridRef.current) return;
    const tiles = [...gridRef.current.querySelectorAll<HTMLButtonElement>("[data-icon-tile]")];
    const current = tiles.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    const first = tiles[0]?.getBoundingClientRect().top ?? 0;
    const perRow = Math.max(1, tiles.filter((t) => t.getBoundingClientRect().top === first).length);
    const rtl = getComputedStyle(gridRef.current).direction === "rtl";
    const next = {
      ArrowLeft: current + (rtl ? 1 : -1),
      ArrowRight: current + (rtl ? -1 : 1),
      ArrowUp: current - perRow,
      ArrowDown: current + perRow,
      Home: 0,
      End: tiles.length - 1,
    }[e.key] as number;
    const tile = tiles[Math.min(tiles.length - 1, Math.max(0, next))];
    if (tile) {
      e.preventDefault();
      tile.focus();
    }
  };

  const tile = (entry: IconEntry) => {
    const active = entry.name === selected.name;
    return (
      <button
        key={entry.name}
        type="button"
        data-icon-tile
        aria-pressed={active}
        title={entry.name}
        onClick={() => setSelectedName(entry.name)}
        onDoubleClick={() => copy(jsxSnippet(entry.name, variant, size, stroke), entry.name)}
        className={cn(
          "group/tile relative flex h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border p-2 outline-none transition-[background-color,border-color,box-shadow,transform] duration-(--nv-duration-fast)",
          "focus-visible:ring-3 focus-visible:ring-focus-ring/40",
          active ? "border-primary-border bg-primary-subtle shadow-xs" : "border-transparent hover:border-border hover:bg-surface-hover",
        )}
      >
        <entry.component size={size} strokeWidth={stroke} variant={variant} className={cn("transition-transform duration-(--nv-duration-normal) ease-(--nv-ease-interactive) group-hover/tile:scale-110", colorClass)} />
        <span className={cn("w-full truncate text-center text-2xs", active ? "font-semibold text-primary-on-subtle" : "text-foreground-muted group-hover/tile:text-foreground")}>
          {entry.name}
        </span>
      </button>
    );
  };

  return (
    <Card variant="outline" className="@container gap-0 overflow-visible p-0">
      {/* Toolbar */}
      {/* Sticky only when wide; on narrow screens it would eat a third of the viewport. */}
      <div className="z-10 flex flex-col gap-3 @min-[40rem]:sticky @min-[40rem]:top-14 rounded-t-(--nv-card-radius) border-b border-border bg-surface/90 p-3 backdrop-blur-md sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <SearchInput
              ref={searchRef}
              aria-label="Search icons"
              placeholder={`Search ${iconCatalog.length} icons — try “crane”, “reefer”, “eta”`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
            />
            {!query ? <Kbd className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">/</Kbd> : null}
          </div>
          <ToggleGroup type="single" aria-label="Variant" value={variant} onValueChange={(v) => v && setVariant(v as IconVariant)}>
            {VARIANTS.map((v) => (
              <ToggleGroupItem key={v.id} value={v.id} size="sm" className="gap-1.5 px-2.5">
                <CheckCircle variant={v.id} size={16} />
                {v.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-foreground-secondary">
          <div className="flex items-center gap-2">
            <span id="icon-size-label" className="font-medium">Size</span>
            <ToggleGroup type="single" aria-labelledby="icon-size-label" value={String(size)} onValueChange={(v) => v && setSize(Number(v))}>
              {SIZES.map((s) => (
                <ToggleGroupItem key={s} value={String(s)} size="sm" className="min-w-9 px-2 tabular-nums">
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex min-w-48 items-center gap-3">
            <span className="font-medium">Stroke</span>
            <Slider className="w-28" min={1} max={2.5} step={0.25} value={[stroke]} onValueChange={([v]) => setStroke(v ?? 1.5)} thumbLabels={["Stroke width"]} />
            <span className="w-8 tabular-nums text-foreground">{stroke.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Preview color">
            <span className="font-medium">Color</span>
            {COLORS.map((c) => (
              <Tooltip key={c.id} content={c.label}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={color === c.id}
                  aria-label={c.label}
                  onClick={() => setColor(c.id)}
                  className={cn(
                    "size-6 rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-focus-ring",
                    c.swatch,
                    color === c.id && "ring-2 ring-foreground",
                  )}
                />
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Categories">
          {[{ id: "all", label: "All" }, ...iconCategories].map((c) => {
            const count = c.id === "all" ? found.length : (counts.get(c.id) ?? 0);
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={count === 0 && !active}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-40",
                  active ? "border-primary-solid bg-primary-solid text-primary-on-solid" : "border-border bg-surface text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
                )}
              >
                {c.label}
                <span className={cn("tabular-nums", active ? "font-normal" : "text-foreground-muted")}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col @min-[40rem]:grid @min-[40rem]:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Grid */}
        <div className="min-w-0 p-3 sm:p-4" ref={gridRef} onKeyDown={onGridKeyDown}>
          <p aria-live="polite" className="mb-3 text-xs text-foreground-muted">
            {visible.length === iconCatalog.length ? `${visible.length} icons` : `${visible.length} of ${iconCatalog.length} icons`}
            <span className="hidden sm:inline"> · Click to inspect, double-click to copy JSX, arrow keys to move.</span>
          </p>
          {visible.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<Search />}
              title={`No icons match “${query}”`}
              description="Try a broader word such as ship, cargo, port or arrow."
              actions={
                <Button size="sm" variant="outline" onClick={() => { setQuery(""); setCategory("all"); }}>
                  Clear search
                </Button>
              }
            />
          ) : grouped ? (
            <div className="flex flex-col gap-6">
              {iconCategories.map((c) => {
                const entries = visible.filter((e) => e.category === c.id);
                return (
                  <section key={c.id} aria-labelledby={`icons-${c.id}`} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3 px-1">
                      <Heading level={3} size="xs" id={`icons-${c.id}`} className="shrink-0 whitespace-nowrap">
                        {c.label}
                      </Heading>
                      <Text size="xs" tone="muted" className="hidden truncate sm:block">
                        {c.description}
                      </Text>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-1">{entries.map(tile)}</div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-1">{visible.map(tile)}</div>
          )}
        </div>

        {/* Inspector */}
        <IconInspector entry={selected} variant={variant} size={size} stroke={stroke} colorClass={colorClass} />
      </div>
    </Card>
  );
}

function IconInspector({ entry, variant, size, stroke, colorClass }: { entry: IconEntry; variant: IconVariant; size: number; stroke: number; colorClass?: string }) {
  const Glyph = entry.component;
  const importLine = `import { ${entry.name} } from "@darkalpha/nova-ui/icons";`;
  const jsx = jsxSnippet(entry.name, variant, size, stroke);
  const [justCopied, setJustCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!justCopied) return;
    const t = setTimeout(() => setJustCopied(null), 1500);
    return () => clearTimeout(t);
  }, [justCopied]);

  const action = (id: string, label: string, run: () => void, Icon: IconComponent) => (
    <Button
      size="sm"
      variant="outline"
      className="flex-1"
      startIcon={justCopied === id ? <CheckCircle className="text-success-text" /> : <Icon />}
      onClick={() => {
        run();
        setJustCopied(id);
      }}
    >
      {label}
    </Button>
  );

  const downloadSvg = () => {
    const blob = new Blob([svgMarkup(Glyph, variant, stroke)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `${Glyph.iconName}.svg` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      aria-label="Selected icon"
      className={cn(
        // Narrow: a floating "mini player" pinned to the bottom of the explorer while it's in view.
        "sticky bottom-3 z-10 mx-3 mb-3 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-md",
        // Wide: a side column with every detail.
        "@min-[40rem]:static @min-[40rem]:m-0 @min-[40rem]:rounded-none @min-[40rem]:rounded-ee-(--nv-card-radius) @min-[40rem]:border-0 @min-[40rem]:border-s @min-[40rem]:border-border @min-[40rem]:bg-surface-sunken/60 @min-[40rem]:p-4 @min-[40rem]:shadow-none @min-[40rem]:backdrop-blur-none",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 @min-[40rem]:sticky @min-[40rem]:top-[15rem] @min-[40rem]:flex-col @min-[40rem]:flex-nowrap @min-[40rem]:items-stretch @min-[40rem]:gap-4">
        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface @min-[40rem]:aspect-[4/3] @min-[40rem]:size-auto">
          {/* 24-unit grid behind the preview: one cell per unit, safe area outlined. */}
          <div aria-hidden className="absolute hidden size-36 bg-[linear-gradient(var(--nv-color-border)_1px,transparent_1px),linear-gradient(90deg,var(--nv-color-border)_1px,transparent_1px)] bg-size-[6px_6px] opacity-60 @min-[40rem]:block" />
          <div aria-hidden className="absolute hidden size-[7.5rem] rounded-sm border border-dashed border-primary-border @min-[40rem]:block" />
          <Glyph key={`${entry.name}-${variant}`} size={144} strokeWidth={stroke} variant={variant} className={cn("relative size-8 animate-nv-pop-in @min-[40rem]:size-36", colorClass)} />
        </div>

        <div className="hidden items-center justify-between gap-2 @min-[40rem]:flex">
          {VARIANTS.map((v) => (
            <div key={v.id} className={cn("flex flex-1 flex-col items-center gap-1 rounded-lg py-2", v.id === variant && "bg-surface ring-1 ring-border")}>
              <Glyph size={28} strokeWidth={stroke} variant={v.id} className={colorClass} />
              <span className="text-2xs text-foreground-muted">{v.label}</span>
            </div>
          ))}
        </div>

        <div className="hidden items-end justify-center gap-4 rounded-lg bg-surface py-3 ring-1 ring-border @min-[40rem]:flex">
          {[16, 20, 24, 32].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <Glyph size={s} strokeWidth={stroke} variant={variant} absoluteStrokeWidth={s < 20} className={colorClass} />
              <span className="text-2xs tabular-nums text-foreground-muted">{s}</span>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Heading level={3} size="sm" className="truncate">
            {entry.name}
          </Heading>
          <Badge variant="neutral" className="w-fit">
            {categoryLabel(entry.category)}
          </Badge>
          {entry.tags.length ? (
            <p className="hidden text-xs text-foreground-muted @min-[40rem]:block">
              <span className="sr-only">Also found by: </span>
              {entry.tags.join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto @min-[40rem]:w-full">
          <CodeBlock code={`${importLine}\n\n${jsx}`} className="hidden text-xs @min-[40rem]:block" />
          <div className="flex gap-2">
            {action("jsx", "JSX", () => copy(jsx, "JSX"), Copy)}
            {action("svg", "SVG", () => copy(svgMarkup(Glyph, variant, stroke), "SVG"), Copy)}
            {action("dl", "Save", downloadSvg, Download)}
          </div>
        </div>
      </div>
    </aside>
  );
}

/* --------------------------------------------------------------------- Page */

export function IconsPage() {
  const vessels = iconCatalog.filter((e) => ["vessels", "port", "cargo", "customs"].includes(e.category)).length;
  return (
    <Page
      wide
      eyebrow="Foundations"
      title="Icons"
      lead="A modern, minimal icon set drawn on one grid, with everyday interface icons and a dedicated shipping & marine collection. Three variants, fully themeable, tree-shakable."
    >
      {/* Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: iconCatalog.length, label: "Icons", hint: "and growing" },
          { value: vessels, label: "Shipping & marine", hint: "vessels, port, cargo, customs" },
          { value: 3, label: "Variants", hint: "linear · duotone · soft" },
          { value: "24 / 1.5", label: "Grid & stroke", hint: "px, round caps and joins" },
        ].map((s) => (
          <Card key={s.label} variant="outline" className="gap-1 p-4">
            <span className="font-display text-2xl font-semibold tabular-nums text-foreground">{s.value}</span>
            <span className="text-sm font-medium text-foreground">{s.label}</span>
            <span className="text-xs text-foreground-muted">{s.hint}</span>
          </Card>
        ))}
      </div>

      <IconExplorer />

      <Section title="Install and use">
        <Prose>
          <p>
            Icons ship with <code>@darkalpha/nova-ui</code> under their own entry point. Each icon is a separate export, so your bundle only includes the ones you
            import. They inherit <code>currentColor</code>, so text color utilities and component colors just work.
          </p>
        </Prose>
        <CodeBlock
          code={`import { ContainerShip, PortCrane, Search } from "@darkalpha/nova-ui/icons";

<ContainerShip />                         // 24px, linear
<PortCrane variant="duotone" size={20} />
<Search className="size-4 text-foreground-muted" />`}
        />
      </Section>

      <Section title="Variants">
        <Example
          title="Linear, duotone and soft"
          description="Duotone dims the secondary part of a glyph so the key shape leads. Soft adds a light tint inside closed shapes — friendly for empty states, cards and marketing."
          code={`<ContainerShip variant="linear" />
<ContainerShip variant="duotone" />
<ContainerShip variant="soft" />`}
        >
          <div className="flex w-full flex-wrap items-center justify-center gap-10 text-primary-text">
            {VARIANTS.map((v) => (
              <div key={v.id} className="flex flex-col items-center gap-3">
                <div className="flex gap-3">
                  {[ContainerShip, Tugboat, PortCrane, Anchor, BillOfLading].map((I) => (
                    <I key={I.iconName} variant={v.id} size={32} />
                  ))}
                </div>
                <Text size="sm" tone="muted">
                  {v.label}
                </Text>
              </div>
            ))}
          </div>
        </Example>
        <Example
          title="Set defaults once with IconProvider"
          description="Size, stroke and variant cascade to every Nova UI icon inside the provider. Props on an individual icon still win."
          code={`<IconProvider variant="duotone" size={20}>
  <Sidebar>…</Sidebar>
</IconProvider>`}
        >
          <IconProvider variant="duotone" size={20}>
            <div className="flex flex-wrap gap-2">
              {[
                [ContainerShip, "Fleet"],
                [PortCrane, "Terminal"],
                [BillOfLading, "Documents"],
              ].map(([I, label]) => {
                const Glyph = I as IconComponent;
                return (
                  <Button key={label as string} variant="outline" startIcon={<Glyph />}>
                    {label as string}
                  </Button>
                );
              })}
            </div>
          </IconProvider>
        </Example>
      </Section>

      <Section title="Accessibility">
        <Prose>
          <ul>
            <li>
              Icons are <strong>decorative by default</strong> (<code>aria-hidden</code>). When an icon carries meaning on its own, give it a name with{" "}
              <code>title</code> or <code>aria-label</code> and it becomes <code>role="img"</code>.
            </li>
            <li>
              Icon-only buttons need a label on the <em>button</em> — <code>IconButton</code> requires <code>aria-label</code> in its type.
            </li>
            <li>
              Pair status icons with text. Color and shape alone don't communicate state.
            </li>
            <li>
              Below 20px, pass <code>absoluteStrokeWidth</code> to keep strokes crisp, and mirror directional icons in RTL with{" "}
              <code>{"<Icon flipInRtl />"}</code>.
            </li>
          </ul>
        </Prose>
        <CodeBlock
          code={`<VesselTracking title="Live AIS position" />

<IconButton aria-label="Download bill of lading">
  <BillOfLading />
</IconButton>`}
        />
      </Section>

      <Section title="Drawing your own">
        <Prose>
          <p>
            <code>createIcon</code> turns SVG elements into a component with the same props and variants. Flag secondary parts with <code>"s"</code> (dimmed in
            duotone) and closed shapes with <code>"f"</code> (tinted in soft).
          </p>
        </Prose>
        <CodeBlock
          code={`import { createIcon } from "@darkalpha/nova-ui/icons";

export const MooringLine = createIcon("mooring-line", [
  ["ellipse", { cx: 12, cy: 6, rx: 5, ry: 2 }, "f"],
  ["path", { d: "M9 8v11M15 8v11" }],
  ["path", { d: "M9 13c-2.6.4-5.1 1.6-7 3.5" }, "s"],
]);`}
        />
        <Card variant="outline" className="grid gap-4 p-5 sm:grid-cols-2">
          {[
            ["Grid", "24 × 24 viewBox. Keep artwork inside the 20px live area (2px padding) so icons align optically."],
            ["Stroke", "1.5px, round caps and joins. Never mix stroke widths inside one glyph."],
            ["Corners", "Rounded: 1–3.5px on rectangles, matching the component radius scale."],
            ["Simplicity", "Two or three ideas per glyph at most. If it needs labels to read at 20px, simplify."],
          ].map(([title, body]) => (
            <div key={title} className="flex flex-col gap-1">
              <Text size="sm" weight="semibold">
                {title}
              </Text>
              <Text size="sm" tone="muted">
                {body}
              </Text>
            </div>
          ))}
        </Card>
      </Section>
      <ApiSection parts={["Icon"]} />
    </Page>
  );
}
