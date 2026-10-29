import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Bold } from "lucide-react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarGroup,
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  FormField,
  IconButton,
  Input,
  LoadingState,
  NumberInput,
  Pagination,
  Progress,
  Radio,
  RadioGroup,
  SearchInput,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ThemeProvider,
  Toaster,
  Toggle,
  toast,
  getPageItems,
} from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Button", () => {
  it("renders a native button with type=button by default", () => {
    wrap(<Button>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn.className).toContain("bg-primary");
  });

  it("applies variants and merges consumer classes predictably", () => {
    wrap(
      <Button variant="danger" size="lg" className="px-10 my-custom-class">
        Delete
      </Button>,
    );
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("bg-danger");
    expect(cls).toContain("my-custom-class");
    expect(cls).toContain("px-10");
    expect(cls).not.toContain("px-(--ks-control-px-lg)");
  });

  it("loading disables, sets aria-busy and shows loading text", async () => {
    const onClick = vi.fn();
    wrap(
      <Button loading loadingText="Saving…" onClick={onClick}>
        Save
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Saving…" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("asChild renders a link with button styling", () => {
    wrap(
      <Button asChild variant="outline">
        <a href="/start">Start</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Start" });
    expect(link).toHaveAttribute("href", "/start");
    expect(link.className).toContain("border-input");
  });

  it("ButtonGroup shares variant with its buttons", () => {
    wrap(
      <ButtonGroup variant="outline" attached>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" }).className).toContain("border-input");
  });

  it("IconButton exposes its aria-label", () => {
    wrap(<IconButton aria-label="Bold"><Bold /></IconButton>);
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });

  it("Toggle reflects pressed state", async () => {
    wrap(<Toggle aria-label="Bold">B</Toggle>);
    const t = screen.getByRole("button", { name: "Bold" });
    expect(t).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(t);
    expect(t).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Forms", () => {
  it("FormField wires label, description and error to the control", () => {
    wrap(
      <FormField label="Email" description="We never share it." error="Enter a valid email" required>
        <Input placeholder="you@example.com" />
      </FormField>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription(/We never share it\. .*Enter a valid email/);
    // Messages live in a polite live region that exists before the error appears.
    const message = screen.getByText("Enter a valid email");
    expect(message.closest("[aria-live=polite]")).not.toBeNull();
  });

  it("Checkbox toggles with keyboard and supports indeterminate", async () => {
    wrap(
      <>
        <FormField label="Accept terms" inline>
          <Checkbox />
        </FormField>
        <Checkbox aria-label="Mixed" checked="indeterminate" />
      </>,
    );
    const cb = screen.getByRole("checkbox", { name: "Accept terms" });
    cb.focus();
    await userEvent.keyboard(" ");
    expect(cb).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Mixed" })).toHaveAttribute("aria-checked", "mixed");
  });

  it("RadioGroup moves focus with arrow keys and selects with Space", async () => {
    // Radix moves roving focus in a timeout, so arrow-to-select (which relies on
    // the key still being held) is browser-only; verified in Playwright.
    wrap(
      <RadioGroup aria-label="Plan" defaultValue="a">
        <Radio value="a" aria-label="Starter" />
        <Radio value="b" aria-label="Pro" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeInTheDocument();
    screen.getByRole("radio", { name: "Starter" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    const pro = screen.getByRole("radio", { name: "Pro" });
    await waitFor(() => expect(pro).toHaveFocus());
    await userEvent.keyboard(" ");
    expect(pro).toBeChecked();
  });

  it("Switch toggles", async () => {
    wrap(<Switch aria-label="Notifications" />);
    const sw = screen.getByRole("switch");
    await userEvent.click(sw);
    expect(sw).toBeChecked();
  });

  it("NumberInput steps with keys and clamps to bounds", async () => {
    const onValueChange = vi.fn();
    wrap(<NumberInput aria-label="Seats" defaultValue={9} min={0} max={10} onValueChange={onValueChange} />);
    const input = screen.getByRole("spinbutton", { name: "Seats" });
    input.focus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    expect(input).toHaveAttribute("aria-valuenow", "10");
    await userEvent.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it("NumberInput parses typed values on blur", async () => {
    const onValueChange = vi.fn();
    wrap(<NumberInput aria-label="Price" onValueChange={onValueChange} />);
    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "12.5");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(12.5);
  });

  it("SearchInput clears with the button and with Escape", async () => {
    const onClear = vi.fn();
    wrap(<SearchInput aria-label="Search" onClear={onClear} />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "kale");
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    await userEvent.type(input, "x{Escape}");
    expect(input).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(2);
  });

  it("Combobox filters and selects an option", async () => {
    const onValueChange = vi.fn();
    wrap(
      <Combobox
        aria-label="Framework"
        options={[
          { value: "react", label: "React" },
          { value: "vue", label: "Vue" },
          { value: "svelte", label: "Svelte" },
        ]}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Framework" }));
    await userEvent.keyboard("sve");
    await waitFor(() => expect(screen.queryByText("React")).not.toBeInTheDocument());
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("svelte");
    expect(screen.getByRole("combobox")).toHaveTextContent("Svelte");
  });
});

describe("Overlays", () => {
  it("Dialog traps focus, closes on Escape and restores focus", async () => {
    wrap(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Invite</DialogTitle>
          <DialogDescription>Send an invite.</DialogDescription>
          <Input aria-label="Email" />
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Invite" });
    expect(dialog).toHaveAccessibleDescription("Send an invite.");
    expect(dialog.contains(document.activeElement)).toBe(true);
    // Portaled into the theme's portal root, so it inherits theme variables.
    expect(dialog.closest(".ks-theme")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("AlertDialog requires an explicit choice", async () => {
    const onConfirm = vi.fn();
    wrap(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="danger">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("DropdownMenu opens from the keyboard and activates items", async () => {
    const onSelect = vi.fn();
    wrap(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Rename</DropdownMenuItem>
          <DropdownMenuItem destructive>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    screen.getByRole("button", { name: "Actions" }).focus();
    await userEvent.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(2);
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("Navigation", () => {
  it("Tabs switch panels with arrow keys", async () => {
    wrap(
      <Tabs defaultValue="a">
        <TabsList aria-label="Sections">
          <TabsTrigger value="a">Overview</TabsTrigger>
          <TabsTrigger value="b">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Overview panel</TabsContent>
        <TabsContent value="b">Activity panel</TabsContent>
      </Tabs>,
    );
    screen.getByRole("tab", { name: "Overview" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Activity panel");
  });

  it("Accordion expands and collapses", async () => {
    wrap(
      <Accordion type="single" collapsible>
        <AccordionItem value="1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Is it accessible?" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Yes.")).toBeVisible();
  });

  it("Breadcrumbs mark the current page", () => {
    wrap(
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem current>Settings</BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByText("Settings")).toHaveAttribute("aria-current", "page");
  });

  it("Pagination computes ellipses and reports page changes", async () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(10, 20)).toEqual([1, "ellipsis-start", 9, 10, 11, "ellipsis-end", 20]);
    const onPageChange = vi.fn();
    wrap(<Pagination page={1} pageCount={20} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe("Data", () => {
  type Row = { id: string; name: string; seats: number };
  const data: Row[] = [
    { id: "1", name: "Beta", seats: 12 },
    { id: "2", name: "alpha", seats: 3 },
    { id: "3", name: "Gamma", seats: 40 },
  ];
  const columns = [
    { id: "name", header: "Name", sortable: true },
    { id: "seats", header: "Seats", sortable: true, align: "end" as const },
  ];

  it("DataTable sorts with aria-sort and locale-aware comparison", async () => {
    wrap(<DataTable data={data} columns={columns} getRowId={(r) => r.id} />);
    const header = screen.getByRole("columnheader", { name: /Name/ });
    expect(header).toHaveAttribute("aria-sort", "none");
    await userEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    const names = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0]!.textContent);
    expect(names()).toEqual(["alpha", "Beta", "Gamma"]);
    await userEvent.click(within(header).getByRole("button"));
    expect(names()).toEqual(["Gamma", "Beta", "alpha"]);
  });

  it("DataTable selects rows and all rows", async () => {
    const onSelectionChange = vi.fn();
    wrap(<DataTable data={data} columns={columns} getRowId={(r) => r.id} selectable onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row 1" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["1"]);
    expect(screen.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute("aria-checked", "mixed");
    await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["1", "2", "3"]);
  });

  it("DataTable shows loading and empty states", () => {
    const { rerender } = wrap(<DataTable data={[]} columns={columns} getRowId={(r: Row) => r.id} loading />);
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    rerender(
      <ThemeProvider>
        <DataTable data={[]} columns={columns} getRowId={(r: Row) => r.id} />
      </ThemeProvider>,
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
  });
});

describe("Feedback", () => {
  it("Alert uses alert role for danger and status otherwise, and can be dismissed", async () => {
    const onDismiss = vi.fn();
    wrap(
      <>
        <Alert variant="danger" title="Payment failed" />
        <Alert variant="success" title="Saved" onDismiss={onDismiss} />
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Payment failed");
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("Progress exposes value semantics and an indeterminate state", () => {
    wrap(
      <>
        <Progress aria-label="Upload" value={40} />
        <Progress aria-label="Sync" />
      </>,
    );
    expect(screen.getByRole("progressbar", { name: "Upload" })).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByRole("progressbar", { name: "Sync" })).not.toHaveAttribute("aria-valuenow");
  });

  it("toast() shows a notification through the Toaster", async () => {
    wrap(<Toaster />);
    toast.success("Changes saved", { description: "All good." });
    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    toast.dismiss();
  });

  it("Avatar falls back to initials and AvatarGroup counts overflow", () => {
    wrap(
      <AvatarGroup max={2}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
      </AvatarGroup>,
    );
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveTextContent("AL");
    expect(screen.getByRole("img", { name: "1 more" })).toHaveTextContent("+1");
  });
});

describe("Accessibility (axe)", () => {
  it("a composed screen has no axe violations", async () => {
    function Screen() {
      const [page, setPage] = useState(1);
      return (
        <main>
          <Card>
            <CardHeader>
              <CardTitle level={2}>Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success">Ready</Badge>
              <FormField label="Email" description="Work email">
                <Input type="email" />
              </FormField>
              <FormField label="Notifications" inline>
                <Switch />
              </FormField>
              <Button>Get started</Button>
              <IconButton aria-label="Bold">
                <Bold />
              </IconButton>
              <Alert variant="warning" title="Review required" />
              <Progress aria-label="Setup" value={60} />
              <EmptyState title="No projects" />
              <LoadingState />
              <Pagination page={page} pageCount={5} onPageChange={setPage} />
            </CardContent>
          </Card>
        </main>
      );
    }
    const { container } = wrap(<Screen />);
    expect(await axeViolations(container)).toEqual([]);
  });

  describe("Surface Styles (Glassmorphism, Claymorphism, Neumorphism)", () => {
    it("renders Card variants for glass, clay and neomorphic", () => {
      wrap(
        <div>
          <Card variant="glass" data-testid="card-glass">Glass Card</Card>
          <Card variant="clay" interactive data-testid="card-clay">Clay Card</Card>
          <Card variant="neomorphic" data-testid="card-neomorph">Neomorphic Card</Card>
        </div>,
      );
      const glass = screen.getByTestId("card-glass");
      expect(glass.className).toContain("backdrop-blur");
      const clay = screen.getByTestId("card-clay");
      expect(clay.className).toContain("shadow-(--ks-shadow-clay)");
      const neomorph = screen.getByTestId("card-neomorph");
      expect(neomorph.className).toContain("shadow-(--ks-shadow-neomorph)");
    });

    it("renders Button and Badge with glass and clay styles", () => {
      wrap(
        <div>
          <Button variant="glass">Glass Button</Button>
          <Button variant="clay">Clay Button</Button>
          <Button variant="neomorphic">Neomorph Button</Button>
          <Badge appearance="glass">Glass Badge</Badge>
          <Badge appearance="clay">Clay Badge</Badge>
        </div>,
      );
      expect(screen.getByRole("button", { name: "Glass Button" }).className).toContain("backdrop-blur");
      expect(screen.getByRole("button", { name: "Clay Button" }).className).toContain("shadow-(--ks-shadow-clay-primary)");
      expect(screen.getByRole("button", { name: "Neomorph Button" }).className).toContain("shadow-(--ks-shadow-neomorph)");
      expect(screen.getByText("Glass Badge").className).toContain("backdrop-blur-sm");
      expect(screen.getByText("Clay Badge").className).toContain("shadow-(--ks-shadow-clay)");
    });
  });
});
