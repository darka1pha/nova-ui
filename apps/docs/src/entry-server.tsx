// Server entry for scripts/prerender.ts: renders one route of the docs to HTML.
// Built with `vite build --ssr`, so it shares the client's modules and aliases.
import { StrictMode } from "react";
import { prerender } from "react-dom/static";
import { App } from "./App.tsx";
import { setServerRoute } from "./docs/kit.tsx";
import { categories, componentById } from "./docs/registry.ts";
import { nav, routeLabel } from "./pages/index.tsx";

/** Every route the site has, home first. */
export function allRoutes(): string[] {
  const out = new Set<string>();
  for (const group of nav) {
    for (const item of group.items) {
      out.add(item.id);
      for (const child of item.children ?? []) out.add(child.id);
    }
  }
  return [...out];
}

const DEFAULT_DESCRIPTION = "Nova UI — a colorful, accessible, themeable design system for React.";

/** The page's title and meta description. */
export function headFor(route: string): { title: string; description: string } {
  const label = route === "home" ? undefined : routeLabel(route);
  const title = route === "home" ? "Nova UI" : label ? `${label} · Nova UI` : "Page not found · Nova UI";
  if (route.startsWith("components/")) {
    const entry = componentById.get(route.slice("components/".length));
    if (entry) return { title, description: `${entry.name}: ${entry.summary}` };
  }
  const category = categories.find((c) => c.id === route);
  return { title, description: category ? category.lead : DEFAULT_DESCRIPTION };
}

/**
 * Renders a route to plain HTML. A lazy page or data that suspends comes out as
 * a fallback plus a script that swaps the content in, which crawlers without
 * JS don't see, so render again once everything it loaded has resolved
 * (resolved lazies and promises then render synchronously).
 */
export async function render(route: string): Promise<{ html: string; errors: unknown[] }> {
  let result = await renderOnce(route);
  for (let pass = 0; pass < 4 && result.html.includes("<!--$?-->"); pass++) result = await renderOnce(route);
  return result;
}

async function renderOnce(route: string): Promise<{ html: string; errors: unknown[] }> {
  setServerRoute(route);
  const errors: unknown[] = [];
  const { prelude } = await prerender(
    <StrictMode>
      <App />
    </StrictMode>,
    {
      // Keep finished content inline; by default big boundaries are moved out
      // of line and swapped in by script, as for streaming.
      progressiveChunkSize: Number.POSITIVE_INFINITY,
      // A demo that throws on the server falls back to rendering in the browser.
      onError: (error) => void errors.push(error),
    },
  );
  return { html: await new Response(prelude).text(), errors };
}
