import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TreeSelect } from "../src/experimental.ts";
import { FormField, ThemeProvider, TreeView, type TreeItem } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const ports: TreeItem[] = [
  {
    id: "south",
    label: "Persian Gulf",
    children: [
      { id: "bandar", label: "Bandar Abbas" },
      { id: "bushehr", label: "Bushehr" },
      { id: "kish", label: "Kish", disabled: true },
    ],
  },
  {
    id: "north",
    label: "Caspian",
    children: [
      { id: "anzali", label: "Anzali" },
      { id: "amirabad", label: "Amirabad" },
    ],
  },
  { id: "chabahar", label: "Chabahar" },
];

describe("TreeView checkable", () => {
  it("checks leaves, derives branch state and skips disabled leaves", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<TreeView label="Ports" items={ports} checkable defaultExpanded={["south"]} onCheckedIdsChange={onChange} />);
    expect(screen.getByRole("tree")).toHaveAttribute("aria-multiselectable", "true");
    const gulf = screen.getByRole("treeitem", { name: /Persian Gulf/ });
    expect(gulf).toHaveAttribute("aria-checked", "false");

    await user.click(screen.getByText("Bandar Abbas"));
    expect(onChange).toHaveBeenLastCalledWith(["bandar"]);
    expect(gulf).toHaveAttribute("aria-checked", "mixed");

    // Space on the branch checks every enabled leaf under it.
    gulf.focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith(["bandar", "bushehr"]);
    expect(gulf).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("treeitem", { name: "Kish" })).toHaveAttribute("aria-checked", "false");

    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("TreeSelect", () => {
  it("picks a leaf, opening branches instead of picking them, and submits it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <TreeSelect aria-label="Port" items={ports} name="port" onValueChange={onValueChange} />
      </form>,
    );
    const trigger = screen.getByRole("combobox", { name: "Port" });
    await user.click(trigger);
    const tree = screen.getByRole("tree", { name: "Port" });
    await user.click(within(tree).getByText("Caspian"));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(within(tree).getByText("Anzali"));
    expect(onValueChange).toHaveBeenCalledWith("anzali");
    expect(screen.queryByRole("tree")).toBeNull();
    expect(trigger).toHaveTextContent("Anzali");
    expect(container.querySelector<HTMLInputElement>('input[name="port"]')?.value).toBe("anzali");
  });

  it("filters with the search box, keeping ancestors, and moves into the tree with Down", async () => {
    const user = userEvent.setup();
    render(<TreeSelect aria-label="Port" items={ports} />);
    await user.click(screen.getByRole("combobox", { name: "Port" }));
    const search = screen.getByRole("searchbox", { name: "Search…" });
    expect(search).toHaveFocus();
    await user.keyboard("bush");
    const tree = screen.getByRole("tree");
    expect(within(tree).getAllByRole("treeitem").map((i) => i.getAttribute("aria-level") + ":" + i.firstElementChild?.textContent)).toEqual(["1:Persian Gulf", "2:Bushehr"]);
    await user.keyboard("{ArrowDown}");
    expect(within(tree).getByRole("treeitem", { name: /Persian Gulf/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("combobox")).toHaveTextContent("Bushehr");

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("zzz");
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("picks several with multiple and summarizes them on the trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ThemeProvider dir="rtl">
        <FormField label="Ports">
          <TreeSelect multiple items={ports} defaultValue={["chabahar"]} onValueChange={onValueChange} />
        </FormField>
      </ThemeProvider>,
    );
    const trigger = screen.getByRole("combobox", { name: "Ports" });
    expect(trigger).toHaveTextContent("Chabahar");
    await user.click(trigger);
    // Named by the field's label, not the placeholder.
    const tree = screen.getByRole("tree", { name: "Ports" });
    expect(tree).toHaveAttribute("aria-multiselectable", "true");
    await user.click(within(tree).getByText("Caspian")); // opens
    await user.click(within(tree).getByText("Anzali"));
    await user.click(within(tree).getByText("Amirabad"));
    expect(onValueChange).toHaveBeenLastCalledWith(["chabahar", "anzali", "amirabad"]);
    // Still open for more picks.
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Chabahar +2");
  });
});
