"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Check, Copy, Star, X } from "lucide-react";
import { forwardRef, useEffect, useId, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button.tsx";
import { useFormField, useFormFieldContext } from "./field.tsx";
import { focusRing, pressable, transition } from "./shared.ts";

/* -------------------------------------------------------------------- Chip */

const chipVariants = cva(
  `group/chip inline-flex max-w-full items-center gap-1.5 rounded-full border font-medium ${transition}`,
  {
    variants: {
      size: { sm: "h-7 px-2.5 text-xs [&_svg]:size-3.5", md: "h-8 px-3 text-sm [&_svg]:size-4" },
      selected: {
        true: "border-primary-border bg-primary-subtle text-primary-on-subtle",
        false: "border-border bg-surface text-foreground-secondary hover:border-border-strong hover:bg-surface-hover hover:text-foreground",
      },
    },
    defaultVariants: { size: "md", selected: false },
  },
);

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange">, Omit<VariantProps<typeof chipVariants>, "selected"> {
  /** Makes the chip a toggle (filters). Controlled. */
  selected?: boolean;
  /** Called when a selectable chip is toggled. */
  onSelectedChange?: (selected: boolean) => void;
  /** Shows a remove button (tags, applied filters). */
  onRemove?: () => void;
  /** Accessible label for the remove button. Defaults to "Remove <text>". */
  removeLabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

/**
 * Compact, interactive tokens for filters, tags and choices. Selectable chips
 * are toggle buttons (aria-pressed) whose check mark slides in on selection.
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { selected, onSelectedChange, onRemove, removeLabel, icon, size, disabled, className, children, ...props },
  ref,
) {
  const selectable = onSelectedChange !== undefined || selected !== undefined;
  const isSelected = !!selected;
  const label = typeof children === "string" ? children : undefined;
  const content = (
    <>
      {selectable ? (
        // The check mark grows in from zero width so the label slides over.
        <span
          aria-hidden
          className={cn(
            "inline-flex overflow-hidden transition-[width,opacity] duration-(--nv-duration-slow) ease-(--nv-ease-interactive)",
            isSelected ? "w-4 opacity-100" : "w-0 opacity-0",
          )}
        >
          <Check className="shrink-0" strokeWidth={3} />
        </span>
      ) : null}
      {icon}
      <span className="truncate">{children}</span>
    </>
  );
  return (
    <span
      ref={ref}
      data-selected={isSelected || undefined}
      className={cn(chipVariants({ size, selected: isSelected }), onRemove && "pe-1", disabled && "pointer-events-none opacity-50", className)}
      {...props}
    >
      {selectable ? (
        <button
          type="button"
          aria-pressed={isSelected}
          disabled={disabled}
          onClick={() => onSelectedChange?.(!isSelected)}
          className={cn("inline-flex items-center gap-1.5 rounded-full outline-none", focusRing, pressable, transition)}
        >
          {content}
        </button>
      ) : (
        content
      )}
      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={removeLabel ?? (label ? `Remove ${label}` : "Remove")}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full text-foreground-muted hover:bg-danger-subtle hover:text-danger-on-subtle [&_svg]:size-3 [&_svg]:transition-transform [&_svg]:duration-(--nv-duration-slow) [&_svg]:ease-(--nv-ease-interactive) hover:[&_svg]:rotate-90",
            focusRing,
            transition,
          )}
        >
          <X />
        </button>
      ) : null}
    </span>
  );
});

/* -------------------------------------------------------------- CopyButton */

export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  /** Text to copy. */
  value: string;
  /** Visible label; omit for an icon-only button (then pass aria-label or keep the default). */
  label?: ReactNode;
  /** Shown and announced after copying. */
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Called after the value was copied. */
  onCopied?: () => void;
}

