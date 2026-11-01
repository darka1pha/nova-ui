import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  CodeBlock,
  Countdown,
  ExpandableText,
  FileUploadList,
  formatFileSize,
  Gauge,
  Popconfirm,
  splitDuration,
  ThemeProvider,
  TransferList,
  type UploadItem,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe("CodeBlock", () => {
  const code = "const a = 1;\nconst b = 2;\n\nexport { a, b };\n";
  it("renders lines, numbers and highlights, and copies the raw code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = wrap(<CodeBlock code={code} language="ts" filename="values.ts" showLineNumbers highlightLines="2,4-4" />);
    expect(screen.getByRole("figure", { name: /values\.ts/ })).toBeInTheDocument();
    const lines = container.querySelectorAll("[data-line]");
    expect(lines).toHaveLength(4);
    expect([...lines].filter((l) => l.hasAttribute("data-highlighted")).map((l) => l.getAttribute("data-line"))).toEqual(["2", "4"]);
    expect(container.querySelector("pre")).toHaveAttribute("tabindex", "0");
    await userEvent.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(code);
  });

  it("uses renderLine for custom highlighting and has no axe violations", async () => {
    const { container } = wrap(<CodeBlock code={"a\nb"} renderLine={(line, n) => <mark>{`${n}:${line}`}</mark>} />);
    expect(container.querySelectorAll("mark")[1]).toHaveTextContent("2:b");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ExpandableText", () => {
  it("shows the toggle only when the text overflows", async () => {
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(200);
    const client = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(60);
    const { unmount } = wrap(<ExpandableText lines={2}>A long paragraph…</ExpandableText>);
    const toggle = screen.getByRole("button", { name: "Show more" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
    unmount();
    scroll.mockRestore();
    client.mockRestore();

    wrap(<ExpandableText>Short.</ExpandableText>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Popconfirm", () => {
  it("focuses Cancel for destructive actions and confirms asynchronously", async () => {
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    wrap(
      <Popconfirm title="Delete this file?" description="This cannot be undone." confirmLabel="Delete" onConfirm={onConfirm}>
        <Button>Delete</Button>
      </Popconfirm>,
    );
    const trigger = screen.getByRole("button", { name: "Delete" });
    await userEvent.click(trigger);
    const dialog = screen.getByRole("alertdialog", { name: "Delete this file?" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]!);
    expect(onConfirm).toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await act(async () => resolve());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("stays open with the error when confirm throws, and cancels with Escape", async () => {
    const onCancel = vi.fn();
    wrap(
      <Popconfirm title="Archive?" onConfirm={() => Promise.reject(new Error("Network error"))} onCancel={onCancel} tone="primary">
        <Button>Archive</Button>
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Archive" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Network error")).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription("Network error");
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});

describe("Countdown", () => {
  it("splits durations", () => {
    expect(splitDuration(((2 * 24 + 3) * 60 + 4) * 60_000 + 5_999)).toEqual({ day: 2, hour: 3, minute: 4, second: 5 });
  });

  it("ticks, labels at minute precision and completes once", () => {
    vi.useFakeTimers({ now: new Date("2026-10-29T10:00:00Z") });
    try {
      const onComplete = vi.fn();
      wrap(<Countdown to="2026-10-29T10:01:02Z" locale="en" onComplete={onComplete} completed="Started!" />);
      const timer = screen.getByRole("timer");
      expect(timer).toHaveAccessibleName("0 hours, 1 minute");
      expect(timer).toHaveTextContent("01minute02seconds");
      // Ticks land just after each second boundary.
      act(() => void vi.advanceTimersByTime(1100));
      expect(timer).toHaveTextContent("01minute01second");
      for (let i = 0; i < 62; i++) act(() => void vi.advanceTimersByTime(1000));
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(timer).toHaveAccessibleName("Started!");
      expect(timer).toHaveTextContent("Started!");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Gauge", () => {
  it("is a meter that clamps, formats and picks a band tone", async () => {
    const { container } = wrap(
      <Gauge
        aria-label="CPU usage"
        value={130}
        label="CPU"
        bands={[
          { upTo: 60, tone: "success" },
          { upTo: 85, tone: "warning" },
          { upTo: 100, tone: "danger" },
        ]}
      />,
    );
    const meter = screen.getByRole("meter", { name: "CPU usage" });
    expect(meter).toHaveAttribute("aria-valuenow", "100");
    expect(meter).toHaveAttribute("aria-valuetext", "100%");
    expect(container.querySelector(".stroke-danger")).toHaveAttribute("stroke-dasharray", "100 100");
    expect(await axeViolations(container)).toEqual([]);
  });
});

const people = [
  { value: "mina", label: "Mina" },
  { value: "arash", label: "Arash" },
  { value: "sara", label: "Sara", disabled: true },
  { value: "kian", label: "Kian" },
];

describe("TransferList", () => {
  it("moves checked items across, filters, announces and posts values", async () => {
    const onValueChange = vi.fn();
    const { container } = wrap(
      <form>
        <TransferList items={people} defaultValue={["kian"]} onValueChange={onValueChange} searchable name="members" />
      </form>,
    );
    const [available, selected] = screen.getAllByRole("group");
    expect(available).toHaveAccessibleName("Available");
    await userEvent.click(screen.getByRole("checkbox", { name: "Mina" }));
    expect(screen.getByText("1 of 3 checked")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add checked" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["kian", "mina"]);
    expect(screen.getByText("1 moved to selected.")).toBeInTheDocument();
    expect(selected).toHaveTextContent("Mina");

    await userEvent.type(screen.getByRole("searchbox", { name: "Search available" }), "ash");
    expect(screen.queryByRole("checkbox", { name: "Sara" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Arash" })).toBeInTheDocument();

    // "Add all" skips disabled items (Sara).
    await userEvent.click(screen.getByRole("button", { name: "Add all" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["kian", "mina", "arash"]);
    expect([...new FormData(container.querySelector("form")!).getAll("members")]).toEqual(["kian", "mina", "arash"]);
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<TransferList items={people} searchable />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("FileUploadList", () => {
  it("formats sizes", () => {
    expect(formatFileSize(512, "en")).toBe("512 byte");
    expect(formatFileSize(1536, "en")).toBe("1.5 kB");
    expect(formatFileSize(5 * 1024 ** 2, "en")).toBe("5 MB");
  });

  it("shows progress and status, wires actions and announces results", async () => {
    const onCancel = vi.fn();
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    function Uploads() {
      const [items, setItems] = useState<UploadItem[]>([
        { id: "1", name: "report.pdf", size: 1536, type: "application/pdf", status: "uploading", progress: 40 },
        { id: "2", name: "photo.png", size: 2048, type: "image/png", status: "error", error: "Too large" },
      ]);
      return (
        <>
          <FileUploadList items={items} onCancel={onCancel} onRetry={onRetry} onRemove={onRemove} />
          <button type="button" onClick={() => setItems((list) => list.map((i) => (i.id === "1" ? { ...i, status: "done" } : i)))}>
            finish
          </button>
        </>
      );
    }
    const { container } = wrap(<Uploads />);
    expect(screen.getByRole("progressbar", { name: "Uploading report.pdf" })).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByText("Too large")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel upload of report.pdf" }));
    await userEvent.click(screen.getByRole("button", { name: "Retry photo.png" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove photo.png" }));
    expect([onCancel.mock.calls[0], onRetry.mock.calls[0], onRemove.mock.calls[0]]).toEqual([["1"], ["2"], ["2"]]);
    await userEvent.click(screen.getByRole("button", { name: "finish" }));
    expect(screen.getByText("report.pdf uploaded.")).toBeInTheDocument();
    expect(screen.getByText("Uploaded")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});
