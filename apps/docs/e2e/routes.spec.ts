import { expect, test, type Page } from "@playwright/test";
import { horizontalOverflow, navRoutes, open } from "./helpers.ts";

const routes = navRoutes();

// Routes with a known layout bug at 375px. Each is expected to fail until the bug is fixed;
// Playwright reports it when a fix makes it pass, so remove the entry then.
const knownFailures: Record<string, string> = {};

/** Structure every page should have: one h1, a page-specific title, no sideways scroll. */
async function expectSoundPage(page: Page, route: string) {
  await expect(page.locator("h1"), "exactly one h1").toHaveCount(1);
  const title = await page.title();
  if (route === "home") expect(title).toBe("Nova UI");
  else expect(title).toMatch(/^.+ · Nova UI$/);
  expect(title).not.toBe("Page not found · Nova UI");
  expect(await horizontalOverflow(page), "horizontal overflow").toBeNull();
}

// P1.2: every nav entry at phone width, in both directions. Tagged @mobile so it runs
// in the touch-emulating project; the viewport is narrowed to the 375px baseline.
test.describe("route sweep at 375px @mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const route of routes) {
    test(route, async ({ page }) => {
      test.fail(route in knownFailures, knownFailures[route]);
      const errors = await open(page, route);
      await expectSoundPage(page, route);

      await page.getByRole("button", { name: "Toggle text direction" }).click();
      await expect(page.locator(".nv-theme").first()).toHaveAttribute("dir", "rtl");
      // Let RTL-only layout (logical insets, mirrored overlays) settle before measuring.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await expectSoundPage(page, route);

      expect(errors).toEqual([]);
    });
  }
});

test("every page has its own document title", async ({ page }) => {
  test.setTimeout(240_000);
  await open(page, "home");
  const seen = new Map<string, string>();
  for (const route of routes) {
    await page.evaluate((r) => (location.hash = `#/${r}`), route);
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });
    const title = await page.title();
    expect(seen.get(title), `"${title}" is used by both ${seen.get(title)} and ${route}`).toBeUndefined();
    seen.set(title, route);
  }
});

// P1.3: the skip link and the not-found state.
test("skip link moves focus to <main> and keeps the route", async ({ page }) => {
  await open(page, "components/button");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
  await expect(page).toHaveURL(/#\/components\/button$/);
  await expect(page.getByRole("heading", { level: 1, name: "Button" })).toBeVisible();
  // The next Tab continues from the page content, not from the top of the header.
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
});

for (const route of ["no-such-page", "components/no-such-component"]) {
  test(`unknown route shows "Page not found": ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`/#/${route}`);
    await expect(page.locator("main").getByText("Page not found", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveTitle("Page not found · Nova UI");
    // It must not fall back to the overview.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);

    await page.getByRole("link", { name: "Back to the overview" }).click();
    await expect(page).toHaveURL(/#\/home$/);
    await expect(page).toHaveTitle("Nova UI");
    expect(errors).toEqual([]);
  });
}
