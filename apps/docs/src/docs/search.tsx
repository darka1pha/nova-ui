import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandPalette, CommandShortcut, Kbd } from "@darkalpha/nova-ui";
import { Blocks, FileText, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ApiData } from "../../scripts/api-types.ts";
import { nav } from "../pages/index.tsx";
import { navigate } from "./kit.tsx";
import { components } from "./registry.ts";

/*
 * ⌘K / Ctrl+K search over pages, components and their props. Pages and
 * components are always searchable; props come from the generated API data
 * (virtual:nova-api), which loads the first time the palette opens.
 */

interface Entry {
  kind: "page" | "component" | "prop";
  route: string;
  label: string;
  /** Shown under the label. */
  detail?: string;
  /** Extra words that match but aren't shown. */
  keywords?: string;
}

const componentRoutes = new Set(components.map((c) => `components/${c.id}`));

const staticEntries: Entry[] = [
  ...nav.flatMap((group) =>
    group.items.flatMap((item) => [
      { kind: "page" as const, route: item.id, label: item.label, detail: group.title, keywords: item.keywords },
      ...(item.children ?? [])
        .filter((child) => !componentRoutes.has(child.id))
        .map((child) => ({ kind: "page" as const, route: child.id, label: child.label, detail: item.label, keywords: child.keywords })),
    ]),
  ),
  ...components.map((c) => ({ kind: "component" as const, route: `components/${c.id}`, label: c.name, detail: c.summary, keywords: c.parts.join(" ") })),
];

function propEntries(api: ApiData): Entry[] {
  const out: Entry[] = [];
  for (const c of components) {
    for (const part of c.parts) {
      const info = api[part];
      if (!info) continue;
      for (const prop of info.props) {
        out.push({ kind: "prop", route: `components/${c.id}#api-${part}`, label: `${part}.${prop.name}`, detail: prop.type, keywords: prop.description });
      }
    }
  }
  return out;
}

/** Higher is better; 0 means no match. Every word of the query has to match. */
function score(entry: Entry, words: string[]): number {
  const label = entry.label.toLowerCase();
  const rest = `${entry.detail ?? ""} ${entry.keywords ?? ""}`.toLowerCase();
  // For a prop ("Button.loading"), the prop's own name matters most.
  const name = entry.kind === "prop" ? label.slice(label.indexOf(".") + 1) : label;
  let total = 0;
  for (const word of words) {
    if (label === word || name === word) total += 8;
    else if (name !== label && name.startsWith(word)) total += 6;
    else if (label.startsWith(word)) total += 5;
    else if (label.split(/[\s.&/-]+/).some((part) => part.startsWith(word))) total += 4;
    else if (label.includes(word)) total += 2;
    else if (rest.includes(word)) total += 1;
    else return 0;
  }
  // Pages and components before props on a tie.
  return total + (entry.kind === "prop" ? 0 : 0.5);
}

const LIMITS = { page: 8, component: 12, prop: 20 } as const;
const startHere = staticEntries.filter((e) => ["installation", "getting-started", "theming", "playground", "forms-validation"].includes(e.route));

export function useSearchShortcut(setOpen: (open: boolean | ((o: boolean) => boolean)) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  // The highlighted result; null means "the first one", so Enter right after typing opens the best match.
  const [active, setActive] = useState<string | null>(null);
  const [props, setProps] = useState<Entry[]>([]);
  useEffect(() => {
    if (!open || props.length) return;
    let live = true;
    void import("virtual:nova-api").then((m) => {
      if (live) setProps(propEntries(m.default));
    });
    return () => {
      live = false;
    };
  }, [open, props.length]);

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    const ranked = [...staticEntries, ...props]
      .map((entry) => ({ entry, s: score(entry, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.entry.label.localeCompare(b.entry.label));
    const by = (kind: Entry["kind"]) => ranked.filter((r) => r.entry.kind === kind).slice(0, LIMITS[kind]).map((r) => r.entry);
    return { page: by("page"), component: by("component"), prop: by("prop") };
  }, [query, props]);

  const keyOf = (entry: Entry) => `${entry.kind}:${entry.route}:${entry.label}`.toLowerCase();
  const shown = results ? [...results.page, ...results.component, ...results.prop] : startHere;
  const value = active && shown.some((e) => keyOf(e) === active) ? active : shown[0] ? keyOf(shown[0]) : "";

  const go = (route: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(route);
  };
  const item = (entry: Entry) => {
    const Icon = entry.kind === "page" ? FileText : entry.kind === "component" ? Blocks : SlidersHorizontal;
    return (
      <CommandItem key={keyOf(entry)} value={keyOf(entry)} onSelect={() => go(entry.route)}>
        <Icon aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{entry.label}</span>
          {entry.detail ? <span className="truncate text-xs text-foreground-muted">{entry.detail}</span> : null}
        </span>
      </CommandItem>
    );
  };

  return (
    <CommandPalette
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
      title="Search the docs"
      commandProps={{ shouldFilter: false, loop: true, value, onValueChange: setActive }}
    >
      <CommandInput
        value={query}
        onValueChange={(next) => {
          setQuery(next);
          setActive(null);
        }}
        placeholder="Search pages, components and props…"
      />
      <CommandList>
        {results ? (
          <>
            <CommandEmpty>No results for “{query.trim()}”.</CommandEmpty>
            {results.page.length ? <CommandGroup heading="Pages">{results.page.map(item)}</CommandGroup> : null}
            {results.component.length ? <CommandGroup heading="Components">{results.component.map(item)}</CommandGroup> : null}
            {results.prop.length ? <CommandGroup heading="Props">{results.prop.map(item)}</CommandGroup> : null}
          </>
        ) : (
          <CommandGroup heading="Start here">{startHere.map(item)}</CommandGroup>
        )}
      </CommandList>
    </CommandPalette>
  );
}

const noopSubscribe = () => () => {};

/** The header button that opens the palette, showing the shortcut. */
export function SearchButton({ onClick }: { onClick: () => void }) {
  const mac = useSyncExternalStore(noopSubscribe, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts="Control+K Meta+K"
      className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus-ring max-sm:w-8 max-sm:justify-center max-sm:px-0"
    >
      <Search aria-hidden className="size-4" />
      <span className="max-sm:sr-only">Search</span>
      <CommandShortcut className="ms-3 max-md:hidden">
        <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd> <Kbd>K</Kbd>
      </CommandShortcut>
    </button>
  );
}
