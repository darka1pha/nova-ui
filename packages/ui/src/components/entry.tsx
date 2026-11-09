"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn.ts";
import { Chip } from "./chip.tsx";
import { useFormField, useFormFieldContext } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { focusRing, transition } from "./shared.ts";

/* ---------------------------------------------------------------- PinInput */

export interface PinInputProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Number of boxes. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called once every box is filled. */
  onComplete?: (value: string) => void;
  /** `numeric` brings up the number pad on phones and accepts digits only. */
  type?: "numeric" | "alphanumeric";
  /** Hide characters (like a password). */
  mask?: boolean;
  disabled?: boolean;
  /** Accessible label per box, e.g. (i, n) => `Digit ${i} of ${n}`. */
  getInputLabel?: (index: number, length: number) => string;
  "aria-invalid"?: boolean;
  id?: string;
  /** Submits the code with native forms via a hidden input. */
  name?: string;
}

/**
 * One-time-code entry. Typing advances, Backspace goes back, arrows move,
 * and pasting a whole code fills every box. Each box pops as it fills.
 */
export const PinInput = forwardRef<HTMLDivElement, PinInputProps>(function PinInput(
  {
    length = 6,
    value,
    defaultValue = "",
    onValueChange,
    onComplete,
    type = "numeric",
    mask = false,
    disabled,
    getInputLabel = (i, n) => `Character ${i} of ${n}`,
    className,
    id,
    "aria-invalid": invalid,
    name,
    ...rest
  },
  ref,
) {
  const field = useFormField<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean; disabled?: boolean }>({ id, "aria-invalid": invalid, disabled });
  const [internal, setInternal] = useState(defaultValue.slice(0, length));
  const current = (value ?? internal).slice(0, length);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const labelId = useFormFieldContext()?.labelId;
  const pattern = type === "numeric" ? /[0-9]/ : /[0-9a-z]/i;

  const commit = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    if (next.length === length && !next.includes(" ")) onComplete?.(next);
  };
  const setAt = (index: number, char: string) => {
    const chars = current.padEnd(length, " ").split("");
    chars[index] = char;
    commit(chars.join("").replace(/\s+$/, ""));
  };
  const focus = (index: number) => inputs.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  const onPaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    const text = e.clipboardData.getData("text").split("").filter((c) => pattern.test(c)).join("");
    if (!text) return;
    e.preventDefault();
    const next = (current.slice(0, index) + text).slice(0, length);
    commit(next);
    focus(next.length);
  };

  return (
    <div ref={ref} role="group" aria-labelledby={labelId} className={cn("flex items-center gap-2", className)} {...rest}>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      {Array.from({ length }, (_, i) => {
        const char = current[i]?.trim() ?? "";
        return (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            id={i === 0 ? field.id : undefined}
            aria-label={getInputLabel(i + 1, length)}
            aria-invalid={field["aria-invalid"]}
            aria-describedby={i === 0 ? field["aria-describedby"] : undefined}
            disabled={field.disabled}
            type={mask ? "password" : "text"}
            inputMode={type === "numeric" ? "numeric" : "text"}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={char}
            data-filled={char ? "" : undefined}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const c = e.target.value.slice(-1);
              if (c && !pattern.test(c)) return;
              setAt(i, c);
              if (c) focus(i + 1);
            }}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Backspace" && !char) {
                e.preventDefault();
                setAt(i - 1, " ");
                focus(i - 1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                focus(i - 1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                focus(i + 1);
              }
            }}
            onFocus={(e) => e.target.select()}
            onPaste={(e) => onPaste(e, i)}
            className={cn(
              fieldVariants(),
              "size-11 px-0 text-center font-mono text-lg font-semibold caret-primary-text",
              "focus-visible:scale-105 data-[filled]:border-primary-border data-[filled]:bg-primary-subtle/40 data-[filled]:animate-nv-bounce-in motion-reduce:focus-visible:scale-100",
            )}
          />
        );
      })}
    </div>
  );
});

/* ---------------------------------------------------------------- TagInput */

