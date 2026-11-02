import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

/** Every component page id, read from the docs registry (`{ id: "button", … }`). */
export function componentIds(): string[] {
  const source = readFileSync(new URL("../src/docs/registry.ts", import.meta.url), "utf8");
  return [...source.matchAll(/\{ id: "([\w-]+)", name:/g)].map((m) => m[1]!);
}

/** Opens a docs route with a fixed color mode and fails on any console error. */
export async function open(page: Page, route: string, mode: "light" | "dark" = "light") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  // Seed the stored mode once, then reload so the head script applies it like a returning visit.
  await page.goto(`/#/${route}`);
  await page.evaluate((m) => window.localStorage.setItem("nova-docs-mode", m), mode);
  await page.reload();
  // Pages are lazy-loaded; allow for a cold chunk under parallel workers.
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

/** Runs axe-core in the real browser, including color-contrast. */
export async function axe(page: Page, selector = "main") {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async (sel) => {
    const w = window as unknown as { axe: { run: (ctx: string, opts: object) => Promise<{ violations: { id: string; help: string; nodes: { target: string[] }[] }[] }> } };
    const result = await w.axe.run(sel, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
    return result.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  }, selector);
}
