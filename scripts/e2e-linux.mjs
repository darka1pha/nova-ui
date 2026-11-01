/**
 * Runs the Playwright suites inside the same container CI uses, so linux
 * screenshot baselines can be checked or regenerated from any OS with Docker.
 *
 * Usage: node scripts/e2e-linux.mjs [playwright args…]
 *   node scripts/e2e-linux.mjs visual.spec.ts --update-snapshots=all
 *
 * The repo is mounted read-only and copied into the container without
 * node_modules (host binaries don't run on linux); only the linux screenshots
 * are written back to apps/docs/e2e/__screenshots__/linux.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const docs = JSON.parse(readFileSync(join(root, "apps/docs/package.json"), "utf8"));
const version = docs.devDependencies["@playwright/test"];
const pnpm = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).packageManager;
const args = process.argv.slice(2).map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" ");

const inner = [
  "set -e",
  "mkdir -p /work",
  "tar -C /src --exclude=node_modules --exclude=dist --exclude=.git --exclude=test-results --exclude=playwright-report -cf - . | tar -C /work -xf -",
  "cd /work",
  `npm install -g --silent ${pnpm}`,
  "pnpm install --frozen-lockfile",
  "pnpm build",
  `status=0; CI=1 pnpm --filter @kaleido/docs exec playwright test ${args} || status=$?`,
  "if [ -d apps/docs/e2e/__screenshots__/linux ]; then rm -rf /out/linux && cp -r apps/docs/e2e/__screenshots__/linux /out/; fi",
  "exit $status",
].join("\n");

const result = spawnSync(
  "docker",
  [
    "run", "--rm", "--ipc=host",
    "-v", `${root}:/src:ro`,
    "-v", `${join(root, "apps/docs/e2e/__screenshots__")}:/out`,
    `mcr.microsoft.com/playwright:v${version}-noble`,
    "bash", "-c", inner,
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
