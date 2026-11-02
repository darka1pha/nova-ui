import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DateTimePicker, FormField, InfiniteScroll, KanbanBoard, Masonry, MultiSelect, SignaturePad, ThemeProvider, Toaster, type KanbanColumn } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) => render(<ThemeProvider {...props}>{ui}</ThemeProvider>);

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

describe("MultiSelect", () => {
  it("adds and removes values as chips and submits each one", async () => {
    const onValueChange = vi.fn();
    const { container } = wrap(
      <form>
        <FormField label="Fruit">
          <MultiSelect options={fruits} name="fruit" onValueChange={onValueChange} />
        </FormField>
      </form>,
    );
    const field = screen.getByRole("combobox", { name: "Fruit" });
    await userEvent.click(field);
    await userEvent.click(screen.getByRole("option", { name: "Apple" }));
    await userEvent.click(screen.getByRole("option", { name: "Cherry" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["apple", "cherry"]);
    // The list stays open for more choices, and chosen rows say so.
    expect(screen.getByRole("option", { name: /Apple, selected/ })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect([...container.querySelectorAll<HTMLInputElement>('input[name="fruit"]')].map((i) => i.value)).toEqual(["apple", "cherry"]);
    await userEvent.click(screen.getByRole("button", { name: "Remove Apple" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["cherry"]);
    field.focus();
    await userEvent.keyboard("{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("creates options and respects max", async () => {
    const onCreate = vi.fn((q: string) => ({ value: q.toLowerCase(), label: q }));
    wrap(<MultiSelect aria-label="Tags" options={fruits} defaultValue={["apple"]} max={2} onCreate={onCreate} />);
    await userEvent.click(screen.getByRole("combobox", { name: "Tags" }));
    await userEvent.keyboard("Mango");
    await userEvent.click(screen.getByRole("option", { name: "Create “Mango”" }));
    expect(onCreate).toHaveBeenCalledWith("Mango");
    expect(screen.getByRole("button", { name: "Remove Mango" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("You can choose up to 2.");
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-disabled", "true");
  });

  it("has no axe violations", async () => {
    const { container } = wrap(
      <FormField label="Fruit">
        <MultiSelect options={fruits} defaultValue={["banana"]} />
      </FormField>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("DateTimePicker", () => {
  it("combines the picked day with the default time and submits local ISO", async () => {
    const onValueChange = vi.fn();
    const { container } = wrap(
      <FormField label="Starts">
        <DateTimePicker name="starts" defaultValue={new Date(2026, 5, 15, 14, 30)} onValueChange={onValueChange} locale="en-US" />
      </FormField>,
    );
    expect(container.querySelector<HTMLInputElement>('input[name="starts"]')?.value).toBe("2026-06-15T14:30");
    await userEvent.click(screen.getByRole("combobox", { name: "Starts" }));
    await userEvent.click(screen.getByRole("button", { name: /June 20, 2026/ }));
    // Picking a day keeps the time already chosen.
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 20, 14, 30));
    // The popover stays open for the time until Done.
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Starts" })).toHaveTextContent(/Jun 20, 2026/);
  });

  it("uses defaultTime for a fresh value and clamps to max", async () => {
    // Only Date is faked, so the calendar opens on June 2026 while user-event's timers stay real.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 1));
    const onValueChange = vi.fn();
    wrap(<DateTimePicker aria-label="When" defaultTime="18:00" max={new Date(2026, 5, 20, 12, 0)} onValueChange={onValueChange} locale="en-US" clearable />);
    await userEvent.click(screen.getByRole("combobox", { name: "When" }));
    await userEvent.click(screen.getByRole("button", { name: /June 10, 2026/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 10, 18, 0));
    await userEvent.click(screen.getByRole("button", { name: /June 20, 2026/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 20, 12, 0));
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Clear date and time" }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    vi.useRealTimers();
  });
});

interface Card {
  id: string;
  title: string;
}

function Board({ onMove }: { onMove?: (cols: KanbanColumn<Card>[]) => void }) {
  const [columns, setColumns] = useState<KanbanColumn<Card>[]>([
    { id: "todo", title: "To do", items: [{ id: "a", title: "Write spec" }, { id: "b", title: "Design" }] },
    { id: "doing", title: "Doing", items: [{ id: "c", title: "Build" }], limit: 1 },
    { id: "done", title: "Done", items: [] },
  ]);
  return (
    <KanbanBoard
      aria-label="Sprint"
      columns={columns}
      getKey={(c) => c.id}
      getLabel={(c) => c.title}
      onMove={(next) => {
        setColumns(next);
        onMove?.(next);
      }}
      renderItem={(c) => c.title}
    />
  );
}

const titles = (col: HTMLElement) => within(col).queryAllByRole("listitem").map((li) => li.textContent);

describe("KanbanBoard", () => {
  it("moves a card across columns with the keyboard and announces it", async () => {
    const onMove = vi.fn();
    wrap(<Board onMove={onMove} />);
    screen.getByRole("button", { name: "Move Write spec" }).focus();
    await userEvent.keyboard(" ");
    expect(screen.getByText(/Picked up Write spec in To do/)).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    expect(screen.getByText("Write spec moved to Doing, position 2 of 2.")).toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(onMove).toHaveBeenCalledOnce();
    const doing = screen.getByRole("region", { name: "Doing" });
    expect(titles(doing)).toEqual(["Build", "Write spec"]);
    // Over its WIP limit, the count shows "2 / 1".
    expect(within(doing).getByText("2 / 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Write spec" })).toHaveFocus();
  });

  it("cancels with Escape and mirrors arrows in RTL", async () => {
    const onMove = vi.fn();
    wrap(<Board onMove={onMove} />, { dir: "rtl" });
    screen.getByRole("button", { name: "Move Build" }).focus();
    await userEvent.keyboard(" {ArrowLeft}");
    expect(titles(screen.getByRole("region", { name: "Done" }))).toEqual(["Build"]);
    await userEvent.keyboard("{Escape}");
    expect(onMove).not.toHaveBeenCalled();
    expect(titles(screen.getByRole("region", { name: "Doing" }))).toEqual(["Build"]);
    expect(screen.getByText("Move cancelled. Build is back where it started.")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<Board />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Masonry", () => {
  it("keeps children in source order", () => {
    wrap(
      <Masonry columns={3}>
        {["one", "two", "three", "four"].map((t) => (
          <p key={t}>{t}</p>
        ))}
      </Masonry>,
    );
    expect(screen.getAllByText(/one|two|three|four/).map((p) => p.textContent)).toEqual(["one", "two", "three", "four"]);
  });

  it("renders as a grid on the server", () => {
    const html = renderToString(
      <Masonry columns={{ base: 2 }}>
        <p>a</p>
        <p>b</p>
      </Masonry>,
    );
    expect(html).toContain("grid-template-columns:repeat(2, minmax(0, 1fr))");
  });
});

describe("InfiniteScroll", () => {
  it("falls back to a Load more button and shows the end", async () => {
    const onLoadMore = vi.fn();
    const { rerender } = wrap(
      <InfiniteScroll onLoadMore={onLoadMore} hasMore>
        <p>row</p>
      </InfiniteScroll>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    rerender(
      <ThemeProvider>
        <InfiniteScroll onLoadMore={onLoadMore} hasMore loading>
          <p>row</p>
        </InfiniteScroll>
      </ThemeProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading more…");
    rerender(
      <ThemeProvider>
        <InfiniteScroll onLoadMore={onLoadMore} hasMore={false}>
          <p>row</p>
        </InfiniteScroll>
      </ThemeProvider>,
    );
    expect(screen.getByText("You've reached the end.")).toBeInTheDocument();
  });

  it("loads when the end intersects, up to autoLoadPages", () => {
    let fire: (hit: boolean) => void = () => {};
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        fire = (hit) => cb([{ isIntersecting: hit } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
    try {
      const onLoadMore = vi.fn();
      wrap(
        <InfiniteScroll onLoadMore={onLoadMore} hasMore autoLoadPages={1}>
          <p>row</p>
        </InfiniteScroll>,
      );
      expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
      act(() => fire(true));
      expect(onLoadMore).toHaveBeenCalledOnce();
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });
});

describe("SignaturePad", () => {
  it("offers a typed alternative and submits the image", async () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <FormField label="Signature">
        <SignaturePad name="sig" onChange={onChange} />
      </FormField>,
    );
    expect(screen.getByRole("img", { name: "Signature" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Type instead" }));
    await userEvent.type(screen.getByLabelText("Type your full name"), "Ada");
    // jsdom has no canvas, so there's no image, but the typed name counts as signed.
    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
    expect(container.querySelector('input[name="sig"]')).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Draw instead" }));
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("records strokes from the pointer", () => {
    wrap(<SignaturePad />);
    const pad = screen.getByRole("img", { name: "Signature" });
    fireEvent.pointerDown(pad, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(pad, { clientX: 40, clientY: 20 });
    fireEvent.pointerUp(pad);
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = wrap(
      <FormField label="Signature">
        <SignaturePad />
      </FormField>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("server rendering", () => {
  it("hydrates the new components and Toaster without errors", async () => {
    const ui = (
      <ThemeProvider>
        <Masonry columns={2}>
          <p>a</p>
          <p>b</p>
        </Masonry>
        <MultiSelect aria-label="Tags" options={fruits} defaultValue={["apple"]} />
        <DateTimePicker aria-label="When" />
        <InfiniteScroll onLoadMore={() => {}} hasMore>
          <p>row</p>
        </InfiniteScroll>
        <SignaturePad />
        <Board />
        <Toaster />
      </ThemeProvider>
    );
    const host = document.createElement("div");
    host.innerHTML = renderToString(ui);
    document.body.append(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () => {
        hydrateRoot(host, ui);
      });
      expect(errors.mock.calls.map((c) => String(c[0]))).toEqual([]);
    } finally {
      errors.mockRestore();
      host.remove();
    }
  });
});
