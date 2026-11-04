import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModuleCard } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const Icon = () => <svg data-testid="icon" />;

describe("ModuleCard", () => {
  it("is one link named by its title and description, with decorative art hidden", async () => {
    const { container } = render(<ModuleCard href="/imports" tone="teal" icon={<Icon />} title="Imports" description="Manage import operations" />);
    const link = screen.getByRole("link", { name: /Imports.*Manage import operations/ });
    expect(link).toHaveAttribute("href", "/imports");
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
    // The wave and the arrow are decorative.
    expect(container.querySelectorAll("[aria-hidden]").length).toBeGreaterThanOrEqual(3);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("is a button with onClick, and static without either", () => {
    const onClick = vi.fn();
    const { container } = render(
      <>
        <ModuleCard onClick={onClick} title="Reports" />
        <ModuleCard title="Settings" data-testid="static" />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reports" }));
    expect(onClick).toHaveBeenCalledOnce();
    const stat = screen.getByTestId("static");
    expect(stat.tagName).toBe("DIV");
    // A static card has no arrow: only the wave is decorative.
    expect(stat.querySelectorAll("[aria-hidden]")).toHaveLength(1);
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("drops the link when disabled", () => {
    render(<ModuleCard href="/customs" disabled title="Customs" />);
    const card = screen.getByText("Customs").closest("a")!;
    expect(card).not.toHaveAttribute("href");
    expect(card).toHaveAttribute("aria-disabled", "true");
  });

  it("sets its tone as CSS variables, following the theme for primary", () => {
    render(
      <>
        <ModuleCard title="Violet" tone="violet" data-testid="violet" />
        <ModuleCard title="Primary" data-testid="primary" />
      </>,
    );
    expect(screen.getByTestId("violet").style.getPropertyValue("--mc-accent")).toMatch(/^light-dark\(#/);
    expect(screen.getByTestId("primary").style.getPropertyValue("--mc-accent")).toBe("var(--nv-color-primary-text)");
  });

  it("shows a badge and keeps the title clear of it", () => {
    render(<ModuleCard title="Documents" badge="12" />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Documents").parentElement).toHaveClass("pe-10");
  });

  it("draws a seeded wave: the same seed gives the same hills, another seed new ones, false none", () => {
    const { container } = render(
      <>
        <ModuleCard title="Imports" data-testid="a" />
        <ModuleCard title="Imports" data-testid="b" />
        <ModuleCard title="Exports" data-testid="c" />
        <ModuleCard title="Exports" wave={7} data-testid="d" />
        <ModuleCard title="Plain" wave={false} data-testid="e" />
      </>,
    );
    const paths = (id: string) => [...container.querySelectorAll(`[data-testid=${id}] svg path`)].map((p) => p.getAttribute("d"));
    expect(paths("a")).toHaveLength(2);
    expect(paths("a")).toEqual(paths("b"));
    expect(paths("c")).not.toEqual(paths("a"));
    expect(paths("d")).not.toEqual(paths("c"));
    expect(paths("e")).toHaveLength(0);
    // Each layer rises from the start edge and lands on the bottom edge part-way across, with one or two crests.
    const [back, front] = paths("c");
    const end = (d: string | null | undefined) => Number(/ ([\d.]+) 120Z$/.exec(d ?? "")?.[1]);
    for (const d of [back, front]) {
      expect(d).toMatch(/^M0 120L0 [\d.]+C/);
      expect(d).toMatch(/ 120Z$/);
      expect((d?.match(/C/g) ?? []).length).toBeGreaterThanOrEqual(2);
      expect((d?.match(/C/g) ?? []).length).toBeLessThanOrEqual(4);
    }
    expect(end(back)).toBeGreaterThanOrEqual(240 * 0.62);
    expect(end(back)).toBeLessThanOrEqual(240 * 0.88);
    expect(end(front)).toBeGreaterThanOrEqual(240 * 0.45);
    expect(end(front)).toBeLessThanOrEqual(240 * 0.72);
  });

  it("opens new-tab links safely", () => {
    render(<ModuleCard href="https://example.com" target="_blank" title="Portal" />);
    expect(screen.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
  });
});