/**
 * Copies text to the clipboard. The icon morphs into a check mark and a polite
 * live region announces "Copied" to screen readers.
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  { value, label, copiedLabel = "Copied", variant = "outline", size = "sm", onCopied, className, onClick, "aria-label": ariaLabel, ...props },
  ref,
) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);
  const iconOnly = label === undefined;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={iconOnly ? (copied ? copiedLabel : (ariaLabel ?? "Copy to clipboard")) : ariaLabel}
      className={cn(buttonVariants({ variant, size }), iconOnly && "aspect-square px-0", className)}
      onClick={(e) => {
        onClick?.(e);
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          onCopied?.();
        });
      }}
      {...props}
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        <Copy aria-hidden className={cn("absolute transition-[scale,opacity] duration-(--nv-duration-slow) ease-(--nv-ease-interactive)", copied ? "scale-0 opacity-0" : "scale-100 opacity-100")} />
        <Check aria-hidden className={cn("absolute text-success-text transition-[scale,opacity] duration-(--nv-duration-slow) ease-(--nv-ease-interactive)", copied ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
      </span>
      {iconOnly ? null : copied ? copiedLabel : label}
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
});

/* ------------------------------------------------------------------ Rating */

export interface RatingProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  /** Display-only rating. */
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  /** Accessible group name, e.g. "Rate this recipe". */
  label?: string;
  /** Text for each option, e.g. (n) => `${n} stars`. */
  getOptionLabel?: (value: number) => string;
  name?: string;
  /** Disables every star. Inherited from a surrounding FormField. */
  disabled?: boolean;
  /** Marks the group required (native `required` on the radios). Inherited from FormField. */
  required?: boolean;
}

const starSizes = { sm: "size-4", md: "size-6", lg: "size-8" };
// Empty stars are the choices, so they need 3:1 non-text contrast (WCAG 1.4.11):
// `input` is resolved to at least 3:1; `border-strong` only to 1.6:1.
const emptyStar = "text-input";

/**
 * A star rating built on native radio inputs: arrow keys, form submission and
 * screen readers work as standard. Stars preview on hover and pop when chosen.
 */
export const Rating = forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value,
    defaultValue = 0,
    onValueChange,
    max = 5,
    readOnly = false,
    size = "md",
    label,
    getOptionLabel = (n) => `${n} star${n === 1 ? "" : "s"}`,
    name,
    disabled: disabledProp,
    required: requiredProp,
    className,
    ...rest
  },
  ref,
) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const [hover, setHover] = useState<number | null>(null);
  const autoName = useId();
  const shown = hover ?? current;
  // Inside a FormField: take its id, description/message ids, invalid, required and disabled.
  const field = useFormFieldContext();
  const { disabled, required, ...props } = useFormField({ ...rest, disabled: disabledProp, required: requiredProp });
  // The field's visible label names the group; an explicit `label` prop still wins.
  const naming = label !== undefined ? { "aria-label": label } : field?.labelId ? { "aria-labelledby": field.labelId } : { "aria-label": "Rating" };

  if (readOnly) {
    return (
      <div ref={ref} role="img" aria-label={`${current} out of ${max}`} className={cn("inline-flex gap-0.5", className)} {...props}>
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} aria-hidden className={cn(starSizes[size], i < Math.round(current) ? "fill-warning text-warning-text" : emptyStar)} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      {...naming}
      aria-required={required || undefined}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn("inline-flex gap-0.5", disabled && "opacity-50", className)}
      onPointerLeave={() => setHover(null)}
      {...props}
    >
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const id = `${autoName}-${n}`;
        const filled = n <= shown;
        return (
          <label
            key={n}
            htmlFor={id}
            className={cn("group/star relative", disabled ? "cursor-not-allowed" : "cursor-pointer")}
            onPointerEnter={disabled ? undefined : () => setHover(n)}
          >
            <input
              id={id}
              type="radio"
              name={name ?? autoName}
              value={n}
              checked={current === n}
              disabled={disabled}
              required={required}
              onChange={() => {
                if (value === undefined) setInternal(n);
                onValueChange?.(n);
              }}
              className="peer sr-only"
            />
            <span className="sr-only">{getOptionLabel(n)}</span>
            <Star
              aria-hidden
              className={cn(
                starSizes[size],
                "rounded-sm transition-[scale,color,fill] duration-(--nv-duration-slow) ease-(--nv-ease-interactive) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring peer-checked:animate-nv-bounce-in",
                !disabled && "group-hover/star:scale-125 motion-reduce:group-hover/star:scale-100",
                filled ? "fill-warning text-warning-text" : cn("fill-transparent", emptyStar),
              )}
            />
          </label>
        );
      })}
    </div>
  );
});
