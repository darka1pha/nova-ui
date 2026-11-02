import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const { version } = JSON.parse(readFileSync(new URL("../../packages/ui/package.json", import.meta.url), "utf8")) as { version: string };

// The docs consume @darkalpha/nova-ui exactly like an external app: through its
// built `dist/` and package exports. Run `pnpm build` at the root first.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  // The release shown in the header and hero, read from the package so it can't go stale.
  define: { __NOVA_VERSION__: JSON.stringify(version) },
  server: { port: 5173 },
  preview: { port: 4173 },
});
