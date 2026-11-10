/**
 * Measures what consumers actually ship: bundles small entry files that import
 * from the built package (react/react-dom external), minifies, and reports
 * raw and gzip sizes. Proves tree-shaking: importing Button must not pull in
 * DataTable or cmdk.
 *
 * Each case has a gzip budget. The script exits with code 1 when one is over,
 * which fails CI. When an increase is deliberate, raise that budget in the same
 * change and say why. Budgets sit about 5% above the size when they were set.
 *
 * Usage: pnpm --filter @darkalpha/nova-ui build && node scripts/size-report.ts
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const mainEntry = join(pkgRoot, "dist", "index.js");

/** Imports to measure, each with its gzip budget in kB. */
const cases: Record<string, { names: string; budget: number }> = {
  "Button": { names: "Button", budget: 12.5 },
  "Button + Card + Badge + Input": { names: "Button, Card, Badge, Input", budget: 15 },
  "ThemeProvider (custom brand)": { names: "ThemeProvider", budget: 12 },
  "Dialog": { names: "Dialog, DialogContent, DialogTitle, DialogTrigger", budget: 27.7 },
  "Select": { names: "Select, SelectContent, SelectItem, SelectTrigger, SelectValue", budget: 47 },
  "Combobox (cmdk)": { names: "Combobox", budget: 48 },
  "DataTable": { names: "DataTable", budget: 56.7 },
  "Toast": { names: "toast, Toaster", budget: 26.3 },
  "Everything": { names: "*", budget: 208 },
  // Static rich text from the rich-text-editor entry: no Tiptap / ProseMirror in it.
  "RichTextContentView": { names: "RichTextContentView", budget: 13.5, entry: "rich-text-editor.js" },
};
/** Gzip budget in kB for the full stylesheet. */
const cssBudget = 33;

const work = mkdtempSync(join(tmpdir(), "nova-ui-size-"));
const rows: [label: string, raw: number, gzip: number, budget: number][] = [];

try {
  for (const [label, { names, budget, entry: entryFile }] of Object.entries(cases)) {
    const entry = entryFile ? join(pkgRoot, "dist", entryFile) : mainEntry;
    const dir = join(work, String(rows.length));
    mkdirSync(dir);
    const importLine = names === "*" ? `import * as all from ${JSON.stringify(entry)}; console.log(all);` : `import { ${names} } from ${JSON.stringify(entry)}; console.log(${names});`;
    writeFileSync(join(dir, "entry.js"), importLine);
    await build({
      logLevel: "silent",
      configFile: false,
      root: dir,
      define: { "process.env.NODE_ENV": '"production"' },
      build: {
        outDir: join(dir, "out"),
        minify: true,
        lib: { entry: join(dir, "entry.js"), formats: ["es"], fileName: "bundle" },
        rolldownOptions: { external: [/^react($|\/)/, /^react-dom($|\/)/] },
      },
    });
    const outDir = join(dir, "out");
    const file = readdirSync(outDir).find((f) => /\.m?js$/.test(f));
    if (!file) throw new Error(`No output for ${label}`);
    const code = readFileSync(join(outDir, file));
    rows.push([label, code.length, gzipSync(code).length, budget]);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

const css = readFileSync(join(pkgRoot, "dist", "styles.css"));
rows.push(["styles.css (all components)", css.length, gzipSync(css).length, cssBudget]);

const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
const isOver = (gzip: number, budget: number) => gzip > budget * 1024;
const lines = [
  "| Import | Minified | Gzip | Gzip budget | |",
  "| --- | ---: | ---: | ---: | :---: |",
  ...rows.map(([label, raw, gz, budget]) => `| ${label} | ${kb(raw)} | ${kb(gz)} | ${budget.toFixed(1)} kB | ${isOver(gz, budget) ? "❌ over" : "✅"} |`),
];
console.log("JS excludes react/react-dom (peer dependencies).\n");
console.log(lines.join("\n"));

const over = rows.filter(([, , gz, budget]) => isOver(gz, budget));
if (over.length) {
  // stderr, so it shows in the CI log while stdout goes to the step summary.
  for (const [label, , gz, budget] of over) console.error(`Over budget: ${label} is ${kb(gz)} gzip (budget ${budget.toFixed(1)} kB).`);
  console.error("If the increase is deliberate, raise the budget in packages/ui/scripts/size-report.ts and say why.");
  process.exitCode = 1;
}
