"use client";

import { GripVertical } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { focusRing, transition } from "./shared.ts";

export interface KanbanColumn<T> {
  id: string;
  /** Plain-text name, used in headings and announcements. */
  title: string;
  items: T[];
  /** Work-in-progress limit: the count turns to a warning once it's exceeded. */
  limit?: number;
}

export interface KanbanMove {
  from: { column: string; index: number };
  to: { column: string; index: number };
}

export interface KanbanMessages {
  instructions: string;
  handle: (label: string) => string;
  pickedUp: (label: string, column: string, position: number, total: number) => string;
  moved: (label: string, column: string, position: number, total: number) => string;
  dropped: (label: string, column: string, position: number, total: number) => string;
  cancelled: (label: string) => string;
  /** Count shown next to a column title. */
  count: (count: number, limit?: number) => string;
}

const defaultMessages: KanbanMessages = {
  instructions:
    "Press Space or Enter to pick up. Use up and down to move within a column, left and right to move between columns, Space or Enter to drop, Escape to cancel.",
  handle: (label) => `Move ${label}`,
  pickedUp: (label, column, pos, total) => `Picked up ${label} in ${column}. Position ${pos} of ${total}.`,
  moved: (label, column, pos, total) => `${label} moved to ${column}, position ${pos} of ${total}.`,
  dropped: (label, column, pos, total) => `${label} dropped in ${column} at position ${pos} of ${total}.`,
  cancelled: (label) => `Move cancelled. ${label} is back where it started.`,
  count: (count, limit) => (limit !== undefined ? `${count} / ${limit}` : String(count)),
};

export interface KanbanItemState {
  column: string;
  index: number;
  dragging: boolean;
}

export interface KanbanBoardProps<T> {
  columns: readonly KanbanColumn<T>[];
  getKey: (item: T) => string | number;
  /** Plain-text name of a card, for the handle label and announcements. */
  getLabel: (item: T) => string;
  /** Called once per drop with the new columns. */
  onMove: (columns: KanbanColumn<T>[], move: KanbanMove) => void;
  renderItem: (item: T, state: KanbanItemState) => ReactNode;
  /** Extra content at the end of a column's header (a menu, an add button). */
  renderColumnActions?: (column: KanbanColumn<T>) => ReactNode;
  /** Shown in an empty column. */
  emptyMessage?: ReactNode;
  "aria-label"?: string;
  messages?: Partial<KanbanMessages>;
  disabled?: boolean;
  className?: string;
  columnClassName?: string;
  itemClassName?: string;
}

interface Drag {
  key: string | number;
  from: { column: number; index: number };
  to: { column: number; index: number };
  via: "pointer" | "keyboard";
}

/** `list[i]` for an index known to be in range. */
const at = <V,>(list: readonly V[], i: number) => list[i] as V;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The board with the dragged card taken out of its column and put in at `to`. */
function arrange<T>(columns: readonly KanbanColumn<T>[], drag: Drag | null): KanbanColumn<T>[] {
  const next = columns.map((c) => ({ ...c, items: [...c.items] }));
  if (!drag) return next;
  const [item] = at(next, drag.from.column).items.splice(drag.from.index, 1);
  at(next, drag.to.column).items.splice(drag.to.index, 0, item as T);
  return next;
}

/**
 * Columns of cards people move by dragging a handle or with the keyboard: Space
 * picks a card up, up/down move it within a column, left/right across columns
 * (mirrored in RTL), Space drops and Escape cancels. Every step is announced.
 */
