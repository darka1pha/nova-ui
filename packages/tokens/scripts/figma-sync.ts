/**
 * Pushes Nova UI tokens into a Figma file as variables, through the Figma REST
 * API. Re-running updates the same variables (matched by collection and name)
 * instead of duplicating them.
 *
 *   FIGMA_TOKEN=… FIGMA_FILE_KEY=… node scripts/figma-sync.ts [--themes vibrant,ocean] [--dry-run]
 *
 * FIGMA_TOKEN is a personal access token with the `file_variables:read` and
 * `file_variables:write` scopes; the Variables REST API needs a Figma
 * Enterprise plan. Without it, use --dry-run and import the JSON with a
 * variables plugin, or use the DTCG files in dist/dtcg with Tokens Studio.
 * Run `pnpm build` first: this reads dist/.
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { defaultTheme, figmaVariables, getResolvedTheme, presets, type FigmaLocalVariables } from "../dist/index.js";

const { values } = parseArgs({
  options: {
    themes: { type: "string", default: defaultTheme.id },
    "dry-run": { type: "boolean", default: false },
    out: { type: "string", default: "figma-variables.json" },
  },
});

const ids = (values.themes ?? defaultTheme.id).split(",").map((s) => s.trim()).filter(Boolean);
const unknown = ids.filter((id) => !(id in presets));
if (unknown.length) throw new Error(`Unknown theme(s): ${unknown.join(", ")}. Presets: ${Object.keys(presets).join(", ")}.`);
const themes = ids.map((id) => getResolvedTheme(id));

const token = process.env.FIGMA_TOKEN;
const fileKey = process.env.FIGMA_FILE_KEY;
const api = `https://api.figma.com/v1/files/${fileKey}/variables`;

let existing: FigmaLocalVariables | undefined;
if (!values["dry-run"]) {
  if (!token || !fileKey) throw new Error("Set FIGMA_TOKEN and FIGMA_FILE_KEY, or pass --dry-run.");
  const res = await fetch(`${api}/local`, { headers: { "X-Figma-Token": token } });
  if (!res.ok) throw new Error(`GET variables failed: ${res.status} ${await res.text()}`);
  existing = ((await res.json()) as { meta: FigmaLocalVariables }).meta;
}

const payload = figmaVariables(themes, { existing });
const counts = `${payload.variables.length} variables, ${payload.variableModeValues.length} values, themes: ${ids.join(", ")}`;

if (values["dry-run"]) {
  writeFileSync(values.out ?? "figma-variables.json", JSON.stringify(payload, null, 2));
  console.log(`Wrote ${values.out} (${counts}).`);
} else {
  const res = await fetch(api, {
    method: "POST",
    headers: { "X-Figma-Token": token as string, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST variables failed: ${res.status} ${await res.text()}`);
  console.log(`Synced to Figma (${counts}).`);
}
