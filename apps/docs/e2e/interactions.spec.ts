import { expect, test, type Locator, type Page } from "@playwright/test";
import { open } from "./helpers.ts";

/*
 * Real-browser interaction tests. Each covers behavior that unit tests in jsdom
 * could not see: actual layout, trusted key and pointer events, focus timing,
 * and how a browser batches input. Several reproduce bugs found by hand.
 */

const exampleSection = (page: Page, title: string) => page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) }).first();

test.describe("Carousel", () => {
  test("previous and next work when several slides are visible", async ({ page }) => {
    await open(page, "data");
    const carousel = page.getByRole("region", { name: "Featured themes" });
    await carousel.scrollIntoViewIfNeeded();
    const previous = carousel.getByRole("button", { name: "Previous slide" });
    const next = carousel.getByRole("button", { name: "Next slide" });
    const track = carousel.locator("[tabindex='0']").first();
    const scroll = () => track.evaluate((el) => Math.round(el.scrollLeft));

    // The bug: the carousel thought it started on slide 2, so Previous did nothing and was enabled.
    await expect(previous).toBeDisabled();
    await expect(carousel.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true");
    await next.click();
    await expect.poll(scroll).toBeGreaterThan(0);
    const one = await scroll();
    await expect(previous).toBeEnabled();
    // Two quick clicks travel two slides, not one.
    await next.click();
    await next.click();
    await expect.poll(scroll).toBeGreaterThan(one * 2.5);
    await previous.click();
    await previous.click();
    await previous.click();
    await expect.poll(scroll).toBe(0);
    await expect(previous).toBeDisabled();
  });
});

test.describe("TimeInput", () => {
  async function eta(page: Page) {
    await open(page, "forms");
    const field = page.getByRole("group", { name: "ETA" });
    await field.scrollIntoViewIfNeeded();
    return { field, hours: field.getByRole("spinbutton", { name: "Hours" }), minutes: field.getByRole("spinbutton", { name: "Minutes" }), stored: page.locator("input[name=eta]") };
  }

  test("a fast burst of digits fills hour and minute in order", async ({ page }) => {
    const { hours, stored } = await eta(page);
    await hours.click();
    // pressSequentially with no delay: keystrokes arrive faster than React re-renders.
    await hours.pressSequentially("0745", { delay: 0 });
    await expect(stored).toHaveValue(/^(07|19):45$/);
  });

  test("one insert carrying several digits spreads across segments", async ({ page }) => {
    const { hours, stored } = await eta(page);
    await hours.click();
    // insertText delivers "0630" as a single beforeinput, as autocomplete and swipe keyboards do.
    // The test browser is en-US (12-hour); the ETA starts in the afternoon, so 06:30 keeps PM.
    await page.keyboard.insertText("0630");
    await expect(stored).toHaveValue("18:30");
  });

  test("clearing the minutes keeps the hour (controlled field)", async ({ page }) => {
    const { hours, minutes, stored } = await eta(page);
    await hours.click();
    await page.keyboard.insertText("0915");
    await expect(stored).toHaveValue(/^(09|21):15$/);
    await minutes.focus();
    await page.keyboard.press("Backspace");
    await expect(stored).toHaveValue("");
    await expect(hours).not.toHaveText("––");
    await expect(minutes).toHaveText("––");
  });
});

test.describe("Resizable panels", () => {
  test("drag, collapse by dragging, and expand back to the earlier size", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("nv-resizable:docs-fleet"));
    await open(page, "layout");
    const handle = page.getByRole("separator", { name: "Resize Vessels" });
    await handle.scrollIntoViewIfNeeded();
    const size = async () => Number(await handle.getAttribute("aria-valuenow"));
    expect(await size()).toBe(32);

    const box = (await handle.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy, { steps: 5 });
    await page.mouse.up();
    const widened = await size();
    expect(widened).toBeGreaterThan(40);

    const box2 = (await handle.boundingBox())!;
    await page.mouse.move(box2.x + 1, cy);
    await page.mouse.down();
    await page.mouse.move(box2.x - 600, cy, { steps: 8 });
    await page.mouse.up();
    await expect.poll(size).toBe(0);
    await handle.focus();
    await page.keyboard.press("Enter");
    await expect.poll(size).toBe(widened);
  });
});

