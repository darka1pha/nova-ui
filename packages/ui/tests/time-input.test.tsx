import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FormField, ThemeProvider, TimeInput } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const seg = (name: string) => screen.getByRole("spinbutton", { name });

describe("TimeInput", () => {
  it("types hour and minute, auto-advancing, and reports HH:mm", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hourCycle="h23" name="eta" onValueChange={onValueChange} aria-label="ETA" />);
    seg("Hours").focus();
    await user.keyboard("1430");
    expect(onValueChange).toHaveBeenLastCalledWith("14:30");
    expect(seg("Hours")).toHaveAttribute("aria-valuenow", "14");
    expect(seg("Minutes")).toHaveAttribute("aria-valuenow", "30");
    expect(container.querySelector("input[name='eta']")).toHaveValue("14:30");
  });

  it("advances after one digit when another couldn't make a valid hour", async () => {
    const user = userEvent.setup();
    render(<TimeInput hourCycle="h23" />);
    seg("Hours").focus();
    await user.keyboard("7");
    expect(document.activeElement).toBe(seg("Minutes"));
    expect(seg("Hours")).toHaveTextContent("07");
  });

  it("steps with arrows, wraps, and honours minuteStep", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeInput hourCycle="h23" defaultValue="23:50" minuteStep={15} onValueChange={onValueChange} />);
    seg("Hours").focus();
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith("00:50");
    await user.keyboard("{ArrowRight}{ArrowUp}");
    // 50 snaps to the 15-minute grid (45), then steps to 00.
    expect(onValueChange).toHaveBeenLastCalledWith("00:00");
  });

  it("uses a 12-hour clock with AM/PM for en-US", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeInput locale="en-US" defaultValue="09:15" onValueChange={onValueChange} />);
    expect(seg("Hours")).toHaveTextContent("09");
    expect(seg("AM/PM")).toHaveTextContent("AM");
    seg("AM/PM").focus();
    await user.keyboard("p");
    expect(onValueChange).toHaveBeenLastCalledWith("21:15");
    expect(seg("AM/PM")).toHaveTextContent("PM");
    // Typing an hour keeps the period: "3" in the afternoon is 15:00.
    seg("Hours").focus();
    await user.keyboard("3");
    expect(onValueChange).toHaveBeenLastCalledWith("15:15");
  });

  it("clamps to min and max", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeInput hourCycle="h23" min="06:00" max="18:00" defaultValue="17:30" onValueChange={onValueChange} />);
    seg("Hours").focus();
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith("18:00");
  });

  it("clears with Backspace and the clear button", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeInput hourCycle="h23" defaultValue="08:00" clearable onValueChange={onValueChange} />);
    seg("Minutes").focus();
    await user.keyboard("{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(seg("Minutes")).toHaveAttribute("aria-valuetext", "Empty");
    await user.keyboard("45");
    expect(onValueChange).toHaveBeenLastCalledWith("08:45");
    await user.click(screen.getByRole("button", { name: "Clear time" }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(seg("Hours")).toHaveTextContent("––");
  });

  it("shows Persian digits and accepts Persian typing under fa-IR", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ThemeProvider locale="fa-IR" dir="rtl">
        <TimeInput onValueChange={onValueChange} labels={{ hour: "ساعت", minute: "دقیقه" }} />
      </ThemeProvider>,
    );
    // fa-IR uses a 24-hour clock: no AM/PM segment.
    expect(screen.queryByRole("spinbutton", { name: "AM/PM" })).toBeNull();
    seg("ساعت").focus();
    await user.keyboard("۰۹۴۵");
    expect(onValueChange).toHaveBeenLastCalledWith("09:45");
    expect(seg("ساعت")).toHaveTextContent("۰۹");
    expect(seg("دقیقه")).toHaveTextContent("۴۵");
  });

  it("accepts touch-keyboard input (beforeinput) including deletes", () => {
    const onValueChange = vi.fn();
    render(<TimeInput hourCycle="h23" onValueChange={onValueChange} />);
    const input = (el: HTMLElement, init: InputEventInit) => {
      const e = new InputEvent("beforeinput", { bubbles: true, cancelable: true, ...init });
      act(() => {
        el.dispatchEvent(e);
      });
      return e;
    };
    // Phones open a numeric keyboard on hour and minute.
    expect(seg("Hours")).toHaveAttribute("inputmode", "numeric");
    expect(seg("Hours")).toHaveAttribute("contenteditable", "true");
    const typed = input(seg("Hours"), { inputType: "insertText", data: "0" });
    expect(typed.defaultPrevented).toBe(true);
    input(seg("Hours"), { inputType: "insertText", data: "8" });
    input(seg("Minutes"), { inputType: "insertText", data: "1" });
    input(seg("Minutes"), { inputType: "insertText", data: "5" });
    expect(onValueChange).toHaveBeenLastCalledWith("08:15");
    input(seg("Minutes"), { inputType: "deleteContentBackward" });
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(seg("Minutes")).toHaveTextContent("––");
  });

  it("keeps every digit of a fast burst (no re-render between keystrokes)", () => {
    const onValueChange = vi.fn();
    render(<TimeInput locale="en-US" defaultValue="14:30" onValueChange={onValueChange} />);
    const send = (el: HTMLElement, data: string) => el.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data }));
    // All four in one batch, as a phone keyboard or quick typist can deliver them.
    act(() => {
      send(seg("Hours"), "0");
      send(seg("Hours"), "7");
      send(seg("Minutes"), "4");
      send(seg("Minutes"), "5");
    });
    // 07 in the afternoon, 45 minutes: 19:45.
    expect(onValueChange).toHaveBeenLastCalledWith("19:45");
    expect(seg("Hours")).toHaveTextContent("07");
    expect(seg("Minutes")).toHaveTextContent("45");
    expect(seg("AM/PM")).toHaveTextContent("PM");
  });

  it("follows auto-advance even when a burst is delivered to the first segment", () => {
    // Chrome delivered a whole typed burst to the segment focused when it began,
    // although focus had moved on after the hour was complete.
    const onValueChange = vi.fn();
    render(<TimeInput locale="en-US" defaultValue="14:30" onValueChange={onValueChange} />);
    const hours = seg("Hours");
    act(() => hours.focus());
    act(() => {
      for (const data of ["0", "7", "4", "5"]) {
        hours.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data }));
      }
    });
    expect(onValueChange).toHaveBeenLastCalledWith("19:45");
    expect(document.activeElement).toBe(seg("AM/PM"));
  });

  it("spreads one multi-character insert across segments", () => {
    // Chrome (and phone autocomplete or swipe) can deliver "0745" as a single event.
    const onValueChange = vi.fn();
    render(<TimeInput locale="en-US" defaultValue="14:30" onValueChange={onValueChange} />);
    const hours = seg("Hours");
    act(() => hours.focus());
    act(() => {
      hours.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data: "0745" }));
    });
    expect(onValueChange).toHaveBeenLastCalledWith("19:45");
    expect(seg("Hours")).toHaveTextContent("07");
    expect(seg("Minutes")).toHaveTextContent("45");
  });

  it("controlled: clearing one segment keeps the other, and outside changes still apply", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [time, setTime] = useState<string | null>("14:30");
      return (
        <>
          <TimeInput hourCycle="h23" value={time} onValueChange={setTime} />
          <output data-testid="value">{String(time)}</output>
          <button type="button" onClick={() => setTime("08:15")}>
            Set 08:15
          </button>
          <button type="button" onClick={() => setTime(null)}>
            Reset
          </button>
        </>
      );
    }
    render(<Controlled />);
    seg("Minutes").focus();
    await user.keyboard("{Backspace}");
    // The parent now holds null, but the hour the user typed stays put.
    expect(screen.getByTestId("value")).toHaveTextContent("null");
    expect(seg("Hours")).toHaveTextContent("14");
    expect(seg("Minutes")).toHaveTextContent("––");
    await user.keyboard("45");
    expect(screen.getByTestId("value")).toHaveTextContent("14:45");

    await user.click(screen.getByRole("button", { name: "Set 08:15" }));
    expect(seg("Hours")).toHaveTextContent("08");
    expect(seg("Minutes")).toHaveTextContent("15");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(seg("Hours")).toHaveTextContent("––");
    expect(seg("Minutes")).toHaveTextContent("––");
  });

  it("is labelled by its FormField and passes axe", async () => {
    const { container } = render(
      <FormField label="Departure" description="Local port time">
        <TimeInput hourCycle="h23" defaultValue="06:30" />
      </FormField>,
    );
    expect(screen.getByRole("group", { name: "Departure" })).toBeInTheDocument();
    expect(seg("Hours")).toHaveAccessibleDescription("Local port time");
    expect(await axeViolations(container)).toEqual([]);
  });
});
