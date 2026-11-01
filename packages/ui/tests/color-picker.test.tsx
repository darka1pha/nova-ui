import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorInput, ColorPicker, FormField, ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe("ColorPicker", () => {
  it("moves through saturation, brightness and hue with the keyboard", async () => {
    const onValueChange = vi.fn();
    wrap(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} />);
    const area = screen.getByRole("slider", { name: "Saturation and brightness" });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 100%");
    area.focus();
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 90%");
    expect(onValueChange).toHaveBeenLastCalledWith("#e60000");

    const hue = screen.getByRole("slider", { name: "Hue" });
    hue.focus();
    await userEvent.keyboard("{End}");
    expect(hue).toHaveAttribute("aria-valuenow", "359");
    await userEvent.keyboard("{Home}{Shift>}{ArrowRight}{ArrowRight}{/Shift}");
    expect(hue).toHaveAttribute("aria-valuetext", "20°");
  });

  it("drags the area with a pointer", () => {
    const onValueChange = vi.fn();
    wrap(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} />);
    const area = screen.getByRole("slider", { name: "Saturation and brightness" }).parentElement!;
    area.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(area, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
    expect(onValueChange).toHaveBeenLastCalledWith("#ffffff");
    fireEvent.pointerMove(area, { pointerId: 1, clientX: 200, clientY: 100 });
    expect(onValueChange).toHaveBeenLastCalledWith("#000000");
  });

  it("accepts hex, swatches, keeps hue through grays and shows contrast", async () => {
    const onValueChange = vi.fn();
    wrap(<ColorPicker defaultValue="#6d4aff" onValueChange={onValueChange} swatches={["#00c2a8", "#ffffff"]} showScale />);
    const hex = screen.getByRole("textbox", { name: "Hex color" });
    await userEvent.clear(hex);
    await userEvent.type(hex, "0af{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("#00aaff");

    await userEvent.click(screen.getByRole("button", { name: "Use #00c2a8" }));
    expect(screen.getByRole("button", { name: "Use #00c2a8" })).toHaveAttribute("aria-pressed", "true");
    const hueBefore = screen.getByRole("slider", { name: "Hue" }).getAttribute("aria-valuenow");
    await userEvent.click(screen.getByRole("button", { name: "Use #ffffff" }));
    expect(screen.getByRole("slider", { name: "Hue" })).toHaveAttribute("aria-valuenow", hueBefore);

    expect(screen.getByRole("img", { name: /against #ffffff, fails/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /21 to 1 against #000000, passes AAA/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Generated tonal scale" }).children).toHaveLength(12);
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<ColorPicker showScale />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ColorInput", () => {
  it("commits valid hex on blur, reverts invalid text and opens the picker", async () => {
    const onValueChange = vi.fn();
    wrap(
      <FormField label="Brand color">
        <ColorInput defaultValue="#6d4aff" onValueChange={onValueChange} name="brand" />
      </FormField>,
    );
    const input = screen.getByLabelText("Brand color");
    expect(input).toHaveValue("#6d4aff");
    expect(input).toHaveAttribute("name", "brand");
    await userEvent.clear(input);
    await userEvent.type(input, "nope");
    await userEvent.tab();
    expect(input).toHaveValue("#6d4aff");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.clear(input);
    await userEvent.type(input, "#00C2A8{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("#00c2a8");

    await userEvent.click(screen.getByRole("button", { name: "Open color picker" }));
    expect(screen.getByRole("textbox", { name: "Hex color" })).toHaveValue("#00c2a8");
    await userEvent.click(screen.getAllByRole("button", { name: /Use #/, pressed: false })[0]!);
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(input).toHaveValue(onValueChange.mock.calls[1]![0]);
  });

  it("has no axe violations", async () => {
    const { container } = wrap(
      <FormField label="Accent">
        <ColorInput />
      </FormField>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
