import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  IconButton,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetTitle,
  ThemeProvider,
  Toaster,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  cn,
  presets,
  useTheme,
  type ModePreference,
} from "@darkalpha/nova-ui";
import { ChevronRight, GitPullRequest, Languages, Menu, Monitor, Moon, SearchX, Sun } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { releaseLabel, to, useLinkInterception, useRoute } from "./docs/kit.tsx";
import { SearchButton, useSearchShortcut } from "./docs/search-button.tsx";

// The palette (cmdk and the search index) loads the first time it's opened.
const SearchPalette = lazy(() => import("./docs/search.tsx").then((m) => ({ default: m.SearchPalette })));
import { nav, resolveRoute, routeLabel, type NavItem } from "./pages/index.tsx";

function Logo() {
  return (
    <a href={to("home")} className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-focus-ring">
      <span aria-hidden className="relative size-8 shrink-0 overflow-hidden rounded-[10px] bg-(image:--nv-gradient-vivid) shadow-md">
        <span className="absolute inset-[5px] rotate-45 rounded-[5px] border-2 border-white/80" />
      </span>
      <span className="whitespace-nowrap font-display text-lg font-extrabold tracking-(--nv-tracking-tight) text-foreground">Nova UI</span>
      {/* Dropped on phones, where the header has no room for it. */}
      <Badge size="sm" variant="neutral" appearance="outline" className="max-sm:hidden">
        {releaseLabel}
      </Badge>
    </a>
  );
}

const linkClass = (active: boolean) =>
  cn(
    "flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-(--nv-duration-fast) focus-visible:outline-2 focus-visible:outline-focus-ring",
    active ? "bg-primary-subtle text-primary-on-subtle" : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
  );

function NavLink({ item, current, onNavigate, expandable, expanded }: { item: NavItem; current: string; onNavigate?: () => void; expandable?: boolean; expanded?: boolean }) {
  const active = item.id === current;
  return (
    <a href={to(item.id)} onClick={onNavigate} aria-current={active ? "page" : undefined} className={linkClass(active)}>
      {expandable ? <ChevronRight aria-hidden className={cn("-ms-1 size-3.5 shrink-0 transition-transform rtl:-scale-x-100", expanded && "rotate-90 rtl:rotate-90")} /> : null}
      {item.label}
      {item.badge ? (
        <Badge size="sm" variant="gradient" className="ms-auto">
          {item.badge}
        </Badge>
      ) : null}
    </a>
  );
}

function NavList({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  const [filter, setFilter] = useState("");
  const query = filter.trim().toLowerCase();
  const matches = query
    ? nav.flatMap((g) => g.items.flatMap((i) => i.children ?? [])).filter((c) => `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(query))
    : [];
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-5">
      <SearchInput
        size="sm"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        onClear={() => setFilter("")}
        placeholder="Find a component"
        aria-label="Find a component"
      />
      {query ? (
        <ul className="flex flex-col gap-0.5" aria-label="Matching components">
          {matches.map((item) => (
            <li key={item.id}>
              <NavLink
                item={item}
                current={current}
                onNavigate={() => {
                  setFilter("");
                  onNavigate?.();
                }}
              />
            </li>
          ))}
          {matches.length === 0 ? <li className="px-3 text-sm text-foreground-muted">No components match.</li> : null}
        </ul>
      ) : (
        nav.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-(--nv-tracking-wider) text-foreground-muted">{group.title}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                // Only the current category is expanded, so the list stays short.
                const expanded = !!item.children && (item.id === current || item.children.some((c) => c.id === current));
                return (
                  <li key={item.id}>
                    <NavLink item={item} current={current} onNavigate={onNavigate} expandable={!!item.children} expanded={expanded} />
                    {expanded ? (
                      <ul className="ms-4 mt-0.5 flex flex-col gap-0.5 border-s border-border ps-2">
                        {(item.children ?? []).map((child) => (
                          <li key={child.id}>
                            <NavLink item={child} current={current} onNavigate={onNavigate} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </nav>
  );
}

function ModeSwitch() {
  const { mode, setMode } = useTheme();
  return (
    <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as ModePreference)} aria-label="Color mode">
      <ToggleGroupItem value="light" aria-label="Light mode">
        <Sun />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System mode">
        <Monitor />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark mode">
        <Moon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function Shell({ theme, setTheme, dir, setDir, children }: { theme: string; setTheme: (t: string) => void; dir: "ltr" | "rtl"; setDir: (d: "ltr" | "rtl") => void; children: ReactNode }) {
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpenState] = useState(false);
  // Mount the palette only once it has been asked for, then keep it (for its close animation).
  const [searchUsed, setSearchUsed] = useState(false);
  const setSearchOpen = useCallback((next: boolean | ((open: boolean) => boolean)) => {
    setSearchUsed(true);
    setSearchOpenState(next);
  }, []);
  useSearchShortcut(setSearchOpen);
  useLinkInterception();
  useEffect(() => {
    // Jump to `#anchor` once the (lazy) page has rendered it, else to the top.
    const id = decodeURIComponent(window.location.hash.slice(1));
    window.scrollTo({ top: 0 });
    let frame = 0;
    let tries = 0;
    const seek = () => {
      const target = id ? document.getElementById(id) : null;
      if (target) target.scrollIntoView();
      else if (id && tries++ < 120) frame = requestAnimationFrame(seek);
    };
    if (id) seek();
    // A distinct title per page, for tabs, history and screen readers (WCAG 2.4.2).
    const label = route === "home" ? undefined : (routeLabel(route) ?? "Page not found");
    document.title = label ? `${label} · Nova UI` : "Nova UI";
    return () => cancelAnimationFrame(frame);
  }, [route]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Focus <main> directly, so the URL keeps any #anchor the page was opened with. */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <IconButton aria-label="Open navigation" className="lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu />
          </IconButton>
          <Logo />
          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <SearchButton onClick={() => setSearchOpen(true)} />
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger size="sm" aria-label="Theme preset" className="hidden w-36 sm:flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(presets).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tooltip content={dir === "ltr" ? "Preview right-to-left" : "Back to left-to-right"}>
              <IconButton aria-label="Toggle text direction" aria-pressed={dir === "rtl"} variant={dir === "rtl" ? "soft" : "ghost"} onClick={() => setDir(dir === "ltr" ? "rtl" : "ltr")}>
                <Languages />
              </IconButton>
            </Tooltip>
            <ModeSwitch />
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <a href={to("contributing")}>
                <GitPullRequest /> Contribute
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[90rem] flex-1">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-e border-border px-3 py-6 lg:block">
          <NavList current={route} />
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>

      {searchUsed ? (
        <Suspense fallback={null}>
          <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      ) : null}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="start" className="w-72 p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo />
          <NavList current={route} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NotFound() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="Page not found"
      description="There's no page at this address. It may have moved, or the link has a typo."
      actions={
        <Button asChild>
          <a href={to("home")}>Back to the overview</a>
        </Button>
      }
      className="py-24"
    />
  );
}

export function App() {
  const [theme, setTheme] = useState("vibrant");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const route = useRoute();
  const current = resolveRoute(route);

  return (
    <ThemeProvider theme={theme} dir={dir} storageKey="nova-docs-mode" defaultMode="system">
      <Shell theme={theme} setTheme={setTheme} dir={dir} setDir={setDir}>
        <Suspense fallback={<LoadingState title="Loading page…" className="py-24" />}>
          {current ?? <NotFound />}
        </Suspense>
      </Shell>
      <Toaster />
    </ThemeProvider>
  );
}
