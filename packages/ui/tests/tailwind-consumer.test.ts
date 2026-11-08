import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

/*
 * Apps with their own Tailwind import @darkalpha/nova-ui/tailwind.css instead of the
 * precompiled styles.css, so a single build sorts every utility and breakpoint
 * overrides (`flex-col sm:flex-row`) can't be beaten by a second stylesheet.
 * That only works if tailwind.css makes the app's build generate everything
 * styles.css ships. Runs against dist/: `pnpm build` first.
 */
// String form: under jsdom the global URL is not Node's.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve("@tailwindcss/cli/package.json")), "dist", "index.mjs");
const out = mkdtempSync(join(tmpdir(), "nv-tw-consumer-"));
afterAll(() => rmSync(out, { recursive: true, force: true }));

/** Every rule selector in a stylesheet, keyframe steps aside. */
function selectors(css: string) {
  const found = css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?:^|[{};])\s*([^{};@][^{};]*?)\s*\{/g);
  return new Set([...found].flatMap((m) => (m[1] ?? "").split(",").map((s) => s.trim())).filter((s) => !/^(from|to|[\d.]+%)$/.test(s)));
}

describe("@darkalpha/nova-ui/tailwind.css in a consumer's Tailwind build", () => {
  it("generates every rule that styles.css ships", () => {
    expect(existsSync(join(root, "dist/tailwind.css")), "dist/ is missing: run `pnpm build` in packages/ui").toBe(true);
    execFileSync(process.execPath, [cli, "-i", "tests/fixtures/tailwind-consumer.css", "-o", join(out, "app.css"), "--minify"], { cwd: root, stdio: "pipe" });

    const app = selectors(readFileSync(join(out, "app.css"), "utf8"));
    const lib = selectors(readFileSync(join(root, "dist/styles.css"), "utf8"));
    expect(lib.size).toBeGreaterThan(1000);
    expect([...lib].filter((s) => !app.has(s))).toEqual([]);
    // Spot-check a breakpoint override and the cascade layer materials rely on.
    expect(app).toContain(".sm\\:flex-row");
    const layers = [...new Set([...readFileSync(join(out, "app.css"), "utf8").matchAll(/@layer ([\w-]+)\{/g)].map((m) => m[1]))];
    expect(layers.indexOf("nv-materials")).toBeGreaterThan(layers.indexOf("utilities"));
  });
});

describe("the dark: variant from tailwind.css (M-9)", () => {
  it("matches an explicit dark mode and a dark OS when no mode is set", () => {
    execFileSync(process.execPath, [cli, "-i", "tests/fixtures/tailwind-dark.css", "-o", join(out, "dark.css"), "--minify"], { cwd: root, stdio: "pipe" });
    const css = readFileSync(join(out, "dark.css"), "utf8");
    // Explicit dark on the element or an ancestor…
    expect(css).toContain(String.raw`.dark\:bg-primary:where([data-nv-mode=dark],[data-nv-mode=dark] *)`);
    // …or the OS, unless a mode was set somewhere above.
    expect(css).toContain(String.raw`@media (prefers-color-scheme:dark){.dark\:bg-primary:where(:not([data-nv-mode],[data-nv-mode] *))`);
  });
});
