/**
 * `changeset publish`, with `--provenance` added to every `pnpm publish` it runs.
 *
 * Why this exists: pnpm 12 (checked against v12.5.1, which `packageManager`
 * pins) decides provenance from the `--provenance` flag only. Its CLI maps
 * `flags.registry.provenance.then_some(true)` straight into the publish
 * options (pnpm/crates/cli/src/cli_args/publish.rs), so `PNPM_CONFIG_PROVENANCE`,
 * `NPM_CONFIG_PROVENANCE` and `publishConfig.provenance` are all ignored. With
 * no flag, pnpm only attaches provenance itself under npm trusted publishing
 * (OIDC), which this repo doesn't use: it publishes with NPM_TOKEN.
 * @changesets/cli v3 runs `pnpm publish --json --access … --tag … --no-git-checks`
 * and has no option to pass extra publish arguments, so 0.3.x–0.5.1 went out
 * without attestations.
 *
 * This puts a `pnpm` shim first on PATH for the `changeset publish` process.
 * The shim adds `--provenance` to `pnpm publish` and passes every other pnpm
 * command (`info`, `pack`, `--version`) through unchanged, always running the
 * real pnpm from the original PATH. Everything else stays the CLI's job,
 * including git tags and the CHANGESETS_OUTPUT report that
 * scripts/release-tags.mjs reads.
 *
 * `--provenance` signs with the GitHub Actions OIDC token (`id-token: write`),
 * so publishing through this outside CI fails before anything is uploaded.
 *
 * Usage: node scripts/changeset-publish.mjs [changeset publish args…]
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

const SHIM_ENV = "NOVA_PNPM_SHIM_REAL_PATH";
const isWindows = process.platform === "win32";
// Windows spells it "Path"; set whichever key the environment already uses.
const pathKey = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";

/** Real pnpm, with `--provenance` added to `publish` (unless already given). */
function runShim(args) {
  const publishAt = args.indexOf("publish");
  const isPublish = publishAt !== -1 && args.slice(0, publishAt).every((a) => a.startsWith("-"));
  const hasProvenanceFlag = args.some((a) => /^--(no-)?provenance(=|$)/.test(a));
  const finalArgs = isPublish && !hasProvenanceFlag
    ? [...args.slice(0, publishAt + 1), "--provenance", ...args.slice(publishAt + 1)]
    : args;
  const { [SHIM_ENV]: realPath, ...rest } = process.env;
  const env = { ...rest, [pathKey]: realPath };
  const result = spawnSync("pnpm", finalArgs, { stdio: "inherit", env, shell: isWindows });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

if (process.argv[2] === "--shim") runShim(process.argv.slice(3));

const self = import.meta.filename;
const shimDir = mkdtempSync(join(tmpdir(), "pnpm-provenance-shim-"));
writeFileSync(join(shimDir, "pnpm"), `#!/bin/sh\nexec "${process.execPath}" "${self}" --shim "$@"\n`, { mode: 0o755 });
writeFileSync(join(shimDir, "pnpm.cmd"), `@"${process.execPath}" "${self}" --shim %*\r\n`);

const result = spawnSync("changeset", ["publish", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: isWindows,
  env: { ...process.env, [pathKey]: `${shimDir}${delimiter}${process.env[pathKey]}`, [SHIM_ENV]: process.env[pathKey] },
});
rmSync(shimDir, { recursive: true, force: true });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
