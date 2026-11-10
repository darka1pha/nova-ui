"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { caretCoordinates } from "../utils/caret-coords.ts";
import { cn } from "../utils/cn.ts";
import { useLatestRef } from "../utils/use-latest-ref.ts";
import { Textarea, type TextareaProps } from "./input.tsx";
import { floatingSurface, menuItem } from "./shared.ts";
import { Spinner } from "./spinner.tsx";

export interface MentionOption {
  /** Stored id, e.g. a user id. */
  value: string;
  /** Inserted after the trigger character and shown in the list. */
  label: string;
  /** A second line in the list, e.g. a role or an email. */
  description?: string;
  icon?: ReactNode;
}

export interface MentionTrigger {
  /** The character that opens suggestions, e.g. "@" or "#". */
  char: string;
  /** Fixed options, filtered by what follows the trigger. */
  options?: MentionOption[];
  /** Loads options for the text after the trigger. Abort when `signal` fires (a newer query or close). */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<MentionOption[]>;
}

export interface MentionLabels {
  loading?: string;
  empty?: string;
  error?: string;
  /** Announced when suggestions appear, e.g. (n) => `${n} suggestions`. */
  count?: (n: number) => string;
}

export interface MentionTextareaProps extends Omit<TextareaProps, "value" | "defaultValue" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** What opens suggestions. Default: "@" with no options (pass `options` or `loadOptions`). */
  triggers: MentionTrigger[];
  /** Called when a suggestion is inserted. */
  onMention?: (option: MentionOption, trigger: string) => void;
  /** Delay before `loadOptions` runs, ms. Default 200. */
  debounceMs?: number;
  /** Most suggestions to show. Default 8. */
  maxSuggestions?: number;
  labels?: MentionLabels;
}

interface Query {
  trigger: MentionTrigger;
  /** Index of the trigger character in the text. */
  start: number;
  text: string;
}

/** The mention being typed at the caret: a trigger at the start of a word, then no spaces. */
function findQuery(text: string, caret: number, triggers: MentionTrigger[]): Query | null {
  for (let i = caret - 1; i >= 0 && caret - i <= 50; i--) {
    const ch = text[i] ?? "";
    if (/\s/.test(ch)) return null;
    const trigger = triggers.find((t) => t.char === ch);
    if (trigger && (i === 0 || /\s/.test(text[i - 1] ?? ""))) return { trigger, start: i, text: text.slice(i + 1, caret) };
  }
  return null;
}

