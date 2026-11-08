import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  KavehCard,
  KavehContactCard,
  KavehEmptyState,
  KavehFooter,
  KavehHero,
  KavehKpiCard,
  KavehLink,
  KavehLoader,
  KavehMenu,
  KavehNavMenu,
  KavehNotice,
  KavehPageHeader,
  KavehPortCard,
  KavehServiceCard,
  KavehSidebar,
  KavehTable,
  KavehTimeline,
} from "../src/kaveh.ts";
import { axeViolations } from "./axe.ts";

const pixel = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

describe("Kaveh cards", () => {
  it.each(["horizon", "navy", "band", "elevated", "outline"] as const)("renders the %s card with a bilingual title", async (variant) => {
    const { container } = render(<KavehCard variant={variant} title="Ship agency" titleFa="نمایندگی کشتیرانی" description="Port calls and crew change." actions={<button type="button">Open</button>} />);
    expect(screen.getByText("Ship agency")).toBeInTheDocument();
    expect(screen.getByText("نمایندگی کشتیرانی")).toHaveAttribute("dir", "rtl");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("turns a service card into one link when given href", () => {
    render(<KavehServiceCard icon={<svg />} title="Bunkering" titleFa="سوخت‌رسانی" href="#bunkering" />);
    expect(screen.getByRole("link", { name: /Bunkering/ })).toHaveAttribute("href", "#bunkering");
  });

  it("shows a port's status and facts", () => {
    render(<KavehPortCard layout="horizontal" name="Shahid Rajaee" nameFa="بندر شهید رجایی" image={pixel} imageAlt="Port" status="limited" facts={[{ label: "Berths", value: "40" }]} />);
    expect(screen.getByText("Limited")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("links phone and email on a contact card and falls back to initials", () => {
    render(<KavehContactCard name="Sara Ahmadi" role="Port agent" phone="+98 76 1234 5678" email="ops@example.com" />);
    expect(screen.getByRole("link", { name: "+98 76 1234 5678" })).toHaveAttribute("href", "tel:+987612345678");
    expect(screen.getByRole("link", { name: "ops@example.com" })).toHaveAttribute("href", "mailto:ops@example.com");
    expect(screen.getByText("SA")).toBeInTheDocument();
  });

  it("marks a fall as good news when the KPI is inverted", () => {
    render(<KavehKpiCard label="Waiting time" value="3.2 h" delta={-12} invertDelta deltaLabel="vs last month" />);
    expect(screen.getByText(/12%/).closest("span")).toHaveClass("bg-success-subtle");
    expect(screen.getByText("down", { exact: false })).toBeInTheDocument();
  });
});

describe("Kaveh page sections", () => {
  it("renders the hero with its headline and default emblem", () => {
    render(<KavehHero title="Trusted at every port." titleFa="در هر بندر، کنار شما" actions={<a href="#q">Request a quote</a>} />);
    expect(screen.getByRole("heading", { level: 2, name: "Trusted at every port." })).toBeInTheDocument();
    expect(screen.getByText("در هر بندر، کنار شما")).toHaveAttribute("lang", "fa");
  });

  it("renders a page header as the page's h1", () => {
    render(<KavehPageHeader variant="navy" title="Vessels" titleFa="شناورها" actions={<button type="button">Add vessel</button>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Vessels" })).toBeInTheDocument();
  });

  it("names each footer column as a navigation landmark", () => {
    render(<KavehFooter columns={[{ title: "Services", links: [{ label: "Ship agency", href: "#a" }] }]} legal="© 2026 Kaveh" />);
    expect(screen.getByRole("navigation", { name: "Services" })).toContainElement(screen.getByRole("link", { name: "Ship agency" }));
    expect(screen.getByText("© 2026 Kaveh")).toBeInTheDocument();
  });

  it("marks the current milestone", () => {
    render(<KavehTimeline current={1} items={[{ year: 1948, yearFa: "۱۳۲۷", title: "Founded" }, { year: 2026, title: "Today" }]} />);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("aria-current", "step");
  });
});

describe("Kaveh navigation", () => {
  const items = [
    { id: "dash", label: "Dashboard", labelFa: "داشبورد" },
    { id: "fleet", label: "Fleet", badge: 5 },
    { id: "docs", label: "Documents", href: "#docs" },
  ];

  it("marks the active sidebar item and reports clicks", async () => {
    const onNavigate = vi.fn();
    const { container } = render(<KavehSidebar sections={[{ title: "Operations", items }]} activeId="fleet" onNavigate={onNavigate} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("button", { name: /Fleet/ })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(nav).getByRole("button", { name: /Dashboard/ }));
    expect(onNavigate).toHaveBeenCalledWith("dash");
    expect(within(nav).getByRole("link", { name: "Documents" })).toHaveAttribute("href", "#docs");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("keeps labels for screen readers when collapsed", () => {
    render(<KavehSidebar collapsed sections={[{ items }]} />);
    expect(screen.getByRole("button", { name: /Dashboard/ })).toHaveAttribute("title", "Dashboard");
  });

  it.each(["underline", "pill", "band"] as const)("marks the active link in the %s nav menu", (variant) => {
    render(<KavehNavMenu variant={variant} items={items} activeId="docs" />);
    expect(screen.getByRole("link", { name: "Documents" })).toHaveAttribute("aria-current", "page");
  });

  it("opens the dropdown and runs an item", async () => {
    const onSelect = vi.fn();
    render(<KavehMenu variant="navy" header="Sara Ahmadi" items={[{ label: "Profile" }, { label: "Sign out", onSelect, separated: true, destructive: true }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByText("Sara Ahmadi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("Kaveh data and status", () => {
  type Row = { id: string; vessel: string; berth: number };
  const rows: Row[] = [
    { id: "1", vessel: "MV Persian Gulf", berth: 12 },
    { id: "2", vessel: "MT Hormuz Star", berth: 4 },
  ];

  it.each(["navy", "band", "minimal"] as const)("renders a %s table with bilingual headers", (variant) => {
    render(
      <KavehTable<Row>
        variant={variant}
        caption="Vessels in port"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: "vessel", header: "Vessel", headerFa: "شناور" },
          { key: "berth", header: "Berth", align: "end", render: (r) => `#${r.berth}` },
        ]}
      />,
    );
    const table = screen.getByRole("table", { name: "Vessels in port" });
    expect(within(table).getByRole("columnheader", { name: /Vessel/ })).toHaveTextContent("شناور");
    expect(within(table).getByText("#12")).toBeInTheDocument();
  });

  type Call = { id: string; vessel: string; port: string; berth: number };
  const calls: Call[] = [
    { id: "a", vessel: "MV Persian Gulf", port: "Shahid Rajaee", berth: 12 },
    { id: "b", vessel: "MT Hormuz Star", port: "Bandar Abbas", berth: 4 },
    { id: "c", vessel: "MV Kish Breeze", port: "Bandar Abbas", berth: 9 },
  ];
  const callColumns = [
    { key: "vessel", header: "Vessel", headerFa: "شناور", sortable: true },
    { key: "port", header: "Port", sortable: true },
    { key: "berth", header: "Berth", numeric: true, sortable: true },
  ];

  it("frames the table with a title, a record count and actions", () => {
    render(<KavehTable<Call> title="Vessel calls" titleFa="ورود شناورها" actions={<button type="button">Export</button>} rows={calls} rowKey={(r) => r.id} columns={callColumns} />);
    const frame = screen.getByRole("region", { name: "Vessel calls" });
    expect(within(frame).getByRole("heading", { name: "Vessel calls" })).toBeInTheDocument();
    expect(within(frame).getByText("3 records")).toBeInTheDocument();
    expect(within(frame).getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("sorts by a column and reports it with aria-sort", async () => {
    render(<KavehTable<Call> rows={calls} rowKey={(r) => r.id} columns={callColumns} />);
    const berthHeader = screen.getByRole("columnheader", { name: /Berth/ });
    await userEvent.click(within(berthHeader).getByRole("button"));
    expect(berthHeader).toHaveAttribute("aria-sort", "ascending");
    const firstRow = screen.getAllByRole("row")[1]!;
    expect(firstRow).toHaveTextContent("MT Hormuz Star");
  });

  it("filters rows with the search box", async () => {
    render(<KavehTable<Call> searchable rows={calls} rowKey={(r) => r.id} columns={callColumns} />);
    await userEvent.type(screen.getByRole("searchbox"), "kish");
    expect(screen.getByText("MV Kish Breeze")).toBeInTheDocument();
    expect(screen.queryByText("MV Persian Gulf")).toBeNull();
  });

  it("shows the bulk-action bar for a selection and clears it", async () => {
    const onArchive = vi.fn();
    render(
      <KavehTable<Call>
        selectable
        rows={calls}
        rowKey={(r) => r.id}
        columns={callColumns}
        bulkActions={(ids, clear) => (
          <button
            type="button"
            onClick={() => {
              onArchive(ids);
              clear();
            }}
          >
            Archive
          </button>
        )}
      />,
    );
    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull();
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row a" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row c" }));
    const bar = screen.getByRole("region", { name: "Bulk actions" });
    expect(bar).toHaveTextContent("2 selected");
    expect(screen.getAllByRole("row").filter((r) => r.getAttribute("data-state") === "selected")).toHaveLength(2);
    await userEvent.click(within(bar).getByRole("button", { name: "Archive" }));
    expect(onArchive).toHaveBeenCalledWith(["a", "c"]);
    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull();
  });

  it("pages long lists", () => {
    render(<KavehTable<Call> pageSize={2} rows={calls} rowKey={(r) => r.id} columns={callColumns} />);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    render(<KavehTable rows={[]} rowKey={(_, i) => String(i)} columns={[{ key: "a", header: "A" }]} empty="No vessels" />);
    expect(screen.getByText("No vessels")).toBeInTheDocument();
  });

  it("uses alert for warnings, status otherwise, and dismisses", async () => {
    const onDismiss = vi.fn();
    render(
      <>
        <KavehNotice variant="warning" title="Storm warning">
          Pilotage suspended.
        </KavehNotice>
        <KavehNotice variant="campaign" title="Yalda offer" onDismiss={onDismiss} />
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Storm warning");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it.each(["default", "calm", "navy"] as const)("renders the %s empty state", (variant) => {
    render(<KavehEmptyState variant={variant} title="No vessels yet" titleFa="هنوز شناوری نیست" />);
    expect(screen.getByText("No vessels yet")).toBeInTheDocument();
  });

  it.each(["ring", "wave", "pulse"] as const)("announces the %s loader", (variant) => {
    render(<KavehLoader variant={variant} label="Loading vessels" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading vessels");
  });

  it("renders call-to-action links", () => {
    render(<KavehLink variant="button" href="#quote">Request a quote</KavehLink>);
    expect(screen.getByRole("link", { name: "Request a quote" })).toHaveAttribute("href", "#quote");
  });
});
