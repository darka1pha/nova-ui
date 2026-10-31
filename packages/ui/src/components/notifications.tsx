"use client";

import { Bell, BellOff, Check, CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { Button, IconButton, ToggleGroup, ToggleGroupItem } from "./button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./overlay.tsx";
import { focusRing } from "./shared.ts";

export type NotificationTone = "info" | "success" | "warning" | "danger";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  /** When it happened; drives the relative time and day grouping. */
  time: Date;
  read?: boolean;
  tone?: NotificationTone;
  /** Matches a NotificationCenter category id for filtering. */
  category?: string;
  /** Replaces the tone icon (e.g. a vessel or document icon). */
  icon?: ReactNode;
  /** A small action under the text, e.g. a "View manifest" link. */
  action?: ReactNode;
}

export interface NotificationCategory {
  id: string;
  label: string;
}

export interface NotificationCenterProps {
  items: NotificationItem[];
  /** Extra filters next to All and Unread. */
  categories?: NotificationCategory[];
  onMarkRead?: (id: string, read: boolean) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (id: string) => void;
  /** Called when the item body is activated. */
  onItemClick?: (item: NotificationItem) => void;
  /** Bottom of the panel, e.g. a "View all" link. */
  footer?: ReactNode;
  /** Controlled open state of the panel. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  locale?: string;
  className?: string;
  labels?: {
    title?: string;
    /** Bell name, e.g. (unread) => `Notifications, ${unread} unread`. */
    trigger?: (unread: number) => string;
    markAllRead?: string;
    all?: string;
    unread?: string;
    filters?: string;
    empty?: string;
    emptyDescription?: string;
    markRead?: string;
    markUnread?: string;
    dismiss?: string;
    today?: string;
    yesterday?: string;
    /** Announced when new notifications arrive, e.g. (n) => `${n} new notifications`. */
    arrived?: (count: number) => string;
  };
}

