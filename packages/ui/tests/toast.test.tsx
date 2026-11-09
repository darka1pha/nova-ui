import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, toast, Toaster } from "../src/index.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);
const openTitles = () => [...document.querySelectorAll("li[data-state=open]")].map((li) => li.querySelector("[class*=font-semibold]")?.textContent);

/** A promise you settle from the test. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  act(() => toast.dismiss());
});

describe("Toaster max", () => {
  it("keeps at most `max` toasts open and closes the oldest", async () => {
    wrap(<Toaster max={2} />);
    act(() => {
      toast("First");
      toast("Second");
      toast("Third");
    });
    await screen.findByText("Third");
    // jsdom has no exit animation, so Radix unmounts a closed toast right away.
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(openTitles()).toEqual(["Second", "Third"]);
  });

  it("applies a lower limit to toasts that are already open", async () => {
    const { rerender } = wrap(<Toaster max={3} />);
    act(() => {
      toast("One");
      toast("Two");
      toast("Three");
    });
    await screen.findByText("Three");
    expect(openTitles()).toHaveLength(3);
    rerender(
      <ThemeProvider>
        <Toaster max={1} />
      </ThemeProvider>,
    );
    await waitFor(() => expect(openTitles()).toEqual(["Three"]));
  });
});

describe("onDismiss", () => {
  it("fires once for the close button, toast.dismiss(), the limit and the timer", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    wrap(<Toaster max={1} />);

    // The timer first: once focus is inside the toast region (after the click below), Radix pauses every timer.
    let id = "";
    act(() => void (id = toast("Times out", { onDismiss, duration: 30 })));
    await waitFor(() => expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id));

    onDismiss.mockClear();
    act(() => void (id = toast("Close me", { onDismiss })));
    await user.click(await screen.findByRole("button", { name: "Dismiss notification" }));
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id);

    onDismiss.mockClear();
    act(() => void (id = toast("Dismiss me", { onDismiss })));
    act(() => toast.dismiss(id));
    act(() => toast.dismiss(id)); // already closing: no second call
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id);

    onDismiss.mockClear();
    act(() => void (id = toast("Pushed out", { onDismiss })));
    act(() => void toast("Newer"));
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("doesn't fire when a toast with the same id replaces it", async () => {
    const onDismiss = vi.fn();
    wrap(<Toaster />);
    act(() => void toast("Uploading 1 of 2", { id: "upload", onDismiss, duration: Infinity }));
    act(() => void toast("Uploading 2 of 2", { id: "upload", onDismiss, duration: Infinity }));
    expect(await screen.findByText("Uploading 2 of 2")).toBeInTheDocument();
    expect(screen.queryByText("Uploading 1 of 2")).not.toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe("toast.promise", () => {
  it("shows a spinner while pending, then the success message in the same toast", async () => {
    wrap(<Toaster />);
    const { promise, resolve } = deferred<{ name: string }>();
    let returned!: Promise<{ name: string }>;
    act(() => {
      returned = toast.promise(promise, { loading: "Saving…", success: (doc) => `Saved ${doc.name}`, error: "Couldn't save" });
    });
    const loading = (await screen.findByText("Saving…")).closest("li")!;
    expect(loading.querySelector(".animate-nv-spin")).not.toBeNull();
    expect(loading.querySelector("[data-slot=toast-countdown]")).toBeNull(); // never times out

    await act(async () => resolve({ name: "report.pdf" }));
    const done = (await screen.findByText("Saved report.pdf")).closest("li")!;
    expect(done).toBe(loading); // updated in place, not a second toast
    expect(done.querySelector(".animate-nv-spin")).toBeNull();
    expect(done.querySelector(".text-success-text")).not.toBeNull();
    expect(done.querySelector("[data-slot=toast-countdown]")).not.toBeNull();
    await expect(returned).resolves.toEqual({ name: "report.pdf" });
  });

  it("starts the timer once it settles", async () => {
    const onDismiss = vi.fn();
    wrap(<Toaster />);
    const { promise, resolve } = deferred<undefined>();
    act(() => void toast.promise(promise, { loading: "Exporting", success: { title: "Exported", duration: 30 }, error: "Export failed", onDismiss }));
    await screen.findByText("Exporting");
    await new Promise((r) => setTimeout(r, 60));
    expect(onDismiss).not.toHaveBeenCalled(); // still loading: no timeout
    await act(async () => resolve(undefined));
    await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());
  });

  it("shows the error message on rejection and passes the rejection through", async () => {
    wrap(<Toaster />);
    const failing = () => Promise.reject(new Error("quota exceeded"));
    let returned!: Promise<unknown>;
    act(() => {
      returned = toast.promise(failing, {
        loading: { title: "Uploading", description: "report.pdf" },
        success: "Uploaded",
        error: (e) => ({ title: "Upload failed", description: (e as Error).message }),
      });
    });
    await expect(returned).rejects.toThrow("quota exceeded");
    const failed = (await screen.findByText("Upload failed")).closest("li")!;
    expect(failed).toHaveTextContent("quota exceeded");
    expect(failed.querySelector(".text-danger-text")).not.toBeNull();
  });

  it("doesn't bring back a loading toast the person dismissed", async () => {
    const user = userEvent.setup();
    wrap(<Toaster />);
    const { promise, resolve } = deferred<undefined>();
    act(() => void toast.promise(promise, { loading: "Syncing", success: "Synced", error: "Sync failed" }));
    await user.click(await screen.findByRole("button", { name: "Dismiss notification" }));
    await act(async () => resolve(undefined));
    expect(screen.queryByText("Synced")).not.toBeInTheDocument();
  });

  // Found in review of #16: a synchronous throw used to leave the spinner running forever.
  it("treats a factory that throws synchronously as a rejection", async () => {
    wrap(<Toaster />);
    let returned!: Promise<unknown>;
    act(() => {
      returned = toast.promise(
        () => {
          throw new Error("not signed in");
        },
        { loading: "Publishing", success: "Published", error: (e) => `Couldn't publish: ${(e as Error).message}` },
      );
    });
    await expect(returned).rejects.toThrow("not signed in");
    const failed = (await screen.findByText("Couldn't publish: not signed in")).closest("li")!;
    expect(failed.querySelector(".animate-nv-spin")).toBeNull();
    expect(screen.queryByText("Publishing")).not.toBeInTheDocument();
  });

  it("shows the error outcome when the success formatter throws", async () => {
    wrap(<Toaster />);
    act(() => {
      void toast.promise(Promise.resolve(null as unknown as { name: string }), {
        loading: "Loading profile",
        success: (profile) => `Hello ${profile.name}`, // null.name throws
        error: "Couldn't load your profile",
      });
    });
    expect(await screen.findByText("Couldn't load your profile")).toBeInTheDocument();
  });

  it("closes the spinner and reports it when the error formatter throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    wrap(<Toaster />);
    act(() => {
      void toast
        .promise(Promise.reject(new Error("offline")), {
          loading: "Refreshing",
          success: "Refreshed",
          error: () => {
            throw new Error("formatter bug");
          },
        })
        .catch(() => {});
    });
    await screen.findByText("Refreshing");
    await waitFor(() => expect(screen.queryByText("Refreshing")).not.toBeInTheDocument());
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("toast.promise"), expect.objectContaining({ message: "formatter bug" }));
    consoleError.mockRestore();
  });
});
