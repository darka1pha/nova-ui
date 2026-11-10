import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MentionTextarea, type MentionOption } from "../src/experimental.ts";
import { FormField, ThemeProvider } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const people: MentionOption[] = [
  { value: "u1", label: "Sara Ahmadi", description: "Port captain" },
  { value: "u2", label: "Reza Omrani", description: "Director" },
  { value: "u3", label: "Sam Karimi" },
];
const tags: MentionOption[] = [
  { value: "t1", label: "customs" },
  { value: "t2", label: "berthing" },
];

function setup(props: Partial<React.ComponentProps<typeof MentionTextarea>> = {}) {
  const onValueChange = vi.fn();
  const onMention = vi.fn();
  const utils = render(
    <FormField label="Note">
      <MentionTextarea triggers={[{ char: "@", options: people }, { char: "#", options: tags }]} onValueChange={onValueChange} onMention={onMention} {...props} />
    </FormField>,
  );
  return { ...utils, onValueChange, onMention, textbox: screen.getByRole("textbox", { name: "Note" }) };
}

describe("MentionTextarea", () => {
  it("suggests after a trigger at the start of a word and inserts with Enter", async () => {
    const user = userEvent.setup();
    const { textbox, onValueChange, onMention, container } = setup();
    await user.type(textbox, "Ask @sa");
    const list = screen.getByRole("listbox");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Sara AhmadiPort captain", "Sam Karimi"]);
    expect(textbox).toHaveAttribute("aria-controls", list.id);
    expect(textbox).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[0]?.id);
    expect(await axeViolations(container)).toEqual([]);

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("Ask @Sam Karimi ");
    expect(onMention).toHaveBeenCalledWith(people[2], "@");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("ignores a trigger inside a word, and supports several triggers", async () => {
    const user = userEvent.setup();
    const { textbox, onValueChange } = setup();
    await user.type(textbox, "mail@sa");
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.type(textbox, " #cu");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["customs"]);
    await user.keyboard("{Tab}");
    expect(onValueChange).toHaveBeenLastCalledWith("mail@sa #customs ");
  });

  it("closes with Escape until the query changes, and on a space", async () => {
    const user = userEvent.setup();
    const { textbox } = setup();
    await user.type(textbox, "@r");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.type(textbox, "e");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Reza OmraniDirector"]);
    await user.type(textbox, " ");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("inserts on click without losing focus", async () => {
    const user = userEvent.setup();
    const { textbox, onValueChange } = setup();
    await user.type(textbox, "Hi @");
    await user.click(screen.getByRole("option", { name: /Reza/ }));
    expect(onValueChange).toHaveBeenLastCalledWith("Hi @Reza Omrani ");
    await waitFor(() => expect(textbox).toHaveFocus());
  });

  it("loads options asynchronously, debounced, and aborts older queries", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const signals: AbortSignal[] = [];
    const loadOptions = vi.fn((query: string, signal: AbortSignal) => {
      signals.push(signal);
      return Promise.resolve(people.filter((p) => p.label.toLowerCase().startsWith(query.toLowerCase())));
    });
    render(
      <ThemeProvider dir="rtl">
        <MentionTextarea aria-label="Note" triggers={[{ char: "@", loadOptions }]} debounceMs={100} />
      </ThemeProvider>,
    );
    await user.type(screen.getByRole("textbox", { name: "Note" }), "@s");
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    await user.type(screen.getByRole("textbox"), "ar");
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    await waitFor(() => expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Sara AhmadiPort captain"]));
    // Only the last query ran: the debounce dropped "s", and nothing older is pending.
    expect(loadOptions).toHaveBeenLastCalledWith("sar", expect.any(AbortSignal));
    // Every earlier request was aborted once a newer query came in.
    expect(signals.slice(0, -1).every((s) => s.aborted)).toBe(true);
    expect(screen.getByText("1 suggestion")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
