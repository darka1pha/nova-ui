import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider, TreeView, type TreeItem } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const ports: TreeItem[] = [
  {
    id: "bandar-abbas",
    label: "Bandar Abbas",
    badge: "3",
    children: [
      {
        id: "srp",
        label: "Shahid Rajaee",
        children: [
          { id: "berth-1", label: "Berth 1" },
          { id: "berth-2", label: "Berth 2" },
        ],
      },
      { id: "shahid-bahonar", label: "Shahid Bahonar" },
      { id: "closed", label: "Old jetty", disabled: true },
    ],
  },
  { id: "bushehr", label: "Bushehr", children: [{ id: "bushehr-1", label: "Container terminal" }] },
  { id: "chabahar", label: "Chabahar" },
];

const item = (name: string) => screen.getByRole("treeitem", { name: new RegExp(`^${name}`) });

describe("TreeView", () => {
  it("renders a labelled tree with one tab stop and collapsed branches", () => {
    render(<TreeView label="Ports" items={ports} />);
    expect(screen.getByRole("tree", { name: "Ports" })).toBeInTheDocument();
    expect(screen.getAllByRole("treeitem")).toHaveLength(3);
    expect(item("Bandar Abbas")).toHaveAttribute("aria-expanded", "false");
    expect(item("Chabahar")).not.toHaveAttribute("aria-expanded");
    expect(screen.getAllByRole("treeitem").filter((t) => t.tabIndex === 0)).toHaveLength(1);
  });

  it("follows the tree keyboard model", async () => {
    const user = userEvent.setup();
    render(<TreeView label="Ports" items={ports} />);
    item("Bandar Abbas").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("Bandar Abbas")).toHaveAttribute("aria-expanded", "true");
    expect(item("Shahid Rajaee")).toHaveAttribute("aria-level", "2");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(item("Shahid Rajaee"));
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(item("Berth 1"));
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(item("Shahid Rajaee"));
    await user.keyboard("{ArrowLeft}");
    expect(item("Shahid Rajaee")).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(item("Chabahar"));
    await user.keyboard("{Home}{ArrowDown}");
    expect(document.activeElement).toBe(item("Shahid Rajaee"));
  });

  it("selects with Enter/Space and click, skipping disabled items", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(<TreeView label="Ports" items={ports} defaultExpanded={["bandar-abbas"]} onSelectedChange={onSelectedChange} />);
    item("Shahid Bahonar").focus();
    await user.keyboard(" ");
    expect(onSelectedChange).toHaveBeenLastCalledWith("shahid-bahonar", expect.objectContaining({ label: "Shahid Bahonar" }));
    expect(item("Shahid Bahonar")).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByText("Old jetty"));
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText("Chabahar"));
    expect(item("Chabahar")).toHaveAttribute("aria-selected", "true");
  });

  it("expands every sibling with * and jumps by typing", async () => {
    const user = userEvent.setup();
    render(<TreeView label="Ports" items={ports} />);
    item("Bandar Abbas").focus();
    await user.keyboard("*");
    expect(item("Bandar Abbas")).toHaveAttribute("aria-expanded", "true");
    expect(item("Bushehr")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("co");
    expect(document.activeElement).toBe(item("Container terminal"));
  });

  it("cycles through matches when the same letter is pressed again", async () => {
    const user = userEvent.setup();
    render(<TreeView label="Ports" items={ports} />);
    item("Chabahar").focus();
    await user.keyboard("b");
    expect(document.activeElement).toBe(item("Bandar Abbas"));
    await user.keyboard("b");
    expect(document.activeElement).toBe(item("Bushehr"));
    // A real prefix narrows instead.
    await user.keyboard("{Home}");
    await new Promise((r) => setTimeout(r, 750));
    await user.keyboard("bu");
    expect(document.activeElement).toBe(item("Bushehr"));
  });

  it("mirrors Left/Right in RTL", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider dir="rtl">
        <TreeView label="بنادر" items={ports} />
      </ThemeProvider>,
    );
    item("Bandar Abbas").focus();
    await user.keyboard("{ArrowLeft}");
    expect(item("Bandar Abbas")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowRight}");
    expect(item("Bandar Abbas")).toHaveAttribute("aria-expanded", "false");
  });

  it("passes axe with branches open", async () => {
    const { container } = render(<TreeView label="Ports" items={ports} defaultExpanded={["bandar-abbas", "srp"]} defaultSelected="berth-2" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
