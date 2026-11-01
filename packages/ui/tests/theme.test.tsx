import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, getThemeCss, getThemeScript, ThemeProvider, useTheme } from "../src/index.ts";

function ModeProbe() {
  const { mode, resolvedMode, setMode, dir } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedMode}</span>
      <span data-testid="dir">{dir}</span>
      <button onClick={() => setMode("dark")}>go dark</button>
    </div>
  );
}

const root = (el: HTMLElement) => el.closest(".nv-theme") as HTMLElement;

describe("ThemeProvider", () => {
  it("renders the default theme without inline variables (styles.css covers it)", () => {
    render(
      <ThemeProvider>
        <span>hi</span>
      </ThemeProvider>,
    );
    const el = root(screen.getByText("hi"));
    expect(el).toHaveAttribute("data-nv-theme", "vibrant");
    expect(el.getAttribute("style") ?? "").not.toContain("--nv-color");
  });

  it("applies a preset's semantic colors as CSS variables", () => {
    render(
      <ThemeProvider theme="ocean">
        <span>hi</span>
      </ThemeProvider>,
    );
    const el = root(screen.getByText("hi"));
    expect(el).toHaveAttribute("data-nv-theme", "ocean");
    expect(el.style.getPropertyValue("--nv-color-primary-solid")).toMatch(/light-dark\(#|^#/);
  });

  it("custom brand colors update the actual variables", () => {
    render(
      <ThemeProvider theme="vibrant" brand={{ primary: "#6C5CE7", secondary: "#00C2A8", accent: "#FF6B6B" }}>
        <span>hi</span>
      </ThemeProvider>,
    );
    const value = root(screen.getByText("hi")).style.getPropertyValue("--nv-color-primary-solid");
    expect(value).toContain("#6c5ce7");
  });

  it("warns once in development for invalid brand colors and keeps rendering", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <ThemeProvider brand={{ primary: "definitely-not-a-color" }}>
        <span>ok</span>
      </ThemeProvider>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not a valid hex color"));
    warn.mockRestore();
  });

  it("radius and density props reshape the theme", () => {
    render(
      <ThemeProvider radius="xl" density="compact">
        <span>hi</span>
      </ThemeProvider>,
    );
    const el = root(screen.getByText("hi"));
    expect(el.style.getPropertyValue("--nv-radius-base")).toBe("1rem");
    expect(el.style.getPropertyValue("--nv-density")).toBe("0.85");
    expect(el).toHaveAttribute("data-nv-density", "compact");
  });

  it("leaves 'system' mode to CSS and writes explicit modes as data-nv-mode", async () => {
    render(
      <ThemeProvider>
        <ModeProbe />
      </ThemeProvider>,
    );
    const el = root(screen.getByTestId("mode"));
    expect(el).not.toHaveAttribute("data-nv-mode");
    expect(screen.getByTestId("mode")).toHaveTextContent("system");
    await userEvent.click(screen.getByRole("button", { name: "go dark" }));
    expect(el).toHaveAttribute("data-nv-mode", "dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("uses a theme's preferred mode (midnight is dark-first)", () => {
    render(
      <ThemeProvider theme="midnight">
        <ModeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("persists the mode with storageKey and restores it", async () => {
    const { unmount } = render(
      <ThemeProvider storageKey="test-mode">
        <ModeProbe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "go dark" }));
    expect(window.localStorage.getItem("test-mode")).toBe("dark");
    expect(document.documentElement).toHaveAttribute("data-nv-mode", "dark");
    unmount();
    render(
      <ThemeProvider storageKey="test-mode">
        <ModeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });

  it("supports controlled mode", async () => {
    const onModeChange = vi.fn();
    render(
      <ThemeProvider mode="light" onModeChange={onModeChange}>
        <ModeProbe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "go dark" }));
    expect(onModeChange).toHaveBeenCalledWith("dark");
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("nested providers inherit mode and direction but can change the theme", async () => {
    render(
      <ThemeProvider dir="rtl" mode="dark">
        <ThemeProvider theme="sunset">
          <ModeProbe />
        </ThemeProvider>
      </ThemeProvider>,
    );
    const inner = root(screen.getByTestId("mode"));
    expect(inner).toHaveAttribute("data-nv-theme", "sunset");
    expect(inner).not.toHaveAttribute("data-nv-mode");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
  });

  it("sets dir for RTL layouts", () => {
    render(
      <ThemeProvider dir="rtl">
        <Button>مرحبا</Button>
      </ThemeProvider>,
    );
    expect(root(screen.getByRole("button"))).toHaveAttribute("dir", "rtl");
  });

  it("forces reduced motion with motion='reduce'", () => {
    render(
      <ThemeProvider motion="reduce">
        <span>calm</span>
      </ThemeProvider>,
    );
    expect(root(screen.getByText("calm"))).toHaveAttribute("data-nv-motion", "reduce");
  });

  it("does not re-resolve when inline brand objects are recreated", () => {
    const { rerender } = render(
      <ThemeProvider brand={{ primary: "#e11d48" }}>
        <span>x</span>
      </ThemeProvider>,
    );
    const before = root(screen.getByText("x")).getAttribute("style");
    act(() =>
      rerender(
        <ThemeProvider brand={{ primary: "#e11d48" }}>
          <span>x</span>
        </ThemeProvider>,
      ),
    );
    expect(root(screen.getByText("x")).getAttribute("style")).toBe(before);
  });
});

describe("SSR helpers", () => {
  it("getThemeScript applies only valid stored values", () => {
    window.localStorage.setItem("k", "dark");
    new Function(getThemeScript("k"))();
    expect(document.documentElement).toHaveAttribute("data-nv-mode", "dark");
    document.documentElement.removeAttribute("data-nv-mode");
    window.localStorage.setItem("k", "<script>");
    new Function(getThemeScript("k"))();
    expect(document.documentElement).not.toHaveAttribute("data-nv-mode");
  });

  it("getThemeCss produces a scoped block with brand colors", () => {
    const css = getThemeCss("vibrant", { brand: { primary: "#0ea5e9" }, selector: ":root" });
    expect(css.startsWith(":root {")).toBe(true);
    expect(css).toContain("--nv-color-primary-solid");
  });
});
