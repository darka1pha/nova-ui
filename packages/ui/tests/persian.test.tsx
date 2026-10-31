import { fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Calendar,
  calendarForLocale,
  DatePicker,
  fromJalali,
  isJalaliLeapYear,
  jalaliMonthLength,
  NumberInput,
  ThemeProvider,
  toJalali,
  toLatinDigits,
  toPersianDigits,
} from "../src/index.ts";

describe("Jalali arithmetic", () => {
  it("matches Intl's Persian calendar and round-trips every day for decades", () => {
    const intl = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", day: "numeric" });
    for (let d = new Date(1990, 0, 1); d < new Date(2040, 0, 1); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      const parts = Object.fromEntries(intl.formatToParts(d).map((p) => [p.type, Number(p.value)]));
      const j = toJalali(d);
      expect([j.year, j.month, j.day], d.toDateString()).toEqual([parts.year, parts.month, parts.day]);
      expect(fromJalali(j.year, j.month, j.day).getTime()).toBe(d.getTime());
    }
  });

  it("knows Nowruz, month lengths and leap years", () => {
    expect(toJalali(new Date(2025, 2, 21))).toEqual({ year: 1404, month: 1, day: 1 });
    expect(toJalali(new Date(2026, 9, 31))).toEqual({ year: 1405, month: 8, day: 9 });
    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(isJalaliLeapYear(1404)).toBe(false);
    expect([jalaliMonthLength(1404, 6), jalaliMonthLength(1404, 7), jalaliMonthLength(1403, 12), jalaliMonthLength(1404, 12)]).toEqual([31, 30, 30, 29]);
    // Months overflow into the next year, like new Date(y, m, d).
    expect(fromJalali(1404, 13, 1).getTime()).toBe(fromJalali(1405, 1, 1).getTime());
  });

  it("converts between Persian and Latin digits", () => {
    expect(toPersianDigits("1405/08/09")).toBe("۱۴۰۵/۰۸/۰۹");
    expect(toLatinDigits("۱٬۲۵۰٫۵")).toBe("1250.5");
    expect(toLatinDigits("٣٤")).toBe("34");
  });

  it("derives the calendar from the locale", () => {
    expect(calendarForLocale("fa-IR")).toBe("persian");
    expect(calendarForLocale("fa-IR-u-ca-gregory")).toBe("gregory");
    expect(calendarForLocale("en-US-u-ca-persian")).toBe("persian");
    expect(calendarForLocale("en-US")).toBe("gregory");
  });
});

describe("Persian locale in components", () => {
  it("shows Jalali months with Persian digits, Saturday first and Friday marked", () => {
    render(
      <ThemeProvider locale="fa-IR" dir="rtl">
        <Calendar defaultValue={new Date(2026, 9, 31)} />
      </ThemeProvider>,
    );
    expect(document.querySelector("[lang='fa-IR']")).not.toBeNull();
    const grid = screen.getByRole("grid");
    expect(screen.getByText("آبان ۱۴۰۵")).toBeInTheDocument();
    const headers = within(grid).getAllByRole("columnheader");
    expect(headers[0]).toHaveAccessibleName("شنبه");
    expect(headers[6]).toHaveClass("text-danger-text");
    const selected = within(grid).getByRole("button", { name: "شنبه ۹ آبان ۱۴۰۵" });
    expect(selected).toHaveTextContent("۹");
    // Aban has 30 days: the month grid runs ۱ … ۳۰.
    const aban = within(grid)
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label")?.endsWith(" آبان ۱۴۰۵"));
    expect(aban.map((b) => b.textContent)).toEqual(Array.from({ length: 30 }, (_, i) => toPersianDigits(i + 1)));
  });

  it("steps across Jalali month boundaries with Page Down", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider locale="fa-IR">
        <Calendar defaultValue={new Date(2026, 9, 31)} />
      </ThemeProvider>,
    );
    screen.getByRole("button", { name: "شنبه ۹ آبان ۱۴۰۵" }).focus();
    await user.keyboard("{PageDown}");
    expect(document.activeElement).toHaveAccessibleName(/ ۹ آذر ۱۴۰۵$/);
  });

  it("lets a component opt back into Gregorian", () => {
    render(
      <ThemeProvider locale="fa-IR">
        <Calendar calendar="gregory" defaultValue={new Date(2026, 9, 31)} />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button", { name: /۳۱ اکتبر ۲۰۲۶/ })).toBeInTheDocument();
  });

  it("formats the DatePicker in Jalali but submits the ISO Gregorian date", () => {
    const { container } = render(
      <ThemeProvider locale="fa-IR">
        <DatePicker aria-label="تاریخ" name="arrival" defaultValue={new Date(2026, 9, 31)} />
      </ThemeProvider>,
    );
    expect(screen.getByRole("combobox", { name: "تاریخ" })).toHaveTextContent("۱۴۰۵");
    expect(container.querySelector("input[name='arrival']")).toHaveValue("2026-10-31");
  });

  it("accepts Persian digits in NumberInput and shows them back", () => {
    const onValueChange = vi.fn();
    render(
      <ThemeProvider locale="fa-IR">
        <NumberInput aria-label="وزن" onValueChange={onValueChange} />
      </ThemeProvider>,
    );
    const input = screen.getByRole("spinbutton", { name: "وزن" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "۱۲۵۰٫۵" } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenLastCalledWith(1250.5);
    expect(input).toHaveValue("۱۲۵۰٫۵");
  });
});
