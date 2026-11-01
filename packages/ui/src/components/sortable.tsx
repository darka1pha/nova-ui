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
  items: readonly T[];
  getKey: (item: T) => string | number;
  /** Plain-text name of an item, used for the handle label and announcements. */
  getLabel: (item: T) => string;
  /** Called once per drop with the new order. */
  onReorder: (items: T[], move: { from: number; to: number }) => void;
  renderItem: (item: T, state: SortableItemState) => ReactNode;
  "aria-label"?: string;
  messages?: Partial<SortableMessages>;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
}

const move = <T,>(list: readonly T[], from: number, to: number) => {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

interface Drag {
  key: string | number;
  from: number;
  to: number;
  via: "pointer" | "keyboard";
}

/**
 * A list people can reorder by dragging a handle or with the keyboard (Space to
 * pick up, arrows to move, Space to drop, Escape to cancel). Every step is
 * announced through a live region. No drag-and-drop library needed.
 */
export function SortableList<T>({ items, getKey, getLabel, onReorder, renderItem, "aria-label": ariaLabel, messages: messagesProp, disabled = false, className, itemClassName }: SortableListProps<T>) {
  const messages = { ...defaultMessages, ...messagesProp };
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const rows = useRef(new Map<string | number, HTMLLIElement>());
  const handles = useRef(new Map<string | number, HTMLButtonElement>());
  const instructionsId = useId();
  const shown = drag ? move(items, drag.from, drag.to) : items;
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
      <ul aria-label={ariaLabel} className={cn("flex flex-col gap-2", className)}>
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
                "flex items-center gap-2 rounded-(--ks-card-radius) border border-border bg-surface p-2 pe-3 text-sm",
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
