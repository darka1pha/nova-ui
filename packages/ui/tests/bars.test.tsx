import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  ThemeProvider,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

function AppMenus({ onExport = () => {} }: { onExport?: () => void }) {
  return (
    <Menubar aria-label="Application">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New voyage</MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Export</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={onExport}>Manifest (CSV)</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem destructive>Close</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked>Show berths</MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

describe("Menubar", () => {
  it("opens menus, moves between them and reaches submenus by keyboard", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<AppMenus onExport={onExport} />);
    const file = screen.getByRole("menuitem", { name: "File" });
    file.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowDown}");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "New voyage" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    const csv = await screen.findByRole("menuitem", { name: "Manifest (CSV)" });
    expect(csv).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("marks destructive items and checkbox items", async () => {
    const user = userEvent.setup();
    render(<AppMenus />);
    await user.click(screen.getByRole("menuitem", { name: "View" }));
    expect(await screen.findByRole("menuitemcheckbox", { name: "Show berths" })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("menuitem", { name: "File" }));
    expect(await screen.findByRole("menuitem", { name: "Close" })).toHaveClass("text-danger-text");
  });

  it("mirrors Left/Right in RTL", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider dir="rtl">
        <AppMenus />
      </ThemeProvider>,
    );
    screen.getByRole("menuitem", { name: "File" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveFocus();
  });

  it("passes axe", async () => {
    const { container } = render(<AppMenus />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

function Editor({ onPrint = () => {} }: { onPrint?: () => void }) {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarToggleGroup type="multiple" aria-label="Text style" defaultValue={["bold"]}>
        <ToolbarToggleItem value="bold" aria-label="Bold">
          B
        </ToolbarToggleItem>
        <ToolbarToggleItem value="italic" aria-label="Italic">
          I
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton onClick={onPrint}>Print</ToolbarButton>
    </Toolbar>
  );
}

describe("Toolbar", () => {
  it("has one tab stop and arrow-key roving", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Editor />
      </>,
    );
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toHaveAttribute("aria-orientation", "horizontal");
    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("button", { name: "Print" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
  });

  it("toggles items and runs buttons", async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();
    render(<Editor onPrint={onPrint} />);
    const bold = screen.getByRole("button", { name: "Bold" });
    const italic = screen.getByRole("button", { name: "Italic" });
    expect(bold).toHaveAttribute("aria-pressed", "true");
    await user.click(italic);
    expect(italic).toHaveAttribute("aria-pressed", "true");
    await user.click(bold);
    expect(bold).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Print" }));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it("passes axe", async () => {
    const { container } = render(<Editor />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
