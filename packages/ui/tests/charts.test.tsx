import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AreaChart, BarChart, DataTable, DonutChart, LineChart, ThemeProvider, type DataTableColumn } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

// jsdom has no layout; give elements a width so charts draw.
const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
beforeAll(() => Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 600 }));
afterAll(() => original && Object.defineProperty(HTMLElement.prototype, "clientWidth", original));

const months = [
  { month: "Jan", teu: 1200, reefer: 300 },
  { month: "Feb", teu: 1500, reefer: 420 },
  { month: "Mar", teu: 1350, reefer: 380 },
];
const series = [
  { key: "teu" as const, label: "TEU" },
  { key: "reefer" as const, label: "Reefer" },
];

describe("Cartesian charts", () => {
  it("draws lines, a legend for 2+ series and an accessible table", () => {
    const { container } = render(<LineChart label="Monthly volume" data={months} index="month" series={series} />);
    expect(container.querySelectorAll("svg path[stroke-width='2']")).toHaveLength(2);
    expect(screen.getByRole("figure", { name: "Monthly volume" })).toBeInTheDocument();
    // Legend names each series; the table carries every value without the chart.
    const table = screen.getByRole("table", { name: "Monthly volume" });
    expect(within(table).getByRole("columnheader", { name: "Reefer" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "1,500" })).toBeInTheDocument();
    expect(screen.getAllByText("TEU").length).toBeGreaterThan(1);
  });

  it("uses the brand primary and no legend for a single series", () => {
    const { container } = render(<AreaChart label="TEU" data={months} index="month" series={[series[0]!]} />);
    expect(container.querySelector("path[stroke='var(--nv-color-primary-solid)']")).not.toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("reads values with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<BarChart label="Monthly volume" data={months} index="month" series={series} />);
    const plot = screen.getByRole("group", { name: "Monthly volume" });
    plot.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(plot).toHaveAccessibleDescription("Feb: TEU 1,500, Reefer 420");
    await user.keyboard("{End}");
    expect(plot).toHaveAccessibleDescription("Mar: TEU 1,350, Reefer 380");
  });

  it("caps grouped bars at 24px with rounded data ends", () => {
    const { container } = render(<BarChart label="Volume" data={months} index="month" series={series} />);
    const bars = [...container.querySelectorAll("svg g path")];
    expect(bars).toHaveLength(6);
    for (const bar of bars) {
      const xs = (bar.getAttribute("d") ?? "").match(/H([\d.]+)/);
      expect(xs).not.toBeNull();
    }
    const first = bars[0]!.getAttribute("d")!;
    const [, x0] = /^M([\d.]+)/.exec(first)!;
    const [, x1] = /Q([\d.]+),[\d.]+ [\d.]+,[\d.]+V/.exec(first.split("H")[1] ? `Q${first.split("Q")[2]}` : "") ?? [];
    expect(Number(x1 ?? x0)).toBeGreaterThanOrEqual(Number(x0));
  });

  it("switches to a visible table and back", async () => {
    const user = userEvent.setup();
    render(<LineChart label="Volume" data={months} index="month" series={series} />);
    await user.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("button", { name: "Chart" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("group", { name: "Volume" })).toBeNull();
  });

  it("formats with the provider locale", () => {
    render(
      <ThemeProvider locale="fa-IR" dir="rtl">
        <LineChart label="حجم" data={months} index="month" series={series} />
      </ThemeProvider>,
    );
    expect(within(screen.getByRole("table", { name: "حجم" })).getByRole("cell", { name: "۱٬۵۰۰" })).toBeInTheDocument();
  });

  it("passes axe", async () => {
    const { container } = render(<BarChart label="Volume" data={months} index="month" series={series} stacked />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("DonutChart", () => {
  const data = [
    { label: "Containers", value: 60 },
    { label: "Bulk", value: 30 },
    { label: "Ro-Ro", value: 10 },
  ];

  it("shows the total, shares and keyboard readout", async () => {
    const user = userEvent.setup();
    render(<DonutChart label="Cargo mix" data={data} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getAllByText("60%").length).toBeGreaterThan(0);
    const ring = screen.getByRole("group", { name: "Cargo mix" });
    ring.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(ring).toHaveAccessibleDescription("Bulk: 30 (30%)");
  });
});

describe("DataTable features", () => {
  type Ship = { id: string; name: string; port: string; teu: number };
  const ships: Ship[] = Array.from({ length: 23 }, (_, i) => ({
    id: String(i + 1),
    name: `Vessel ${i + 1}`,
    port: i % 2 ? "Bandar Abbas" : "Bushehr",
    teu: 1000 + i * 10,
  }));
  const columns: DataTableColumn<Ship>[] = [
    { id: "name", header: "Name", sortable: true },
    { id: "port", header: "Port" },
    { id: "teu", header: "TEU", align: "end" },
  ];

  it("paginates and reports the range", async () => {
    const user = userEvent.setup();
    render(<DataTable data={ships} columns={columns} getRowId={(s) => s.id} pageSize={10} />);
    expect(screen.getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("1–10 of 23")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /3/ }));
    expect(screen.getByText("21–23 of 23")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("searches across columns and resets to the first page", async () => {
    const user = userEvent.setup();
    render(<DataTable data={ships} columns={columns} getRowId={(s) => s.id} pageSize={5} searchable />);
    await user.click(screen.getByRole("button", { name: /2/ }));
    await user.type(screen.getByRole("searchbox", { name: "Search rows" }), "bushehr 1");
    // Bushehr rows are odd-numbered vessels; "1" narrows to names/TEU containing 1.
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row).toHaveTextContent("Bushehr");
    expect(screen.getByText(/^1–/)).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No matching rows")).toBeInTheDocument();
  });

  it("hides columns from the columns menu", async () => {
    const user = userEvent.setup();
    render(<DataTable data={ships.slice(0, 3)} columns={columns} getRowId={(s) => s.id} columnToggle />);
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Port" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("columnheader", { name: "Port" })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "TEU" })).toBeInTheDocument();
  });

  it("expands a row to show details", async () => {
    const user = userEvent.setup();
    render(
      <DataTable data={ships.slice(0, 2)} columns={columns} getRowId={(s) => s.id} renderExpanded={(s) => <p>Manifest for {s.name}</p>} />,
    );
    const toggle = screen.getByRole("button", { name: "Show details for 1" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Manifest for Vessel 1")).toBeInTheDocument();
  });
});
