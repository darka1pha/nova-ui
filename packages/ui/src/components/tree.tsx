"use client";

import { ChevronRight } from "lucide-react";
import { forwardRef, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { useOptionalTheme } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";

export interface TreeItem {
  /** Unique across the whole tree. */
  id: string;
  label: string;
  icon?: ReactNode;
  /** Small trailing content: a count, a status dot, a badge. */
  badge?: ReactNode;
  disabled?: boolean;
  children?: TreeItem[];
}

export interface TreeViewProps extends Omit<HTMLAttributes<HTMLUListElement>, "onSelect"> {
  /** Accessible name for the tree. */
  label: string;
  /** The tree: each item has an id, a label and optional children. */
  items: TreeItem[];
  /** Controlled ids of expanded branches. */
  expanded?: string[];
  /** Ids of the items open on first render. */
  defaultExpanded?: string[];
  /** Called with the ids of the open items. */
  onExpandedChange?: (ids: string[]) => void;
  /** Controlled selected id. */
  selected?: string | null;
  /** Id of the item selected on first render. */
  defaultSelected?: string | null;
  /** Called with the id and item that was selected. */
  onSelectedChange?: (id: string, item: TreeItem) => void;
  /** Row height. */
  size?: "sm" | "md";
  /** Faint vertical guides that show which branch a row belongs to. */
  guides?: boolean;
}

interface Row {
  item: TreeItem;
  depth: number;
  parent: string | null;
  /** 1-based position among siblings, and sibling count (aria-posinset/setsize). */
  pos: number;
  size: number;
}

/** The rows a reader can currently see, in order (collapsed branches hide their children). */
function visibleRows(items: TreeItem[], expanded: Set<string>, depth = 0, parent: string | null = null, out: Row[] = []): Row[] {
  items.forEach((item, i) => {
    out.push({ item, depth, parent, pos: i + 1, size: items.length });
    if (item.children?.length && expanded.has(item.id)) visibleRows(item.children, expanded, depth + 1, item.id, out);
  });
  return out;
}

function findSiblings(items: TreeItem[], id: string): TreeItem[] | null {
  if (items.some((i) => i.id === id)) return items;
  for (const item of items) {
    const found = item.children ? findSiblings(item.children, id) : null;
    if (found) return found;
  }
  return null;
}

/**
 * A hierarchical list that expands and collapses (WAI-ARIA tree pattern).
 * One tab stop; Up/Down move, Right opens or enters a branch, Left closes it
 * or goes to the parent (mirrored in RTL), Home/End jump, Enter/Space select,
 * `*` opens every sibling, and typing jumps to the next matching label.
 */
export const TreeView = forwardRef<HTMLUListElement, TreeViewProps>(function TreeView(
  {
    label,
    items,
    expanded: expandedProp,
    defaultExpanded = [],
    onExpandedChange,
    selected: selectedProp,
    defaultSelected = null,
    onSelectedChange,
    size = "md",
    guides = true,
    className,
    ...props
  },
  ref,
) {
  const rtl = (useOptionalTheme()?.dir ?? "ltr") === "rtl";
  const [internalExpanded, setInternalExpanded] = useState<string[]>(defaultExpanded);
  const expandedIds = expandedProp ?? internalExpanded;
  const expanded = useMemo(() => new Set(expandedIds), [expandedIds]);
  const [internalSelected, setInternalSelected] = useState<string | null>(defaultSelected);
  const selected = selectedProp !== undefined ? selectedProp : internalSelected;

  const rows = useMemo(() => visibleRows(items, expanded), [items, expanded]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // The one tab stop: the focused row, else the selected one if visible, else the first.
  const tabStop = rows.find((r) => r.item.id === focusedId)?.item.id ?? rows.find((r) => r.item.id === selected)?.item.id ?? rows[0]?.item.id;
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const typeahead = useRef({ text: "", at: 0 });

  const setExpanded = (ids: string[]) => {
    if (expandedProp === undefined) setInternalExpanded(ids);
    onExpandedChange?.(ids);
  };
  const toggle = (id: string, open = !expanded.has(id)) => setExpanded(open ? [...expandedIds.filter((x) => x !== id), id] : expandedIds.filter((x) => x !== id));
  const select = (item: TreeItem) => {
    if (item.disabled) return;
    if (selectedProp === undefined) setInternalSelected(item.id);
    onSelectedChange?.(item.id, item);
  };
  const focusRow = (id: string | undefined) => {
    if (!id) return;
    setFocusedId(id);
    rowRefs.current.get(id)?.focus();
  };

  const onKeyDown = (row: Row) => (e: KeyboardEvent<HTMLLIElement>) => {
    // Rows nest, so only the row that has focus handles its keys.
    if (e.target !== e.currentTarget) return;
    const index = rows.findIndex((r) => r.item.id === row.item.id);
    const hasChildren = !!row.item.children?.length;
    const isOpen = expanded.has(row.item.id);
    const inward = rtl ? "ArrowLeft" : "ArrowRight";
    const outward = rtl ? "ArrowRight" : "ArrowLeft";
    const go = (handled: () => void) => {
      e.preventDefault();
      handled();
    };

    switch (e.key) {
      case "ArrowDown":
        return go(() => focusRow(rows[index + 1]?.item.id));
      case "ArrowUp":
        return go(() => focusRow(rows[index - 1]?.item.id));
      case "Home":
        return go(() => focusRow(rows[0]?.item.id));
      case "End":
        return go(() => focusRow(rows[rows.length - 1]?.item.id));
      case inward:
        return go(() => {
          if (!hasChildren) return;
          if (!isOpen) toggle(row.item.id, true);
          else focusRow(row.item.children?.[0]?.id);
        });
      case outward:
        return go(() => {
          if (hasChildren && isOpen) toggle(row.item.id, false);
          else if (row.parent) focusRow(row.parent);
        });
      case "Enter":
      case " ":
        return go(() => {
          select(row.item);
          if (e.key === "Enter" && hasChildren) toggle(row.item.id);
        });
      case "*":
        return go(() => {
          const siblings = findSiblings(items, row.item.id) ?? [];
          const branches = siblings.filter((s) => s.children?.length).map((s) => s.id);
          setExpanded([...new Set([...expandedIds, ...branches])]);
        });
    }

    // Type-ahead: jump to the next visible row whose label starts with what was typed.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      const t = typeahead.current;
      t.text = now - t.at > 700 ? e.key : t.text + e.key;
      t.at = now;
      // Pressing the same letter again ("b", "b") cycles through matches rather than
      // searching for "bb"; a real prefix ("bu") narrows and stays put while it matches.
      const repeated = t.text.length > 1 && [...t.text].every((c) => c.toLocaleLowerCase() === t.text[0]?.toLocaleLowerCase());
      const query = (repeated ? e.key : t.text).toLocaleLowerCase();
      const ordered = [...rows.slice(index + 1), ...rows.slice(0, index + 1)];
      const pool = !repeated && t.text.length > 1 && row.item.label.toLocaleLowerCase().startsWith(query) ? [row, ...ordered] : ordered;
      const match = pool.find((r) => r.item.label.toLocaleLowerCase().startsWith(query));
      if (match) {
        e.preventDefault();
        focusRow(match.item.id);
      }
    }
  };

  const rowHeight = size === "sm" ? "h-7 text-xs" : "h-9 text-sm";
  const indent = size === "sm" ? 16 : 20;

  const renderLevel = (levelItems: TreeItem[], depth: number, parent: string | null): ReactNode =>
    levelItems.map((item, i) => {
      const row: Row = { item, depth, parent, pos: i + 1, size: levelItems.length };
      const hasChildren = !!item.children?.length;
      const isOpen = hasChildren && expanded.has(item.id);
      const isSelected = selected === item.id;
      return (
        <li
          key={item.id}
          ref={(el) => {
            if (el) rowRefs.current.set(item.id, el);
            else rowRefs.current.delete(item.id);
          }}
          role="treeitem"
          aria-level={depth + 1}
          aria-posinset={row.pos}
          aria-setsize={row.size}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-selected={isSelected}
          aria-disabled={item.disabled || undefined}
          tabIndex={item.id === tabStop ? 0 : -1}
          onKeyDown={onKeyDown(row)}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusedId(item.id);
          }}
          className="group/treeitem list-none outline-none"
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mouse target for the row; the keyboard is handled on the treeitem (<li>) */}
          <div
            onClick={() => {
              focusRow(item.id);
              select(item);
              if (hasChildren) toggle(item.id);
            }}
            style={{ paddingInlineStart: depth * indent + 4 }}
            className={cn(
              "relative flex cursor-default select-none items-center gap-1.5 rounded-md pe-2 transition-colors duration-(--nv-duration-fast)",
              rowHeight,
              isSelected ? "bg-primary-subtle font-medium text-primary-on-subtle" : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
              item.disabled && "pointer-events-none opacity-50",
              // Focus shows on the row the keyboard is on.
              "group-focus-visible/treeitem:outline-2 group-focus-visible/treeitem:-outline-offset-2 group-focus-visible/treeitem:outline-focus-ring",
            )}
          >
            {guides
              ? Array.from({ length: depth }, (_, d) => (
                  <span
                    key={d}
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 w-px bg-border"
                    style={{ insetInlineStart: d * indent + 4 + indent / 2 + 3 }}
                  />
                ))
              : null}
            <span aria-hidden className="flex size-5 shrink-0 items-center justify-center text-foreground-muted">
              {hasChildren ? (
                <ChevronRight
                  className={cn("size-4 transition-transform duration-(--nv-duration-normal) ease-(--nv-ease-interactive) rtl:-scale-x-100", isOpen && "rotate-90 rtl:-rotate-90")}
                />
              ) : null}
            </span>
            {item.icon ? (
              <span aria-hidden className={cn("flex shrink-0 items-center [&_svg]:size-4", isSelected ? "text-primary-text" : "text-foreground-muted")}>
                {item.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge ? <span className="shrink-0 text-xs tabular-nums text-foreground-muted">{item.badge}</span> : null}
          </div>
          {hasChildren && isOpen ? (
            <ul role="group" className="m-0 animate-nv-slide-down list-none p-0">
              {renderLevel(item.children ?? [], depth + 1, item.id)}
            </ul>
          ) : null}
        </li>
      );
    });

  return (
    <ul ref={ref} role="tree" aria-label={label} className={cn("m-0 flex list-none flex-col gap-px p-0", className)} {...props}>
      {renderLevel(items, 0, null)}
    </ul>
  );
});
