/**
 * Installs Nova UI into another project on this machine — no npm registry.
 *
 *   node scripts/install-local.mjs <path-to-project> [--no-build]
 *   pnpm install:local ../my-app
 *
 * What it does:
 *   1. builds and packs @darkalpha/nova-tokens and @darkalpha/nova-ui (pack-local.mjs)
 *   2. copies the tarballs into <project>/vendor/nova-ui/, so the project keeps
 *      working even if this repository moves
 *   3. adds `file:` dependencies plus an override so @darkalpha/nova-ui's own
 *      dependency on @darkalpha/nova-tokens also resolves to the local tarball
 *   4. runs the project's package manager (npm, pnpm, yarn or bun, detected
 *      from its lockfile)
 *
 * Run it again any time to pick up library changes.
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { packLocal } from "./pack-local.mjs";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
if (!target) {
  console.error("Usage: node scripts/install-local.mjs <path-to-project> [--no-build]");
  process.exit(1);
}
const project = resolve(target);
const manifestPath = join(project, "package.json");
if (!existsSync(manifestPath)) {
  console.error(`No package.json in ${project}. Create the project first (e.g. npm create vite@latest).`);
  process.exit(1);
}

const manager = existsSync(join(project, "pnpm-lock.yaml"))
  ? "pnpm"
  : existsSync(join(project, "yarn.lock"))
    ? "yarn"
    : existsSync(join(project, "bun.lock")) || existsSync(join(project, "bun.lockb"))
      ? "bun"
      : "npm";

console.log(`▸ Packing Nova UI`);
const tarballs = packLocal({ build: !args.includes("--no-build") });

console.log(`▸ Copying tarballs into ${relative(process.cwd(), project) || "."}/vendor/nova-ui`);
const vendor = join(project, "vendor", "nova-ui");
mkdirSync(vendor, { recursive: true });
// A fresh file name per install makes every package manager re-read the
// tarball instead of trusting the integrity hash in its lockfile.
for (const old of readdirSync(vendor)) if (old.endsWith(".tgz")) rmSync(join(vendor, old));
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const names = {};
for (const [pkg, file] of Object.entries(tarballs)) {
  names[pkg] = `nova-${pkg}-${stamp}.tgz`;
  copyFileSync(file, join(vendor, names[pkg]));
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const spec = (pkg) => `file:./vendor/nova-ui/${names[pkg]}`;
manifest.dependencies = { ...manifest.dependencies, "@darkalpha/nova-tokens": spec("tokens"), "@darkalpha/nova-ui": spec("ui") };
for (const peer of ["react", "react-dom"]) {
  if (!manifest.dependencies[peer] && !manifest.devDependencies?.[peer]) manifest.dependencies[peer] = "^19.0.0";
}

// Point @darkalpha/nova-ui's dependency on @darkalpha/nova-tokens at the local tarball too.
if (manager === "npm" || manager === "bun") manifest.overrides = { ...manifest.overrides, "@darkalpha/nova-tokens": "$@darkalpha/nova-tokens" };
if (manager === "pnpm") manifest.pnpm = { ...manifest.pnpm, overrides: { ...manifest.pnpm?.overrides, "@darkalpha/nova-tokens": spec("tokens") } };
if (manager === "yarn") manifest.resolutions = { ...manifest.resolutions, "@darkalpha/nova-tokens": spec("tokens") };
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

// pnpm 10+ reads overrides from pnpm-workspace.yaml (the package.json field above is for older pnpm).
if (manager === "pnpm") {
  const yamlPath = join(project, "pnpm-workspace.yaml");
  const entry = `  "@darkalpha/nova-tokens": "${spec("tokens")}"`;
  let yaml = existsSync(yamlPath) ? readFileSync(yamlPath, "utf8") : "";
  yaml = yaml.replace(/^\s+["']?@darkalpha\/nova-tokens["']?:.*\n?/m, "");
  yaml = /^overrides:\s*$/m.test(yaml) ? yaml.replace(/^overrides:\s*$/m, `overrides:\n${entry}`) : `${yaml.trimEnd()}${yaml.trim() ? "\n\n" : ""}overrides:\n${entry}\n`;
  writeFileSync(yamlPath, yaml);
}

console.log(`▸ Installing with ${manager}`);
const install = {
  npm: "npm install --no-audit --no-fund",
  pnpm: "pnpm install --no-frozen-lockfile",
  yarn: "yarn install",
  bun: "bun install --force",
}[manager];
execSync(install, { cwd: project, stdio: "inherit" });

console.log(`
✔ Nova UI installed in ${project}

  import { Button, ThemeProvider } from "@darkalpha/nova-ui";
  import "@darkalpha/nova-ui/styles.css";

Re-run this command after changing the library to update the project.`);
