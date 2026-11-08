import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeUrl } from "../src/components/rich-text-editor.tsx";
import { Button, Countdown, DataTable, Fieldset, FormField, Input, Rating, ThemeProvider, toast, Toaster, cn, getThemeScript } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

// Regression tests for the Medium/Low component findings in issues.md.

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

afterEach(() => {
  document.documentElement.removeAttribute("data-nv-mode");
  window.localStorage.clear();
});

describe("persisted mode without a flash (M-11)", () => {
  const runScript = (src: string) => new Function(src)();

  it("ThemeScript applies the stored mode, else the default", () => {
    runScript(getThemeScript("mode", "dark"));
    expect(document.documentElement.dataset.nvMode).toBe("dark");

    document.documentElement.removeAttribute("data-nv-mode");
    window.localStorage.setItem("mode", "light");
    runScript(getThemeScript("mode", "dark"));
    expect(document.documentElement.dataset.nvMode).toBe("light");

    // A stored "system" beats the default and leaves the OS in charge.
    document.documentElement.removeAttribute("data-nv-mode");
    window.localStorage.setItem("mode", "system");
    runScript(getThemeScript("mode", "dark"));
    expect(document.documentElement.dataset.nvMode).toBeUndefined();
  });

  it("server markup of a persisted provider leaves the mode to <html>, even with defaultMode", () => {
    const html = renderToString(
      <ThemeProvider storageKey="mode" defaultMode="light">
        x
      </ThemeProvider>,
    );
    expect(html).not.toContain("data-nv-mode");
  });

  it("applies the stored mode before the first paint on the client", () => {
    window.localStorage.setItem("mode", "dark");
    const { container } = render(
      <ThemeProvider storageKey="mode" defaultMode="light">
        x
      </ThemeProvider>,
    );
    // render() has flushed layout effects only: no paint happened in between.
    expect(container.querySelector(".nv-theme")).toHaveAttribute("data-nv-mode", "dark");
  });
});

describe("Toast (M-7, M-8)", () => {
  it("pauses the countdown bar whenever Radix pauses the timer", async () => {
    wrap(<Toaster />);
    act(() => void toast("Saved"));
    const bar = await screen.findByText("Saved").then((el) => el.closest("li")?.querySelector<HTMLElement>("[data-slot=toast-countdown]"));
    expect(bar?.style.animationPlayState).toBe("running");
    // Radix pauses every toast while the window is in the background.
    act(() => void window.dispatchEvent(new Event("blur")));
    expect(bar?.style.animationPlayState).toBe("paused");
    act(() => void window.dispatchEvent(new Event("focus")));
    expect(bar?.style.animationPlayState).toBe("running");
    act(() => toast.dismiss());
  });

  it("follows a vertical swipe for centered positions", async () => {
    wrap(<Toaster position="bottom-center" />);
    act(() => void toast("Centered"));
    const item = (await screen.findByText("Centered")).closest("li");
    expect(item?.className).toContain("data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y)");
    act(() => toast.dismiss());
  });
});

describe("Button asChild (M-5)", () => {
  it("keeps icons and blocks activation while disabled", async () => {
    const onClick = vi.fn();
    wrap(
      <>
        <Button asChild startIcon={<svg data-testid="start" />} endIcon={<svg data-testid="end" />}>
          <a href="#go">Go</a>
        </Button>
        <Button asChild disabled>
          <a href="#nope" onClick={onClick}>
            Nope
          </a>
        </Button>
      </>,
    );
    const go = screen.getByRole("link", { name: "Go" });
    expect(within(go).getByTestId("start")).toBeInTheDocument();
    expect(within(go).getByTestId("end")).toBeInTheDocument();

    const nope = screen.getByRole("link", { name: "Nope" });
    expect(nope).toHaveAttribute("aria-disabled", "true");
    expect(nope).toHaveAttribute("tabindex", "-1");
    fireEvent.click(nope);
    expect(onClick).not.toHaveBeenCalled();
    expect(window.location.hash).not.toBe("#nope");
  });

  it("still spins its loading spinner", () => {
    wrap(<Button loading>Save</Button>);
    const spinner = screen.getByRole("button").querySelector(".animate-nv-spin");
    expect(spinner).not.toBeNull();
  });
});

describe("rich text links (M-4)", () => {
  it("refuses script and data URLs", () => {
    for (const bad of ["javascript:alert(1)", "JavaScript:alert(1)", " java\tscript:alert(1)", "data:text/html,<script>", "vbscript:x"]) {
      expect(normalizeUrl(bad)).toBe("");
    }
  });

  it("keeps safe links and completes bare ones", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeUrl("example.com/a")).toBe("https://example.com/a");
    expect(normalizeUrl("me@example.com")).toBe("mailto:me@example.com");
    expect(normalizeUrl("tel:+98912")).toBe("tel:+98912");
    expect(normalizeUrl("/docs#a")).toBe("/docs#a");
  });
});

describe("fields (L-4, L-5)", () => {
  it("Fieldset is described by its description and error, without aria-invalid", async () => {
    const { container } = wrap(
      <Fieldset legend="Shipping" description="Where it goes" error="Pick one">
        <Input aria-label="Street" />
      </Fieldset>,
    );
    const group = screen.getByRole("group", { name: "Shipping" });
    expect(group).not.toHaveAttribute("aria-invalid");
    expect(group).toHaveAccessibleDescription("Where it goes Pick one");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("an empty message region stays in the accessibility tree", () => {
    wrap(
      <FormField label="Name">
        <Input />
      </FormField>,
    );
    const region = document.querySelector("[aria-live=polite]");
    expect(region).toHaveClass("sr-only");
    expect(region).not.toHaveClass("contents");
  });
});

describe("smaller fixes", () => {
  it("cn lets a consumer replace a component animation (L-13)", () => {
    expect(cn("animate-nv-pop-in", "animate-none")).toBe("animate-none");
    expect(cn("data-[state=open]:animate-nv-pop-in", "animate-none")).toBe("data-[state=open]:animate-nv-pop-in animate-none");
  });

  it("read-only Rating label is localizable (L-1)", () => {
    wrap(<Rating readOnly value={3} getValueLabel={(v, m) => `${v} از ${m}`} />);
    expect(screen.getByRole("img", { name: "3 از 5" })).toBeInTheDocument();
  });

  it("Countdown renders nothing for an invalid date (L-14)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      wrap(<Countdown to="not a date" />);
      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
      expect(warn.mock.calls.some((c) => String(c[0]).includes("not a valid date"))).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  it("DataTable rows carry no aria-selected; the row checkbox states it (L-3)", async () => {
    const data = [{ id: "1", name: "alpha" }];
    wrap(<DataTable data={data} columns={[{ id: "name", header: "Name" }]} getRowId={(r) => r.id} selectable />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row 1" }));
    for (const row of screen.getAllByRole("row")) expect(row).not.toHaveAttribute("aria-selected");
    expect(screen.getByRole("checkbox", { name: "Select row 1" })).toBeChecked();
  });
});
