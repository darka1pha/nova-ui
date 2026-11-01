import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Image, ImageGallery, Lightbox, ThemeProvider, Tour } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) => render(<ThemeProvider {...props}>{ui}</ThemeProvider>);

const photos = [
  { src: "/a.jpg", alt: "Harbor at dawn", caption: "Bandar Abbas" },
  { src: "/b.jpg", alt: "Desert road" },
  { src: "/c.jpg", alt: "Mountain lake" },
];

describe("Image", () => {
  it("shimmers while loading, fades in on load and falls back on error", () => {
    const { container, rerender } = wrap(<Image src="/a.jpg" alt="Harbor" ratio={16 / 9} />);
    const wrapper = container.querySelector("[data-status]")!;
    expect(wrapper).toHaveAttribute("data-status", "loading");
    expect(wrapper).toHaveStyle({ aspectRatio: String(16 / 9) });
    const img = screen.getByRole("img", { name: "Harbor" });
    expect(img).toHaveAttribute("loading", "lazy");
    fireEvent.load(img);
    expect(wrapper).toHaveAttribute("data-status", "loaded");

    rerender(
      <ThemeProvider>
        <Image src="/missing.jpg" alt="Harbor" />
      </ThemeProvider>,
    );
    fireEvent.error(screen.getByRole("img", { name: "Harbor" }));
    expect(container.querySelector("[data-status]")).toHaveAttribute("data-status", "error");
    expect(screen.getByRole("img", { name: "Harbor" }).tagName).toBe("SPAN");
  });
});

describe("Lightbox", () => {
  function Viewer(props: Partial<React.ComponentProps<typeof Lightbox>>) {
    const [open, setOpen] = useState(true);
    return <Lightbox images={photos} open={open} onOpenChange={setOpen} {...props} />;
  }

  it("moves with buttons and arrow keys, wraps, and announces position", async () => {
    const onIndexChange = vi.fn();
    wrap(<Viewer onIndexChange={onIndexChange} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("1 of 3: Harbor at dawn");
    expect(screen.getByText("Bandar Abbas")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(dialog).toHaveAccessibleName("2 of 3: Desert road");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("img", { name: "Mountain lake" })).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    expect(dialog).toHaveAccessibleName("1 of 3: Harbor at dawn");
    await userEvent.keyboard("{End}");
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
  });

  it("mirrors arrows in RTL and stops at the ends without loop", async () => {
    wrap(<Viewer loop={false} />, { dir: "rtl" });
    expect(screen.getByRole("button", { name: "Previous image" })).toBeDisabled();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("2 of 3: Desert road");
  });

  it("zooms and closes with Escape", async () => {
    wrap(<Viewer />);
    const zoom = screen.getByRole("button", { name: "Zoom in" });
    await userEvent.click(zoom);
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("swipes between images on touch", () => {
    wrap(<Viewer />);
    const stage = screen.getByRole("img", { name: "Harbor at dawn" }).parentElement!;
    fireEvent.pointerDown(stage, { pointerType: "touch", pointerId: 1, clientX: 300 });
    fireEvent.pointerUp(stage, { pointerType: "touch", pointerId: 1, clientX: 150 });
    expect(screen.getByRole("dialog")).toHaveAccessibleName("2 of 3: Desert road");
  });

  it("has no axe violations", async () => {
    wrap(<Viewer />);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe("ImageGallery", () => {
  it("opens the lightbox at the clicked thumbnail and returns focus", async () => {
    wrap(<ImageGallery images={photos} />);
    const thumb = screen.getByRole("button", { name: "View Desert road" });
    await userEvent.click(thumb);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("2 of 3: Desert road");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(thumb).toHaveFocus());
  });
});

describe("Tour", () => {
  function Page({ onFinish }: { onFinish?: () => void }) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button id="create">Create</button>
        <input aria-label="Search" id="search" />
        <Tour
          open={open}
          onOpenChange={setOpen}
          onFinish={onFinish}
          steps={[
            { target: "#create", title: "Create things", content: "Start a new project here." },
            { target: "#missing", title: "Hidden", content: "Not on this page." },
            { target: "#search", title: "Find anything", content: "Search across projects." },
          ]}
        />
        <output>{open ? "open" : "closed"}</output>
      </>
    );
  }

  it("walks through steps, skips missing targets and finishes", async () => {
    const onFinish = vi.fn();
    wrap(<Page onFinish={onFinish} />);
    const dialog = await screen.findByRole("dialog", { name: "Create things" });
    expect(dialog).toHaveAccessibleDescription("Start a new project here.");
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(document.querySelector("[data-tour-spotlight]")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Find anything" })).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("dialog", { name: "Create things" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(await screen.findByRole("button", { name: "Done" }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("closed");
  });

  it("ends on Escape or Skip without finishing", async () => {
    const onFinish = vi.fn();
    wrap(<Page onFinish={onFinish} />);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("status")).toHaveTextContent("closed");
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    wrap(<Page />);
    await screen.findByRole("dialog");
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