const toneIcon: Record<NotificationTone, ReactNode> = {
  info: <Info />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  danger: <CircleAlert />,
};
const toneClass: Record<NotificationTone, string> = {
  info: "bg-info-subtle text-info-text",
  success: "bg-success-subtle text-success-text",
  warning: "bg-warning-subtle text-warning-text",
  danger: "bg-danger-subtle text-danger-text",
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "3 minutes ago", "yesterday", in the locale's words and digits. */
function relativeTime(time: Date, now: Date, format: Intl.RelativeTimeFormat) {
  const seconds = Math.round((time.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return format.format(0, "second");
  if (abs < 3600) return format.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return format.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) return format.format(Math.round(seconds / 86400), "day");
  return format.format(Math.round(seconds / (7 * 86400)), "week");
}

/**
 * A bell with an unread count that opens a panel of notifications, newest first,
 * grouped by day. Filter by All, Unread or your categories; mark items read or
 * unread, dismiss them, or mark everything read. New arrivals are announced
 * politely to screen readers. The data stays yours: pass items and handle the callbacks.
 */
export const NotificationCenter = forwardRef<HTMLButtonElement, NotificationCenterProps>(function NotificationCenter(
  { items, categories = [], onMarkRead, onMarkAllRead, onDismiss, onItemClick, footer, open, onOpenChange, locale: localeProp, className, labels },
  ref,
) {
  const { locale, calendar } = useLocale(localeProp);
  const [filter, setFilter] = useState("all");
  const unread = items.filter((i) => !i.read).length;
  const now = new Date();

  // Announce arrivals (not the initial load) without stealing focus.
  const [announcement, setAnnouncement] = useState("");
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    if (seen.current) {
      const fresh = items.filter((i) => !seen.current?.has(i.id) && !i.read).length;
      if (fresh > 0) setAnnouncement((labels?.arrived ?? ((n) => (n === 1 ? "1 new notification" : `${n} new notifications`)))(fresh));
    }
    seen.current = ids;
  }, [items, labels?.arrived]);

  const relative = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);
  const dayFormat = useMemo(() => new Intl.DateTimeFormat(locale, { calendar, weekday: "long", day: "numeric", month: "long" }), [locale, calendar]);
  const fullFormat = useMemo(() => new Intl.DateTimeFormat(locale, { calendar, dateStyle: "medium", timeStyle: "short" }), [locale, calendar]);
  const count = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const visible = items
    .filter((i) => (filter === "all" ? true : filter === "unread" ? !i.read : i.category === filter))
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  // Group under Today / Yesterday / the date.
  const today = startOfDay(now).getTime();
  const dayLabel = (d: Date) => {
    const diff = Math.round((today - startOfDay(d).getTime()) / 86400000);
    if (diff === 0) return labels?.today ?? "Today";
    if (diff === 1) return labels?.yesterday ?? "Yesterday";
    return dayFormat.format(d);
  };
  const groups: { label: string; items: NotificationItem[] }[] = [];
  for (const item of visible) {
    const label = dayLabel(item.time);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  const triggerLabel = (labels?.trigger ?? ((n) => (n ? `Notifications, ${n} unread` : "Notifications")))(unread);
  const smallAction = cn("inline-flex size-7 shrink-0 items-center justify-center rounded-md text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-3.5", focusRing);

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <IconButton ref={ref} aria-label={triggerLabel} variant="ghost" className={cn("relative", className)}>
            <Bell className={cn(unread > 0 && "motion-safe:group-hover/button:animate-ks-wiggle")} />
            {unread > 0 ? (
              <span
                aria-hidden
                className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-bold leading-none tabular-nums text-danger-on-solid ring-2 ring-surface"
              >
                {unread > 99 ? `${count.format(99)}+` : count.format(unread)}
              </span>
            ) : null}
          </IconButton>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          collisionPadding={8}
          // Never taller than the room Radix measured, so the panel can't run off-screen; the list scrolls instead.
          className="flex max-h-[min(36rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-1rem))] flex-col p-0"
          aria-label={labels?.title ?? "Notifications"}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <p className="font-display text-sm font-semibold text-foreground">{labels?.title ?? "Notifications"}</p>
            {onMarkAllRead ? (
              <Button size="xs" variant="ghost" disabled={unread === 0} onClick={onMarkAllRead} startIcon={<Check />}>
                {labels?.markAllRead ?? "Mark all as read"}
              </Button>
            ) : null}
          </div>

          {/* Filters wrap rather than scroll sideways, so every one stays in sight. */}
          <div className="border-b border-border px-3 py-2">
            <ToggleGroup type="single" size="sm" aria-label={labels?.filters ?? "Filter notifications"} value={filter} onValueChange={(v) => v && setFilter(v)} className="flex-wrap">
              <ToggleGroupItem value="all" className="h-7 gap-1.5 px-2.5 text-xs">
                {labels?.all ?? "All"}
              </ToggleGroupItem>
              <ToggleGroupItem value="unread" className="h-7 gap-1.5 px-2.5 text-xs">
                {labels?.unread ?? "Unread"}
                {unread ? <span className="tabular-nums text-foreground-muted">{count.format(unread)}</span> : null}
              </ToggleGroupItem>
              {categories.map((c) => (
                <ToggleGroupItem key={c.id} value={c.id} className="h-7 px-2.5 text-xs">
                  {c.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-sunken text-foreground-muted [&_svg]:size-5">
                  <BellOff aria-hidden />
                </span>
                <p className="text-sm font-medium text-foreground">{labels?.empty ?? "You're all caught up"}</p>
                <p className="text-xs text-foreground-muted">{labels?.emptyDescription ?? "New notifications will show up here."}</p>
              </div>
            ) : (
              groups.map((g) => (
                <section key={g.label} aria-label={g.label}>
                  <h3 className="sticky top-0 z-10 bg-surface-raised/95 px-4 pb-1 pt-3 text-2xs font-semibold uppercase tracking-(--ks-tracking-wider) text-foreground-muted backdrop-blur-sm">
                    {g.label}
                  </h3>
                  <ul className="m-0 list-none p-0">
                    {g.items.map((item) => {
                      const tone = item.tone ?? "info";
                      return (
                        <li
                          key={item.id}
                          data-unread={!item.read || undefined}
                          className="group/notification relative flex gap-3 px-4 py-3 transition-colors hover:bg-surface-hover data-[unread]:bg-primary-subtle/40"
                        >
                          <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4", toneClass[tone])}>
                            {item.icon ?? toneIcon[tone]}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            {onItemClick ? (
                              <button
                                type="button"
                                onClick={() => onItemClick(item)}
                                className={cn("text-start text-sm font-medium text-foreground after:absolute after:inset-0 hover:underline", focusRing)}
                              >
                                {item.title}
                              </button>
                            ) : (
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                            )}
                            {item.description ? <p className="text-xs text-foreground-secondary">{item.description}</p> : null}
                            <time dateTime={item.time.toISOString()} title={fullFormat.format(item.time)} className="text-2xs text-foreground-muted">
                              {relativeTime(item.time, now, relative)}
                              {!item.read ? <span className="sr-only">, unread</span> : null}
                            </time>
                            {item.action ? <div className="relative z-10 mt-1">{item.action}</div> : null}
                          </div>
                          {/* Item controls sit above the stretched click area. */}
                          <div className="relative z-10 flex shrink-0 items-start gap-0.5">
                            {onMarkRead ? (
                              <button
                                type="button"
                                aria-label={`${item.read ? (labels?.markUnread ?? "Mark as unread") : (labels?.markRead ?? "Mark as read")}: ${item.title}`}
                                onClick={() => onMarkRead(item.id, !item.read)}
                                className={smallAction}
                              >
                                {item.read ? <span className="size-2 rounded-full border border-current" /> : <span className="size-2 rounded-full bg-primary-solid" />}
                              </button>
                            ) : !item.read ? (
                              <span aria-hidden className="mt-2.5 size-2 rounded-full bg-primary-solid" />
                            ) : null}
                            {onDismiss ? (
                              <button
                                type="button"
                                aria-label={`${labels?.dismiss ?? "Dismiss"}: ${item.title}`}
                                onClick={() => onDismiss(item.id)}
                                className={cn(smallAction, "opacity-0 focus-visible:opacity-100 group-hover/notification:opacity-100")}
                              >
                                <X />
                              </button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
          {footer ? <div className="border-t border-border px-4 py-2.5">{footer}</div> : null}
        </PopoverContent>
      </Popover>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
});
