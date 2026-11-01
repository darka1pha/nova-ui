"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Dialog as DialogPrimitive, VisuallyHidden as VisuallyHiddenPrimitive } from "radix-ui";
import { forwardRef, useState, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useFormField } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./overlay.tsx";
import { usePortalContainer } from "./portal.tsx";
import { menuItem } from "./shared.ts";

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
  options: ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
  /** Allow deselecting the current option by choosing it again. */
  clearable?: boolean;
  /** Submits the value with native forms (rendered as a hidden input). */
  name?: string;
  /** Fires when focus leaves the field (marks it "touched" in form libraries). */
  onBlur?: () => void;
}

/** A searchable single-select. Use Select when the list is short. */
export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    options,
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
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const current = value !== undefined ? value : internal;
  const selected = options.find((o) => o.value === current);
  const { disabled, required, ...fieldProps } = useFormField(rest);

  const choose = (next: string) => {
    const resolved = clearable && next === current ? null : next;
    if (value === undefined) setInternal(resolved);
    onValueChange?.(resolved);
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
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0" align="start" sideOffset={6}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {options.map((option) => (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
