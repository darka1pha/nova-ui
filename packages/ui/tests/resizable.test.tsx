import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

function Layout(props: { onLayout?: (s: number[]) => void; autoSaveId?: string }) {
  return (
    <ResizablePanelGroup {...props} style={{ width: 1000 }}>
      <ResizablePanel aria-label="Vessels" defaultSize={30} minSize={20} maxSize={50} collapsible>
        Vessels
      </ResizablePanel>
      <ResizableHandle withGrip />
      <ResizablePanel aria-label="Details">Details</ResizablePanel>
    </ResizablePanelGroup>
  );
}

const sizes = () => [...document.querySelectorAll("[data-panel-size]")].map((p) => Number(p.getAttribute("data-panel-size")));

/** jsdom has no layout: give the group a 1000px width so drags convert to %. */
function withWidth(width = 1000) {
  const group = document.querySelector<HTMLElement>("[data-direction]");
  if (group) group.getBoundingClientRect = () => ({ left: 0, top: 0, right: width, bottom: 400, width, height: 400, x: 0, y: 0, toJSON: () => ({}) });
}

afterEach(() => window.localStorage.clear());

describe("Resizable panels", () => {
  it("splits defaults and shares the rest, exposing an accessible separator", () => {
    render(<Layout />);
    expect(sizes()).toEqual([30, 70]);
    const handle = screen.getByRole("separator", { name: "Resize Vessels" });
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "30");
    expect(handle).toHaveAttribute("aria-valuemax", "50");
    expect(handle).toHaveAttribute("aria-controls", document.querySelector("[data-panel-size]")?.id);
  });

  it("resizes with the keyboard and respects min/max", async () => {
    const user = userEvent.setup();
    const onLayout = vi.fn();
    render(<Layout onLayout={onLayout} />);
    screen.getByRole("separator").focus();
    await user.keyboard("{ArrowRight}");
    expect(sizes()).toEqual([32, 68]);
    await user.keyboard("{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}");
    expect(sizes()).toEqual([50, 50]);
    expect(onLayout).toHaveBeenLastCalledWith([50, 50]);
    await user.keyboard("{Home}");
    // Collapsible: Home closes it entirely.
    expect(sizes()).toEqual([0, 100]);
    await user.keyboard("{End}");
    expect(sizes()).toEqual([50, 50]);
  });

  it("drags by pointer, clamps, and snaps a collapsible panel shut", () => {
    render(<Layout />);
    withWidth();
    const handle = screen.getByRole("separator");
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    expect(sizes()).toEqual([40, 60]);
    fireEvent.pointerMove(handle, { clientX: 900, pointerId: 1 });
    expect(sizes()).toEqual([50, 50]);
    // Below half of minSize (10%) it snaps shut; between 10 and 20 it holds at the minimum.
    fireEvent.pointerMove(handle, { clientX: 150, pointerId: 1 });
    expect(sizes()).toEqual([20, 80]);
    fireEvent.pointerMove(handle, { clientX: 50, pointerId: 1 });
    expect(sizes()).toEqual([0, 100]);
    expect(document.querySelector("[data-collapsed]")).not.toBeNull();
    fireEvent.pointerUp(handle, { pointerId: 1 });
  });

  it("expands a panel collapsed by dragging back to its size before the drag", async () => {
    const user = userEvent.setup();
    render(<Layout />);
    withWidth();
    const handle = screen.getByRole("separator");
    handle.focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(sizes()).toEqual([40, 60]);
    // Drag all the way down: it passes the 20% minimum, then snaps shut.
    fireEvent.pointerDown(handle, { button: 0, clientX: 400, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 20, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(sizes()).toEqual([0, 100]);
    await user.keyboard("{Enter}");
    expect(sizes()).toEqual([40, 60]);
  });

  it("toggles collapse with Enter and restores the previous size", async () => {
    const user = userEvent.setup();
    render(<Layout />);
    screen.getByRole("separator").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(sizes()).toEqual([34, 66]);
    await user.keyboard("{Enter}");
    expect(sizes()).toEqual([0, 100]);
    await user.keyboard("{Enter}");
    expect(sizes()).toEqual([34, 66]);
  });

  it("mirrors horizontal drag and arrows in RTL", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider dir="rtl">
        <Layout />
      </ThemeProvider>,
    );
    withWidth();
    const handle = screen.getByRole("separator");
    // The first panel sits on the right: moving left grows it.
    fireEvent.pointerDown(handle, { button: 0, clientX: 700, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 600, pointerId: 1 });
    expect(sizes()).toEqual([40, 60]);
    fireEvent.pointerUp(handle, { pointerId: 1 });
    handle.focus();
    await user.keyboard("{ArrowLeft}");
    expect(sizes()).toEqual([42, 58]);
  });

  it("remembers the layout with autoSaveId", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Layout autoSaveId="ops" />);
    screen.getByRole("separator").focus();
    await user.keyboard("{ArrowRight}");
    unmount();
    render(<Layout autoSaveId="ops" />);
    expect(sizes()).toEqual([32, 68]);
  });

  it("supports vertical groups and passes axe", async () => {
    const { container } = render(
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel aria-label="Map">Map</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel aria-label="Log">Log</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(sizes()).toEqual([50, 50]);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
    expect(await axeViolations(container)).toEqual([]);
  });
});
