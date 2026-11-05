"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Minus, Plus, Search, X } from "lucide-react";
import { Direction } from "radix-ui";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { useLocale } from "../theme/theme-provider.tsx";
import { toLatinDigits } from "../utils/jalali.ts";
import { useFormField } from "./field.tsx";
import { transition } from "./shared.ts";

/** The shared look of every text-entry control. */
export const fieldVariants = cva(
  // `nv-field` marks every text-entry control for theme materials (glass, clay, neomorphic).
  `nv-field w-full min-w-0 rounded-(--nv-input-radius) border border-input bg-surface text-foreground shadow-xs ${transition} ` +
    "placeholder:text-foreground-muted placeholder:opacity-80 outline-none " +
    "hover:border-foreground-muted focus-visible:border-focus-ring focus-visible:ring-3 focus-visible:ring-focus-ring/25 " +
    // Invalid fields shake once when the error appears (FormField adds text, so it's not color alone).
    "aria-invalid:border-danger-text aria-invalid:focus-visible:ring-danger-text/25 aria-invalid:animate-nv-shake " +
    // Warning and valid states come from FormField (warning / success props, or a validated RHF field).
    "data-[status=warning]:border-warning-text data-[status=warning]:focus-visible:ring-warning-text/25 data-[status=valid]:border-success-text data-[status=valid]:focus-visible:ring-success-text/25 " +
    "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60 [&:is(input,textarea):read-only]:bg-surface-sunken",
  {
    variants: {
      // Padding is set per side (not `px-*`) so adornment padding like `ps-9` replaces it in the
      // merged class list. With `px-*` both classes survive and whichever stylesheet the consumer's
      // Tailwind emits last wins, which can put the text under a leading icon.
      size: {
        sm: "h-(--nv-control-h-sm) ps-2.5 pe-2.5 text-sm",
        md: "h-(--nv-control-h-md) ps-3 pe-3 text-sm",
        lg: "h-(--nv-control-h-lg) ps-4 pe-4 text-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

// useLayoutEffect warns during SSR on React 18; measuring only matters in the browser.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type FieldSize =NonNullable<VariantProps<typeof fieldVariants>["size"]>;

interface InputGroupContextValue {
  hasStart: boolean;
  hasEnd: boolean;
  size?: FieldSize;
}
const InputGroupContext = createContext<InputGroupContextValue | null>(null);

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, VariantProps<typeof fieldVariants> {}

/** A single-line text input. Wires itself to a surrounding FormField. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ size, className, type = "text", ...props }, ref) {
  const group = useContext(InputGroupContext);
  const fieldProps = useFormField(props);
  const inner = useRef<HTMLInputElement>(null);
  const composed = useComposedRefs(ref, inner);
  // The group lays out its adornments in its own direction, but logical padding (`ps-*`) follows
  // the input's. An input with its own `dir` (e.g. `dir="ltr"` for an email in an RTL page) would
  // pad the wrong side and the text would run under the icon, so swap the sides when they differ.
  const contextDir = Direction.useDirection();
  const [flipped, setFlipped] = useState(() => !!group && !!props.dir && props.dir !== "auto" && props.dir !== contextDir);
  useIsomorphicLayoutEffect(() => {
    const el = inner.current;
    const parent = el?.parentElement;
    if (!group || !el || !parent) return;
    const own = getComputedStyle(el).direction;
    const outer = getComputedStyle(parent).direction;
    if (!own || !outer) return; // no layout engine (e.g. jsdom): keep the prop-based guess
    if ((own !== outer) !== flipped) setFlipped(own !== outer);
  });
  const padStart = flipped ? "pe-9" : "ps-9";
  const padEnd = flipped ? "ps-9" : "pe-9";
  return (
    <input
      ref={composed}
      type={type}
      className={cn(
        fieldVariants({ size: size ?? group?.size }),
        group?.hasStart && padStart,
        group?.hasEnd && padEnd,
        "file:me-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...fieldProps}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with content (uses CSS field-sizing where supported). */
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, autoResize = false, rows = 3, ...props }, ref) {
  const fieldProps = useFormField(props);
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldVariants(), "h-auto min-h-20 px-3 py-2 leading-relaxed", autoResize ? "field-sizing-content resize-none" : "resize-y", className)}
      {...fieldProps}
    />
  );
});

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon or text shown before the input (inside it). */
  start?: ReactNode;
  /** Icon, text or a small button shown after the input. */
  end?: ReactNode;
  size?: FieldSize;
}

/** Decorates an Input with leading/trailing adornments. */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup({ start, end, size, className, children, ...props }, ref) {
  const adornment = "pointer-events-none absolute inset-y-0 flex items-center text-foreground-muted [&_svg]:size-4 [&_button]:pointer-events-auto";
  return (
    <InputGroupContext.Provider value={{ hasStart: !!start, hasEnd: !!end, size }}>
      <div ref={ref} className={cn("relative flex w-full items-center", className)} {...props}>
        {start ? <span className={cn(adornment, "start-3")}>{start}</span> : null}
        {children}
        {end ? <span className={cn(adornment, "end-2")}>{end}</span> : null}
      </div>
    </InputGroupContext.Provider>
  );
});

export interface SearchInputProps extends Omit<InputProps, "type"> {
  /** Called when the clear button is pressed or Escape clears the value. */
  onClear?: () => void;
  /** Accessible label for the clear button. */
  clearLabel?: string;
}