export interface TagInputProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  placeholder?: string;
  /** Maximum number of tags. */
  max?: number;
  /** Keys that commit the current text as a tag. */
  separators?: string[];
  /** Return false (or a message) to reject a tag. */
  validate?: (tag: string) => boolean;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  /** Submits each tag with native forms (one hidden input per tag). */
  name?: string;
}

/**
 * Free-form tags: Enter or comma adds, Backspace on an empty field removes the
 * last tag, pasting "a, b, c" adds several. New tags bounce in.
 */
export const TagInput = forwardRef<HTMLDivElement, TagInputProps>(function TagInput(
  { value, defaultValue = [], onValueChange, placeholder = "Add…", max, separators = ["Enter", ","], validate, disabled, name, className, ...rest },
  ref,
) {
  const { id, "aria-label": ariaLabel, "aria-describedby": describedBy, "aria-invalid": invalid, ...props } = rest;
  const field = useFormField({ id, "aria-describedby": describedBy, "aria-invalid": invalid, disabled });
  const [internal, setInternal] = useState(defaultValue);
  const tags = value ?? internal;
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const update = (next: string[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const add = (raw: string) => {
    const parts = raw.split(",").map((t) => t.trim()).filter(Boolean);
    const fresh = parts.filter((t, i) => !tags.includes(t) && parts.indexOf(t) === i);
    const rejected = fresh.filter((t) => validate && !validate(t));
    // Keep invalid text so it can be corrected; duplicates simply clear.
    if (rejected.length) return;
    if (fresh.length) update([...tags, ...fresh].slice(0, max ?? Infinity));
    setText("");
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- clicking the padding focuses the input; keyboard users focus the input directly
    <div
      ref={ref}
      onClick={() => inputRef.current?.focus()}
      className={cn(
        fieldVariants(),
        "flex h-auto min-h-(--nv-control-h-md) cursor-text flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-focus-ring focus-within:ring-3 focus-within:ring-focus-ring/25",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      {...props}
    >
      {name ? tags.map((tag) => <input key={`h-${tag}`} type="hidden" name={name} value={tag} />) : null}
      {tags.map((tag) => (
        <Chip key={tag} size="sm" className="animate-nv-bounce-in" onRemove={() => update(tags.filter((t) => t !== tag))} disabled={field.disabled}>
          {tag}
        </Chip>
      ))}
      <input
        ref={inputRef}
        id={field.id}
        aria-label={ariaLabel}
        aria-describedby={field["aria-describedby"]}
        aria-invalid={field["aria-invalid"]}
        disabled={field.disabled}
        value={text}
        placeholder={tags.length ? undefined : placeholder}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (separators.includes(e.key) && text.trim()) {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && tags.length) {
            update(tags.slice(0, -1));
          }
        }}
        onBlur={() => text.trim() && add(text)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (pasted.includes(",")) {
            e.preventDefault();
            add(pasted);
          }
        }}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-foreground-muted"
      />
    </div>
  );
});

/* ------------------------------------------------------------ FileDropzone */

export interface FileDropzoneProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "title"> {
  /** Native accept string, e.g. "image/*,.pdf". */
  accept?: string;
  /** Accept more than one file. */
  multiple?: boolean;
  /** Maximum size per file in bytes. */
  maxSize?: number;
  /** Controlled list of chosen files. Pair with onFilesChange. */
  files?: File[];
  /** Called with the accepted files after a drop or a pick. */
  onFilesChange?: (files: File[]) => void;
  /** Called with files that were rejected and why. */
  onReject?: (rejections: { file: File; reason: "type" | "size" }[]) => void;
  title?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Accessible labels for localization. */
  labels?: { removeFile?: (name: string) => string; browse?: string };
  /** Field name for native form submission (multipart). */
  name?: string;
  /** Fires after the user picks, drops or removes files (marks the field "touched"). */
  onBlur?: () => void;
}

function cloneFiles(list: FileList): FileList {
  const transfer = new DataTransfer();
  Array.from(list).forEach((f) => transfer.items.add(f));
  return transfer.files;
}

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} kB` : `${(n / 1024 ** 2).toFixed(1)} MB`);

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(",").some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
    if (r.endsWith("/*")) return file.type.startsWith(r.slice(0, -1));
    return file.type === r;
  });
}

/**
 * Drag files in or browse. The zone lifts and its icon bounces while files hover
 * over it; it is a real button, so keyboard users press Enter or Space to browse.
 */
export const FileDropzone = forwardRef<HTMLDivElement, FileDropzoneProps>(function FileDropzone(
  {
    accept,
    multiple = true,
    maxSize,
    files: filesProp,
    onFilesChange,
    onReject,
    title = "Drop files here or click to browse",
    description,
    disabled,
    labels,
    name,
    onBlur,
    className,
    ...props
  },
  ref,
) {
  const [internal, setInternal] = useState<File[]>([]);
  const files = filesProp ?? internal;
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const descriptionId = useId();

  const update = (next: File[]) => {
    if (filesProp === undefined) setInternal(next);
    onFilesChange?.(next);
    onBlur?.();
    // Mirror the list into the real <input type="file"> so native form posts include drops.
    if (input.current && typeof DataTransfer !== "undefined") {
      const transfer = new DataTransfer();
      next.forEach((f) => transfer.items.add(f));
      input.current.files = transfer.files;
    }
  };
  const accept_ = (list: FileList | null) => {
    if (!list) return;
    const rejections: { file: File; reason: "type" | "size" }[] = [];
    const ok = Array.from(list).filter((file) => {
      if (!matchesAccept(file, accept)) return rejections.push({ file, reason: "type" }) < 0;
      if (maxSize && file.size > maxSize) return rejections.push({ file, reason: "size" }) < 0;
      return true;
    });
    if (rejections.length) onReject?.(rejections);
    if (ok.length) update(multiple ? [...files, ...ok] : ok.slice(0, 1));
  };
  const onDrag = (e: DragEvent<HTMLDivElement>, over: boolean) => {
    e.preventDefault();
    if (!disabled) setDragging(over);
  };

  return (
    <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
      <div
        onDragEnter={(e) => onDrag(e, true)}
        onDragOver={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDrop={(e) => {
          onDrag(e, false);
          if (!disabled) accept_(e.dataTransfer.files);
        }}
        data-dragging={dragging || undefined}
        className={cn(
          "group/drop relative rounded-lg border-2 border-dashed border-border-strong bg-surface-sunken/50",
          transition,
          "hover:border-primary-border hover:bg-primary-subtle/40 data-[dragging]:scale-[1.01] data-[dragging]:border-primary data-[dragging]:bg-primary-subtle data-[dragging]:shadow-glow-primary",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <button
          type="button"
          disabled={disabled}
          aria-describedby={description ? descriptionId : undefined}
          onClick={() => input.current?.click()}
          className={cn("flex w-full flex-col items-center gap-2 rounded-[inherit] px-6 py-10 text-center", focusRing)}
        >
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-full bg-(image:--nv-gradient-subtle) text-primary-text ring-1 ring-primary-border transition-transform duration-(--nv-duration-slow) ease-(--nv-ease-interactive) group-hover/drop:-translate-y-1 group-data-[dragging]/drop:animate-nv-bounce-in group-data-[dragging]/drop:scale-110 [&_svg]:size-6"
          >
            <UploadCloud />
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {description ? (
            <span id={descriptionId} className="text-xs text-foreground-muted">
              {description}
            </span>
          ) : null}
        </button>
        <input
          ref={input}
          type="file"
          name={name}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            const picked = e.target.files;
            // Copy before update() rewrites input.files with the merged list.
            accept_(picked && typeof DataTransfer === "undefined" ? picked : picked ? cloneFiles(picked) : null);
          }}
        />
      </div>
      {files.length ? (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-md border border-border bg-surface p-2 ps-3 text-sm animate-nv-slide-down">
              <FileText aria-hidden className="size-4 shrink-0 text-primary-text" />
              <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-foreground-muted">{formatBytes(file.size)}</span>
              <button
                type="button"
                aria-label={labels?.removeFile?.(file.name) ?? `Remove ${file.name}`}
                onClick={() => update(files.filter((_, j) => j !== i))}
                className={cn("inline-flex size-7 items-center justify-center rounded-sm text-foreground-muted hover:bg-danger-subtle hover:text-danger-on-subtle [&_svg]:size-4", focusRing, transition)}
              >
                <X />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
