import {
  Badge,
  Button,
  LoadingState,
  IconButton,
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
import { GitPullRequest, Languages, Menu, Monitor, Moon, Sun } from "lucide-react";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRoute } from "./docs/kit.tsx";
import { pages, nav } from "./pages/index.tsx";

function Logo() {
  return (
    <a href="#/home" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-focus-ring">
      <span aria-hidden className="relative size-8 overflow-hidden rounded-[10px] bg-(image:--nv-gradient-vivid) shadow-md">
        <span className="absolute inset-[5px] rotate-45 rounded-[5px] border-2 border-white/80" />
      </span>
      <span className="font-display text-lg font-extrabold tracking-(--nv-tracking-tight) text-foreground">Nova UI</span>
      <Badge size="sm" variant="neutral" appearance="outline">
        v0.1
      </Badge>
    </a>
  );
}

function NavList({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-5">
      {nav.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-(--nv-tracking-wider) text-foreground-muted">{group.title}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = item.id === current;
              return (
                <li key={item.id}>
                  <a
                    href={`#/${item.id}`}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-(--nv-duration-fast) focus-visible:outline-2 focus-visible:outline-focus-ring",
                      active ? "bg-primary-subtle text-primary-on-subtle" : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {item.badge ? (
                      <Badge size="sm" variant="gradient" className="ms-auto">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
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
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
          <IconButton aria-label="Open navigation" className="lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu />
          </IconButton>
          <Logo />
          <div className="ms-auto flex items-center gap-2">
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
              <a href="#/contributing">
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
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

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

export function App() {
  const [theme, setTheme] = useState("vibrant");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const route = useRoute();
  const Current = pages[route] ?? pages.home;

  return (
    <ThemeProvider theme={theme} dir={dir} storageKey="nova-docs-mode" defaultMode="system">
      <Shell theme={theme} setTheme={setTheme} dir={dir} setDir={setDir}>
        <Suspense fallback={<LoadingState title="Loading page…" className="py-24" />}>
          <Current />
        </Suspense>
      </Shell>
      <Toaster />
    </ThemeProvider>
  );
}
