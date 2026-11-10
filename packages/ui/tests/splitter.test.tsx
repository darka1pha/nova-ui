import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Splitter } from "../src/experimental.ts";
import { ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const sizes = () => [...document.querySelectorAll("[data-panel-size]")].map((p) => Number(p.getAttribute("data-panel-size")));

const panes = [
  { id: "nav", label: "Folders", content: "Folders", defaultSize: 20, minSize: 15 },
  { id: "list", label: "Messages", content: "Messages", defaultSize: 30 },
  { id: "read", label: "Reading pane", content: "Reading pane" },
];

describe("Splitter", () => {
  it("lays out the panes with a named handle between each pair", async () => {
    const { container } = render(<Splitter panes={panes} />);
    expect(sizes()).toEqual([20, 30, 50]);
    expect(screen.getAllByRole("separator")).toHaveLength(2);
    expect(screen.getByRole("separator", { name: "Resize Folders" })).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize Messages" })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("resizes from the keyboard, mirrored in RTL, and reports the layout", async () => {
    const onLayout = vi.fn();
    render(
      <ThemeProvider dir="rtl">
        <Splitter panes={panes} keyboardStep={5} onLayout={onLayout} />
      </ThemeProvider>,
    );
    screen.getByRole("separator", { name: "Resize Folders" }).focus();
    // In RTL the first pane is on the right, so ArrowLeft grows it.
    await userEvent.keyboard("{ArrowLeft}");
    expect(sizes()).toEqual([25, 25, 50]);
    expect(onLayout).toHaveBeenLastCalledWith([25, 25, 50]);
  });

  it("stacks vertically", () => {
    render(<Splitter panes={panes.slice(0, 2)} direction="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });
});
