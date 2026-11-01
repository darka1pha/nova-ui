"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Checkbox } from "./controls.tsx";
import { SearchInput } from "./input.tsx";
import { focusRing, transition } from "./shared.ts";

export interface TransferItem {
  value: string;
  label: ReactNode;
  /** Plain text used for search when `label` isn't a string. */
  text?: string;
  description?: ReactNode;
  disabled?: boolean;
}

export interface TransferListLabels {
  available: string;
  selected: string;
  moveRight: string;
  moveAllRight: string;
  moveLeft: string;
  moveAllLeft: string;
  search: (title: string) => string;
  selectAll: (title: string) => string;
  /** "2 of 8 checked" */
  count: (checked: number, total: number) => string;
  empty: string;
  moved: (count: number, title: string) => string;
}

const defaultLabels: TransferListLabels = {
  available: "Available",
  selected: "Selected",
  moveRight: "Add checked",
  moveAllRight: "Add all",
  moveLeft: "Remove checked",
  moveAllLeft: "Remove all",
  search: (title) => `Search ${title.toLowerCase()}`,
  selectAll: (title) => `Check all ${title.toLowerCase()}`,
  count: (c, n) => `${c} of ${n} checked`,
  empty: "Nothing here",
  moved: (count, title) => `${count} moved to ${title.toLowerCase()}.`,
};

export interface TransferListProps {
  items: readonly TransferItem[];
  /** Values on the right ("selected") side, in order. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  searchable?: boolean;
  labels?: Partial<TransferListLabels>;
  /** Height of each list. */
  listHeight?: number | string;
  disabled?: boolean;
  /** Posts each selected value under this name with native forms. */
  name?: string;
  className?: string;
}

const textOf = (item: TransferItem) => item.text ?? (typeof item.label === "string" ? item.label : item.value);

/**
 * Two lists side by side: check items and move them across. Each side is a
 * fieldset of checkboxes with "check all", optional search, and a count; moves
 * are announced. Stacks vertically on narrow screens, with arrows that follow.
 */
