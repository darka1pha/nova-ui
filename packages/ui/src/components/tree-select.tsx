"use client";

import { ChevronsUpDown, Search } from "lucide-react";
import { forwardRef, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent } from "react";
import { cn } from "../utils/cn.ts";
import { useFormField, useFormFieldContext } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./overlay.tsx";
import { TreeView, type TreeItem } from "./tree.tsx";

export interface TreeSelectLabels {
  /** Placeholder and name of the search box. */
  search?: string;
  /** Shown when nothing matches the search. */
  empty?: string;
  /** Trigger text when several items are picked and they don't fit, e.g. (first, rest) => `${first} +${rest}`. */
  more?: (first: string, rest: number) => string;
}

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "defaultValue" | "onChange"> {
  /** The tree to pick from: `{ id, label, icon?, disabled?, children? }`. */
  items: TreeItem[];
  placeholder?: string;
  /** Show a search box that filters the tree (matches keep their ancestors). Default true. */
  searchable?: boolean;
  /** Ids of branches open when the list opens. */
  defaultExpanded?: string[];
  size?: "sm" | "md" | "lg";
  /** Submits the value with forms: one hidden input per picked id. */
  name?: string;
  labels?: TreeSelectLabels;
}

export interface TreeSelectSingleProps extends BaseProps {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Let branches (items with children) be picked too, not only leaves. Default false. */
  branchesSelectable?: boolean;
  /** Picking the selected item again clears it. Default true. */
  clearable?: boolean;
}

export interface TreeSelectMultipleProps extends BaseProps {
  /** Pick several leaves with checkboxes; checking a branch picks every leaf under it. */
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type TreeSelectProps = TreeSelectSingleProps | TreeSelectMultipleProps;

function flatten(items: TreeItem[], out = new Map<string, TreeItem>()): Map<string, TreeItem> {
  for (const item of items) {
    out.set(item.id, item);
    if (item.children) flatten(item.children, out);
  }
  return out;
}

/** The items whose label matches, with their ancestors (so the path stays visible). */
function filterTree(items: TreeItem[], query: string): TreeItem[] {
  if (!query) return items;
  return items.flatMap((item) => {
    if (item.label.toLocaleLowerCase().includes(query)) return [item];
    const children = item.children ? filterTree(item.children, query) : [];
    return children.length ? [{ ...item, children }] : [];
  });
}

const branchIds = (items: TreeItem[]): string[] => items.flatMap((i) => (i.children?.length ? [i.id, ...branchIds(i.children)] : []));

/**
 * Picks one item, or several with `multiple`, from a hierarchy: departments, locations,
 * categories. A field-styled button opens a searchable TreeView, so the tree keyboard works
 * inside (arrows, Right/Left to open and close, type-ahead). Down from the search box moves
 * into the tree.
 */
export const TreeSelect = forwardRef<HTMLButtonElement, TreeSelectProps>(function TreeSelect(props, ref) {
  const {
    items,
    placeholder = "Select…",
    searchable = true,
    defaultExpanded = [],
    size,
    name,
    labels,
    className,
    multiple: _multiple,
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    ...rest
  } = props;
  const { branchesSelectable: _b, clearable: _c, ...buttonProps } = rest as Omit<BaseProps, "items" | "placeholder" | "searchable" | "defaultExpanded" | "size" | "name" | "labels"> & {
    branchesSelectable?: boolean;
    clearable?: boolean;
    required?: boolean;
  };
  const { disabled, required, ...fieldProps } = useFormField(buttonProps);
  // The popup and its tree take the field's name: its label, else aria-label, else the placeholder.
  const labelId = useFormFieldContext()?.labelId ?? buttonProps["aria-labelledby"];
  const naming = labelId ? { "aria-labelledby": labelId } : { "aria-label": buttonProps["aria-label"] ?? placeholder };

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  // One state shape for both modes: a list of ids.
  const initial = props.multiple ? (props.defaultValue ?? []) : props.defaultValue ? [props.defaultValue] : [];
  const [internal, setInternal] = useState<string[]>(initial);
  const controlled = props.multiple ? props.value : props.value === undefined ? undefined : props.value === null ? [] : [props.value];
  const picked = controlled ?? internal;

  const byId = useMemo(() => flatten(items), [items]);
  const lower = query.trim().toLocaleLowerCase();
  const visible = useMemo(() => filterTree(items, lower), [items, lower]);

  const commit = (next: string[]) => {
    if (controlled === undefined) setInternal(next);
    if (props.multiple) props.onValueChange?.(next);
    else props.onValueChange?.(next[0] ?? null);
  };

  const pickedLabels = picked.map((id) => byId.get(id)?.label ?? id);
  const more = labels?.more ?? ((first: string, restCount: number) => `${first} +${restCount}`);
  const display = pickedLabels.length === 0 ? null : pickedLabels.length <= 2 ? pickedLabels.join(", ") : more(pickedLabels[0] ?? "", pickedLabels.length - 1);
  const searchLabel = labels?.search ?? "Search…";

  const focusTree = () => contentRef.current?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]')?.focus();
  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusTree();
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setQuery("");
      }}
    >
      {name ? picked.map((id) => <input key={id} type="hidden" name={name} value={id} />) : null}
      <PopoverTrigger asChild disabled={disabled}>
        <button
          ref={ref}
          type="button"
          // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- PopoverTrigger asChild adds aria-controls and aria-expanded at runtime
          role="combobox"
          aria-haspopup="tree"
          aria-expanded={open}
          aria-required={required}
          className={cn(fieldVariants({ size }), "flex items-center justify-between gap-2 text-start", !display && "text-foreground-muted", className)}
          {...fieldProps}
        >
          <span className="min-w-0 truncate">{display ?? placeholder}</span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-foreground-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        {...naming}
        className="flex w-(--radix-popover-trigger-width) min-w-64 flex-col gap-1 p-1"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => {
          // Without a search box, start on the tree.
          if (!searchable) {
            e.preventDefault();
            requestAnimationFrame(focusTree);
          }
        }}
      >
        {searchable ? (
          <div className="flex items-center gap-2 border-b border-border px-2">
            <Search aria-hidden className="size-4 shrink-0 text-foreground-muted" />
            <input
              type="search"
              aria-label={searchLabel}
              placeholder={searchLabel}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              className="h-9 w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
            />
          </div>
        ) : null}
        {visible.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-foreground-muted">{labels?.empty ?? "No results."}</p>
        ) : (
          <div className="max-h-72 overflow-y-auto p-1">
            <TreeView
              label={buttonProps["aria-label"] ?? placeholder}
              {...(labelId ? { "aria-labelledby": labelId } : {})}
              items={visible}
              size="sm"
              // While searching, show every match in place.
              expanded={lower ? branchIds(visible) : expanded}
              onExpandedChange={(ids) => {
                if (!lower) setExpanded(ids);
              }}
              {...(props.multiple
                ? { checkable: true, checkedIds: picked, onCheckedIdsChange: commit }
                : {
                    selected: picked[0] ?? null,
                    onSelectedChange: (id: string, item: TreeItem) => {
                      if (item.children?.length && !props.branchesSelectable) return; // the tree opens it instead
                      commit((props.clearable ?? true) && picked[0] === id ? [] : [id]);
                      setOpen(false);
                    },
                  })}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
