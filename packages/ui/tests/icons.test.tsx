import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { iconCatalog, iconCategories } from "../src/icons/catalog.ts";
import { roundCorners } from "../src/icons/create-icon.ts";
import * as pack from "../src/icons/index.ts";
import { ContainerShip, createIcon, IconProvider } from "../src/icons/index.ts";
import { Icon } from "../src/index.ts";

const icons = Object.entries(pack).filter(([, value]) => typeof value === "object" && "iconName" in (value as object));

describe("Icon pack", () => {
  it("renders every icon on the 24px grid with 1.5px round strokes", () => {
    expect(icons.length).toBeGreaterThan(60);
    for (const [name, Glyph] of icons as [string, typeof ContainerShip][]) {
      const { container, unmount } = render(<Glyph />);
      const svg = container.querySelector("svg");
      expect(svg, name).not.toBeNull();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg).toHaveAttribute("stroke", "currentColor");
      expect(svg).toHaveAttribute("stroke-width", "1.5");
      expect(svg).toHaveAttribute("stroke-linecap", "round");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg?.querySelectorAll("path, circle, rect, ellipse").length, name).toBeGreaterThan(0);
      unmount();
    }
  });

  it("dims secondary parts in duotone and tints closed shapes in soft", () => {
    const { container, rerender } = render(<ContainerShip />);
    expect(container.querySelector("[opacity]")).toBeNull();
    rerender(<ContainerShip variant="duotone" />);
    expect(container.querySelectorAll("[opacity='0.5']").length).toBeGreaterThan(0);
    expect(container.querySelector("[fill-opacity]")).toBeNull();
    rerender(<ContainerShip variant="soft" />);
    expect(container.querySelector("[fill-opacity]")).toHaveAttribute("fill", "currentColor");
  });

  it("takes size, stroke and variant defaults from IconProvider", () => {
    const { container } = render(
      <IconProvider size={32} strokeWidth={2} variant="duotone">
        <ContainerShip />
      </IconProvider>,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("stroke-width", "2");
    expect(svg).toHaveAttribute("data-variant", "duotone");
  });

  it("is accessible when labelled, and works inside <Icon>", () => {
    render(<ContainerShip title="Container vessel" />);
    expect(screen.getByRole("img", { name: "Container vessel" })).toBeInTheDocument();
    render(<Icon icon={ContainerShip} label="Vessel" size="lg" />);
    expect(screen.getByRole("img", { name: "Vessel" })).toHaveClass("nv-icon-container-ship", "size-6");
  });

  it("createIcon builds custom icons with the same contract", () => {
    const Mooring = createIcon("mooring", [["path", { d: "M4 12h16" }, "s"]]);
    const { container } = render(<Mooring variant="duotone" />);
    expect(container.querySelector("svg")).toHaveClass("nv-icon", "nv-icon-mooring");
    expect(container.querySelector("path")).toHaveAttribute("opacity", "0.5");
  });

  it("rounds corners between straight segments and leaves curves and open ends alone", () => {
    expect(roundCorners("M4 4h10v10", 2)).toBe("M4 4L12 4Q14 4 14 6L14 14");
    // A closed square gets all four corners, including the one Z closes.
    expect(roundCorners("M4 4h10v10H4Z", 1)).toBe("M5 4L13 4Q14 4 14 5L14 13Q14 14 13 14L5 14Q4 14 4 13L4 5Q4 4 5 4Z");
    // Short sides cap the fillet at half their length; straight runs and arcs are untouched.
    expect(roundCorners("m5 12 1 1 1-1", 2)).toBe("M5 12L5.5 12.5Q6 13 6.5 12.5L7 12");
    expect(roundCorners("M2 12h10h10", 2)).toBe("M2 12L12 12L22 12");
    expect(roundCorners("M4 12a8 8 0 1 0 16 0", 2)).toBe("M4 12A8 8 0 1 0 20 12");
  });

  it("renders well-formed rounded path data for every icon", () => {
    for (const [name, Glyph] of icons as [string, typeof ContainerShip][]) {
      const { container, unmount } = render(<Glyph />);
      for (const path of container.querySelectorAll("path")) expect(path.getAttribute("d"), name).not.toMatch(/NaN|undefined/);
      unmount();
    }
    const Sharp = createIcon("sharp", [["path", { d: "m5 12 4 4 10-10" }]], { corner: 0 });
    const { container } = render(<Sharp />);
    expect(container.querySelector("path")).toHaveAttribute("d", "m5 12 4 4 10-10");
  });

  it("catalogs every icon exactly once, in a known category", () => {
    const names = iconCatalog.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    const categoryIds = new Set<string>(iconCategories.map((c) => c.id));
    for (const entry of iconCatalog) expect(categoryIds.has(entry.category), entry.name).toBe(true);
    for (const [name] of icons) expect(names, `${name} missing from catalog`).toContain(name);
  });
});
