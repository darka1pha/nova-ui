import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter, ThemeProvider, type NotificationItem } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const NOW = new Date(2026, 9, 31, 12, 0);
const minutes = (n: number) => new Date(NOW.getTime() - n * 60_000);

const initial: NotificationItem[] = [
  { id: "1", title: "Iran Shahr berthed at Berth 2", description: "Shahid Rajaee", time: minutes(5), tone: "success", category: "vessels" },
  { id: "2", title: "Customs hold on container MSKU 4821", time: minutes(90), tone: "warning", category: "customs" },
  { id: "3", title: "Bunkering completed", time: minutes(60 * 26), tone: "info", category: "vessels", read: true },
];

function Center(props: { onItemClick?: (i: NotificationItem) => void; locale?: string; start?: NotificationItem[] }) {
  const [items, setItems] = useState(props.start ?? initial);
  return (
    <>
      <NotificationCenter
        items={items}
        categories={[
          { id: "vessels", label: "Vessels" },
          { id: "customs", label: "Customs" },
        ]}
        onMarkRead={(id, read) => setItems((all) => all.map((i) => (i.id === id ? { ...i, read } : i)))}
        onMarkAllRead={() => setItems((all) => all.map((i) => ({ ...i, read: true })))}
        onDismiss={(id) => setItems((all) => all.filter((i) => i.id !== id))}
        onItemClick={props.onItemClick}
        locale={props.locale}
      />
      <button type="button" onClick={() => setItems((all) => [{ id: "new", title: "Pilot boarded Kish Star", time: NOW }, ...all])}>
        Push
      </button>
    </>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe("NotificationCenter", () => {
  it("shows the unread count on the bell and groups items by day", async () => {
    const user = userEvent.setup();
    render(<Center />);
    const bell = screen.getByRole("button", { name: "Notifications, 2 unread" });
    await user.click(bell);
    const panel = screen.getByRole("dialog", { name: "Notifications" });
    expect(within(panel).getByRole("region", { name: "Today" })).toHaveTextContent("Iran Shahr berthed");
    expect(within(panel).getByRole("region", { name: "Yesterday" })).toHaveTextContent("Bunkering completed");
    expect(within(panel).getByText("5 minutes ago")).toBeInTheDocument();
  });

  it("filters by unread and category", async () => {
    const user = userEvent.setup();
    render(<Center />);
    await user.click(screen.getByRole("button", { name: /Notifications/ }));
    await user.click(screen.getByRole("radio", { name: /Unread/ }));
    expect(screen.queryByText("Bunkering completed")).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Customs" }));
    expect(screen.getByText(/Customs hold/)).toBeInTheDocument();
    expect(screen.queryByText(/Iran Shahr/)).toBeNull();
  });

  it("marks one read, all read, and dismisses", async () => {
    const user = userEvent.setup();
    render(<Center />);
    await user.click(screen.getByRole("button", { name: /Notifications/ }));
    await user.click(screen.getByRole("button", { name: "Mark as read: Iran Shahr berthed at Berth 2" }));
    expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark all as read" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Dismiss: Bunkering completed" }));
    expect(screen.queryByText("Bunkering completed")).toBeNull();
  });

  it("opens an item and shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    render(<Center onItemClick={onItemClick} start={[initial[2] as NotificationItem]} />);
    await user.click(screen.getByRole("button", { name: /Notifications/ }));
    await user.click(screen.getByRole("button", { name: "Bunkering completed" }));
    expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: "3" }));
    await user.click(screen.getByRole("radio", { name: /Unread/ }));
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it("announces new arrivals but not the initial list", async () => {
    const user = userEvent.setup();
    render(<Center />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    await user.click(screen.getByRole("button", { name: "Push" }));
    expect(status).toHaveTextContent("1 new notification");
    expect(screen.getByRole("button", { name: "Notifications, 3 unread" })).toBeInTheDocument();
  });

  it("uses the locale for times and counts", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider locale="fa-IR" dir="rtl">
        <Center />
      </ThemeProvider>,
    );
    const bell = screen.getByRole("button", { name: /Notifications/ });
    expect(bell).toHaveTextContent("۲");
    await user.click(bell);
    expect(screen.getByText("۵ دقیقه پیش")).toBeInTheDocument();
  });

  it("passes axe with the panel open", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<Center />);
    await user.click(screen.getByRole("button", { name: /Notifications/ }));
    expect(await axeViolations(baseElement)).toEqual([]);
  });
});
