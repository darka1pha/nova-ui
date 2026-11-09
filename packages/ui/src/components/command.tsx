"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { Dialog as DialogPrimitive, VisuallyHidden as VisuallyHiddenPrimitive } from "radix-ui";
import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useLatestRef } from "../utils/use-latest-ref.ts";
import { useFormField } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./overlay.tsx";
import { usePortalContainer } from "./portal.tsx";
import { menuItem } from "./shared.ts";
import { Spinner } from "./spinner.tsx";

/* ----------------------------------------------------------------- Command */

/** A filterable, keyboard-driven list. The base of Combobox and CommandPalette. */
export const Command = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof CommandPrimitive>>(function Command({ className, ...props }, ref) {
  return <CommandPrimitive ref={ref} className={cn("flex size-full flex-col overflow-hidden bg-surface-raised text-foreground", className)} {...props} />;
});

export const CommandInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<typeof CommandPrimitive.Input>>(function CommandInput({ className, ...props }, ref) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3" cmdk-input-wrapper="">
      <Search aria-hidden className="size-4 shrink-0 text-foreground-muted" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn("flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-foreground-muted disabled:opacity-50", className)}
        {...props}
      />
    </div>
  );
});

export const CommandList = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(function CommandList({ className, ...props }, ref) {
  return <CommandPrimitive.List ref={ref} className={cn("max-h-80 overflow-y-auto overflow-x-hidden p-1", className)} {...props} />;
});

export const CommandEmpty = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>>(function CommandEmpty({ className, ...props }, ref) {
  return <CommandPrimitive.Empty ref={ref} className={cn("py-6 text-center text-sm text-foreground-muted", className)} {...props} />;
});

export const CommandGroup = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(function CommandGroup({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn("overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-foreground-muted", className)}
      {...props}
    />
  );
});

export const CommandSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>>(function CommandSeparator(
  { className, ...props },
  ref,
) {
  return <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />;
});

export const CommandItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(menuItem, "data-[selected=true]:bg-primary-subtle data-[selected=true]:text-primary-on-subtle data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50", className)}
      {...props}
    />
  );
});

export function CommandShortcut({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ms-auto font-mono text-xs text-foreground-muted", className)} {...props} />;
}

/* --------------------------------------------------------- CommandPalette */

export interface CommandPaletteProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  /** Accessible title (visually hidden). */
  title?: string;
  children: ReactNode;
  /** Props forwarded to the inner Command (filtering, `loop`, etc.). */
  commandProps?: ComponentPropsWithoutRef<typeof CommandPrimitive>;
}

/**
 * A modal command menu (⌘K pattern). Compose with CommandInput, CommandList,
 * CommandGroup and CommandItem. Bind the shortcut in your app; see docs.
 */
