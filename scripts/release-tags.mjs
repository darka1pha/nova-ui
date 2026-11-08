/**
 * Finishes a release after `changeset publish`:
 *   1. pushes the git tags it created (one per published package, e.g.
 *      `@darkalpha/nova-ui@0.5.0`),
 *   2. creates a GitHub Release per tag, with that version's CHANGELOG section,
 *   3. checks npm shows a provenance attestation for each published version.
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

async function hasProvenance(name, version) {
  // Fresh versions can take a minute to show up in the registry.
  for (let attempt = 1; attempt <= 12; attempt++) {
    const res = await fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}/${version}`, { headers: { "cache-control": "no-cache" } });
    if (res.ok) {
      const manifest = await res.json();
      return Boolean(manifest.dist?.attestations);
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error(`${name}@${version} did not appear on the npm registry`);
}

const tags = readTags();
if (tags.length === 0) process.exit(0);
const notesDir = mkdtempSync(join(tmpdir(), "release-notes-"));
const missingProvenance = [];

for (const tag of tags) {
  const { name, version } = parseTag(tag);
  console.log(`▸ ${tag}`);

  // 1. Push the tag the CLI created locally.
  run("git", ["push", "origin", `refs/tags/${tag}`]);
  if (!dryRun) console.log("  tag pushed");

  // 2. GitHub Release with the changelog section. The ui package is the headline release.
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

  // 3. Provenance: published from CI, every version must carry an attestation.
  if (!skipProvenance && !dryRun) {
    if (await hasProvenance(name, version)) console.log("  provenance attestation present");
    else missingProvenance.push(tag);
  }
}

if (missingProvenance.length) {
  console.error(
    `\nNo provenance attestation on npm for: ${missingProvenance.join(", ")}.\n` +
      "Check that publishConfig.provenance / PNPM_CONFIG_PROVENANCE are set and the job has `id-token: write`.",
  );
  process.exit(1);
}
