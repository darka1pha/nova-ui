import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The docs consume @kaleido/ui exactly like an external app: through its
// built `dist/` and package exports. Run `pnpm build` at the root first.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  server: { port: 5173 },
  preview: { port: 4173 },
});