test.describe("DateRangePicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-29T10:00:00"));
  });

  test("a preset applies and two calendar clicks pick a range", async ({ page }) => {
    await open(page, "forms");
    const trigger = page.getByRole("combobox", { name: "Voyage window" });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const dialog = page.getByRole("dialog");
    // Presets sit beside the calendar, not stacked on top of it.
    const presets = (await dialog.getByRole("list", { name: "Presets" }).boundingBox())!;
    const grid = (await dialog.getByRole("grid").first().boundingBox())!;
    expect(presets.x + presets.width).toBeLessThanOrEqual(grid.x + 4);
    await dialog.getByRole("button", { name: "Last 7 days" }).click();
    await expect(page.locator("input[name=voyageStart]")).toHaveValue("2026-10-23");
    await expect(page.locator("input[name=voyageEnd]")).toHaveValue("2026-10-29");

    await trigger.click();
    await page.getByRole("dialog").getByRole("button", { name: /November 3, 2026/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: /November 12, 2026/ }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator("input[name=voyageStart]")).toHaveValue("2026-11-03");
    await expect(page.locator("input[name=voyageEnd]")).toHaveValue("2026-11-12");
  });
});

test.describe("TreeView", () => {
  test("arrows, type-ahead cycling and selection", async ({ page }) => {
    await open(page, "navigation");
    const tree = page.getByRole("tree", { name: "Ports" });
    await tree.scrollIntoViewIfNeeded();
    const item = (name: string) => tree.getByRole("treeitem", { name: new RegExp(`^${name}`) });
    await item("Chabahar").click();
    await page.keyboard.press("b");
    await expect(item("Bandar Abbas")).toBeFocused();
    await page.keyboard.press("b");
    await expect(item("Berth 1")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(item("Berth 2")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(item("Shahid Rajaee")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(item("Shahid Rajaee")).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Menubar and Toolbar", () => {
  async function fileMenu(page: Page): Promise<Locator> {
    await open(page, "navigation");
    const file = page.getByRole("menubar").getByRole("menuitem", { name: "File" });
    await file.scrollIntoViewIfNeeded();
    return file;
  }

  test("keyboard: open, move, and enter a submenu", async ({ page }) => {
    const file = await fileMenu(page);
    await file.focus();
    // Radix moves focus a tick after each key; wait for it as a person's pace would.
    for (const name of [/New voyage/, /Open manifest/, /^Export$/]) {
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menuitem", { name })).toBeFocused();
    }
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("menuitem", { name: "Manifest (CSV)" })).toBeFocused();
  });

  test("click to open, then arrow keys at typing speed", async ({ page }) => {
    const file = await fileMenu(page);
    await file.click();
    for (const name of [/New voyage/, /Open manifest/, /^Export$/]) {
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menuitem", { name })).toBeFocused();
    }
  });

  test("toolbar keeps one tab stop and toggles with Space", async ({ page }) => {
    await open(page, "navigation");
    const toolbar = page.getByRole("toolbar", { name: "Report formatting" });
    await toolbar.scrollIntoViewIfNeeded();
    await toolbar.getByRole("button", { name: "Bold" }).click();
    await expect(toolbar.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false");
    for (const name of ["Italic", "Align start", "Align center"]) {
      await page.keyboard.press("ArrowRight");
      await expect(toolbar.getByRole(name === "Italic" ? "button" : "radio", { name })).toBeFocused();
    }
    await page.keyboard.press("Space");
    await expect(toolbar.getByRole("radio", { name: "Align center" })).toHaveAttribute("aria-checked", "true");
    expect(await toolbar.locator("button[tabindex='0']").count()).toBe(1);
  });
});

test.describe("NotificationCenter", () => {
  test("filters, marks read and announces arrivals", async ({ page }) => {
    await open(page, "feedback");
    const section = exampleSection(page, "NotificationCenter");
    await section.scrollIntoViewIfNeeded();
    const bell = section.getByRole("button", { name: /^Notifications/ });
    await expect(bell).toHaveAccessibleName("Notifications, 3 unread");
    await bell.click();
    const panel = page.getByRole("dialog", { name: "Notifications" });
    await panel.getByRole("radio", { name: "Customs" }).click();
    await expect(panel.getByText(/Customs hold/)).toBeVisible();
    await expect(panel.getByText(/Iran Shahr/)).toBeHidden();
    await panel.getByRole("button", { name: "Mark all as read" }).click();
    await expect(bell).toHaveAccessibleName("Notifications");
    await page.keyboard.press("Escape");
    await section.getByRole("button", { name: "Simulate an arrival" }).click();
    await expect(bell).toHaveAccessibleName("Notifications, 1 unread");
    await expect(page.getByRole("status").filter({ hasText: "1 new notification" })).toHaveCount(1);
  });
});
