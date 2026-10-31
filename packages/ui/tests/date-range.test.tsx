import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateRangePicker, defaultDateRangePresets, RangeCalendar, ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const day = (name: RegExp | string) => screen.getByRole("button", { name });

describe("RangeCalendar", () => {
  it("shows two months and picks a range in either order", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RangeCalendar defaultMonth={new Date(2026, 9, 1)} onValueChange={onValueChange} />);
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    expect(screen.getByText("November 2026")).toBeInTheDocument();

    // End first, then start: the range still comes back ordered.
    await user.click(day(/November 3, 2026/));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(day(/October 28, 2026/));
    expect(onValueChange).toHaveBeenCalledWith({ start: new Date(2026, 9, 28), end: new Date(2026, 10, 3) });

    // Ends and the days between are selected; the band crosses the month boundary.
    const selected = screen.getAllByRole("gridcell").filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(7);
  });

  it("previews the range under keyboard focus while choosing", async () => {
    const user = userEvent.setup();
    render(<RangeCalendar defaultMonth={new Date(2026, 9, 1)} />);
    day(/October 1, 2026/).focus();
    await user.keyboard("{Enter}{ArrowDown}");
    // Oct 1 → Oct 8 is previewed before the second end is chosen.
    const previewed = screen.getAllByRole("gridcell").filter((c) => c.getAttribute("aria-selected") === "true");
    expect(previewed).toHaveLength(8);
    await user.keyboard("{Enter}");
    expect(day(/October 8, 2026/).closest("[role=gridcell]")).toHaveAttribute("aria-selected", "true");
  });

  it("keeps the view still while focus moves within the visible months", async () => {
    const user = userEvent.setup();
    render(<RangeCalendar defaultMonth={new Date(2026, 9, 1)} />);
    day(/October 25, 2026/).focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toHaveAccessibleName(/November 8, 2026/);
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    await user.keyboard("{PageDown}");
    // Focus left the visible months, so the view moves just enough to show it.
    expect(screen.getByText("December 2026")).toBeInTheDocument();
    expect(screen.queryByText("October 2026")).toBeNull();
  });

  it("works in the Jalali calendar", () => {
    render(
      <ThemeProvider locale="fa-IR" dir="rtl">
        <RangeCalendar defaultValue={{ start: new Date(2026, 9, 31), end: new Date(2026, 10, 3) }} />
      </ThemeProvider>,
    );
    expect(screen.getByText("آبان ۱۴۰۵")).toBeInTheDocument();
    expect(screen.getByText("آذر ۱۴۰۵")).toBeInTheDocument();
  });

  it("passes axe", async () => {
    const { container } = render(<RangeCalendar defaultValue={{ start: new Date(2026, 9, 5), end: new Date(2026, 9, 9) }} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("DateRangePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 31, 12));
  });
  afterEach(() => vi.useRealTimers());

  it("applies a preset, shows the range and submits both ends", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateRangePicker aria-label="Voyage window" name="voyage" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox", { name: "Voyage window" }));
    await user.click(screen.getByRole("button", { name: "Last 7 days" }));
    expect(onValueChange).toHaveBeenCalledWith({ start: new Date(2026, 9, 25), end: new Date(2026, 9, 31) });
    expect(screen.getByRole("combobox", { name: "Voyage window" })).toHaveTextContent(/Oct 25\s*–\s*31, 2026/);
    expect(container.querySelector("input[name='voyageStart']")).toHaveValue("2026-10-25");
    expect(container.querySelector("input[name='voyageEnd']")).toHaveValue("2026-10-31");
    // Reopening marks the active preset.
    await user.click(screen.getByRole("combobox", { name: "Voyage window" }));
    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveAttribute("aria-pressed", "true");
  });

  it("closes after both ends are picked on the calendar", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker aria-label="Window" presets={false} />);
    await user.click(screen.getByRole("combobox", { name: "Window" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /November 2, 2026/ }));
    await user.click(within(dialog).getByRole("button", { name: /November 6, 2026/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Window" })).toHaveTextContent(/Nov 2\s*–\s*6, 2026/);
  });

  it("computes This month in the Jalali calendar for Persian", () => {
    const thisMonth = defaultDateRangePresets("persian").find((p) => p.label === "This month");
    // 31 Oct 2026 is 9 Aban 1405; Aban runs 23 Oct – 21 Nov.
    expect(thisMonth?.range()).toEqual({ start: new Date(2026, 9, 23), end: new Date(2026, 10, 21) });
  });
});
