import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carousel, Countdown, FormField, Rating, ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

// Regression tests for the High-severity findings in issues.md (H-1 … H-5).

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

afterEach(() => {
  vi.useRealTimers();
});

describe("Carousel autoplay (H-1, H-2)", () => {
  function setup() {
    vi.useFakeTimers();
    wrap(
      <Carousel label="Featured" autoPlay={1000}>
        <div>One</div>
        <div>Two</div>
        <div>Three</div>
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Featured" });
    const track = region.querySelector<HTMLElement>("[tabindex='0']");
    if (!track) throw new Error("track not found");
    const scrollTo = vi.fn();
    track.scrollTo = scrollTo as unknown as typeof track.scrollTo;
    return { region, scrollTo };
  }

  it("has a rotation button that stops and restarts autoplay", () => {
    const { scrollTo } = setup();
    act(() => void vi.advanceTimersByTime(1050));
    expect(scrollTo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Stop slide rotation" }));
    // Clicking focused the button; move focus out so only the explicit stop remains.
    fireEvent.blur(screen.getByRole("button", { name: "Start slide rotation" }), { relatedTarget: document.body });
    scrollTo.mockClear();
    act(() => void vi.advanceTimersByTime(5000));
    expect(scrollTo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Start slide rotation" }));
    fireEvent.blur(screen.getByRole("button", { name: "Stop slide rotation" }), { relatedTarget: document.body });
    act(() => void vi.advanceTimersByTime(1050));
    expect(scrollTo).toHaveBeenCalled();
  });

  it("stays paused while focus moves between controls inside", () => {
    const { region, scrollTo } = setup();
    const [first, second] = within(region).getAllByRole("button", { name: /Go to slide/ });
    fireEvent.focus(first!);
    // focusout from one dot to the next bubbles to the carousel: it must not resume.
    fireEvent.blur(first!, { relatedTarget: second });
    fireEvent.focus(second!);
    act(() => void vi.advanceTimersByTime(5000));
    expect(scrollTo).not.toHaveBeenCalled();

    // Focus leaving the carousel resumes rotation.
    fireEvent.blur(second!, { relatedTarget: document.body });
    act(() => void vi.advanceTimersByTime(1050));
    expect(scrollTo).toHaveBeenCalled();
  });

  it("stays paused when the pointer leaves while focus is still inside", () => {
    const { region, scrollTo } = setup();
    const [dot] = within(region).getAllByRole("button", { name: /Go to slide/ });
    fireEvent.focus(dot!);
    fireEvent.pointerEnter(region);
    fireEvent.pointerLeave(region);
    act(() => void vi.advanceTimersByTime(5000));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("shows no rotation button without autoPlay", () => {
    wrap(
      <Carousel label="Static">
        <div>One</div>
        <div>Two</div>
      </Carousel>,
    );
    expect(screen.queryByRole("button", { name: /slide rotation/ })).not.toBeInTheDocument();
  });
});

describe("Countdown under SSR (H-3)", () => {
  async function hydrateLater(ui: React.ReactNode) {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-29T10:00:00Z") });
    const host = document.createElement("div");
    host.innerHTML = renderToString(<ThemeProvider>{ui}</ThemeProvider>);
    const serverHtml = host.innerHTML;
    document.body.append(host);
    // The client hydrates a few seconds after the server rendered.
    vi.setSystemTime(new Date("2026-10-29T10:00:03Z"));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () => {
        hydrateRoot(host, <ThemeProvider>{ui}</ThemeProvider>);
      });
      return { serverHtml, host, errors: errors.mock.calls.map((c) => String(c[0])) };
    } finally {
      errors.mockRestore();
    }
  }

  it("hydrates without a mismatch and then shows the real time", async () => {
    const { serverHtml, host, errors } = await hydrateLater(<Countdown to="2026-10-29T10:01:02Z" locale="en" />);
    try {
      expect(errors).toEqual([]);
      expect(serverHtml).toContain(">--</span>");
      const timer = within(host).getByRole("timer");
      expect(timer).toHaveTextContent("00minutes59seconds");
      expect(timer).toHaveAccessibleName("0 hours, 0 minutes");
    } finally {
      host.remove();
    }
  });

  it("renders the server clock when given initialNow", async () => {
    const { serverHtml, host, errors } = await hydrateLater(
      <Countdown to="2026-10-29T10:01:02Z" locale="en" initialNow={new Date("2026-10-29T10:00:00Z").getTime()} />,
    );
    try {
      expect(errors).toEqual([]);
      expect(serverHtml).not.toContain(">--</span>");
      expect(serverHtml).toContain(">02</span>");
    } finally {
      host.remove();
    }
  });
});

describe("Rating inside FormField (H-4, H-5)", () => {
  it("takes its name, description, error, required and disabled from the field", async () => {
    const { container, rerender } = render(
      <ThemeProvider>
        <FormField label="Your rating" description="Be honest" error="Pick a rating" required>
          <Rating />
        </FormField>
      </ThemeProvider>,
    );
    const group = screen.getByRole("radiogroup", { name: "Your rating" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAttribute("aria-required", "true");
    expect(group).toHaveAccessibleDescription(/Be honest/);
    expect(group).toHaveAccessibleDescription(/Pick a rating/);
    for (const radio of within(group).getAllByRole("radio")) expect(radio).toBeRequired();
    expect(await axeViolations(container)).toEqual([]);

    rerender(
      <ThemeProvider>
        <FormField label="Your rating" disabled>
          <Rating />
        </FormField>
      </ThemeProvider>,
    );
    for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
  });

  it("keeps an explicit label and does not change when disabled", async () => {
    const onValueChange = vi.fn();
    wrap(<Rating label="Rate it" disabled onValueChange={onValueChange} />);
    expect(screen.getByRole("radiogroup", { name: "Rate it" })).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("draws empty stars with the 3:1 input token, not border-strong", () => {
    const { container } = wrap(
      <>
        <Rating label="Interactive" value={2} />
        <Rating readOnly value={2} />
      </>,
    );
    const stars = container.querySelectorAll("svg");
    const empty = [...stars].filter((s) => !s.classList.contains("fill-warning"));
    expect(empty.length).toBe(6);
    for (const star of empty) {
      expect(star).toHaveClass("text-input");
      expect(star).not.toHaveClass("text-border-strong");
    }
  });
});
