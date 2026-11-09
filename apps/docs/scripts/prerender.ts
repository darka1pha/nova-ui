// Writes a static index.html for every docs route, so pages are indexable,
// shareable with anchors (`/components/button#api`) and paint before JS runs.
// Run after `vite build` and `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const ssrDir = resolve(root, "dist-ssr");

interface ServerEntry {
  allRoutes: () => string[];
  headFor: (route: string) => { title: string; description: string };
  render: (route: string) => Promise<{ html: string; errors: unknown[] }>;
}
const entry = (await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href)) as ServerEntry;
const template = await readFile(resolve(dist, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty <div id="root"></div> to fill.');

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function page(route: string, html: string) {
  const { title, description } = entry.headFor(route);
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escape(description)}" />`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
}

const verbose = process.argv.includes("--verbose");
const started = Date.now();
let partial = 0;
const failed: string[] = [];
const routes = entry.allRoutes();
for (const route of routes) {
  let html = "";
  try {
    const result = await entry.render(route);
    html = result.html;
    if (result.errors.length) {
      partial++;
      if (verbose) console.warn(`  ${route}: ${result.errors.length} part(s) left to the browser:`, result.errors[0]);
    }
  } catch (error) {
    // The page still works: it ships the empty shell and renders in the browser.
    failed.push(route);
    console.warn(`  ${route}: not prerendered:`, error instanceof Error ? error.message : error);
  }
  const file = route === "home" ? resolve(dist, "index.html") : resolve(dist, route, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html ? page(route, html) : page(route, ""));
}

// GitHub Pages serves 404.html for unknown paths; the app shows "Page not found".
const missing = await entry.render("404").catch(() => ({ html: "", errors: [] }));
await writeFile(resolve(dist, "404.html"), page("404", missing.html));
await rm(ssrDir, { recursive: true, force: true });

console.log(
  `Prerendered ${routes.length - failed.length}/${routes.length} routes in ${((Date.now() - started) / 1000).toFixed(1)} s` +
    (partial ? ` (${partial} with parts left to the browser; --verbose lists them)` : "") +
    (failed.length ? `; shell only: ${failed.join(", ")}` : ""),
);
