"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { forwardRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Chip } from "./chip.tsx";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, type ComboboxOption } from "./command.tsx";
import { useFormField } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./overlay.tsx";
import { focusRing } from "./shared.ts";

export interface MultiSelectLabels {
  /** The "create" row. */
  create?: (query: string) => string;
  /** Remove button on each chip. */
  remove?: (label: string) => string;
  /** Spoken after a chosen option's name. */
  selected?: string;
  /** Shown when `max` is reached. */
  maxReached?: (max: number) => string;
}

export interface MultiSelectProps {
  /** The choices: `{ value, label, disabled? }`. */
  options: ComboboxOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /**
   * Lets people add a value that isn't in `options`. Called with the typed text;
   * return the new option (or a promise of it) to select it, or undefined to cancel.
   */
  onCreate?: (query: string) => ComboboxOption | undefined | Promise<ComboboxOption | undefined>;
  /** Most values that can be chosen. */
  max?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
  /** Keep the list open after each choice. */
  closeOnSelect?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
  /** Submits each value with native forms (one hidden input per value). */
  name?: string;
  onBlur?: () => void;
  labels?: MultiSelectLabels;
}

/**
 * Several choices from a long list, with search. Chosen values show as removable
 * chips; Backspace on the field removes the last one. With `onCreate`, typing a
 * value that isn't listed offers to add it.
 */
export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(function MultiSelect(
  {
    options,
    value,
    defaultValue = [],
    onValueChange,
    onCreate,
    max,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyMessage = "No results.",
    closeOnSelect = false,
    size,
    className,
    name,
    onBlur,
    labels,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internal, setInternal] = useState<string[]>(defaultValue);
  // Options added with onCreate, until the parent passes them back in `options`.
  const [created, setCreated] = useState<ComboboxOption[]>([]);
  const current = value !== undefined ? value : internal;
  const { disabled, required, ...fieldProps } = useFormField(rest);
  const all = [...options, ...created.filter((c) => !options.some((o) => o.value === c.value))];
  const byValue = new Map(all.map((o) => [o.value, o]));
  const full = max !== undefined && current.length >= max;
  const trimmed = query.trim();
  const canCreate = !!onCreate && trimmed !== "" && !full && !all.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());

  const set = (next: string[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const toggle = (v: string) => {
    if (current.includes(v)) set(current.filter((x) => x !== v));
    else if (!full) set([...current, v]);
    setQuery("");
    if (closeOnSelect) setOpen(false);
  };
  const create = async () => {
    const option = await onCreate?.(trimmed);
    if (!option) return;
    setCreated((list) => [...list, option]);
    set([...current, option.value]);
    setQuery("");
  };
  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Backspace" && current.length > 0 && !disabled) {
      e.preventDefault();
      set(current.slice(0, -1));
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          onBlur?.();
        }
      }}
    >
      {/* Disabled fields submit nothing, like native controls. */}
      {name ? current.map((v) => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />) : null}
      <PopoverAnchor asChild>
        <div
          data-disabled={disabled || undefined}
          className={cn(
            fieldVariants({ size }),
            "flex h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5 ps-1.5 has-[button[role=combobox]:focus-visible]:border-focus-ring has-[button[role=combobox]:focus-visible]:ring-3 has-[button[role=combobox]:focus-visible]:ring-focus-ring/25 data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken data-disabled:opacity-60",
            fieldProps["aria-invalid"] && "border-danger-text",
            className,
          )}
        >
          {current.length > 0 ? (
            <ul className="contents list-none">
              {current.map((v) => {
                const option = byValue.get(v);
                const label = option?.label ?? v;
                return (
                  <li key={v} className="min-w-0">
                    <Chip size="sm" icon={option?.icon} disabled={disabled} onRemove={() => set(current.filter((x) => x !== v))} removeLabel={labels?.remove?.(label) ?? `Remove ${label}`}>
                      {label}
                    </Chip>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <PopoverTrigger asChild disabled={disabled}>
            <button
              ref={ref}
              type="button"
              // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- PopoverTrigger asChild adds aria-controls and aria-expanded at runtime
              role="combobox"
              aria-expanded={open}
              aria-required={required}
              onKeyDown={onTriggerKeyDown}
              onBlur={() => {
                if (!open) onBlur?.();
              }}
              className={cn("flex min-w-24 flex-1 items-center justify-between gap-2 self-stretch rounded-sm px-1.5 text-start text-sm text-foreground-muted outline-none", focusRing, "focus-visible:outline-none")}
              {...fieldProps}
            >
              <span className="truncate">{current.length === 0 ? placeholder : ""}</span>
              <ChevronsUpDown aria-hidden className="size-4 shrink-0" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0" align="start" sideOffset={6}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {canCreate ? null : <CommandEmpty>{emptyMessage}</CommandEmpty>}
            {all.map((option) => {
              const selected = current.includes(option.value);
              return (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label, ...(option.keywords ?? [])]}
                  disabled={option.disabled || (full && !selected)}
                  onSelect={toggle}
                >
                  {option.icon}
                  <span className="truncate">{option.label}</span>
                  {/* cmdk's aria-selected marks the highlighted row, so the chosen state is spoken as text. */}
                  {selected ? <span className="sr-only">{labels?.selected ?? ", selected"}</span> : null}
                  <Check aria-hidden className={cn("ms-auto text-primary-text", selected ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              );
            })}
            {canCreate ? (
              <CommandItem value={`__create__${trimmed}`} keywords={[trimmed]} onSelect={() => void create()}>
                <Plus aria-hidden />
                <span className="truncate">{labels?.create?.(trimmed) ?? `Create “${trimmed}”`}</span>
              </CommandItem>
            ) : null}
          </CommandList>
          {full ? (
            <p role="status" className="border-t border-border px-3 py-2 text-xs text-foreground-muted">
              {labels?.maxReached?.(max) ?? `You can choose up to ${max}.`}
            </p>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
});
