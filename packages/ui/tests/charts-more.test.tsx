import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RadarChart, ScatterChart } from "../src/experimental.ts";
import { ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

// jsdom has no layout; give elements a width so charts draw.
const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
beforeAll(() => Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 600 }));
afterAll(() => original && Object.defineProperty(HTMLElement.prototype, "clientWidth", original));

const vessels = [
  { name: "Alvand", draft: 12.5, teu: 8000, dwt: 90_000, line: "Gulf" },
  { name: "Zagros", draft: 9.8, teu: 4200, dwt: 51_000, line: "Caspian" },
  { name: "Damavand", draft: 14.2, teu: 13_000, dwt: 140_000, line: "Gulf" },
];

const terminals = [
  { metric: "Throughput", bandar: 90, bushehr: 60 },
  { metric: "Berths", bandar: 70, bushehr: 40 },
  { metric: "Rail access", bandar: 50, bushehr: 80 },
  { metric: "Depth", bandar: 85, bushehr: 55 },
  { metric: "Storage", bandar: 65, bushehr: 75 },
];

describe("ScatterChart", () => {
  it("draws one point per row with a legend per group and a full table", async () => {
    const { container } = render(<ScatterChart label="Draft vs capacity" data={vessels} x="draft" y="teu" group="line" pointLabel="name" xLabel="Draft (m)" yLabel="TEU" />);
    expect(container.querySelectorAll("svg circle")).toHaveLength(3);
    expect(screen.getByRole("figure", { name: "Draft vs capacity" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Draft vs capacity" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["name", "line", "Draft (m)", "TEU"]);
    expect(within(table).getByRole("rowheader", { name: "Damavand" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "13,000" })).toBeInTheDocument();
    expect(screen.getAllByText("Caspian").length).toBeGreaterThan(1); // legend and table
    expect(await axeViolations(container)).toEqual([]);
  });

  it("steps through points in x order with the keyboard, mirrored in RTL", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider dir="rtl">
        <ScatterChart label="Draft vs capacity" data={vessels} x="draft" y="teu" pointLabel="name" />
      </ThemeProvider>,
    );
    const plot = screen.getByRole("group", { name: "Draft vs capacity" });
    plot.focus();
    // In RTL, ArrowLeft moves toward larger x: Zagros (9.8) first, then Alvand (12.5).
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(plot).toHaveAccessibleDescription(/^Alvand, draft 12\.5, teu 8,000$/);
    await user.keyboard("{End}");
    expect(plot).toHaveAccessibleDescription(/^Damavand/);
    // The largest x sits on the left in RTL.
    const circles = [...document.querySelectorAll("svg circle")].map((c) => Number(c.getAttribute("cx")));
    expect(circles[2]).toBeLessThan(circles[1] ?? 0);
  });

  it("sizes bubbles by area", () => {
    const { container } = render(<ScatterChart label="Fleet" data={vessels} x="draft" y="teu" size="dwt" />);
    const r = [...container.querySelectorAll("svg circle")].map((c) => Number(c.getAttribute("r")));
    expect(r[2]).toBeGreaterThan(r[0] ?? 0);
    expect(r[0]).toBeGreaterThan(r[1] ?? 0);
  });
});

describe("RadarChart", () => {
  it("draws a polygon per series over one spoke per row, with a table", async () => {
    const series = [
      { key: "bandar" as const, label: "Bandar Abbas" },
      { key: "bushehr" as const, label: "Bushehr" },
    ];
    const { container } = render(<RadarChart label="Terminal comparison" data={terminals} index="metric" series={series} />);
    expect(container.querySelectorAll("svg path[stroke-width='2']")).toHaveLength(2);
    expect(container.querySelectorAll("svg line")).toHaveLength(5);
    const table = screen.getByRole("table", { name: "Terminal comparison" });
    expect(within(table).getByRole("rowheader", { name: "Rail access" })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("walks the spokes with the arrow keys and wraps around", async () => {
    const user = userEvent.setup();
    render(<RadarChart label="Terminal" data={terminals} index="metric" series={[{ key: "bandar", label: "Bandar Abbas" }]} />);
    const plot = screen.getByRole("group", { name: "Terminal" });
    plot.focus();
    await user.keyboard("{ArrowRight}");
    expect(plot).toHaveAccessibleDescription("Throughput: Bandar Abbas 90");
    await user.keyboard("{ArrowLeft}");
    expect(plot).toHaveAccessibleDescription("Storage: Bandar Abbas 65");
  });

  it("mirrors the spokes in RTL", () => {
    const first = (dir: "ltr" | "rtl") => {
      const { container, unmount } = render(
        <ThemeProvider dir={dir}>
          <RadarChart label="T" data={terminals} index="metric" series={[{ key: "bandar", label: "B" }]} />
        </ThemeProvider>,
      );
      const x = Number(container.querySelectorAll("svg line")[1]?.getAttribute("x2"));
      unmount();
      return x;
    };
    // The second spoke goes right of center in LTR and left in RTL.
    expect(first("ltr")).toBeGreaterThan(300);
    expect(first("rtl")).toBeLessThan(300);
  });
});