/**
 * A textarea that suggests people, tags or anything else after a trigger character
 * ("@", "#"). Type the trigger at the start of a word to open the list; arrows move,
 * Enter or Tab inserts, Escape closes. Inserted mentions are plain text ("@Sara Ahmadi").
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(function MentionTextarea(
  { value: valueProp, defaultValue = "", onValueChange, triggers, onMention, debounceMs = 200, maxSuggestions = 8, labels, className, onKeyDown, onBlur, onSelect, ...props },
  ref,
) {
  const [internal, setInternal] = useState(defaultValue);
  const text = valueProp ?? internal;
  const area = useRef<HTMLTextAreaElement | null>(null);
  const [query, setQuery] = useState<Query | null>(null);
  // A query the user dismissed with Escape stays closed until it changes.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<MentionOption[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0, rtl: false });
  const listId = useId();
  const optionId = (i: number) => `${listId}-${i}`;

  const queryKey = query ? `${query.start}:${query.trigger.char}${query.text}` : null;
  const open = query !== null && queryKey !== dismissed;
  const async = !!query?.trigger.loadOptions;

  const suggestions = useMemo(() => {
    if (!query) return [];
    if (query.trigger.loadOptions) return loaded.slice(0, maxSuggestions);
    const q = query.text.toLocaleLowerCase();
    return (query.trigger.options ?? []).filter((o) => o.label.toLocaleLowerCase().includes(q)).slice(0, maxSuggestions);
  }, [query, loaded, maxSuggestions]);

  // Async loading: debounced, and a newer query aborts the older request.
  const loadRef = useLatestRef(query?.trigger.loadOptions);
  useEffect(() => {
    if (!open || !async || !query) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadRef.current?.(query.text, controller.signal).then(
        (options) => {
          if (controller.signal.aborted) return;
          setLoaded(options);
          setStatus("idle");
        },
        () => {
          if (!controller.signal.aborted) setStatus("error");
        },
      );
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Re-run per query text, not per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, async, queryKey, debounceMs, loadRef]);

  const update = (el: HTMLTextAreaElement) => {
    const next = findQuery(el.value, el.selectionStart ?? el.value.length, triggers);
    setQuery(next);
    setActive(0);
    if (next) {
      if (next.trigger.loadOptions) setStatus("loading");
      const c = caretCoordinates(el, next.start);
      const rtl = getComputedStyle(el).direction === "rtl";
      setPosition({ top: c.top + c.height, left: c.left, right: el.offsetWidth - c.left, rtl });
    }
  };

  const setText = (next: string) => {
    if (valueProp === undefined) setInternal(next);
    onValueChange?.(next);
  };

  const insert = (option: MentionOption) => {
    const el = area.current;
    if (!el || !query) return;
    const caret = el.selectionStart ?? text.length;
    const before = text.slice(0, query.start);
    const after = text.slice(caret).replace(/^\S*/, ""); // drop the rest of a half-typed word
    const mention = `${query.trigger.char}${option.label} `;
    setText(`${before}${mention}${after}`);
    onMention?.(option, query.trigger.char);
    setQuery(null);
    const at = before.length + mention.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(at, at);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !open) return;
    const count = suggestions.length;
    if (e.key === "Escape") {
      e.preventDefault();
      setDismissed(queryKey);
    } else if (count && e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % count);
    } else if (count && e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + count) % count);
    } else if (count && (e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
      const option = suggestions[active];
      if (option) {
        e.preventDefault();
        insert(option);
      }
    }
  };

  const showList = open && (suggestions.length > 0 || status !== "idle" || !!query?.text);
  const announce = labels?.count ?? ((n: number) => (n === 1 ? "1 suggestion" : `${n} suggestions`));

  return (
    <div className="relative">
      <Textarea
        ref={(el) => {
          area.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        value={text}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          setText(e.target.value);
          update(e.target);
        }}
        onSelect={(e: SyntheticEvent<HTMLTextAreaElement>) => {
          onSelect?.(e);
          // Moving the caret with the mouse or arrows can enter or leave a mention.
          const el = e.currentTarget;
          const next = findQuery(el.value, el.selectionStart ?? 0, triggers);
          if ((next ? `${next.start}:${next.trigger.char}${next.text}` : null) !== queryKey) update(el);
        }}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onBlur?.(e);
          setQuery(null);
        }}
        aria-autocomplete="list"
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={showList && suggestions[active] ? optionId(active) : undefined}
        className={className}
        {...props}
      />
      {showList ? (
        <div
          className={cn(floatingSurface, "absolute w-64 max-w-[calc(100%-1rem)] p-1")}
          data-state="open"
          // Caret coordinates are physical. The list starts at the trigger and runs in the reading
          // direction (rightward in LTR, leftward in RTL), clamped to stay inside the field.
          style={{
            top: position.top + 4,
            [position.rtl ? "right" : "left"]: `min(${Math.max(0, position.rtl ? position.right : position.left)}px, calc(100% - min(16rem, 100% - 1rem)))`,
          }}
        >
          <div id={listId} role="listbox" aria-label={query?.trigger.char === "#" ? "Tags" : "Suggestions"} aria-busy={status === "loading" || undefined}>
            {status === "loading" ? (
              <div className="flex items-center gap-2 px-2 py-2 text-sm text-foreground-muted">
                <Spinner size="sm" label="" />
                {labels?.loading ?? "Loading…"}
              </div>
            ) : status === "error" ? (
              <div className="px-2 py-2 text-sm text-danger-text">{labels?.error ?? "Couldn't load suggestions."}</div>
            ) : suggestions.length === 0 ? (
              <div className="px-2 py-2 text-sm text-foreground-muted">{labels?.empty ?? "No matches."}</div>
            ) : (
              suggestions.map((option, i) => (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- focus stays in the textarea, which drives this listbox (arrows, Enter, Tab) through aria-activedescendant
                <div
                  key={option.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  data-highlighted={i === active ? "" : undefined}
                  // Keep focus (and the caret) in the textarea.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => insert(option)}
                  className={menuItem}
                >
                  {option.icon}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description ? <span className="truncate text-xs text-foreground-muted">{option.description}</span> : null}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {showList && status === "idle" ? announce(suggestions.length) : ""}
      </p>
    </div>
  );
});
