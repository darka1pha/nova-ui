import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  AnimatedBorder,
  AnimatedNumber,
  Banner,
  Button,
  Calendar,
  Carousel,
  Chip,
  CircularProgress,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CopyButton,
  DatePicker,
  FileDropzone,
  FormField,
  GradientText,
  Marquee,
  PinInput,
  Rating,
  Reveal,
  Sparkline,
  SpotlightCard,
  Stat,
  Stepper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TagInput,
  ThemeProvider,
  Timeline,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) => render(<ThemeProvider {...props}>{ui}</ThemeProvider>);

describe("motion tokens", () => {
  it("motionStyle sets the interaction tokens", () => {
    wrap(<span>x</span>, { motionStyle: "expressive" });
    const root = screen.getByText("x").closest(".nv-theme") as HTMLElement;
    expect(root).toHaveAttribute("data-nv-motion-style", "expressive");
    expect(root.style.getPropertyValue("--nv-press-scale")).toBe("0.94");
    expect(root.style.getPropertyValue("--nv-ease-interactive")).toMatch(/^linear\(/);
  });

  it("presets carry their own motion personality", () => {
    wrap(<span>calm</span>, { theme: "minimal" });
    expect(screen.getByText("calm").closest(".nv-theme")).toHaveAttribute("data-nv-motion-style", "subtle");
  });

  it("Button ripple spawns an ink element on press and cleans it up", () => {
    vi.useFakeTimers();
    wrap(<Button ripple>Tap</Button>);
    const btn = screen.getByRole("button", { name: "Tap" });
    fireEvent.pointerDown(btn, { clientX: 10, clientY: 10 });
    expect(btn.querySelector(".animate-nv-ripple")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1100));
    expect(btn.querySelector(".animate-nv-ripple")).toBeNull();
    vi.useRealTimers();
  });

  it("Tabs render a sliding indicator once measured", async () => {
    wrap(
      <Tabs defaultValue="a">
        <TabsList aria-label="t">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A</TabsContent>
        <TabsContent value="b">B</TabsContent>
      </Tabs>,
    );
    const list = screen.getByRole("tablist");
    await waitFor(() => expect(list).toHaveAttribute("data-indicator", "ready"));
    expect(list.querySelector("[data-tabs-indicator]")).not.toBeNull();
  });

  it("AnimatedNumber exposes only the final value to assistive tech", () => {
    wrap(<AnimatedNumber value={1234} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locale="en-US" />);
    expect(screen.getByText("$1,234", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("Reveal keeps content visible when IntersectionObserver is unavailable", () => {
    wrap(<Reveal>Hello</Reveal>);
    const el = screen.getByText("Hello");
    expect(el).toHaveAttribute("data-reveal", "idle");
    expect(el.className).not.toContain("opacity-0");
  });

  it("Marquee hides its duplicate copy from assistive tech", () => {
    wrap(
      <Marquee>
        <span>Logo</span>
      </Marquee>,
    );
    const copies = screen.getAllByText("Logo", { ignore: false });
    expect(copies).toHaveLength(2);
    expect(copies[1]!.closest("[aria-hidden]")).not.toBeNull();
  });
});

describe("Chip, CopyButton, Rating", () => {
  it("selectable Chip toggles aria-pressed and removable Chip calls onRemove", async () => {
    function Demo() {
      const [on, setOn] = useState(false);
      return (
        <Chip selected={on} onSelectedChange={setOn} onRemove={onRemove}>
          Design
        </Chip>
      );
    }
    const onRemove = vi.fn();
    wrap(<Demo />);
    const toggle = screen.getByRole("button", { name: "Design" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Remove Design" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("CopyButton writes to the clipboard and announces it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    wrap(<CopyButton value="npm i @darkalpha/nova-ui" label="Copy" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    });
    expect(writeText).toHaveBeenCalledWith("npm i @darkalpha/nova-ui");
    expect(await screen.findByRole("status")).toHaveTextContent("Copied");
  });

  it("Rating uses native radios and reports the chosen value", async () => {
    const onValueChange = vi.fn();
    wrap(<Rating label="Rate it" onValueChange={onValueChange} />);
    expect(screen.getByRole("radiogroup", { name: "Rate it" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onValueChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("radio", { name: "4 stars" })).toBeChecked();
  });

  it("read-only Rating is a single labelled image", () => {
    wrap(<Rating readOnly value={3} />);
    expect(screen.getByRole("img", { name: "3 out of 5" })).toBeInTheDocument();
  });
});

describe("PinInput, TagInput, FileDropzone", () => {
  it("PinInput advances, supports paste and completes", async () => {
    const onComplete = vi.fn();
    wrap(<PinInput length={4} onComplete={onComplete} />);
    const boxes = screen.getAllByRole("textbox");
    boxes[0]!.focus();
    await userEvent.keyboard("12");
    expect(boxes[2]).toHaveFocus();
    await userEvent.keyboard("{Backspace}");
    expect(boxes[1]).toHaveFocus();
    expect(boxes[1]).toHaveValue("");
    boxes[0]!.focus();
    await userEvent.paste("9876");
    expect(onComplete).toHaveBeenCalledWith("9876");
  });

  it("PinInput rejects letters in numeric mode and wires FormField", async () => {
    wrap(
      <FormField label="Code" error="Wrong code">
        <PinInput length={3} />
      </FormField>,
    );
    const group = screen.getByRole("group", { name: "Code" });
    const first = within(group).getAllByRole("textbox")[0]!;
    expect(first).toHaveAccessibleName("Character 1 of 3");
    expect(first).toHaveAttribute("aria-invalid", "true");
    first.focus();
    await userEvent.keyboard("a");
    expect(first).toHaveValue("");
  });

  it("TagInput adds on Enter and comma, removes on Backspace, de-duplicates", async () => {
    const onValueChange = vi.fn();
    wrap(<TagInput aria-label="Tags" onValueChange={onValueChange} />);
    const input = screen.getByRole("textbox", { name: "Tags" });
    await userEvent.type(input, "react{Enter}vue,react{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(["react", "vue"]);
    await userEvent.type(input, "{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith(["react"]);
  });

  it("FileDropzone accepts matching files and rejects oversized ones", async () => {
    const onFilesChange = vi.fn();
    const onReject = vi.fn();
    const { container } = wrap(<FileDropzone accept="image/*" maxSize={10} onFilesChange={onFilesChange} onReject={onReject} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const ok = new File(["12345"], "a.png", { type: "image/png" });
    const big = new File(["x".repeat(50)], "b.png", { type: "image/png" });
    const pdf = new File(["1"], "c.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [ok, big, pdf] } });
    expect(onFilesChange).toHaveBeenCalledWith([ok]);
    expect(onReject).toHaveBeenCalledWith([
      { file: big, reason: "size" },
      { file: pdf, reason: "type" },
    ]);
    expect(screen.getByRole("button", { name: "Remove a.png" })).toBeInTheDocument();
  });
});

describe("Calendar and DatePicker", () => {
  const june15 = new Date(2026, 5, 15);

  it("navigates with the keyboard and selects with Enter", async () => {
    const onValueChange = vi.fn();
    wrap(<Calendar defaultValue={june15} onValueChange={onValueChange} locale="en-US" weekStartsOn={0} />);
    const day = screen.getByRole("button", { name: /June 15, 2026/ });
    expect(day).toHaveAttribute("tabindex", "0");
    expect(day.closest('[role="gridcell"]')).toHaveAttribute("aria-selected", "true");
    day.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    expect(screen.getByRole("button", { name: /June 23, 2026/ })).toHaveFocus();
    await userEvent.keyboard("{PageDown}");
    expect(screen.getByRole("button", { name: /July 23, 2026/ })).toHaveFocus();
    expect(screen.getByText("July 2026")).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 6, 23));
  });

  it("mirrors left/right arrows in RTL and respects min", async () => {
    const onValueChange = vi.fn();
    wrap(<Calendar defaultValue={june15} min={new Date(2026, 5, 10)} onValueChange={onValueChange} locale="en-US" />, { dir: "rtl" });
    screen.getByRole("button", { name: /June 15, 2026/ }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: /June 16, 2026/ })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: /June 5, 2026/ }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("DatePicker opens on the selected day and closes after choosing", async () => {
    const onValueChange = vi.fn();
    wrap(
      <FormField label="Start date">
        <DatePicker defaultValue={june15} onValueChange={onValueChange} locale="en-US" />
      </FormField>,
    );
    const field = screen.getByLabelText("Start date");
    expect(field).toHaveTextContent("Jun 15, 2026");
    await userEvent.click(field);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByRole("button", { name: /June 15, 2026/ })).toHaveFocus());
    await userEvent.click(within(dialog).getByRole("button", { name: /June 20, 2026/ }));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 20));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(field).toHaveTextContent("Jun 20, 2026");
  });
});

describe("Display components", () => {
  it("CircularProgress exposes progressbar semantics", () => {
    wrap(<CircularProgress aria-label="Storage" value={42} />);
    const bar = screen.getByRole("progressbar", { name: "Storage" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveTextContent("42%");
  });

  it("Stepper marks the current step and lets completed steps be revisited", async () => {
    const onStepClick = vi.fn();
    wrap(<Stepper current={1} steps={[{ title: "Account" }, { title: "Profile" }, { title: "Done" }]} onStepClick={onStepClick} />);
    expect(screen.getByText("Profile").closest("li")).toHaveAttribute("aria-current", "step");
    await userEvent.click(screen.getByRole("button", { name: /Account/ }));
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("Stat counts to its value and shows a signed delta", () => {
    wrap(<Stat label="Revenue" value={4200} delta={12.5} locale="en-US" />);
    expect(screen.getByText("4,200", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
  });

  it("Carousel follows the ARIA carousel pattern", async () => {
    wrap(
      <Carousel label="Featured">
        <div>One</div>
        <div>Two</div>
        <div>Three</div>
      </Carousel>,
    );
    expect(screen.getByRole("region", { name: "Featured" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("group", { name: "2 of 3" })).toHaveAttribute("aria-roledescription", "slide");
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true");
  });

  it("Carousel previous/next work when several slides are visible", async () => {
    // Fake layout: 5 slides of 352px with a 16px gap in a 766px track, so two show at once.
    const SLIDE = 352;
    const STEP = SLIDE + 16;
    const user = userEvent.setup();
    wrap(
      <Carousel label="Themes" slideSize="352px">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n}>Slide {n}</div>
        ))}
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Themes" });
    const track = region.querySelector<HTMLElement>("[tabindex='0']");
    if (!track) throw new Error("track not found");
    Object.defineProperty(track, "clientWidth", { configurable: true, value: 766 });
    Object.defineProperty(track, "scrollWidth", { configurable: true, value: STEP * 5 - 16 });
    track.getBoundingClientRect = () => ({ left: 0, right: 766, top: 0, bottom: 200, width: 766, height: 200, x: 0, y: 0, toJSON: () => ({}) });
    track.querySelectorAll<HTMLElement>("[data-index]").forEach((slide, i) => {
      slide.getBoundingClientRect = () => {
        const left = i * STEP - track.scrollLeft;
        return { left, right: left + SLIDE, top: 0, bottom: 200, width: SLIDE, height: 200, x: left, y: 0, toJSON: () => ({}) };
      };
    });
    track.scrollTo = ((opts: ScrollToOptions) => {
      track.scrollLeft = Math.min(opts.left ?? 0, STEP * 5 - 16 - 766);
      track.dispatchEvent(new Event("scroll"));
    }) as typeof track.scrollTo;
    track.dispatchEvent(new Event("scroll"));

    const previous = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    // Position is measured on the next frame after a scroll.
    await waitFor(() => expect(next).toBeEnabled());
    expect(previous).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true");

    await user.click(next);
    expect(track.scrollLeft).toBe(STEP);
    await waitFor(() => expect(screen.getByRole("button", { name: "Go to slide 2" })).toHaveAttribute("aria-current", "true"));
    expect(previous).toBeEnabled();

    // The bug: Previous did nothing because the carousel thought it was already further along.
    await user.click(previous);
    expect(track.scrollLeft).toBe(0);
    await waitFor(() => expect(previous).toBeDisabled());
    expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true");
  });

  it("Collapsible toggles its content", async () => {
    wrap(
      <Collapsible>
        <CollapsibleTrigger>More</CollapsibleTrigger>
        <CollapsibleContent>Hidden details</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.queryByText("Hidden details")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByText("Hidden details")).toBeVisible();
  });

  it("new components pass axe", async () => {
    const { container } = wrap(
      <main>
        <Banner onDismiss={() => {}}>Launch week</Banner>
        <GradientText animate>Vivid</GradientText>
        <SpotlightCard>Spot</SpotlightCard>
        <AnimatedBorder>Border</AnimatedBorder>
        <Chip selected onSelectedChange={() => {}}>
          Filter
        </Chip>
        <Rating label="Rating" defaultValue={3} />
        <FormField label="Code">
          <PinInput length={4} />
        </FormField>
        <FormField label="Tags">
          <TagInput defaultValue={["a"]} />
        </FormField>
        <FileDropzone description="PNG up to 2 MB" />
        <Calendar defaultValue={new Date(2026, 0, 10)} />
        <CircularProgress aria-label="Done" value={70} />
        <Stepper current={1} steps={[{ title: "One" }, { title: "Two" }]} />
        <Timeline items={[{ title: "Created", time: "Today" }]} />
        <Sparkline data={[1, 3, 2, 5]} label="Trend up" />
        <Stat label="Users" value={12} />
        <Carousel label="Gallery">
          <div>A</div>
          <div>B</div>
        </Carousel>
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
