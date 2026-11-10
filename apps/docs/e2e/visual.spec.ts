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
const example = (page: Page, title: string) => page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) }).locator(".rounded-t-\\(--nv-card-radius\\)").first();

// The category prefix keeps screenshot names stable from when categories were single pages.
const cases: [category: string, component: string, title: string][] = [
  ["actions", "button", "Variants"],
  ["actions", "button", "Sizes"],
  ["forms", "checkbox", "Checkbox"],
  ["forms", "input", "Input sizes, groups and states"],
  ["feedback", "alert", "Alert"],
  ["feedback", "badge", "Badge"],
  ["navigation", "tabs", "Tabs"],
  ["data", "card", "Card"],
  ["forms", "date-picker", "DatePicker and Calendar"],
  ["forms", "pin-input", "PinInput"],
  ["forms", "rating", "Rating"],
  ["feedback", "circular-progress", "CircularProgress"],
  ["navigation", "stepper", "Stepper"],
  ["data", "stat", "Stat and Sparkline"],
  ["data", "timeline", "Timeline"],
  ["actions", "chip", "Chip"],
];

for (const mode of ["light", "dark"] as const) {
  test.describe(`visual · ${mode}`, () => {
    for (const [category, component, title] of cases) {
      test(`${category} › ${title}`, async ({ page }) => {
        await open(page, `components/${component}`, mode);
        await expect(example(page, title)).toHaveScreenshot(`${category}-${title.replace(/\W+/g, "-").toLowerCase()}-${mode}.png`);
      });
    }

    test("focus ring on primary button", async ({ page }) => {
      await open(page, "components/button", mode);
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

    // Surface materials on the template: a nested ThemeProvider (Kaveh inside the docs theme),
    // so these also catch derived tokens leaking from the outer theme.
    for (const material of ["Classic", "Glass", "Clay", "Neomorph"] as const) {
      test(`template material › ${material}`, async ({ page }) => {
        await open(page, "template", mode);
        await page.getByRole("button", { name: material, exact: true }).first().click();
        const app = page.locator("[data-slot=sidebar-wrapper]");
        await app.scrollIntoViewIfNeeded();
        // The docs site's sticky header overlaps the top of the template; mask it so docs
        // header changes (like the search button) don't fail the material screenshots.
        const docsHeader = page.locator("header.sticky.z-40");
        await expect(app).toHaveScreenshot(`template-${material.toLowerCase()}-${mode}.png`, { mask: [page.locator("time"), docsHeader] });
      });
    }

    test("Persian (fa-IR, RTL, Jalali)", async ({ page }) => {
      await open(page, "i18n", mode);
      const persian = page.locator('[lang="fa-IR"]').first();
      await persian.scrollIntoViewIfNeeded();
      await expect(persian).toHaveScreenshot(`i18n-persian-${mode}.png`);
    });

    test("block › detail page", async ({ page }) => {
      await open(page, "blocks", mode);
      const block = page.locator("section").filter({ has: page.getByRole("heading", { name: "Detail page", exact: true }) }).locator(".bg-surface-sunken\\/40").first();
      await block.scrollIntoViewIfNeeded();
      await expect(block).toHaveScreenshot(`block-detail-${mode}.png`);
    });
  });
}