/** A search field with an icon and a clear button. Escape clears. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { onClear, clearLabel = "Clear search", value, defaultValue, onChange, onKeyDown, size, ...props },
  ref,
) {
  const inner = useRef<HTMLInputElement>(null);
  const composed = useComposedRefs(ref, inner);
  const [uncontrolled, setUncontrolled] = useState(String(defaultValue ?? ""));
  const current = value !== undefined ? String(value) : uncontrolled;

  const clear = () => {
    if (value === undefined) setUncontrolled("");
    if (inner.current) {
      // Notify listeners the same way typing would.
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(inner.current, "");
      inner.current.dispatchEvent(new Event("input", { bubbles: true }));
      inner.current.focus();
    }
    onClear?.();
  };

  return (
    <InputGroup
      size={size ?? undefined}
      start={<Search />}
      end={
        current ? (
          <button
            type="button"
            onClick={clear}
            aria-label={clearLabel}
            className="inline-flex size-6 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <X />
          </button>
        ) : null
      }
    >
      <Input
        ref={composed}
        type="search"
        role="searchbox"
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (value === undefined) setUncontrolled(e.target.value);
          onChange?.(e);
        }}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          onKeyDown?.(e);
          if (e.key === "Escape" && current && !e.defaultPrevented) {
            e.preventDefault();
            clear();
          }
        }}
        className="[&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
    </InputGroup>
  );
});

export interface NumberInputProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Intl number formatting, e.g. `{ style: "currency", currency: "EUR" }`. Applied when not focused. */
  formatOptions?: Intl.NumberFormatOptions;
  /** BCP 47 locale for formatting; defaults to the browser's. */
  locale?: string;
  /** Round committed values to this many decimals (e.g. 2 for cents). */
  precision?: number;
  /** Accessible name of the plus button. */
  incrementLabel?: string;
  /** Accessible name of the minus button. */
  decrementLabel?: string;
}

const clamp = (n: number, min?: number, max?: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

/**
 * A numeric field with stepper buttons, Arrow/Page key stepping, clamping and
 * locale-aware display formatting. Exposes `role="spinbutton"` semantics.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, defaultValue = null, onValueChange, min, max, step = 1, formatOptions, locale: localeProp, precision, incrementLabel = "Increase", decrementLabel = "Decrease", size, disabled, readOnly, onBlur, onFocus, onKeyDown, className, ...props },
  ref,
) {
  const [internal, setInternal] = useState<number | null>(defaultValue);
  const current = value !== undefined ? value : internal;
  const [draft, setDraft] = useState<string | null>(null);
  const fieldProps = useFormField({ disabled, ...props });
  const { locale } = useLocale(localeProp);

  const commit = useCallback(
    (next: number | null) => {
      const clamped =
        next === null || Number.isNaN(next) ? null : clamp(Number(next.toFixed(precision ?? Math.max(decimals(step), decimals(next)))), min, max);
      if (value === undefined) setInternal(clamped);
      onValueChange?.(clamped);
    },
    [value, onValueChange, min, max, step, precision],
  );

  const stepBy = (delta: number) => commit((current ?? min ?? 0) + delta);
  // Without a locale, plain JS digits; with one, its digits (Persian ۱۲٫۵ for fa-IR).
  const plain = (n: number) => (locale ? new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 20 }).format(n) : String(n));
  const format = (n: number | null) => (n === null ? "" : formatOptions ? new Intl.NumberFormat(locale, formatOptions).format(n) : plain(n));
  // Accepts what people type on any keyboard: Persian/Arabic digits and separators, or a decimal comma.
  const parse = (text: string) => {
    const t = toLatinDigits(text).trim().replace(",", ".");
    return t === "" ? null : Number(t);
  };
  const atMin = min !== undefined && current !== null && current <= min;
  const atMax = max !== undefined && current !== null && current >= max;
  const stepper =
    "flex h-1/2 w-7 items-center justify-center text-foreground-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5";

  return (
    <div className={cn("relative flex w-full items-stretch", className)}>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={current === null ? undefined : format(current)}
        readOnly={readOnly}
        className={cn(fieldVariants({ size }), "pe-9 tabular-nums")}
        value={draft ?? format(current)}
        onFocus={(e) => {
          setDraft(current === null ? "" : plain(current));
          onFocus?.(e);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => {
          if (draft !== null) commit(parse(draft));
          setDraft(null);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented || readOnly) return;
          const big = step * 10;
          const map: Record<string, () => void> = {
            ArrowUp: () => stepBy(step),
            ArrowDown: () => stepBy(-step),
            PageUp: () => stepBy(big),
            PageDown: () => stepBy(-big),
            Home: () => min !== undefined && commit(min),
            End: () => max !== undefined && commit(max),
            Enter: () => {
              if (draft !== null) commit(parse(draft));
            },
          };
          const action = map[e.key];
          if (action) {
            e.preventDefault();
            action();
            setDraft(null);
          }
        }}
        {...fieldProps}
      />
      <div className="absolute inset-y-px end-px flex flex-col overflow-hidden rounded-e-(--nv-input-radius) border-s border-border">
        <button type="button" tabIndex={-1} aria-label={incrementLabel} className={stepper} disabled={disabled || readOnly || atMax} onClick={() => stepBy(step)}>
          <Plus />
        </button>
        <button type="button" tabIndex={-1} aria-label={decrementLabel} className={cn(stepper, "border-t border-border")} disabled={disabled || readOnly || atMin} onClick={() => stepBy(-step)}>
          <Minus />
        </button>
      </div>
    </div>
  );
});
