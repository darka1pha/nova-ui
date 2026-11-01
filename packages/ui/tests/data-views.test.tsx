import { act, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CalendarHeatmap, ThemeProvider, VirtualList, type VirtualListApi } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) => render(<ThemeProvider {...props}>{ui}</ThemeProvider>);
const rows = Array.from({ length: 10_000 }, (_, i) => `Row ${i + 1}`);

describe("VirtualList", () => {
  it("renders only the rows in view plus overscan, with list semantics", () => {
    wrap(<VirtualList aria-label="Rows" items={rows} itemHeight={32} height={320} overscan={2} renderItem={(r) => r} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(13); // 10 visible + 1 partial + 2 overscan
    expect(items[0]).toHaveAttribute("aria-setsize", "10000");
    expect(items[0]).toHaveAttribute("aria-posinset", "1");
  });

  it("follows the scroll position and scrolls to an index", () => {
    const api = createRef<VirtualListApi>();
    const { container } = wrap(<VirtualList aria-label="Rows" apiRef={api} items={rows} itemHeight={32} height={320} overscan={0} renderItem={(r) => r} />);
    const viewport = container.querySelector<HTMLElement>("[tabindex='0']")!;
    viewport.scrollTop = 32 * 500;
    fireEvent.scroll(viewport);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Row 501");
    act(() => api.current?.scrollToIndex(9_000, "start"));
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Row 9001");
  });

  it("calls onEndReached once per length when the end comes into view", () => {
    const onEndReached = vi.fn();
    const { container } = wrap(<VirtualList aria-label="Rows" items={rows.slice(0, 50)} itemHeight={32} height={320} onEndReached={onEndReached} renderItem={(r) => r} />);
    expect(onEndReached).not.toHaveBeenCalled();
    const viewport = container.querySelector<HTMLElement>("[tabindex='0']")!;
    viewport.scrollTop = 32 * 40;
    fireEvent.scroll(viewport);
    viewport.scrollTop = 32 * 41;
    fireEvent.scroll(viewport);
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<VirtualList aria-label="Rows" items={rows.slice(0, 100)} itemHeight={32} height={200} renderItem={(r) => r} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("CalendarHeatmap", () => {
  const data = [
    { date: "2026-10-26", value: 1 },
    { date: "2026-10-27", value: 8 },
    { date: "2026-10-28", value: 4 },
  ];
  const props = { "aria-label": "Commits", data, start: "2026-10-04", end: "2026-10-29", locale: "en-US" } as const;

  it("labels every day and maps values to color levels", () => {
    wrap(<CalendarHeatmap {...props} formatLabel={(v, _d, f) => `${v} commits on ${f}`} />);
    expect(screen.getByRole("grid", { name: "Commits" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "8 commits on Tuesday, October 27, 2026" })).toHaveAttribute("data-level", "4");
    expect(screen.getByRole("gridcell", { name: "1 commits on Monday, October 26, 2026" })).toHaveAttribute("data-level", "1");
    expect(screen.getByRole("gridcell", { name: "0 commits on Sunday, October 4, 2026" })).toHaveAttribute("data-level", "0");
    // 26 days in range, one tab stop: the most recent day.
    expect(screen.getAllByRole("gridcell").filter((c) => c.hasAttribute("data-level"))).toHaveLength(26);
    expect(screen.getByRole("gridcell", { name: /October 29/ })).toHaveAttribute("tabindex", "0");
  });

  it("moves by day and week with arrow keys, mirrored in RTL", async () => {
    const { unmount } = wrap(<CalendarHeatmap {...props} />);
    screen.getByRole("gridcell", { name: /October 29/ }).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("gridcell", { name: /October 28/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("gridcell", { name: /October 21/ })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("gridcell", { name: /October 7/ })).toHaveFocus();
    unmount();

    wrap(<CalendarHeatmap {...props} />, { dir: "rtl" });
    screen.getByRole("gridcell", { name: /October 29/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("gridcell", { name: /October 22/ })).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<CalendarHeatmap {...props} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
