import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InlineEdit, SortableList, ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

function Editable({ onSave, ...props }: { onSave?: (v: string) => unknown } & Partial<React.ComponentProps<typeof InlineEdit>>) {
  const [value, setValue] = useState("Apollo");
  return (
    <InlineEdit
      label="Project name"
      value={value}
      onSave={async (next) => {
        const result = await onSave?.(next);
        if (typeof result !== "string") setValue(next);
        return result;
      }}
      {...props}
    />
  );
}

describe("InlineEdit", () => {
  it("edits on click, saves on Enter and returns focus", async () => {
    const onSave = vi.fn();
    wrap(<Editable onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Project name: Apollo" }));
    const input = screen.getByRole("textbox", { name: "Project name" });
    expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.type(input, "Gemini{Enter}");
    expect(onSave).toHaveBeenCalledWith("Gemini");
    const button = await screen.findByRole("button", { name: "Edit Project name: Gemini" });
    expect(button).toHaveFocus();
  });

  it("cancels with Escape", async () => {
    const onSave = vi.fn();
    wrap(<Editable onSave={onSave} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(screen.getByRole("textbox"), "-x{Escape}");
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Apollo$/ })).toHaveFocus();
  });

  it("keeps editing with a message when validation or the save fails", async () => {
    wrap(<Editable validate={(v) => (v.trim() ? undefined : "Name is required")} onSave={(v) => (v === "taken" ? "That name is taken" : undefined)} />);
    await userEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(input, "taken{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("That name is taken");
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("saves on blur, and shows a spinner while an async save runs", async () => {
    let resolve!: () => void;
    const onSave = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    wrap(
      <>
        <Editable onSave={onSave} />
        <button type="button">Elsewhere</button>
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: /Apollo/ }));
    await userEvent.type(screen.getByRole("textbox"), "!");
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(onSave).toHaveBeenCalledWith("Apollo!");
    expect(screen.getByRole("status")).toHaveTextContent("Saving");
    await act(async () => resolve());
    expect(await screen.findByRole("button", { name: /Apollo!/ })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<Editable />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

const fruits = [
  { id: "a", name: "Apple" },
  { id: "b", name: "Banana" },
  { id: "c", name: "Cherry" },
];

function Fruits({ onReorder }: { onReorder?: (items: typeof fruits, move: { from: number; to: number }) => void }) {
  const [items, setItems] = useState(fruits);
  return (
    <SortableList
      aria-label="Fruits"
      items={items}
      getKey={(f) => f.id}
      getLabel={(f) => f.name}
      onReorder={(next, move) => {
        setItems(next);
        onReorder?.(next, move);
      }}
      renderItem={(f) => f.name}
    />
  );
}

const order = () => screen.getAllByRole("listitem").map((li) => li.textContent);

describe("SortableList", () => {
  it("reorders with the keyboard and announces each step", async () => {
    const onReorder = vi.fn();
    wrap(<Fruits onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reorder Apple" });
    handle.focus();
    await userEvent.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Picked up Apple\. Position 1 of 3/)).toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(order()).toEqual(["Banana", "Cherry", "Apple"]);
    expect(screen.getByRole("button", { name: "Reorder Apple" })).toHaveFocus();
    expect(screen.getByText("Apple moved to position 3 of 3.")).toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(onReorder).toHaveBeenCalledWith([fruits[1], fruits[2], fruits[0]], { from: 0, to: 2 });
    expect(screen.getByText("Apple dropped at position 3 of 3.")).toBeInTheDocument();
  });

  it("restores the order on Escape", async () => {
    const onReorder = vi.fn();
    wrap(<Fruits onReorder={onReorder} />);
    screen.getByRole("button", { name: "Reorder Cherry" }).focus();
    await userEvent.keyboard(" {Home}");
    expect(order()).toEqual(["Cherry", "Apple", "Banana"]);
    await userEvent.keyboard("{Escape}");
    expect(order()).toEqual(["Apple", "Banana", "Cherry"]);
    expect(onReorder).not.toHaveBeenCalled();
    expect(screen.getByText(/Reorder cancelled/)).toBeInTheDocument();
  });

  it("reorders by dragging the handle", async () => {
    const onReorder = vi.fn();
    wrap(<Fruits onReorder={onReorder} />);
    // jsdom has no layout: give each row a 40px slot.
    screen.getAllByRole("listitem").forEach((li, i) => {
      li.getBoundingClientRect = () => ({ top: i * 40, height: 40, bottom: i * 40 + 40, left: 0, right: 200, width: 200, x: 0, y: i * 40, toJSON: () => ({}) });
    });
    const handle = screen.getByRole("button", { name: "Reorder Apple" });
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 20 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 70 });
    expect(order()).toEqual(["Banana", "Apple", "Cherry"]);
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 70 });
    await waitFor(() => expect(onReorder).toHaveBeenCalledWith([fruits[1], fruits[0], fruits[2]], { from: 0, to: 1 }));
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<Fruits />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
