import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox, ThemeProvider, type ComboboxOption } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

const cities: ComboboxOption[] = [
  { value: "thr", label: "Tehran" },
  { value: "isf", label: "Isfahan" },
  { value: "shz", label: "Shiraz" },
  { value: "tbz", label: "Tabriz" },
];

describe("Combobox loadOptions", () => {
  it("loads on open, searches the server per query and aborts stale requests", async () => {
    const signals: AbortSignal[] = [];
    const loadOptions = vi.fn(async (query: string, signal: AbortSignal) => {
      signals.push(signal);
      return cities.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
    });
    const onValueChange = vi.fn();
    wrap(<Combobox aria-label="City" loadOptions={loadOptions} debounceMs={10} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("combobox", { name: "City" }));
    expect(await screen.findByRole("option", { name: "Tehran" })).toBeInTheDocument();
    expect(loadOptions).toHaveBeenNthCalledWith(1, "", expect.any(AbortSignal));

    await userEvent.keyboard("shi");
    // Wait for the results themselves: options also disappear while the query is loading.
    expect(await screen.findByRole("option", { name: "Shiraz" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Tehran" })).not.toBeInTheDocument();
    // Earlier queries were superseded; the last one ran with the full text.
    expect(loadOptions).toHaveBeenLastCalledWith("shi", expect.any(AbortSignal));
    expect(signals.slice(0, -1).every((s) => s.aborted)).toBe(true);

    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("shz");
    // The label stays although the next load won't contain it until opened.
    expect(screen.getByRole("combobox")).toHaveTextContent("Shiraz");
  });

  it("shows loading and error states", async () => {
    let reject!: (e: Error) => void;
    const loadOptions = vi.fn(() => new Promise<ComboboxOption[]>((_, r) => (reject = r)));
    wrap(<Combobox aria-label="City" loadOptions={loadOptions} loadingMessage="Searching…" errorMessage="Search failed" />);
    await userEvent.click(screen.getByRole("combobox", { name: "City" }));
    expect(await screen.findByText("Searching…")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    reject(new Error("offline"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Search failed");
  });

  it("has no axe violations with results open", async () => {
    const { baseElement } = wrap(<Combobox aria-label="City" loadOptions={() => cities} />);
    await userEvent.click(screen.getByRole("combobox", { name: "City" }));
    await screen.findByRole("option", { name: "Tabriz" });
    expect(await axeViolations(baseElement)).toEqual([]);
  });
});

describe("Combobox creatable", () => {
  it("offers to create a value that isn't listed and selects it", async () => {
    const onValueChange = vi.fn();
    wrap(<Combobox aria-label="Tag" options={cities} creatable onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("combobox", { name: "Tag" }));
    await userEvent.keyboard("tehran");
    // An exact (case-insensitive) match hides the create item.
    expect(screen.queryByRole("option", { name: /Create/ })).not.toBeInTheDocument();
    await userEvent.keyboard("{Backspace>6/}Yazd");
    const create = await screen.findByRole("option", { name: 'Create "Yazd"' });
    expect(screen.queryByText("No results.")).not.toBeInTheDocument();
    await userEvent.click(create);
    expect(onValueChange).toHaveBeenCalledWith("Yazd");
    expect(screen.getByRole("combobox")).toHaveTextContent("Yazd");
  });

  it("uses the option onCreate returns", async () => {
    const onCreate = vi.fn(async (label: string) => ({ value: "new-1", label: label.toUpperCase() }));
    const onValueChange = vi.fn();
    wrap(<Combobox aria-label="Tag" options={cities} creatable onCreate={onCreate} formatCreateLabel={(q) => `Add ${q}`} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("combobox", { name: "Tag" }));
    await userEvent.keyboard("kish");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("new-1"));
    expect(onCreate).toHaveBeenCalledWith("kish");
    expect(screen.getByRole("combobox")).toHaveTextContent("KISH");
  });
});
