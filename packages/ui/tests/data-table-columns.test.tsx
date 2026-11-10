import { fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, ThemeProvider, type DataTableColumn } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

interface Ship {
  id: string;
  name: string;
  port: string;
  teu: number;
}
const ships: Ship[] = [
  { id: "1", name: "Alvand", port: "Bandar Abbas", teu: 8000 },
  { id: "2", name: "Zagros", port: "Bushehr", teu: 4200 },
  { id: "3", name: "Damavand", port: "Bandar Abbas", teu: 13000 },
];
const columns: DataTableColumn<Ship>[] = [
  { id: "name", header: "Vessel", editable: true },
  { id: "port", header: "Port" },
  { id: "teu", header: "TEU", align: "end" },
];
const headers = () => screen.getAllByRole("columnheader").map((h) => h.textContent);

describe("DataTable column features", () => {
  it("reorders columns with the keyboard (mirrored in RTL) and announces it", async () => {
    const user = userEvent.setup();
    const onColumnOrderChange = vi.fn();
    render(
      <ThemeProvider dir="rtl">
        <DataTable data={ships} columns={columns} getRowId={(s) => s.id} reorderableColumns onColumnOrderChange={onColumnOrderChange} />
      </ThemeProvider>,
    );
    screen.getByRole("button", { name: "Move Vessel" }).focus();
    // In RTL, ArrowLeft moves toward the end.
    await user.keyboard("{ArrowLeft}");
    expect(onColumnOrderChange).toHaveBeenLastCalledWith(["port", "name", "teu"]);
    expect(headers()).toEqual(["Port", "Vessel", "TEU"]);
    expect(screen.getByText("Vessel, column 2 of 3")).toBeInTheDocument();
    // Cells follow their header.
    expect(within(screen.getAllByRole("row")[1] as HTMLElement).getAllByRole("cell")[0]).toHaveTextContent("Bandar Abbas");
  });

  it("reorders by dragging a header onto another", () => {
    render(<DataTable data={ships} columns={columns} getRowId={(s) => s.id} reorderableColumns />);
    const [vessel, , teu] = screen.getAllByRole("columnheader");
    const data = { effectAllowed: "", setData: vi.fn() };
    fireEvent.dragStart(vessel as HTMLElement, { dataTransfer: data });
    fireEvent.dragOver(teu as HTMLElement, { dataTransfer: data });
    fireEvent.drop(teu as HTMLElement, { dataTransfer: data });
    expect(headers()).toEqual(["Port", "TEU", "Vessel"]);
  });

  it("resizes a column from the keyboard, freezing every width into a fixed layout", async () => {
    const user = userEvent.setup();
    const onColumnWidthsChange = vi.fn();
    render(<DataTable data={ships} columns={columns} getRowId={(s) => s.id} resizableColumns onColumnWidthsChange={onColumnWidthsChange} />);
    const handle = screen.getByRole("separator", { name: "Resize Port" });
    handle.focus();
    await user.keyboard("{ArrowRight}{Shift>}{ArrowRight}{/Shift}");
    // jsdom has no layout, so unresized columns freeze at the 120px fallback.
    expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ name: 120, port: 180, teu: 120 });
    expect(handle).toHaveAttribute("aria-valuenow", "180");
    const table = screen.getByRole("table");
    expect(table).toHaveClass("table-fixed");
    expect(table).toHaveStyle({ width: "420px" });
    await user.keyboard("{ArrowLeft>20/}");
    expect(handle).toHaveAttribute("aria-valuenow", "48"); // the minimum
  });

  it("edits a cell in place and reports it", async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    const { container } = render(<DataTable data={ships} columns={columns} getRowId={(s) => s.id} onCellEdit={onCellEdit} />);
    // Only the editable column gets edit buttons.
    expect(screen.getAllByRole("button", { name: /Vessel/ })).toHaveLength(3);
    await user.click(screen.getAllByRole("button", { name: /Vessel/ })[1] as HTMLElement);
    const input = screen.getByRole("textbox", { name: "Vessel" });
    await user.clear(input);
    await user.type(input, "Zagros II{Enter}");
    expect(onCellEdit).toHaveBeenCalledWith(ships[1], "name", "Zagros II");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("groups rows under collapsible headers with counts", async () => {
    const user = userEvent.setup();
    render(<DataTable data={ships} columns={columns} getRowId={(s) => s.id} groupBy="port" />);
    const bandar = screen.getByRole("button", { name: "Bandar Abbas, 2 rows" });
    expect(bandar).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Bushehr, 1 row" })).toBeInTheDocument();
    expect(screen.getByText("Damavand")).toBeInTheDocument();
    await user.click(bandar);
    expect(bandar).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Damavand")).toBeNull();
    expect(screen.getByText("Zagros")).toBeInTheDocument();
  });
});
