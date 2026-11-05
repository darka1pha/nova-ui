import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CurrencyInput,
  DescriptionItem,
  DescriptionList,
  FormField,
  Input,
  InputGroup,
  formatPhoneNumber,
  formatRelativeTime,
  parsePhoneNumber,
  PhoneInput,
  RelativeTime,
  SegmentedControl,
  SegmentedControlItem,
  ThemeProvider,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) => render(<ThemeProvider {...props}>{ui}</ThemeProvider>);

describe("SegmentedControl", () => {
  it("is a radio group that selects with clicks and arrow keys", async () => {
    const onValueChange = vi.fn();
    wrap(
      <SegmentedControl aria-label="View" defaultValue="list" onValueChange={onValueChange}>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="board">Board</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(screen.getByRole("radiogroup", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Board" }));
    expect(onValueChange).toHaveBeenLastCalledWith("board");
    // Radix selects on focus while an arrow key is down and moves focus in a timeout,
    // so hold the key the way a person does instead of an instant keydown/keyup.
    await userEvent.keyboard("{ArrowLeft>}");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Grid" })).toBeChecked());
    await userEvent.keyboard("{/ArrowLeft}");
  });

  it("has no axe violations", async () => {
    const { container } = wrap(
      <SegmentedControl aria-label="Range" defaultValue="w">
        <SegmentedControlItem value="d">Day</SegmentedControlItem>
        <SegmentedControlItem value="w">Week</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("DescriptionList", () => {
  it("renders term/definition pairs inside a dl", async () => {
    const { container } = wrap(
      <DescriptionList columns={2} divided>
        <DescriptionItem term="Status">Active</DescriptionItem>
        <DescriptionItem term="Owner" action={<button type="button">Edit</button>}>
          Mina
        </DescriptionItem>
      </DescriptionList>,
    );
    const dl = container.querySelector("dl")!;
    expect(dl.querySelectorAll(":scope > div > dt")).toHaveLength(2);
    expect(screen.getByText("Status").nextElementSibling).toHaveTextContent("Active");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("formatRelativeTime / RelativeTime", () => {
  const now = new Date("2026-10-29T10:00:00Z");
  it.each([
    [new Date("2026-10-29T09:59:40Z"), "now"],
    [new Date("2026-10-29T09:57:00Z"), "3 minutes ago"],
    [new Date("2026-10-29T13:00:00Z"), "in 3 hours"],
    [new Date("2026-10-28T09:00:00Z"), "yesterday"],
    [new Date("2026-10-15T10:00:00Z"), "2 weeks ago"],
    [new Date("2025-10-29T10:00:00Z"), "last year"],
  ])("formats %s", (date, text) => {
    expect(formatRelativeTime(date, now, "en")).toBe(text);
  });

  it("localizes and renders a <time> with an absolute tooltip", () => {
    expect(formatRelativeTime(new Date("2026-10-29T09:57:00Z"), now, "fa-IR")).toMatch(/دقیقه/);
    vi.useFakeTimers({ now });
    try {
      wrap(<RelativeTime date="2026-10-29T09:57:00Z" locale="en" />);
      const time = screen.getByText("3 minutes ago");
      expect(time.tagName).toBe("TIME");
      expect(time).toHaveAttribute("datetime", "2026-10-29T09:57:00.000Z");
      expect(time.getAttribute("title")).toMatch(/2026/);
      // React re-renders (and schedules the next tick) when each act() ends.
      act(() => void vi.advanceTimersByTime(60_000));
      act(() => void vi.advanceTimersByTime(60_000));
      expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("CurrencyInput", () => {
  it("formats when blurred and rounds to the currency's minor units", async () => {
    const onValueChange = vi.fn();
    wrap(<CurrencyInput aria-label="Price" currency="EUR" locale="en-US" onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Price");
    await userEvent.type(input, "1200.456");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(1200.46);
    expect(input).toHaveValue("€1,200.46");

    onValueChange.mockClear();
    wrap(<CurrencyInput aria-label="Yen" currency="JPY" locale="en-US" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Yen"), "99.6");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(100);
  });
});

describe("PhoneInput helpers", () => {
  it("formats progressively and parses E.164", () => {
    const us = parsePhoneNumber("+14155550123").country;
    expect(us?.code).toBe("US");
    expect(formatPhoneNumber("415", us)).toBe("(415");
    expect(formatPhoneNumber("4155550123", us)).toBe("(415) 555-0123");
    expect(parsePhoneNumber("+447911123456")).toMatchObject({ country: { code: "GB" }, national: "7911123456" });
    expect(parsePhoneNumber("+1 613 555 0100", undefined, "CA").country?.code).toBe("CA");
  });
});

describe("PhoneInput", () => {
  it("formats as you type and reports E.164 with validity", async () => {
    const onValueChange = vi.fn();
    wrap(
      <FormField label="Phone">
        <PhoneInput onValueChange={onValueChange} name="phone" />
      </FormField>,
    );
    const input = screen.getByLabelText("Phone");
    await userEvent.type(input, "4155550123");
    expect(input).toHaveValue("(415) 555-0123");
    expect(onValueChange).toHaveBeenLastCalledWith("+14155550123", { country: "US", national: "4155550123", valid: true });
    expect(document.querySelector<HTMLInputElement>('input[type="hidden"][name="phone"]')!.value).toBe("+14155550123");
  });

  it("switches country on an international paste and drops a trunk zero", () => {
    const onValueChange = vi.fn();
    const onCountryChange = vi.fn();
    wrap(<PhoneInput aria-label="Phone" onValueChange={onValueChange} onCountryChange={onCountryChange} />);
    const input = screen.getByLabelText("Phone");
    fireEvent.change(input, { target: { value: "+44 7911 123456" } });
    expect(onCountryChange).toHaveBeenCalledWith("GB");
    expect(input).toHaveValue("7911 123456");
    expect(screen.getByRole("combobox", { name: /Country: United Kingdom/ })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "07911 123456" } });
    expect(onValueChange).toHaveBeenLastCalledWith("+447911123456", expect.objectContaining({ valid: true }));
  });

  it("accepts Persian digits and works controlled", () => {
    function Controlled() {
      const [value, setValue] = useState("+989121234567");
      return (
        <>
          <PhoneInput aria-label="Phone" value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    wrap(<Controlled />);
    const input = screen.getByLabelText("Phone");
    expect(input).toHaveValue("912 123 4567");
    fireEvent.change(input, { target: { value: "۹۱۲ ۱۲۳ ۴۵۶۸" } });
    expect(screen.getByRole("status")).toHaveTextContent("+989121234568");
  });

  it("has no axe violations", async () => {
    const { container } = wrap(
      <FormField label="Mobile">
        <PhoneInput defaultValue="+33612345678" />
      </FormField>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("InputGroup direction", () => {
  it("pads the side the adornment is on when the input has its own dir", () => {
    wrap(
      <InputGroup start={<span>@</span>}>
        <Input aria-label="Email" dir="ltr" />
      </InputGroup>,
      { dir: "rtl" },
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    // The icon sits at the group's start (right, in RTL), which is the LTR input's end.
    expect(input.className).toContain("pe-9");
    expect(input.className).not.toContain("ps-9");
  });

  it("pads the start side when directions match", () => {
    wrap(
      <InputGroup start={<span>@</span>}>
        <Input aria-label="Name" />
      </InputGroup>,
      { dir: "rtl" },
    );
    expect(screen.getByRole("textbox", { name: "Name" }).className).toContain("ps-9");
  });
});
