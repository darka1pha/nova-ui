"use client";

import { GripVertical } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { focusRing, transition } from "./shared.ts";

export interface SortableMessages {
  /** Spoken instructions, linked to every handle. */
  instructions: string;
  handle: (label: string) => string;
  pickedUp: (label: string, position: number, total: number) => string;
  moved: (label: string, position: number, total: number) => string;
  dropped: (label: string, position: number, total: number) => string;
  cancelled: (label: string) => string;
}

const defaultMessages: SortableMessages = {
  instructions: "Press Space or Enter to pick up. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.",
  handle: (label) => `Reorder ${label}`,
  pickedUp: (label, pos, total) => `Picked up ${label}. Position ${pos} of ${total}.`,
  moved: (label, pos, total) => `${label} moved to position ${pos} of ${total}.`,
  dropped: (label, pos, total) => `${label} dropped at position ${pos} of ${total}.`,
  cancelled: (label) => `Reorder cancelled. ${label} is back where it started.`,
};

export interface SortableItemState {
  index: number;
  /** This item is being moved (pointer or keyboard). */
  dragging: boolean;
}

export interface SortableListProps<T> {
  /** The items, in their current order. */
  items: readonly T[];
  /** A stable key per item. */
  getKey: (item: T) => string | number;
  /** Plain-text name of an item, used for the handle label and announcements. */
  getLabel: (item: T) => string;
  /** Called once per drop with the new order. */
  onReorder: (items: T[], move: { from: number; to: number }) => void;
  /** Renders an item; `state` tells you if it's being dragged. */
  renderItem: (item: T, state: SortableItemState) => ReactNode;
  /** Names the list for screen readers. */
  "aria-label"?: string;
  /** Screen-reader announcements for pick up, move and drop, for localization. */
  messages?: Partial<SortableMessages>;
  disabled?: boolean;
  className?: string;
  /** Classes for each item's wrapper. */
  itemClassName?: string;
}

