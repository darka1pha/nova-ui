/**
 * Finishes a release after `changeset publish`. For each package it reports:
 *   1. waits (up to 15 minutes) until npm serves that version (fresh versions take
 *      minutes to appear, and `changeset publish` has reported a package as
 *      published that never reached the registry, as nova-ui 0.6.0 did),
 *   2. pushes the git tag the CLI created (e.g. `@darkalpha/nova-ui@0.5.0`),
 *   3. creates a GitHub Release with that version's CHANGELOG section,
 *   4. checks npm shows a provenance attestation for it.
 * A version that isn't on npm gets no tag and no release. Every package is
 * handled before the script fails, so one bad package doesn't hold up the rest.
 *
 * Why this exists: changesets/action v1 learns what was published by matching
 * "New tag:" lines in the CLI output. @changesets/cli v3 no longer prints them,
 * so the action pushed no tags and created no releases (0.3.1–0.5.0). The CLI
 * does write a JSON report when CHANGESETS_OUTPUT is set; this reads that.
 *
 * Usage:
 *   node scripts/release-tags.mjs --report <changesets-output.jsonl>   (in CI)
 *   node scripts/release-tags.mjs --tags <tag> [<tag>…] [--skip-provenance]   (backfill local tags)
 *   add --dry-run to print what would happen without pushing or creating anything.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const dryRun = flag("--dry-run");
const skipProvenance = flag("--skip-provenance");

/** Tags from a changesets JSON-lines report, or from --tags. */
function readTags() {
  const reportAt = args.indexOf("--report");
  if (reportAt !== -1) {
    const file = args[reportAt + 1];
    if (!file || !existsSync(file)) {
      console.log(`No changesets report at ${file ?? "(none)"}: nothing was published.`);
      return [];
    }
    return readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((event) => event.type === "git-tag" && typeof event.tag === "string")
      .map((event) => event.tag);
  }
  const tagsAt = args.indexOf("--tags");
  if (tagsAt !== -1) return args.slice(tagsAt + 1).filter((a) => !a.startsWith("--"));
  throw new Error("Pass --report <file> or --tags <tag>…");
}

/** `@scope/name@1.2.3` → { name: "@scope/name", version: "1.2.3" } */
function parseTag(tag) {
  const at = tag.lastIndexOf("@");
  if (at <= 0) throw new Error(`Unexpected tag format: ${tag}`);
  return { name: tag.slice(0, at), version: tag.slice(at + 1) };
}

const packageDirs = new Map(
  readdirSync(join(root, "packages"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(root, "packages", d.name, "package.json")))
    .map((d) => [JSON.parse(readFileSync(join(root, "packages", d.name, "package.json"), "utf8")).name, join(root, "packages", d.name)]),
);

/** The `## <version>` section of a package's CHANGELOG.md, without its heading. */
function changelogSection(name, version) {
  const dir = packageDirs.get(name);
  const file = dir && join(dir, "CHANGELOG.md");
  if (!file || !existsSync(file)) return `Released ${name}@${version}.`;
  const lines = readFileSync(file, "utf8").split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${version}`);
  if (start === -1) return `Released ${name}@${version}.`;
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim();
}

const run = (cmd, cmdArgs) => {
  if (dryRun) {
    console.log(`  (dry run) ${cmd} ${cmdArgs.join(" ")}`);
    return "";
  }
  return execFileSync(cmd, cmdArgs, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
};

/**
 * Waits up to 15 minutes for npm to serve `name@version`; its manifest, or null if it never shows up.
 * For 0.6.0, npm recorded the packages 2 and 6 minutes after `changeset publish` finished
 * (provenance is verified before a version is listed), and a cached 404 lasted longer still.
 */
const REGISTRY_WAIT_MS = Number(process.env.RELEASE_TAGS_REGISTRY_WAIT_MS ?? 15 * 60_000); // env shortens it for testing
async function registryManifest(name, version) {
  const base = `https://registry.npmjs.org/${name.replace("/", "%2F")}/${version}`;
  const deadline = Date.now() + REGISTRY_WAIT_MS;
  for (let delay = 5_000; ; delay = Math.min(delay * 2, 30_000)) {
    // A unique query string gets past a CDN-cached 404 from an earlier request.
    const res = await fetch(`${base}?t=${Date.now()}`, { headers: { "cache-control": "no-cache" } }).catch(() => null);
    if (res?.ok) return res.json();
    if (Date.now() + delay > deadline) return null;
    await new Promise((r) => setTimeout(r, delay));
  }
}

const tags = readTags();
if (tags.length === 0) process.exit(0);
const notesDir = mkdtempSync(join(tmpdir(), "release-notes-"));
const missingProvenance = [];
const notOnNpm = [];

for (const tag of tags) {
  const { name, version } = parseTag(tag);
  console.log(`▸ ${tag}`);

  // 1. Only tag and announce what npm actually has.
  const manifest = dryRun ? {} : await registryManifest(name, version);
  if (!manifest) {
    console.log("  not on npm: no tag or release created");
    notOnNpm.push(tag);
    continue;
  }

  // 2. Push the tag the CLI created locally.
  run("git", ["push", "origin", `refs/tags/${tag}`]);
  if (!dryRun) console.log("  tag pushed");

  // 3. GitHub Release with the changelog section. The ui package is the headline release.
  const notes = join(notesDir, `${name.replace(/\W+/g, "-")}-${version}.md`);
  writeFileSync(notes, changelogSection(name, version) + "\n");
  const exists = !dryRun && (() => {
    try {
      // Quiet: "release not found" is the expected answer for a new tag.
      execFileSync("gh", ["release", "view", tag], { cwd: root, stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();
  if (exists) console.log("  release already exists");
  else {
    run("gh", ["release", "create", tag, "--verify-tag", "--title", tag, "--notes-file", notes, `--latest=${name === "@darkalpha/nova-ui"}`]);
    if (!dryRun) console.log("  release created");
  }

  // 4. Provenance: published from CI, every version must carry an attestation.
  if (!skipProvenance && !dryRun) {
    if (manifest.dist?.attestations) console.log("  provenance attestation present");
    else missingProvenance.push(tag);
  }
}

if (notOnNpm.length) {
  console.error(
    `\nReported as published but not on npm after ${REGISTRY_WAIT_MS / 60_000} minutes: ${notOnNpm.join(", ")}.\n` +
      "Re-run this job: `changeset publish` skips what's already on npm and retries the rest.",
  );
}
if (missingProvenance.length) {
  console.error(
    `\nNo provenance attestation on npm for: ${missingProvenance.join(", ")}.\n` +
      "Check that `pnpm release` goes through scripts/changeset-publish.mjs (it adds `pnpm publish --provenance`) and the job has `id-token: write`.",
  );
}
if (notOnNpm.length || missingProvenance.length) process.exit(1);
