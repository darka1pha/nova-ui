import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Scheduler, type SchedulerEvent } from "../src/experimental.ts";
import { ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const events: SchedulerEvent[] = [
  { id: "a", title: "Damavand Star berthing", start: at(12, 9), end: at(12, 11) },
  { id: "b", title: "Customs inspection", start: at(12, 10), end: at(12, 12) },
  { id: "c", title: "Pilot briefing", start: at(12, 13), end: at(12, 14) },
  { id: "d", title: "Crew change", start: at(12, 15), end: at(12, 16) },
  { id: "e", title: "Port holiday", start: new Date(2026, 10, 20), end: new Date(2026, 10, 21), allDay: true },
];

describe("Scheduler", () => {
  it("shows the month as a grid of days with events and +N more", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const { container } = render(<Scheduler label="Berths" events={events} defaultDate={at(12, 0)} weekStartsOn={6} locale="en-US" onViewChange={onViewChange} />);
    const grid = screen.getByRole("grid", { name: "Berths, November 2026" });
    expect(within(grid).getAllByRole("columnheader")[0]).toHaveAccessibleName("Saturday");
    const day = within(grid).getByRole("gridcell", { name: "Thursday, November 12, 2026, 4 events" });
    expect(day).toHaveAttribute("tabindex", "0");
    // Three slots: two events and "+2 more".
    expect(within(day).getAllByRole("button").map((b) => b.textContent)).toEqual(["9:00 AMDamavand Star berthing", "10:00 AMCustoms inspection", "+2 more"]);
    expect(await axeViolations(container)).toEqual([]);

    await user.click(within(day).getByRole("button", { name: "+2 more" }));
    expect(onViewChange).toHaveBeenCalledWith("day");
  });

  it("moves between days with the keyboard, mirrored in RTL, and changes month", async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    render(
      <ThemeProvider dir="rtl" locale="en-US">
        <Scheduler label="Berths" events={events} defaultDate={at(12, 0)} onDateChange={onDateChange} />
      </ThemeProvider>,
    );
    screen.getByRole("gridcell", { name: /November 12, 2026/ }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(onDateChange).toHaveBeenLastCalledWith(new Date(2026, 10, 13));
    expect(screen.getByRole("gridcell", { name: /November 13, 2026/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: /November 20, 2026, 1 event/ })).toHaveFocus();
    await user.keyboard("{PageDown}");
    expect(screen.getByRole("grid", { name: "Berths, December 2026" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: /December 20, 2026/ })).toHaveFocus();
  });

  it("picks a day with Enter and opens events from Tab", async () => {
    const user = userEvent.setup();
    const onSlotClick = vi.fn();
    const onEventClick = vi.fn();
    render(<Scheduler label="Berths" events={events} defaultDate={at(12, 0)} locale="en-US" onSlotClick={onSlotClick} onEventClick={onEventClick} />);
    screen.getByRole("gridcell", { name: /November 12, 2026/ }).focus();
    await user.keyboard("{Enter}");
    expect(onSlotClick).toHaveBeenCalledWith(new Date(2026, 10, 12));
    await user.tab();
    expect(screen.getByRole("button", { name: "Damavand Star berthing, 9:00 AM–11:00 AM" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onEventClick).toHaveBeenCalledWith(events[0]);
  });

  it("lays overlapping events side by side in the day view, all-day events above", () => {
    render(<Scheduler label="Berths" events={events} defaultView="day" defaultDate={at(12, 0)} locale="en-US" hourHeight={40} dayStartHour={8} />);
    expect(screen.getByRole("heading", { name: "Thursday, November 12, 2026" })).toBeInTheDocument();
    const a = screen.getByRole("button", { name: /Damavand Star berthing/ });
    const b = screen.getByRole("button", { name: /Customs inspection/ });
    const c = screen.getByRole("button", { name: /Pilot briefing/ });
    // 9:00 is one hour below the 8:00 start; two hours tall.
    expect(a).toHaveStyle({ top: "40px", height: "80px" });
    expect(a.style.insetInlineStart).toBe("calc(0% + 2px)");
    expect(b.style.insetInlineStart).toBe("calc(50% + 2px)");
    expect(a.style.width).toBe("calc(50% - 4px)");
    // A later, separate event gets the full width.
    expect(c.style.width).toBe("calc(100% - 4px)");
  });

  it("follows the Persian calendar and digits", () => {
    render(
      <ThemeProvider locale="fa-IR" dir="rtl">
        <Scheduler label="برنامه" events={[]} defaultDate={new Date(2026, 10, 12)} labels={{ month: "ماه", week: "هفته", day: "روز", today: "امروز" }} />
      </ThemeProvider>,
    );
    // 12 November 2026 is 21 Aban 1405.
    expect(screen.getByRole("heading", { name: "آبان ۱۴۰۵" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: /۲۱ آبان ۱۴۰۵/ })).toHaveAttribute("tabindex", "0");
    // The Persian week starts on Saturday.
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("شنبه");
  });

  it("renders nothing clock-dependent on the server", () => {
    // Without a date, the server can't know the visitor's today: toolbar only, filled in after hydration.
    const bare = renderToString(<Scheduler label="Berths" events={events} />);
    expect(bare).not.toContain('role="grid"');
    expect(bare).toContain('aria-busy="true"');
    // With a date, the grid renders, but no day is marked as today until the client knows it.
    const dated = renderToString(<Scheduler label="Berths" events={events} defaultDate={at(12, 0)} locale="en-US" />);
    expect(dated).toContain('role="grid"');
    expect(dated).not.toContain('aria-current="date"');
  });

  it("switches views and steps by week", async () => {
    const user = userEvent.setup();
    render(<Scheduler label="Berths" events={events} defaultDate={at(12, 0)} locale="en-US" weekStartsOn={0} />);
    await user.click(screen.getByRole("radio", { name: "Week" }));
    expect(screen.getByRole("heading", { name: "Nov 8 – Nov 14" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Nov 15 – Nov 21" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Friday, November 20, 2026, All day/ })).toHaveTextContent("Port holiday");
  });
});