export function CommandPalette({ title = "Command palette", children, commandProps, ...props }: CommandPaletteProps) {
  const container = usePortalContainer();
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-(--nv-z-overlay) bg-overlay/50 backdrop-blur-[2px] data-[state=open]:animate-nv-fade-in data-[state=closed]:animate-nv-fade-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[15dvh] z-(--nv-z-modal) w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-(--nv-dialog-radius) border border-border bg-surface-raised shadow-xl outline-none data-[state=open]:animate-nv-pop-in data-[state=closed]:animate-nv-pop-out"
        >
          <VisuallyHiddenPrimitive.Root asChild>
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          </VisuallyHiddenPrimitive.Root>
          <Command {...commandProps}>{children}</Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* --------------------------------------------------------------- Combobox */

export interface ComboboxOption {
  value: string;
  label: string;
  /** Extra search terms. */
  keywords?: string[];
  disabled?: boolean;
  icon?: ReactNode;
}

export interface ComboboxProps {
  /** The choices: `{ value, label, disabled? }`. With `loadOptions`, the ones shown until the first load finishes. */
  options?: ComboboxOption[];
  /**
   * Fetch options as the user types, instead of filtering `options`. Called on
   * open with "" and then (debounced) for each query. Abort your request when
   * `signal` fires: a newer query or closing the list supersedes it.
   */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<ComboboxOption[]> | ComboboxOption[];
  /** Debounce for `loadOptions`, in ms. Default 250. */
  debounceMs?: number;
  /** Shown while `loadOptions` is pending. */
  loadingMessage?: ReactNode;
  /** Shown when `loadOptions` rejects. */
  errorMessage?: ReactNode;
  /**
   * Offer a "Create …" item when the search doesn't exactly match an option.
   * Choosing it calls `onCreate` with the text; if that returns an option (or a
   * promise of one), its value is selected, otherwise the text itself is.
   */
  creatable?: boolean;
  /** Called with the typed text when the create item is chosen. Return the new option, its value, or nothing to use the text. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- a callback that returns nothing selects the typed text
  onCreate?: (label: string) => ComboboxOption | string | void | Promise<ComboboxOption | string | void>;
  /** Text of the create item. Default: `Create "query"`. */
  formatCreateLabel?: (query: string) => ReactNode;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  /** Placeholder of the search field in the list. */
  searchPlaceholder?: string;
  /** Shown when nothing matches the search. */
  emptyMessage?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
  /** Accessible name, when there's no visible label. */
  "aria-label"?: string;
  /** Ids of elements that describe the field. Set for you inside FormField. */
  "aria-describedby"?: string;
  /** Marks the field invalid. Set for you inside FormField. */
  "aria-invalid"?: boolean;
  required?: boolean;
  /** Allow deselecting the current option by choosing it again. */
  clearable?: boolean;
  /** Submits the value with native forms (rendered as a hidden input). */
  name?: string;
  /** Fires when focus leaves the field (marks it "touched" in form libraries). */
  onBlur?: () => void;
}

/**
 * A searchable single-select. Use Select when the list is short. Pass
 * `loadOptions` to search a server, and `creatable` to let people add a
 * value that isn't in the list.
 */
export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    options: optionsProp = [],
    loadOptions,
    debounceMs = 250,
    loadingMessage = "Loading…",
    errorMessage = "Couldn't load options.",
    creatable = false,
    onCreate,
    formatCreateLabel = (query) => `Create "${query}"`,
    value,
    defaultValue = null,
    onValueChange,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyMessage = "No results.",
    size,
    className,
    clearable = true,
    name,
    onBlur,
    ...rest
  },
  ref,
) {
  const [open, setOpenState] = useState(false);
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const current = value !== undefined ? value : internal;
  const { disabled, required, ...fieldProps } = useFormField(rest);
  const [search, setSearch] = useState("");
  const async = loadOptions !== undefined;
  const [loaded, setLoaded] = useState<ComboboxOption[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  // Options from earlier loads or created here, so the trigger still shows the
  // label of a value that isn't in the current results.
  const [known, setKnown] = useState<Record<string, ComboboxOption>>({});
  const options = async ? (loaded ?? optionsProp) : optionsProp;
  const selected =
    options.find((o) => o.value === current) ?? optionsProp.find((o) => o.value === current) ?? (current !== null ? known[current] : undefined);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    // Each opening starts from an empty search.
    setSearch("");
    if (next && async) setStatus("loading");
  };

  const loadRef = useLatestRef(loadOptions);
  useEffect(() => {
    const load = loadRef.current;
    if (!open || !load) return;
    const controller = new AbortController();
    const run = async () => {
      try {
        const result = await load(search, controller.signal);
        if (controller.signal.aborted) return;
        setLoaded(result);
        setKnown((prev) => ({ ...prev, ...Object.fromEntries(result.map((o) => [o.value, o])) }));
        setStatus("idle");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    };
    const id = setTimeout(() => void run(), search === "" ? 0 : debounceMs);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [open, search, debounceMs, loadRef]);

  const choose = (next: string) => {
    const resolved = clearable && next === current ? null : next;
    if (value === undefined) setInternal(resolved);
    onValueChange?.(resolved);
    setOpen(false);
  };

  const query = search.trim();
  const lower = query.toLocaleLowerCase();
  const canCreate = creatable && query !== "" && status !== "loading" && !options.some((o) => o.value === query || o.label.toLocaleLowerCase() === lower);
  const create = async () => {
    const result = await onCreate?.(query);
    const option: ComboboxOption =
      typeof result === "object" && result !== null
        ? result
        : { value: typeof result === "string" ? result : query, label: query };
    setKnown((prev) => ({ ...prev, [option.value]: option }));
    if (value === undefined) setInternal(option.value);
    onValueChange?.(option.value);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Closing the list is when the user has finished with the field.
        if (!next) onBlur?.();
      }}
    >
      {name ? <input type="hidden" name={name} value={current ?? ""} /> : null}
      <PopoverTrigger asChild disabled={disabled}>
        <button
          ref={ref}
          type="button"
          // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- PopoverTrigger asChild adds aria-controls and aria-expanded at runtime
          role="combobox"
          aria-expanded={open}
          aria-required={required}
          onBlur={() => {
            if (!open) onBlur?.();
          }}
          className={cn(fieldVariants({ size }), "flex items-center justify-between gap-2 text-start", !selected && "text-foreground-muted", className)}
          {...fieldProps}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {selected?.icon}
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-foreground-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        // The popup is a dialog; name it after the field so it isn't announced as an unnamed one.
        aria-label={rest["aria-label"] ?? searchPlaceholder}
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
        align="start"
        sideOffset={6}
      >
        <Command shouldFilter={!async}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={(next) => {
              setSearch(next);
              if (async) setStatus("loading");
            }}
          />
          <CommandList aria-busy={status === "loading" || undefined}>
            {status === "loading" ? (
              <CommandPrimitive.Loading className="flex items-center justify-center gap-2 py-6 text-sm text-foreground-muted">
                <Spinner size="sm" label="" />
                {loadingMessage}
              </CommandPrimitive.Loading>
            ) : status === "error" ? (
              <div role="alert" className="py-6 text-center text-sm text-danger-text">
                {errorMessage}
              </div>
            ) : canCreate ? null : (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            {status === "loading" ? null : options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                keywords={[option.label, ...(option.keywords ?? [])]}
                disabled={option.disabled}
                onSelect={choose}
              >
                {option.icon}
                <span className="truncate">{option.label}</span>
                <Check aria-hidden className={cn("ms-auto text-primary-text", option.value === current ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            ))}
            {canCreate ? (
              <CommandItem forceMount value={`\u0000create:${query}`} onSelect={() => void create()}>
                <Plus aria-hidden className="text-primary-text" />
                <span className="truncate">{formatCreateLabel(query)}</span>
              </CommandItem>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
