/**
 * Compiles the distributable stylesheets with the Tailwind CLI.
 * - styles.css: tokens + base + every utility the components use (no preflight)
 * - themes.css: all presets as [data-nv-theme] blocks for zero-JS theming
 * - tailwind.css: the same styles as source, for apps whose own Tailwind build
 *   generates the component utilities (import it instead of styles.css)
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
// The CLI exposes only its bin, so resolve it relative to package.json.
const cli = join(dirname(require.resolve("@tailwindcss/cli/package.json")), "dist", "index.mjs");
mkdirSync(`${root}dist`, { recursive: true });

execFileSync(process.execPath, [cli, "-i", "src/styles/index.css", "-o", "dist/styles.css", "--minify"], { cwd: root, stdio: "inherit" });
execFileSync(process.execPath, [cli, "-i", "src/styles/themes-entry.css", "-o", "dist/themes.css", "--minify"], { cwd: root, stdio: "inherit" });
// tailwind.css is compiled by the consumer's Tailwind, so it ships as source next to its imports.
copyFileSync(`${root}src/styles/tailwind.css`, `${root}dist/tailwind.css`);
copyFileSync(`${root}src/styles/generated/tokens.css`, `${root}dist/tokens.generated.css`);
copyFileSync(`${root}src/styles/generated/theme.css`, `${root}dist/theme.generated.css`);
copyFileSync(`${root}src/styles/motion.css`, `${root}dist/motion.generated.css`);
for (const f of ["base.css", "interactions.css", "materials.css"]) copyFileSync(`${root}src/styles/${f}`, `${root}dist/${f}`);

for (const f of ["styles.css", "themes.css"]) {
  console.log(`dist/${f}: ${(statSync(`${root}dist/${f}`).size / 1024).toFixed(1)} kB`);
}
