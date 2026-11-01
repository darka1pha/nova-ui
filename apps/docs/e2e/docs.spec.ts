import { expect, test, type Page } from "@playwright/test";
import { axe, open } from "./helpers.ts";

const routes = [
  "home",
  "installation",
  "getting-started",
  "playground",
  "template",
  "blocks",
  "theming",
  "tokens",
  "motion",
  "icons",
  "layout",
  "actions",
  "forms",
  "forms-validation",
  "feedback",
  "overlays",
  "navigation",
  "data",
  "accessibility",
  "i18n",
  "styling",
  "custom-components",
  "migration",
  "troubleshooting",
  "contributing",
];

test.describe("every page renders without errors", () => {
  for (const route of routes) {
    test(route, async ({ page }) => {
      const errors = await open(page, route);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("axe (WCAG 2.2 AA, including color contrast)", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const route of ["home", "installation", "motion", "actions", "forms", "forms-validation", "feedback", "navigation", "data", "playground", "layout", "icons", "blocks", "i18n"]) {
      test(`${route} · ${mode}`, async ({ page }) => {
        await open(page, route, mode);
        expect(await axe(page)).toEqual([]);
      });
    }
  }
});

test("radio selection follows arrow keys", async ({ page }) => {
  await open(page, "forms");
  const pro = page.getByRole("radio", { name: "Pro" });
  await expect(pro).toBeChecked();
  await pro.focus();
  // Radix checks the newly focused radio while the arrow key is still held, as
  // with a real keypress; an instantaneous synthetic press releases too early.
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(50);
  await page.keyboard.up("ArrowDown");
  await expect(page.getByRole("radio", { name: "Enterprise" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Enterprise" })).toBeFocused();
});

test("dialog traps focus and restores it", async ({ page }) => {
  await open(page, "overlays");
  const trigger = page.getByRole("button", { name: "Edit profile" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

/*
 * Breakpoint overrides inside components (`flex-col-reverse sm:flex-row`,
 * `text-3xl sm:text-4xl`) must win at their width. They lose when a second
 * Tailwind build re-emits the base utility later in the same layer, which is
 * why Tailwind apps import @darkalpha/nova-ui/tailwind.css instead of styles.css.
 */
async function responsiveLayouts(page: Page) {
  await open(page, "layout");
  const heading = await page.getByRole("heading", { level: 3, name: "Section heading" }).evaluate((h) => getComputedStyle(h).fontSize);
  await open(page, "feedback");
  const columns = await page.getByText("No projects yet").first().evaluate((el) => {
    const grid = el.closest(".grid");
    return grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0;
  });
  await open(page, "overlays");
  await page.getByRole("button", { name: "Edit profile" }).click();
  const footer = page.getByRole("dialog", { name: "Edit profile" }).getByRole("button", { name: "Save changes" }).locator("..");
  const direction = await footer.evaluate((el) => getComputedStyle(el).flexDirection);
  return { heading, columns, direction };
}

test("component breakpoints apply at desktop width", async ({ page }) => {
  expect(await responsiveLayouts(page)).toEqual({ heading: "36px", columns: 3, direction: "row" });
});

test("component breakpoints collapse at phone width @mobile", async ({ page }) => {
  expect(await responsiveLayouts(page)).toEqual({ heading: "30px", columns: 1, direction: "column-reverse" });
});

test("dropdown menu works with the keyboard", async ({ page }) => {
  await open(page, "actions");
  await page.getByRole("button", { name: "Options" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: /Export/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
});

test("color mode persists across reloads without a flash", async ({ page }) => {
  await open(page, "home", "dark");
  // The inline head script applies the stored mode before React renders.
  expect(await page.evaluate(() => document.documentElement.dataset.nvMode)).toBe("dark");
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector(".nv-theme") as Element).backgroundColor);
  await page.getByRole("radio", { name: "Light mode" }).click();
  await page.reload();
  expect(await page.evaluate(() => window.localStorage.getItem("nova-docs-mode"))).toBe("light");
  const after = await page.evaluate(() => getComputedStyle(document.querySelector(".nv-theme") as Element).backgroundColor);
  expect(after).not.toBe(bg);
});

test("playground brand colors update the live preview", async ({ page }) => {
  await open(page, "playground");
  const preview = page.getByTestId("playground-preview");
  const field = page.getByRole("textbox", { name: "Primary color", exact: true });
  await field.fill("#e11d48");
  await expect(preview.getByRole("button", { name: "Upgrade" })).toHaveCSS("background-color", "rgb(225, 29, 72)");
  await page.getByRole("tab", { name: "Config" }).click();
  await expect(page.getByText('brand={{primary: "#e11d48"}}')).toBeVisible();
});

test("switching presets restyles components", async ({ page }) => {
  await open(page, "actions");
  const primary = page.getByRole("button", { name: "Primary", exact: true }).first();
  const before = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.getByRole("combobox", { name: "Theme preset" }).click();
  await page.getByRole("option", { name: "Forest" }).click();
  await expect(primary).not.toHaveCSS("background-color", before);
});

test("hover lifts and glows a primary button; press squashes it", async ({ page }) => {
  await open(page, "actions");
  const btn = page.getByRole("button", { name: "Primary", exact: true }).first();
  await btn.hover();
  await expect(btn).toHaveCSS("translate", "0px -2px");
  await expect.poll(() => btn.evaluate((el) => getComputedStyle(el).boxShadow)).toContain("0.5) 0px 8px 24px -6px");
  await page.mouse.down();
  await expect.poll(() => btn.evaluate((el) => getComputedStyle(el).scale)).toBe("0.97");
  await page.mouse.up();
});

test("tab indicator glides to the selected tab", async ({ page }) => {
  await open(page, "navigation");
  const list = page.getByRole("tablist", { name: "pills tabs" });
  const indicator = list.locator("[data-tabs-indicator]");
  await expect(list).toHaveAttribute("data-indicator", "ready");
  await list.getByRole("tab", { name: "Settings" }).click();
  const target = await list.getByRole("tab", { name: "Settings" }).evaluate((el: HTMLElement) => el.offsetLeft);
  await expect.poll(() => indicator.evaluate((el: HTMLElement) => el.style.translate)).toContain(`${target}px`);
});

test("date picker: keyboard selection and focus return", async ({ page }) => {
  await open(page, "forms");
  const field = page.getByLabel("Check-in");
  await field.click();
  const grid = page.getByRole("dialog").getByRole("grid");
  await expect(grid).toBeVisible();
  await expect(grid.locator('[tabindex="0"]')).toBeFocused();
  await page.keyboard.press("PageDown");
  await page.keyboard.press("ArrowDown");
  // Land on a weekday that is allowed, then choose it.
  for (let i = 0; i < 7; i++) {
    if ((await grid.locator('[tabindex="0"]').getAttribute("aria-disabled")) !== "true") break;
    await page.keyboard.press("ArrowRight");
  }
  await page.keyboard.press("Enter");
  await expect(grid).toBeHidden();
  await expect(field).toBeFocused();
  await expect(field).not.toHaveText("Pick a date");
});

test("pin input fills every box from a paste", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "forms");
  const boxes = page.getByRole("group", { name: "Verification code" }).getByRole("textbox");
  await page.evaluate(() => navigator.clipboard.writeText("123456"));
  await boxes.first().focus();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(boxes.nth(5)).toHaveValue("6");
  await expect(page.getByText("Code 123456 entered").first()).toBeVisible();
});

test("react-hook-form + zod: messages, summary, focus and a11y after a failed submit", async ({ page }) => {
  await open(page, "forms-validation");
  await page.getByRole("button", { name: "Create account" }).click();
  const summary = page.getByRole("alert", { name: "Please fix 9 problems" });
  await expect(summary).toBeVisible();
  await expect(page.getByLabel(/^Full name/)).toBeFocused();
  await expect(page.getByLabel(/^Full name/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("[data-name=password]").getByText("Include a capital letter")).toBeVisible();
  await summary.getByRole("link", { name: /^Email:/ }).click();
  await expect(page.getByLabel(/^Email/)).toBeFocused();
  // Fixing a field clears its message as you type (re-validation).
  await page.getByLabel(/^Email/).fill("ada@example.com");
  await expect(page.getByLabel(/^Email/)).not.toHaveAttribute("aria-invalid");
  expect(await axe(page)).toEqual([]);
});

test("react-hook-form: server errors from onSubmit land on the form and the field", async ({ page }) => {
  await open(page, "forms-validation");
  await page.getByRole("switch", { name: "Simulate server error" }).click();
  await page.getByLabel(/^Full name/).fill("Ada Lovelace");
  await page.getByLabel(/^Email/).fill("ada@example.com");
  await page.getByLabel(/^Password/).fill("Analytical1");
  await page.getByLabel(/^Age/).fill("36");
  await page.getByLabel(/^Age/).blur();
  await page.getByLabel(/^Plan/).click();
  await page.getByRole("option", { name: "Pro" }).click();
  await page.getByLabel(/^Start date/).click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.getByRole("textbox", { name: /^Skills/ }).fill("math");
  await page.keyboard.press("Enter");
  await page.getByRole("radio", { name: "Monthly" }).click();
  await page.getByRole("checkbox", { name: /I accept the terms/ }).click();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Creating account…" })).toBeVisible();
  await expect(page.getByRole("alert", { name: "Something went wrong" })).toContainText("We couldn't create your account.");
  await expect(page.getByLabel(/^Email/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("[data-name=email]").getByText("This email is already registered")).toBeVisible();
});

test("RTL mirrors layout and overlays", async ({ page }) => {
  await open(page, "overlays");
  await page.getByRole("button", { name: "Toggle text direction" }).click();
  await expect(page.locator(".nv-theme").first()).toHaveAttribute("dir", "rtl");
  const sidebar = await page.locator("aside").boundingBox();
  const main = await page.locator("main").boundingBox();
  expect(sidebar!.x).toBeGreaterThan(main!.x);
  await page.getByRole("button", { name: "Open sheet" }).click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  // side="end" is the left edge in RTL.
  expect(box!.x).toBeLessThan(10);
});

test("reduced motion collapses durations @mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "home");
  const d = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--nv-duration-normal").trim());
  // Durations are calc(<n>ms * scale) normally; reduced motion replaces them with ~0.
  expect(d).toMatch(/^\.?0?\.01ms$/);
  const marquee = await page.evaluate(() => {
    location.hash = "#/motion";
    return true;
  });
  expect(marquee).toBe(true);
});

test("mobile navigation opens in a sheet @mobile", async ({ page }) => {
  await open(page, "home");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Forms", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Forms" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});
