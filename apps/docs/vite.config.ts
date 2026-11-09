import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { novaApi } from "./scripts/api-plugin.ts";

const { version } = JSON.parse(readFileSync(new URL("../../packages/ui/package.json", import.meta.url), "utf8")) as { version: string };

// The docs consume @darkalpha/nova-ui exactly like an external app: through its
// built `dist/` and package exports. Run `pnpm build` at the root first.
export default defineConfig({
  // novaApi: component props extracted from packages/ui source, for the API reference tables.
  plugins: [react(), tailwindcss(), novaApi()],
  // Path routes need an absolute base: "/" locally, "/<repo>/" on GitHub Pages (set in docs.yml).
  base: process.env.DOCS_BASE ?? "/",
  // The release shown in the header and hero, read from the package so it can't go stale.
  define: { __NOVA_VERSION__: JSON.stringify(version) },
  server: { port: 5173 },
  preview: { port: 4173 },
});