export function KanbanBoard<T>({
  columns,
  getKey,
  getLabel,
  onMove,
  renderItem,
  renderColumnActions,
  emptyMessage = "No cards",
  "aria-label": ariaLabel,
  messages: messagesProp,
  disabled = false,
  className,
  columnClassName,
  itemClassName,
}: KanbanBoardProps<T>) {
  const messages = { ...defaultMessages, ...messagesProp };
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const board = useRef<HTMLDivElement>(null);
  const lists = useRef<(HTMLUListElement | null)[]>([]);
  const cards = useRef(new Map<string | number, HTMLLIElement>());
  const handles = useRef(new Map<string | number, HTMLButtonElement>());
  const baseId = useId();
  const shown = arrange(columns, drag);
  const draggedLabel = drag ? getLabel(at(columns, drag.from.column).items[drag.from.index] as T) : "";

  useLayoutEffect(() => {
    if (drag?.via !== "keyboard") return;
    const handle = handles.current.get(drag.key);
    if (handle && document.activeElement !== handle) handle.focus();
  }, [drag]);

  const commit = (d: Drag) => {
    setDrag(null);
    const target = at(arrange(columns, d), d.to.column);
    setAnnouncement(messages.dropped(draggedLabel, target.title, d.to.index + 1, target.items.length));
    if (d.from.column === d.to.column && d.from.index === d.to.index) return;
    onMove(arrange(columns, d), {
      from: { column: at(columns, d.from.column).id, index: d.from.index },
      to: { column: at(columns, d.to.column).id, index: d.to.index },
    });
  };
  const cancel = (label = draggedLabel) => {
    setDrag(null);
    setAnnouncement(messages.cancelled(label));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, column: number, index: number, item: T) => {
    const key = getKey(item);
    if (!drag) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const d: Drag = { key, from: { column, index }, to: { column, index }, via: "keyboard" };
        setDrag(d);
        setAnnouncement(messages.pickedUp(getLabel(item), at(columns, column).title, index + 1, at(columns, column).items.length));
      }
      return;
    }
    if (drag.key !== key) return;
    const rtl = board.current ? getComputedStyle(board.current).direction === "rtl" : false;
    const sizeOf = (c: number) => at(columns, c).items.length - (c === drag.from.column ? 1 : 0);
    let to = drag.to;
    if (e.key === "ArrowUp") to = { ...to, index: Math.max(0, to.index - 1) };
    else if (e.key === "ArrowDown") to = { ...to, index: Math.min(sizeOf(to.column), to.index + 1) };
    else if (e.key === "Home") to = { ...to, index: 0 };
    else if (e.key === "End") to = { ...to, index: sizeOf(to.column) };
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const step = (e.key === "ArrowRight") !== rtl ? 1 : -1;
      const c = clamp(to.column + step, 0, columns.length - 1);
      to = { column: c, index: Math.min(to.index, sizeOf(c)) };
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      commit(drag);
      return;
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    } else {
      if (e.key === "Tab") cancel();
      return;
    }
    e.preventDefault();
    if (to.column === drag.to.column && to.index === drag.to.index) return;
    setDrag({ ...drag, to });
    setAnnouncement(messages.moved(draggedLabel, at(columns, to.column).title, to.index + 1, sizeOf(to.column) + 1));
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, column: number, index: number, item: T) => {
    if (disabled || e.button !== 0 || drag) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ key: getKey(item), from: { column, index }, to: { column, index }, via: "pointer" });
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag?.via !== "pointer") return;
    // The column whose box is horizontally nearest the pointer.
    let column = drag.to.column;
    let best = Infinity;
    lists.current.forEach((list, c) => {
      const rect = list?.getBoundingClientRect();
      if (!rect) return;
      const distance = e.clientX < rect.left ? rect.left - e.clientX : e.clientX > rect.right ? e.clientX - rect.right : 0;
      if (distance < best) {
        best = distance;
        column = c;
      }
    });
    // The slot is how many of that column's other cards sit above the pointer.
    let index = 0;
    for (const other of at(columns, column).items) {
      const k = getKey(other);
      if (k === drag.key) continue;
      const rect = cards.current.get(k)?.getBoundingClientRect();
      if (rect && e.clientY > rect.top + rect.height / 2) index++;
    }
    if (column !== drag.to.column || index !== drag.to.index) setDrag({ ...drag, to: { column, index } });
  };

  return (
    <>
      <div ref={board} role="group" aria-label={ariaLabel} className={cn("flex items-start gap-4 overflow-x-auto pb-2", className)}>
        {shown.map((column, c) => {
          const headingId = `${baseId}-col-${c}`;
          const count = at(columns, c).items.length;
          const over = column.limit !== undefined && column.items.length > column.limit;
          return (
            <section
              key={column.id}
              aria-labelledby={headingId}
              data-drop-target={drag?.to.column === c || undefined}
              className={cn(
                "flex w-72 shrink-0 flex-col gap-2 rounded-(--nv-card-radius) border border-border bg-surface-sunken p-2",
                transition,
                "data-drop-target:border-primary-border",
                columnClassName,
              )}
            >
              <header className="flex items-center gap-2 px-1.5 pt-1">
                <h3 id={headingId} className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {column.title}
                </h3>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", over ? "bg-warning-subtle text-warning-on-subtle" : "bg-surface text-foreground-muted")}>
                  {messages.count(drag ? column.items.length : count, column.limit)}
                </span>
                {renderColumnActions?.(column)}
              </header>
              <ul
                ref={(node) => {
                  lists.current[c] = node;
                }}
                className="flex min-h-16 flex-col gap-2"
              >
                {column.items.map((item, index) => {
                  const key = getKey(item);
                  const dragging = drag?.key === key;
                  return (
                    <li
                      key={key}
                      ref={(node) => {
                        if (node) cards.current.set(key, node);
                        else cards.current.delete(key);
                      }}
                      data-dragging={dragging || undefined}
                      className={cn(
                        "flex items-start gap-1.5 rounded-(--nv-card-radius) border border-border bg-surface p-2 text-sm shadow-xs",
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
                        aria-describedby={`${baseId}-instructions`}
                        aria-pressed={dragging}
                        onKeyDown={(e) => onKeyDown(e, c, index, item)}
                        onPointerDown={(e) => onPointerDown(e, c, index, item)}
                        onPointerMove={onPointerMove}
                        onPointerUp={() => drag?.via === "pointer" && commit(drag)}
                        onPointerCancel={() => drag && cancel()}
                        onBlur={() => {
                          if (drag?.via !== "keyboard" || drag.key !== key) return;
                          setTimeout(() => {
                            if (document.activeElement !== handles.current.get(key)) setDrag((d) => (d?.key === key ? null : d));
                          });
                        }}
                        className={cn(
                          "inline-flex size-6 shrink-0 touch-none items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
                          dragging ? "cursor-grabbing text-primary" : "cursor-grab",
                          focusRing,
                        )}
                      >
                        <GripVertical aria-hidden />
                      </button>
                      <div className="min-w-0 flex-1">{renderItem(item, { column: column.id, index, dragging })}</div>
                    </li>
                  );
                })}
                {column.items.length === 0 ? <li className="flex min-h-16 items-center justify-center rounded-(--nv-card-radius) border border-dashed border-border text-xs text-foreground-muted">{emptyMessage}</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
      <span id={`${baseId}-instructions`} hidden>
        {messages.instructions}
      </span>
      <span aria-live="assertive" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
