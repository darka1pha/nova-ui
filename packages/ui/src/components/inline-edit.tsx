"use client";

import { Pencil } from "lucide-react";
import { forwardRef, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { fieldVariants } from "./input.tsx";
import { focusRing, transition } from "./shared.ts";
import { Spinner } from "./spinner.tsx";

export interface InlineEditProps {
  value: string;
  /**
   * Called with the new value on Enter or blur; may be async. Return (or resolve)
   * a string to reject it with that message and keep editing; throw to show the
   * error's message. Any other result counts as saved.
   */
  onSave: (value: string) => unknown;
  /** Shown when the value is empty. */
  placeholder?: string;
  /** Accessible name of the field, e.g. "Project name". Read as "Edit Project name". */
  label: string;
  /** Multi-line editing; Ctrl/⌘+Enter saves. */
  multiline?: boolean;
  /** Save when focus leaves the field (default). With `false`, blur cancels. */
  saveOnBlur?: boolean;
  /** Synchronous check before saving. Return an error message to block. */
  validate?: (value: string) => string | undefined;
  /** How the value looks when not editing. Defaults to the text itself. */
  renderValue?: (value: string) => ReactNode;
  /** Accessible name of the edit button. */
  editLabel?: string;
  /** Announced while an async onSave is pending. */
  savingLabel?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const textSize = { sm: "text-sm", md: "text-sm", lg: "text-md" } as const;

/**
 * Text that turns into a field when clicked: Enter saves, Escape cancels, and
 * focus returns to the text afterwards. Async saves show a spinner and keep the
 * field open with a message if they fail.
 */
export const InlineEdit = forwardRef<HTMLButtonElement, InlineEditProps>(function InlineEdit(
  { value, onSave, placeholder = "Empty", label, multiline = false, saveOnBlur = true, validate, renderValue, editLabel = "Edit", savingLabel = "Saving", disabled, className, size = "md" },
  ref,
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const display = useRef<HTMLButtonElement>(null);
  const composedRef = useComposedRefs(ref, display);
  const restoreFocus = useRef(false);
  const errorId = useId();

  useEffect(() => {
    if (editing) {
      field.current?.focus();
      field.current?.select();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      display.current?.focus();
    }
  }, [editing]);

  const start = () => {
    if (disabled) return;
    setDraft(value);
    setError(undefined);
    setEditing(true);
  };
  const stop = (refocus: boolean) => {
    restoreFocus.current = refocus;
    setEditing(false);
    setError(undefined);
  };
  const save = async (refocus: boolean) => {
    if (saving) return;
    if (draft === value) return stop(refocus);
    const invalid = validate?.(draft);
    if (invalid) {
      setError(invalid);
      field.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const rejected = await onSave(draft);
      if (typeof rejected === "string") {
        setError(rejected);
        field.current?.focus();
      } else stop(refocus);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      field.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      stop(true);
    } else if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void save(true);
    }
  };

  if (editing) {
    const shared = {
      ref: field,
      value: draft,
      "aria-label": label,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? errorId : undefined,
      "aria-busy": saving || undefined,
      readOnly: saving,
      onChange: (e: { target: { value: string } }) => {
        setDraft(e.target.value);
        if (error) setError(undefined);
      },
      onKeyDown,
      onBlur: () => {
        // A failed save keeps the field open so the message can be read and fixed.
        if (error || saving) return;
        if (saveOnBlur) void save(false);
        else stop(false);
      },
    };
    return (
      <span className={cn("relative inline-flex w-full flex-col gap-1", className)}>
        <span className="relative flex w-full items-center">
          {multiline ? (
            <textarea {...shared} rows={3} className={cn(fieldVariants({ size }), "h-auto min-h-20 resize-y py-2 leading-relaxed")} />
          ) : (
            <input {...shared} type="text" className={cn(fieldVariants({ size }), saving && "pe-9")} />
          )}
          {saving ? <Spinner size="sm" label={savingLabel} className="absolute end-3" /> : null}
        </span>
        {error ? (
          <span id={errorId} role="alert" className="text-xs text-danger-text">
            {error}
          </span>
        ) : null}
      </span>
    );
  }

  const empty = !value;
  return (
    <button
      ref={composedRef}
      type="button"
      onClick={start}
      disabled={disabled}
      aria-label={`${editLabel} ${label}: ${value || placeholder}`}
      className={cn(
        "group/inline-edit -mx-1.5 inline-flex max-w-full items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-start",
        textSize[size],
        transition,
        focusRing,
        !disabled && "cursor-text hover:bg-surface-hover",
        disabled && "cursor-not-allowed opacity-60",
        empty && "text-foreground-muted",
        multiline && "whitespace-pre-wrap",
        className,
      )}
    >
      <span className="min-w-0 break-words">{empty ? placeholder : renderValue ? renderValue(value) : value}</span>
      {!disabled ? <Pencil aria-hidden className="size-3.5 shrink-0 text-foreground-muted opacity-0 transition-opacity group-hover/inline-edit:opacity-100 group-focus-visible/inline-edit:opacity-100" /> : null}
    </button>
  );
});
