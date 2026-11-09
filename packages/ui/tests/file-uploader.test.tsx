import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileUploader, ThemeProvider, type UploadContext } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);
const file = (name: string, type = "text/plain") => new File(["x".repeat(10)], name, { type });

/** An upload whose outcome each test settles by hand. */
function controllable() {
  const calls: { file: File; ctx: UploadContext; resolve: (v?: unknown) => void; reject: (e: unknown) => void }[] = [];
  const upload = vi.fn(
    (f: File, ctx: UploadContext) =>
      new Promise((resolve, reject) => {
        calls.push({ file: f, ctx, resolve, reject });
      }),
  );
  return { upload, calls };
}

const pick = (files: File[]) => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("no file input");
  fireEvent.change(input, { target: { files } });
};

describe("FileUploader", () => {
  it("uploads picked files with progress and a concurrency limit", async () => {
    const { upload, calls } = controllable();
    const onUploaded = vi.fn();
    wrap(<FileUploader upload={upload} concurrency={2} onUploaded={onUploaded} />);
    pick([file("a.txt"), file("b.txt"), file("c.txt")]);
    const list = await screen.findByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
    expect(within(list).getByText("Waiting…")).toBeInTheDocument();

    act(() => calls[0]!.ctx.onProgress(40));
    expect(screen.getByRole("progressbar", { name: "Uploading a.txt" })).toHaveAttribute("aria-valuenow", "40");

    await act(async () => calls[0]!.resolve({ url: "/a" }));
    // The finished slot starts the queued file.
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(3));
    expect(upload.mock.calls[2]![0].name).toBe("c.txt");
    expect(onUploaded).toHaveBeenCalledWith(expect.objectContaining({ name: "a.txt", status: "done" }), expect.any(File), { url: "/a" });
    expect(within(list).getByText("Uploaded")).toBeInTheDocument();
  });

  it("cancels with the abort signal and retries failures", async () => {
    const { upload, calls } = controllable();
    wrap(<FileUploader upload={upload} getErrorMessage={(e) => (e instanceof Error ? e.message : undefined)} />);
    pick([file("a.txt"), file("b.txt")]);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));

    await userEvent.click(screen.getByRole("button", { name: "Cancel upload of a.txt" }));
    expect(calls[0]!.ctx.signal.aborted).toBe(true);
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument();

    await act(async () => calls[1]!.reject(new Error("Server said no")));
    expect(await screen.findByText("Server said no")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry b.txt" }));
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(3));
    await act(async () => calls[2]!.resolve());
    expect(await screen.findByText("Uploaded")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove b.txt" }));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("respects accept, aborts on unmount and has no axe violations", async () => {
    const { upload, calls } = controllable();
    const onReject = vi.fn();
    const { baseElement, unmount } = wrap(<FileUploader upload={upload} accept="image/*" onReject={onReject} />);
    pick([file("notes.txt"), file("cat.png", "image/png")]);
    expect(onReject).toHaveBeenCalledWith([{ file: expect.any(File), reason: "type" }]);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(await axeViolations(baseElement)).toEqual([]);
    unmount();
    expect(calls[0]!.ctx.signal.aborted).toBe(true);
  });
});
