import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { VirtualTable, virtualRange, type VirtualTableApi, type VirtualTableColumn } from "../src/experimental.ts";
import { ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

interface Row {
  id: string;
  name: string;
  n: number;
}
const rows: Row[] = Array.from({ length: 10_000 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}`, n: (i * 7919) % 10_000 }));
const columns: VirtualTableColumn<Row>[] = [
  { id: "name", header: "Name", pinned: true, width: 120 },
  { id: "n", header: "Number", sortable: true, align: "end", width: 100 },
  ...Array.from({ length: 40 }, (_, c) => ({ id: `c${c}`, header: `Col ${c}`, width: 100, cell: (r: Row) => `${r.id}:${c}` })),
];

const bodyRows = () => screen.getAllByRole("row").filter((r) => r.hasAttribute("aria-rowindex") && r.getAttribute("aria-rowindex") !== "1");

describe("virtualRange", () => {
  it("returns the slice in view plus overscan, clamped", () => {
    expect(virtualRange(0, 100, 10, 1000, 2)).toEqual([0, 12]);
    expect(virtualRange(500, 100, 10, 1000, 2)).toEqual([48, 62]);
    expect(virtualRange(9_990, 100, 10, 1000, 2)).toEqual([997, 999]);
    expect(virtualRange(0, 100, 10, 0, 2)).toEqual([0, -1]);
  });
});

describe("VirtualTable", () => {
  it("renders only the rows in view, with row and column counts for screen readers", () => {
    const { container } = wrap(<VirtualTable aria-label="Big table" data={rows} columns={columns} getRowId={(r) => r.id} height={440} rowHeight={44} />);
    const table = screen.getByRole("table", { name: "Big table" });
    expect(table).toHaveAttribute("aria-rowcount", "10001");
    expect(table).toHaveAttribute("aria-colcount", "42");
    const rendered = bodyRows();
    // 9 rows fit under the header, plus up to 6 overscan on each side.
    expect(rendered.length).toBeLessThanOrEqual(25);
    expect(rendered[0]).toHaveAttribute("aria-rowindex", "2");

    const viewport = container.querySelector<HTMLElement>("[tabindex='0']")!;
    viewport.scrollTop = 44 * 5000;
    fireEvent.scroll(viewport);
    const after = bodyRows();
    expect(after.length).toBeLessThanOrEqual(25);
    expect(within(after[0]!).getByText(/^Row 4/)).toBeInTheDocument();
    expect(screen.getByText("Row 5000")).toBeInTheDocument();
    expect(screen.getByText("Row 5000").closest("tr")).toHaveAttribute("aria-rowindex", "5002");
  });

  it("virtualizes columns, keeps pinned ones and the header in place", () => {
    const { container } = wrap(
      <VirtualTable aria-label="Wide" data={rows.slice(0, 20)} columns={columns} getRowId={(r) => r.id} height={300} virtualizeColumns overscan={{ columns: 1 }} />,
    );
    const headers = () => screen.getAllByRole("columnheader").map((h) => h.textContent);
    // jsdom has no layout, so the measured width falls back to ~1600 px.
    expect(headers()).toContain("Name");
    expect(headers()).not.toContain("Col 39");
    const viewport = container.querySelector<HTMLElement>("[tabindex='0']")!;
    viewport.scrollLeft = 100 * 30;
    fireEvent.scroll(viewport);
    expect(headers()).toContain("Name");
    expect(headers()).toContain("Col 39");
    expect(headers()).not.toContain("Col 0");
    const cell = screen.getByText("r0:39").closest("td")!;
    expect(cell).toHaveAttribute("aria-colindex", "42");
  });

  it("selects rows, ranges with shift-click, and all rows from the header", async () => {
    const onSelectionChange = vi.fn();
    wrap(<VirtualTable aria-label="Pick" data={rows} columns={columns.slice(0, 2)} getRowId={(r) => r.id} height={440} selectable onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row r1" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["r1"]);
    const user = userEvent.setup();
    await user.keyboard("{Shift>}");
    await user.click(screen.getByRole("checkbox", { name: "Select row r4" }));
    await user.keyboard("{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["r1", "r2", "r3", "r4"]);
    expect(screen.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute("aria-checked", "mixed");
    await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    // Every row, not just the rendered ones.
    expect(onSelectionChange.mock.lastCall?.[0]).toHaveLength(10_000);
    expect(screen.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute("aria-checked", "true");
  });

  it("sorts client-side, scrolls to a row and loads more at the end", async () => {
    const api = createRef<VirtualTableApi>();
    const onEndReached = vi.fn();
    const { container } = wrap(
      <VirtualTable aria-label="Sorted" apiRef={api} data={rows} columns={columns.slice(0, 2)} getRowId={(r) => r.id} height={440} onEndReached={onEndReached} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Number/ }));
    expect(screen.getByRole("columnheader", { name: /Number/ })).toHaveAttribute("aria-sort", "ascending");
    expect(within(bodyRows()[0]!).getAllByRole("cell")[1]).toHaveTextContent(/^0$/);
    act(() => api.current?.scrollToRow(9_999, "end"));
    const viewport = container.querySelector<HTMLElement>("[tabindex='0']")!;
    expect(viewport.scrollTop).toBeGreaterThan(0);
    expect(within(bodyRows().at(-1)!).getAllByRole("cell")[1]).toHaveTextContent("9999");
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state and has no axe violations", async () => {
    const { baseElement, rerender } = wrap(<VirtualTable aria-label="People" data={[]} columns={columns.slice(0, 2)} getRowId={(r) => r.id} empty="Nobody here" selectable />);
    expect(screen.getByText("Nobody here")).toBeInTheDocument();
    rerender(
      <ThemeProvider>
        <VirtualTable aria-label="People" data={rows.slice(0, 50)} columns={columns.slice(0, 6)} getRowId={(r) => r.id} selectable virtualizeColumns />
      </ThemeProvider>,
    );
    expect(await axeViolations(baseElement)).toEqual([]);
  });
});
