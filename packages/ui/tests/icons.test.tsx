import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { iconCatalog, iconCategories } from "../src/icons/catalog.ts";
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

  it("catalogs every icon exactly once, in a known category", () => {
    const names = iconCatalog.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    const categoryIds = new Set<string>(iconCategories.map((c) => c.id));
    for (const entry of iconCatalog) expect(categoryIds.has(entry.category), entry.name).toBe(true);
    for (const [name] of icons) expect(names, `${name} missing from catalog`).toContain(name);
  });
});
