/**
 * Builds the libraries and writes installable tarballs with stable names to
 * ./local-packages:
 *   local-packages/nova-tokens.tgz
 *   local-packages/nova-ui.tgz
 *
 * Usage: node scripts/pack-local.mjs [--no-build]
 * The tarballs are exactly what `npm publish` would upload, so any project on
 * this machine can install them without a registry (see install-local.mjs).
 */
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const root = resolve(import.meta.dirname, "..");
export const outDir = join(root, "local-packages");

export function packLocal({ build = true } = {}) {
  const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: "inherit" });
  if (build) run("pnpm build");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const result = {};
  for (const pkg of ["tokens", "ui"]) {
    execSync(`pnpm pack --pack-destination "${outDir}"`, { cwd: join(root, "packages", pkg), stdio: "pipe" });
    const file = readdirSync(outDir).find((f) => f.startsWith(`darkalpha-nova-${pkg}-`) && f.endsWith(".tgz"));
    if (!file) throw new Error(`pnpm pack produced no tarball for ${pkg}`);
    const stable = join(outDir, `nova-${pkg}.tgz`);
    renameSync(join(outDir, file), stable);
    result[pkg] = stable;
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const files = packLocal({ build: !process.argv.includes("--no-build") });
  console.log(`\nLocal packages ready:\n  ${files.tokens}\n  ${files.ui}`);
  console.log(`\nInstall into a project:  node scripts/install-local.mjs <path-to-project>`);
}