const move = <T,>(list: readonly T[], from: number, to: number) => {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

/**
 * Slides rows from where they were to their new slots whenever the order changes
 * (FLIP with the Web Animations API). Interrupted moves continue from where the row
 * is on screen. Timing follows the theme's motion tokens, read from `list`'s
 * computed animation duration and easing, so reduced motion turns it off.
 */
function useReorderAnimation(list: HTMLElement | null, rows: Map<string | number, HTMLElement>, order: string) {
  // Layout offsets from the list's corner: page scrolling and the picked-up row's scale don't count as movement.
  const layout = useRef(new Map<string | number, { x: number; y: number }>());
  useLayoutEffect(() => {
    if (!list) return;
    const style = getComputedStyle(list);
    const duration = parseFloat(style.animationDuration) * (style.animationDuration.endsWith("ms") ? 1 : 1000);
    const animate = duration >= 1 && typeof Element.prototype.animate === "function";
    const next = new Map<string | number, { x: number; y: number }>();
    rows.forEach((row, key) => {
      const visual = row.getBoundingClientRect();
      row.getAnimations?.().forEach((a) => {
        if (a.id === "nv-reorder") a.cancel();
      });
      const rect = row.getBoundingClientRect();
      // Rows share the list's offsetParent (the list isn't positioned).
      const now = { x: row.offsetLeft - list.offsetLeft, y: row.offsetTop - list.offsetTop };
      next.set(key, now);
      const before = layout.current.get(key);
      if (!animate || !before) return;
      // Where the row appeared just before this change: its old slot plus any slide still in flight.
      const dx = before.x + (visual.left - rect.left) - now.x;
      const dy = before.y + (visual.top - rect.top) - now.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      const slide = row.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration, easing: style.animationTimingFunction, composite: "add" });
      slide.id = "nv-reorder";
    });
    layout.current = next;
    // `order` is the dependency: rows only move when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, order]);
}

interface Drag {
  key: string | number;
  from: number;
  to: number;
  via: "pointer" | "keyboard";
}

/**
 * A list people can reorder by dragging a handle or with the keyboard (Space to
 * pick up, arrows to move, Space to drop, Escape to cancel). Every step is
 * announced through a live region, and rows slide to their new places (not
 * under reduced motion). No drag-and-drop library needed.
 */
export function SortableList<T>({ items, getKey, getLabel, onReorder, renderItem, "aria-label": ariaLabel, messages: messagesProp, disabled = false, className, itemClassName }: SortableListProps<T>) {
  const messages = { ...defaultMessages, ...messagesProp };
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const rows = useRef(new Map<string | number, HTMLLIElement>());
  const handles = useRef(new Map<string | number, HTMLButtonElement>());
  const instructionsId = useId();
  const [list, setList] = useState<HTMLUListElement | null>(null);
  const shown = drag ? move(items, drag.from, drag.to) : items;
  useReorderAnimation(list, rows.current, JSON.stringify(shown.map(getKey)));
  const total = items.length;
  const labelAt = (index: number) => getLabel(items[index] as T);

  // Moving a focused node in the DOM drops focus; put it back on the moving handle.
  useLayoutEffect(() => {
    if (drag?.via !== "keyboard") return;
    const handle = handles.current.get(drag.key);
    if (handle && document.activeElement !== handle) handle.focus();
  }, [drag]);

  const commit = (d: Drag) => {
    setDrag(null);
    setAnnouncement(messages.dropped(labelAt(d.from), d.to + 1, total));
    if (d.to !== d.from) onReorder(move(items, d.from, d.to), { from: d.from, to: d.to });
  };
  const cancel = (d: Drag) => {
    setDrag(null);
    setAnnouncement(messages.cancelled(labelAt(d.from)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number, item: T) => {
    const key = getKey(item);
    if (!drag) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setDrag({ key, from: index, to: index, via: "keyboard" });
        setAnnouncement(messages.pickedUp(getLabel(item), index + 1, total));
      }
      return;
    }
    if (drag.key !== key) return;
    const targets: Record<string, number> = { ArrowUp: drag.to - 1, ArrowLeft: drag.to - 1, ArrowDown: drag.to + 1, ArrowRight: drag.to + 1, Home: 0, End: total - 1 };
    if (e.key in targets) {
      e.preventDefault();
      const to = Math.min(total - 1, Math.max(0, targets[e.key] ?? drag.to));
      if (to === drag.to) return;
      setDrag({ ...drag, to });
      setAnnouncement(messages.moved(labelAt(drag.from), to + 1, total));
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      commit(drag);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel(drag);
    } else if (e.key === "Tab") {
      cancel(drag);
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, index: number, item: T) => {
    if (disabled || e.button !== 0 || drag) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ key: getKey(item), from: index, to: index, via: "pointer" });
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag?.via !== "pointer") return;
    // The target slot is how many of the other rows sit above the pointer.
    let to = 0;
    for (const other of items) {
      const k = getKey(other);
      if (k === drag.key) continue;
      const rect = rows.current.get(k)?.getBoundingClientRect();
      if (rect && e.clientY > rect.top + rect.height / 2) to++;
    }
    if (to !== drag.to) setDrag({ ...drag, to });
  };
  const onPointerUp = () => {
    if (drag?.via === "pointer") commit(drag);
  };

  return (
    <>
      <ul
        ref={setList}
        aria-label={ariaLabel}
        // The reorder slide reads its timing from these (no animation-name, so nothing else runs).
        className={cn("flex flex-col gap-2 [animation-duration:var(--nv-duration-normal)] [animation-timing-function:var(--nv-ease-interactive)]", className)}
      >
        {shown.map((item, index) => {
          const key = getKey(item);
          const dragging = drag?.key === key;
          return (
            <li
              key={key}
              ref={(node) => {
                if (node) rows.current.set(key, node);
                else rows.current.delete(key);
              }}
              data-dragging={dragging || undefined}
              className={cn(
                "flex items-center gap-2 rounded-(--nv-card-radius) border border-border bg-surface p-2 pe-3 text-sm",
                transition,
                dragging && "relative z-10 scale-[1.02] border-primary shadow-lg motion-reduce:scale-100",
                itemClassName,
              )}
            >
              <button
                ref={(node) => {
                  if (node) handles.current.set(key, node);
                  else handles.current.delete(key);
                }}
                type="button"
                disabled={disabled}
                aria-label={messages.handle(getLabel(item))}
                aria-describedby={instructionsId}
                aria-pressed={dragging}
                onKeyDown={(e) => onKeyDown(e, index, item)}
                onPointerDown={(e) => onPointerDown(e, items.indexOf(item), item)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => drag && cancel(drag)}
                onBlur={() => {
                  if (drag?.via !== "keyboard" || drag.key !== key) return;
                  // Reordering re-inserts the node and blurs it for a moment; cancel only if focus really left.
                  setTimeout(() => {
                    if (document.activeElement !== handles.current.get(key)) setDrag((d) => (d?.key === key ? null : d));
                  });
                }}
                className={cn(
                  "inline-flex size-7 shrink-0 touch-none items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
                  dragging ? "cursor-grabbing text-primary" : "cursor-grab",
                  focusRing,
                )}
              >
                <GripVertical aria-hidden />
              </button>
              <div className="min-w-0 flex-1">{renderItem(item, { index, dragging })}</div>
            </li>
          );
        })}
      </ul>
      <span id={instructionsId} hidden>
        {messages.instructions}
      </span>
      <span aria-live="assertive" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
