import { expect, test, type Page } from "@playwright/test";
import { open } from "./helpers.ts";

// JS-driven motion (count-ups, reveals) can't be paused by Playwright, so render the
// reduced-motion version: final states only, which is what a screenshot should compare.
test.use({ contextOptions: { reducedMotion: "reduce" } });
// Examples that show "today" (Calendar, DatePicker) must render the same day every run.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-29T10:00:00"));
});

/** The preview area of the Nth example on a page. */
const example = (page: Page, title: string) => page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) }).locator(".rounded-t-\\(--ks-card-radius\\)").first();

const cases: [route: string, title: string][] = [
  ["actions", "Variants"],
  ["actions", "Sizes"],
  ["forms", "Checkbox, Radio and Switch"],
  ["forms", "Input sizes, groups and states"],
  ["feedback", "Alert"],
  ["feedback", "Badge"],
  ["navigation", "Tabs"],
  ["data", "Card"],
  ["forms", "DatePicker and Calendar"],
  ["forms", "PinInput"],
  ["forms", "Rating"],
  ["feedback", "CircularProgress"],
  ["navigation", "Stepper"],
  ["data", "Stat and Sparkline"],
  ["data", "Timeline"],
  ["actions", "Chip"],
];

for (const mode of ["light", "dark"] as const) {
  test.describe(`visual · ${mode}`, () => {
    for (const [route, title] of cases) {
      test(`${route} › ${title}`, async ({ page }) => {
        await open(page, route, mode);
        await expect(example(page, title)).toHaveScreenshot(`${route}-${title.replace(/\W+/g, "-").toLowerCase()}-${mode}.png`);
      });
    }

    test("focus ring on primary button", async ({ page }) => {
      await open(page, "actions", mode);
      const btn = page.getByRole("button", { name: "Primary", exact: true }).first();
      await btn.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(btn).toBeFocused();
      await expect(btn).toHaveScreenshot(`button-focus-${mode}.png`);
    });

    test("theme playground", async ({ page }) => {
      await open(page, "playground", mode);
      await expect(page.getByTestId("playground-preview")).toHaveScreenshot(`playground-${mode}.png`);
    });
  });
}