export function TransferList({ items, value: valueProp, defaultValue = [], onValueChange, searchable = false, labels: labelsProp, listHeight = 256, disabled, name, className }: TransferListProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const [valueState, setValueState] = useState(defaultValue);
  const value = valueProp ?? valueState;
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");

  const selectedSet = new Set(value);
  const left = items.filter((i) => !selectedSet.has(i.value));
  const right = value.map((v) => items.find((i) => i.value === v)).filter((i): i is TransferItem => !!i);

  const commit = (next: string[], moved: number, title: string) => {
    if (valueProp === undefined) setValueState(next);
    onValueChange?.(next);
    setAnnouncement(labels.moved(moved, title));
  };
  const move = (direction: "right" | "left", all: boolean) => {
    const source = direction === "right" ? left : right;
    const moving = source.filter((i) => !i.disabled && (all || checked.has(i.value))).map((i) => i.value);
    if (!moving.length) return;
    const next = direction === "right" ? [...value, ...moving] : value.filter((v) => !moving.includes(v));
    setChecked((c) => new Set([...c].filter((v) => !moving.includes(v))));
    commit(next, moving.length, direction === "right" ? labels.selected : labels.available);
  };
  const toggle = (values: string[], on: boolean) =>
    setChecked((c) => {
      const next = new Set(c);
      values.forEach((v) => (on ? next.add(v) : next.delete(v)));
      return next;
    });

  const checkedIn = (list: TransferItem[]) => list.filter((i) => checked.has(i.value)).length;
  const control = cn(
    "inline-flex size-9 items-center justify-center rounded-(--nv-button-radius) border border-border bg-surface text-foreground-muted hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 max-sm:[&_svg]:rotate-90",
    transition,
    focusRing,
  );

  return (
    <div className={cn("flex flex-col items-stretch gap-3 sm:flex-row", className)}>
      <TransferPane title={labels.available} items={left} checked={checked} onToggle={toggle} searchable={searchable} labels={labels} height={listHeight} disabled={disabled} />
      <div className="flex shrink-0 justify-center gap-2 sm:flex-col sm:justify-center">
        <button type="button" className={control} aria-label={labels.moveRight} disabled={disabled || !checkedIn(left)} onClick={() => move("right", false)}>
          <ChevronRight className="rtl:rotate-180 max-sm:rtl:rotate-90" />
        </button>
        <button type="button" className={control} aria-label={labels.moveAllRight} disabled={disabled || !left.some((i) => !i.disabled)} onClick={() => move("right", true)}>
          <ChevronsRight className="rtl:rotate-180 max-sm:rtl:rotate-90" />
        </button>
        <button type="button" className={control} aria-label={labels.moveLeft} disabled={disabled || !checkedIn(right)} onClick={() => move("left", false)}>
          <ChevronLeft className="rtl:rotate-180 max-sm:rtl:rotate-90" />
        </button>
        <button type="button" className={control} aria-label={labels.moveAllLeft} disabled={disabled || !right.some((i) => !i.disabled)} onClick={() => move("left", true)}>
          <ChevronsLeft className="rtl:rotate-180 max-sm:rtl:rotate-90" />
        </button>
      </div>
      <TransferPane title={labels.selected} items={right} checked={checked} onToggle={toggle} searchable={searchable} labels={labels} height={listHeight} disabled={disabled} />
      {name ? value.map((v) => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />) : null}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

function TransferPane({
  title,
  items,
  checked,
  onToggle,
  searchable,
  labels,
  height,
  disabled,
}: {
  title: string;
  items: TransferItem[];
  checked: Set<string>;
  onToggle: (values: string[], on: boolean) => void;
  searchable: boolean;
  labels: TransferListLabels;
  height: number | string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const id = useId();
  const q = query.trim().toLowerCase();
  const visible = q ? items.filter((i) => textOf(i).toLowerCase().includes(q)) : items;
  const enabled = visible.filter((i) => !i.disabled);
  const checkedCount = items.filter((i) => checked.has(i.value)).length;
  const allChecked = enabled.length > 0 && enabled.every((i) => checked.has(i.value));
  const someChecked = enabled.some((i) => checked.has(i.value));

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-(--nv-card-radius) border border-border bg-surface">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Checkbox
          id={`${id}-all`}
          aria-label={labels.selectAll(title)}
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          disabled={!enabled.length}
          onCheckedChange={(on) => onToggle(enabled.map((i) => i.value), on === true)}
        />
        <span aria-hidden className="text-sm font-medium">
          {title}
        </span>
        <span className="ms-auto text-xs text-foreground-muted tabular-nums">{labels.count(checkedCount, items.length)}</span>
      </div>
      {searchable ? (
        <div className="border-b border-border p-2">
          <SearchInput size="sm" aria-label={labels.search(title)} placeholder={labels.search(title)} value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} />
        </div>
      ) : null}
      <ul className="overflow-y-auto p-1" style={{ height }}>
        {visible.length ? (
          visible.map((item) => {
            const itemId = `${id}-${item.value}`;
            return (
              <li key={item.value}>
                <label
                  htmlFor={itemId}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-surface-hover has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
                    checked.has(item.value) && "bg-primary-subtle hover:bg-primary-subtle-hover",
                  )}
                >
                  <Checkbox id={itemId} className="mt-0.5" checked={checked.has(item.value)} disabled={item.disabled} onCheckedChange={(on) => onToggle([item.value], on === true)} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.description ? <span className="text-xs text-foreground-muted">{item.description}</span> : null}
                  </span>
                </label>
              </li>
            );
          })
        ) : (
          <li className="flex h-full items-center justify-center text-sm text-foreground-muted">{labels.empty}</li>
        )}
      </ul>
    </fieldset>
  );
}
