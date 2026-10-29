/**
 * Measures what consumers actually ship: bundles small entry files that import
 * from the built package (react/react-dom external), minifies, and reports
 * raw and gzip sizes. Proves tree-shaking: importing Button must not pull in
 * DataTable or cmdk.
 *
 * Usage: pnpm --filter @kaleido/ui build && node scripts/size-report.ts
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const entry = join(pkgRoot, "dist", "index.js");

const cases: Record<string, string> = {
  "Button": "Button",
  "Button + Card + Badge + Input": "Button, Card, Badge, Input",
  "ThemeProvider (custom brand)": "ThemeProvider",
  "Dialog": "Dialog, DialogContent, DialogTitle, DialogTrigger",
  "Select": "Select, SelectContent, SelectItem, SelectTrigger, SelectValue",
  "Combobox (cmdk)": "Combobox",
  "DataTable": "DataTable",
  "Toast": "toast, Toaster",
  "Everything": "*",
};

const work = mkdtempSync(join(tmpdir(), "kaleido-size-"));
const rows: [string, number, number][] = [];

try {
  for (const [label, names] of Object.entries(cases)) {
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
    rows.push([label, code.length, gzipSync(code).length]);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

const css = readFileSync(join(pkgRoot, "dist", "styles.css"));
const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
const lines = [
  "| Import | Minified | Gzip |",
  "| --- | ---: | ---: |",
  ...rows.map(([label, raw, gz]) => `| ${label} | ${kb(raw)} | ${kb(gz)} |`),
  `| styles.css (all components) | ${kb(css.length)} | ${kb(gzipSync(css).length)} |`,
];
console.log("JS excludes react/react-dom (peer dependencies).\n");
console.log(lines.join("\n"));
