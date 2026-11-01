/**
 * Installation verification: packs @darkalpha/nova-tokens and @darkalpha/nova-ui exactly as
 * they would be published, installs the tarballs into a fresh project outside
 * the workspace, and checks that a real consumer can use them:
 *   1. every package export resolves (JS, types, CSS)
 *   2. components render on the server (no browser APIs during SSR)
 *   3. a consumer TypeScript file type-checks against the published types
 *
 * Usage: pnpm build && node scripts/verify-install.mjs
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const work = mkdtempSync(join(tmpdir(), "nova-ui-verify-"));
const run = (cmd, cwd = work) => execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" });
const step = (msg) => console.log(`\n▸ ${msg}`);

try {
  step("Packing packages");
  for (const pkg of ["tokens", "ui"]) run(`pnpm pack --pack-destination "${work}"`, join(root, "packages", pkg));
  const tarballs = readdirSync(work).filter((f) => f.endsWith(".tgz"));
  const tokens = tarballs.find((f) => f.includes("tokens"));
  const ui = tarballs.find((f) => f.includes("-ui-"));
  if (!tokens || !ui) throw new Error(`Expected two tarballs, found: ${tarballs.join(", ")}`);
  console.log(`  ${tokens}\n  ${ui}`);

  const uiManifest = JSON.parse(run(`tar -xOf "${ui}" package/package.json`));
  if (String(uiManifest.dependencies["@darkalpha/nova-tokens"]).startsWith("workspace:")) {
    throw new Error("workspace: protocol leaked into the published manifest");
  }
  const files = run(`tar -tf "${ui}"`).split("\n");
  for (const required of ["package/dist/index.js", "package/dist/index.d.ts", "package/dist/styles.css", "package/dist/themes.css", "package/dist/tailwind.css"]) {
    if (!files.includes(required)) throw new Error(`Tarball is missing ${required}`);
  }
  // tailwind.css is compiled by the consumer, so everything it imports must ship next to it.
  for (const [, dep] of readFileSync(join(root, "packages/ui/dist/tailwind.css"), "utf8").matchAll(/@import "\.\/([^"]+)"/g)) {
    if (!files.includes(`package/dist/${dep}`)) throw new Error(`Tarball is missing dist/${dep}, imported by tailwind.css`);
  }
  if (files.some((f) => f.includes("/tests/") || f.endsWith(".test.js"))) throw new Error("Tests leaked into the tarball");

  step("Installing into a fresh project (npm, no workspace)");
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify(
      {
        name: "nova-ui-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@darkalpha/nova-tokens": `file:./${tokens}`,
          "@darkalpha/nova-ui": `file:./${ui}`,
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: { typescript: "~6.0.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0" },
        // Make @darkalpha/nova-ui's own dependency resolve to the local tarball too.
        overrides: { "@darkalpha/nova-tokens": "$@darkalpha/nova-tokens" },
      },
      null,
      2,
    ),
  );
  run("npm install --no-audit --no-fund --loglevel=error");

  step("Resolving package exports");
  writeFileSync(
    join(work, "exports.mjs"),
    `import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
for (const spec of ["@darkalpha/nova-ui/styles.css", "@darkalpha/nova-ui/themes.css", "@darkalpha/nova-ui/tailwind.css", "@darkalpha/nova-tokens/css/tokens.css", "@darkalpha/nova-tokens/tokens.json"]) {
  const path = require.resolve(spec);
  const css = readFileSync(path, "utf8");
  if (css.length < 200) throw new Error(spec + " looks empty");
  console.log("  ok", spec, (css.length / 1024).toFixed(1) + " kB");
}
const styles = readFileSync(require.resolve("@darkalpha/nova-ui/styles.css"), "utf8");
for (const needle of ["--nv-color-primary-solid", ".bg-primary", "light-dark("]) {
  if (!styles.includes(needle)) throw new Error("styles.css is missing " + needle);
}
// Layer precedence is set by first appearance and must match Tailwind's own
// order, so an app's Tailwind preflight can never override component utilities.
const order = ["theme", "base", "components", "utilities"].map((l) => styles.indexOf("@layer " + l));
if (order.some((i) => i < 0) || order.some((i, n) => n > 0 && i < order[n - 1])) throw new Error("unexpected @layer order: " + order);
console.log("  ok cascade layers in Tailwind order (theme < base < components < utilities)");
const tokens = await import("@darkalpha/nova-tokens");
const fails = tokens.auditContrast(tokens.getResolvedTheme("vibrant", { brand: { primary: "#ffd400" } })).filter((c) => !c.pass);
if (fails.length) throw new Error("contrast failures: " + JSON.stringify(fails));
console.log("  ok @darkalpha/nova-tokens runtime (brand theme resolves with 0 contrast failures)");
`,
  );
  console.log(run("node exports.mjs").trimEnd());

  step("Server-side rendering with react-dom/server");
  writeFileSync(
    join(work, "ssr.mjs"),
    `import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import * as ui from "@darkalpha/nova-ui";
const { ThemeProvider, ThemeScript, Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, FormField, Tabs, TabsList, TabsTrigger, TabsContent,
  Dialog, DialogTrigger, DialogContent, DialogTitle, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Toaster, DataTable, Avatar, Progress, Alert, Switch, Tooltip } = ui;

const app = h(ThemeProvider, { theme: "ocean", brand: { primary: "#6C5CE7" }, storageKey: "mode", dir: "rtl" },
  h(Card, null,
    h(CardHeader, null, h(CardTitle, null, "Welcome back"), h(Badge, { variant: "success" }, "Ready")),
    h(CardContent, null,
      h(FormField, { label: "Email", error: "Required" }, h(Input, { placeholder: "you@example.com" })),
      h(FormField, { label: "Digest", inline: true }, h(Switch)),
      h(Button, { variant: "primary" }, "Get started"),
      h(Tooltip, { content: "Hi" }, h(Button, { variant: "ghost" }, "Hover")),
      h(Avatar, { name: "Ada Lovelace" }),
      h(Progress, { "aria-label": "p", value: 40 }),
      h(Alert, { variant: "warning", title: "Review required" }),
      h(Tabs, { defaultValue: "a" }, h(TabsList, null, h(TabsTrigger, { value: "a" }, "A")), h(TabsContent, { value: "a" }, "Panel")),
      h(Dialog, null, h(DialogTrigger, null, "Open"), h(DialogContent, null, h(DialogTitle, null, "Title"))),
      h(Select, { defaultValue: "x" }, h(SelectTrigger, { "aria-label": "s" }, h(SelectValue)), h(SelectContent, null, h(SelectItem, { value: "x" }, "X"))),
      h(DataTable, { data: [{ id: "1", name: "Row" }], columns: [{ id: "name", header: "Name", sortable: true }], getRowId: (r) => r.id }),
    )),
  h(Toaster));

const html = renderToString(app);
const again = renderToString(app);
if (html !== again) throw new Error("SSR output is not deterministic");
for (const needle of ['data-nv-theme="ocean"', "--nv-color-primary-solid:", "#6c5ce7", 'dir="rtl"', "Get started", 'role="img"', "aria-invalid"]) {
  if (!html.includes(needle)) throw new Error("SSR output is missing " + needle);
}
const script = renderToString(h(ThemeScript, { storageKey: "mode" }));
if (!script.includes("localStorage")) throw new Error("ThemeScript did not render");
console.log("  ok rendered", (html.length / 1024).toFixed(1), "kB of HTML deterministically, without touching window/document");
`,
  );
  console.log(run("node ssr.mjs").trimEnd());

  step("react-hook-form stays optional");
  writeFileSync(
    join(work, "optional.mjs"),
    `import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
let present = true;
try { require.resolve("react-hook-form"); } catch { present = false; }
if (present) throw new Error("react-hook-form should not be installed yet");
// The main entry graph must never import react-hook-form.
const dist = join(dirname(require.resolve("@darkalpha/nova-ui/package.json")), "dist");
const offenders = [];
const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = join(d, e.name);
  if (e.isDirectory()) walk(p);
  else if (p.endsWith(".js") && !p.endsWith("react-hook-form.js") && /(from\\s*|import\\s*\\(\\s*|require\\(\\s*)["']react-hook-form["']/.test(readFileSync(p, "utf8"))) offenders.push(p);
});
walk(dist);
if (offenders.length) throw new Error("main entry references react-hook-form: " + offenders.join(", "));
await import("@darkalpha/nova-ui");
console.log("  ok @darkalpha/nova-ui loads and renders without react-hook-form installed");
`,
  );
  console.log(run("node optional.mjs").trimEnd());
  run("npm install --no-audit --no-fund --loglevel=error react-hook-form@^7.55.0 zod@^4 @hookform/resolvers@^6");
  writeFileSync(
    join(work, "rhf.mjs"),
    `import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemeProvider } from "@darkalpha/nova-ui";
import { Form, FormInput, FormCheckbox, FormSubmit, FormErrorSummary, isSchemaFieldRequired } from "@darkalpha/nova-ui/react-hook-form";
const schema = z.object({ email: z.string().email(), nickname: z.string().optional(), terms: z.literal(true) });
if (!isSchemaFieldRequired(schema, "email") || isSchemaFieldRequired(schema, "nickname")) throw new Error("schema inspection failed");
function App() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", nickname: "" } });
  return h(ThemeProvider, null, h(Form, { form, schema, onSubmit: () => {} },
    h(FormErrorSummary), h(FormInput, { name: "email", label: "Email" }), h(FormCheckbox, { name: "terms", label: "Terms" }), h(FormSubmit, null, "Go")));
}
const html = renderToString(h(App));
if (!html.toLowerCase().includes('novalidate') || !html.includes("Email")) throw new Error("RHF form did not render");
console.log("  ok @darkalpha/nova-ui/react-hook-form resolves and server-renders a zod-validated form");
`,
  );
  console.log(run("node rhf.mjs").trimEnd());

  step("Type-checking a consumer file against published types");
  writeFileSync(
    join(work, "app.tsx"),
    `import { Button, Badge, Card, Input, ThemeProvider, createTheme, registerTheme, toast, type ButtonProps, type ThemeDefinition } from "@darkalpha/nova-ui";
import "@darkalpha/nova-ui/styles.css";

const acme: ThemeDefinition = createTheme({ id: "acme", extends: "ocean", colors: { primary: "#0f766e" }, radius: "lg" });
registerTheme(acme);

const props: ButtonProps = { variant: "danger", size: "lg", loading: true };

export function App() {
  return (
    <ThemeProvider theme="acme" brand={{ primary: "#6C5CE7" }} density="compact">
      <Card>
        <Badge variant="success">Ready</Badge>
        <Input placeholder="Email" aria-label="Email" />
        <Button {...props} onClick={() => toast.success("Saved")}>Get started</Button>
      </Card>
    </ThemeProvider>
  );
}

// @ts-expect-error — unknown variants are rejected
export const bad = <Button variant="rainbow" />;

// Optional react-hook-form bindings: field names are checked against the schema.
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormInput, FormDatePicker, FormSubmit, formFields } from "@darkalpha/nova-ui/react-hook-form";

const schema = z.object({ email: z.string().email(), start: z.date() });
type Values = z.infer<typeof schema>;
const F = formFields<Values>();

export function Signup() {
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  return (
    <Form form={form} schema={schema} onSubmit={(v) => console.log(v.email.toUpperCase(), v.start.getFullYear())}>
      <FormInput control={form.control} name="email" label="Email" />
      <FormDatePicker control={form.control} name="start" label="Start" />
      {/* @ts-expect-error — "emial" is not a field of the schema */}
      <FormInput control={form.control} name="emial" label="Typo" />
      {/* @ts-expect-error — typed shortcuts reject unknown names too */}
      <F.Input name="nope" />
      <FormSubmit>Go</FormSubmit>
    </Form>
  );
}
`,
  );
  writeFileSync(join(work, "css.d.ts"), `declare module "*.css";\n`);
  for (const [module, moduleResolution] of [["ESNext", "Bundler"], ["NodeNext", "NodeNext"]]) {
    writeFileSync(
      join(work, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { strict: true, jsx: "react-jsx", module, moduleResolution, target: "ES2022", noEmit: true, skipLibCheck: false, types: [] },
        files: ["app.tsx", "css.d.ts"],
      }),
    );
    run("npx tsc -p tsconfig.json");
    console.log(`  ok strict type-check (moduleResolution: ${moduleResolution}, skipLibCheck: false)`);
  }

  console.log("\n✔ Installation verified in", work);
  rmSync(work, { recursive: true, force: true });
} catch (error) {
  console.error("\n✖ Verification failed:", error.stdout || error.message);
  if (error.stderr) console.error(error.stderr);
  console.error("Working directory kept for inspection:", work);
  process.exit(1);
}

