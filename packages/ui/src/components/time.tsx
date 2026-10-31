"use client";

import { Clock, X } from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { toLatinDigits } from "../utils/jalali.ts";
import { useFormField, useFormFieldContext } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { focusRing } from "./shared.ts";

/** A time of day as "HH:mm" (24-hour), the same shape as `<input type="time">`. */
export type TimeValue = string;

type Segment = "hour" | "minute" | "period";
type Draft = { hour: number | null; minute: number | null; pm: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (v: TimeValue | null | undefined) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const fromMinutes = (total: number): TimeValue => `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;

export interface TimeInputProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** "HH:mm" in 24-hour time, or null when empty. */
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  /** Fires with "HH:mm" once hour and minute are both set, or null when cleared. */
  onValueChange?: (value: TimeValue | null) => void;
  /** 12- or 24-hour display. Defaults to the locale's convention. */
  hourCycle?: "h12" | "h23";
  /** Minutes moved per arrow press; typed minutes snap to it. */
  minuteStep?: number;
  /** Earliest and latest allowed times ("HH:mm"); values clamp into range. */
  min?: TimeValue;
  max?: TimeValue;
  locale?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  /** Submits "HH:mm" with native forms via a hidden input. */
  name?: string;
  id?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
  onBlur?: () => void;
  labels?: { hour?: string; minute?: string; period?: string; clear?: string };
}

/**
 * A segmented time field: hour, minute and (for 12-hour locales) AM/PM. Each
 * segment is a spin button — arrows step, Page Up/Down jump, digits type
 * straight in (Persian and Arabic-Indic digits too) and advance on their own.
 * Shows the locale's digits and day-period names; the value is plain "HH:mm".
 */
export const TimeInput = forwardRef<HTMLDivElement, TimeInputProps>(function TimeInput(
  {
    value,
    defaultValue = null,
    onValueChange,
    hourCycle: hourCycleProp,
    minuteStep = 1,
    min,
    max,
    locale: localeProp,
    size,
    disabled,
    readOnly,
    clearable = false,
    name,
    id,
    "aria-invalid": invalid,
    required,
    onBlur,
    labels,
    className,
    ...props
  },
  ref,
) {
  const field = useFormField<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean; disabled?: boolean; required?: boolean }>({
    id,
    "aria-invalid": invalid,
    disabled,
    required,
  });
  const labelId = useFormFieldContext()?.labelId;
  const { locale } = useLocale(localeProp);

  const { hourCycle, periods, digits } = useMemo(() => {
    const probe = new Intl.DateTimeFormat(locale, { hour: "numeric" });
    const cycle = hourCycleProp ?? (probe.resolvedOptions().hourCycle === "h11" || probe.resolvedOptions().hourCycle === "h12" ? "h12" : "h23");
    // The locale's own names for AM and PM.
    const name = (h: number) =>
      new Intl.DateTimeFormat(locale, { hour: "numeric", hourCycle: "h12" }).formatToParts(new Date(2000, 0, 1, h)).find((p) => p.type === "dayPeriod")?.value ??
      (h < 12 ? "AM" : "PM");
    return { hourCycle: cycle, periods: [name(9), name(21)] as const, digits: new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }) };
  }, [locale, hourCycleProp]);
  const twelve = hourCycle === "h12";

  // Segments hold partial input until both hour and minute are known.
  const initial = toMinutes(value !== undefined ? value : defaultValue);
  const [draft, setDraft] = useState<Draft>(() => ({
    hour: initial === null ? null : Math.floor(initial / 60),
    minute: initial === null ? null : initial % 60,
    pm: initial !== null && initial >= 720,
  }));
  // Handlers read the newest draft from here, not from the render they were made in:
  // keystrokes can arrive in a burst (fast typing, a phone keyboard) before React
  // re-renders, and each must build on the one before.
  const latest = useRef(draft);
  const update = (next: Draft) => {
    latest.current = next;
    setDraft(next);
  };

  // Follow a controlled value when it changes from outside. Skip it when the
  // segments already say the same thing: a half-filled field reports null, and
  // that null coming back must not wipe the half that is filled in.
  const controlled = value !== undefined ? toMinutes(value) : undefined;
  const [lastControlled, setLastControlled] = useState(controlled);
  if (controlled !== lastControlled) {
    setLastControlled(controlled);
    const current = latest.current;
    const shown = current.hour !== null && current.minute !== null ? current.hour * 60 + current.minute : null;
    if (controlled !== undefined && controlled !== shown) {
      const next = controlled === null ? { hour: null, minute: null, pm: current.pm } : { hour: Math.floor(controlled / 60), minute: controlled % 60, pm: controlled >= 720 };
      latest.current = next;
      setDraft(next);
    }
  }

  const typed = useRef<{ segment: Segment | null; text: string }>({ segment: null, text: "" });
  const refs = { hour: useRef<HTMLSpanElement>(null), minute: useRef<HTMLSpanElement>(null), period: useRef<HTMLSpanElement>(null) };
  const order: Segment[] = twelve ? ["hour", "minute", "period"] : ["hour", "minute"];
  const interactive = !field.disabled && !readOnly;
  const minM = toMinutes(min);
  const maxM = toMinutes(max);

  const commit = (next: Draft) => {
    let { hour, minute } = next;
    if (hour !== null && minute !== null) {
      let total = hour * 60 + minute;
      if (minM !== null && total < minM) total = minM;
      if (maxM !== null && total > maxM) total = maxM;
      hour = Math.floor(total / 60);
      minute = total % 60;
      update({ hour, minute, pm: hour >= 12 });
      const out = fromMinutes(total);
      if (value === undefined || toMinutes(value) !== total) onValueChange?.(out);
      return;
    }
    update(next);
  };

  // The segment input belongs to. Moves the moment the field advances, because a
  // burst of input can keep arriving at the previous segment's element (Chrome
  // delivers a fast typed burst to the element focused when it began).
  const cursor = useRef<Segment | null>(null);
  const focusSegment = (s: Segment | undefined) => {
    if (!s) return;
    cursor.current = s;
    refs[s].current?.focus();
  };
  const neighbor = (s: Segment, step: 1 | -1) => order[order.indexOf(s) + step];

  const stepSegment = (s: Segment, delta: number) => {
    const draft = latest.current;
    if (s === "period") {
      const hour = draft.hour ?? (draft.pm ? 12 : 0);
      commit({ ...draft, hour: (hour + 12) % 24, pm: !draft.pm });
      return;
    }
    if (s === "hour") {
      const start = draft.hour ?? (delta > 0 ? -1 : 0);
      commit({ ...draft, hour: (((start + delta) % 24) + 24) % 24 });
      return;
    }
    const start = draft.minute ?? (delta > 0 ? -minuteStep : 0);
    const snapped = Math.round(start / minuteStep) * minuteStep;
    commit({ ...draft, minute: (((snapped + delta * minuteStep) % 60) + 60) % 60 });
  };

  const typeDigit = (s: Segment, digit: number) => {
    const draft = latest.current;
    const t = typed.current;
    const text = t.segment === s ? t.text + digit : String(digit);
    const n = Number(text);
    if (s === "hour") {
      // Typed hours read in the displayed cycle: "3" means 3 AM or 3 PM per the period.
      const maxShown = twelve ? 12 : 23;
      const valid = n <= maxShown && !(twelve && n === 0 && text.length > 1);
      const hour24 = !twelve ? n : (n % 12) + (draft.pm ? 12 : 0);
      if (valid) commit({ ...draft, hour: hour24 });
      // Done when another digit couldn't make a valid hour.
      if (!valid || text.length >= 2 || n * 10 > maxShown) {
        typed.current = { segment: null, text: "" };
        if (valid) focusSegment(neighbor(s, 1));
      } else typed.current = { segment: s, text };
      return;
    }
    if (s === "minute") {
      const valid = n <= 59;
      if (valid) commit({ ...draft, minute: n });
      if (!valid || text.length >= 2 || n * 10 > 59) {
        typed.current = { segment: null, text: "" };
        if (valid) focusSegment(neighbor(s, 1));
      } else typed.current = { segment: s, text };
    }
  };

  const clearSegment = (s: Segment) => {
    typed.current = { segment: null, text: "" };
    if (s === "period") return;
    const draft = latest.current;
    const wasComplete = draft.hour !== null && draft.minute !== null;
    update(s === "hour" ? { ...draft, hour: null } : { ...draft, minute: null });
    if (wasComplete) onValueChange?.(null);
  };

  // Touch keyboards send text through beforeinput (Android reports keys as
  // "Unidentified"), so digits and deletes are read here; the DOM never changes
  // on its own because every edit is cancelled and re-rendered from state.
  // Native listener: React's onBeforeInput is synthesized from keypresses and misses deletes.
  const beforeInput = useRef<(s: Segment, e: InputEvent) => void>(() => {});
  beforeInput.current = (target, e) => {
    e.preventDefault();
    if (!interactive) return;
    if (e.inputType.startsWith("delete")) return clearSegment(cursor.current ?? target);
    // One event can carry several characters ("0745" from autocomplete, swipe or a
    // fast burst); each goes to the segment the cursor is on when it arrives.
    for (const ch of toLatinDigits(e.data ?? "")) {
      const s = cursor.current ?? target;
      if (/\d/.test(ch) && s !== "period") typeDigit(s, Number(ch));
      else if (s === "period" && /[ap]/i.test(ch) && (ch.toLowerCase() === "p") !== latest.current.pm) stepSegment("period", 1);
    }
  };

  const onKeyDown = (target: Segment) => (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!interactive) return;
    const s = cursor.current ?? target;
    const key = toLatinDigits(e.key);
    const actions: Record<string, () => void> = {
      ArrowUp: () => stepSegment(s, 1),
      ArrowDown: () => stepSegment(s, -1),
      // Big steps: 3 hours, or about 10 minutes in whole minute steps.
      PageUp: () => stepSegment(s, s === "hour" ? 3 : Math.max(1, Math.round(10 / minuteStep))),
      PageDown: () => stepSegment(s, s === "hour" ? -3 : -Math.max(1, Math.round(10 / minuteStep))),
      ArrowRight: () => focusSegment(neighbor(s, 1)),
      ArrowLeft: () => focusSegment(neighbor(s, -1)),
      Backspace: () => clearSegment(s),
    };
    if (actions[e.key]) {
      e.preventDefault();
      actions[e.key]?.();
    } else if (/^\d$/.test(key)) {
      e.preventDefault();
      if (s === "period") return;
      typeDigit(s, Number(key));
    } else if (s === "period" && /^[ap]$/i.test(e.key)) {
      e.preventDefault();
      const pm = e.key.toLowerCase() === "p";
      if (pm !== latest.current.pm) stepSegment("period", 1);
    } else if ((e.key === ":" || e.key === "." || e.key === " ") && s !== "period") {
      e.preventDefault();
      focusSegment(neighbor(s, 1));
    }
  };

  const shownHour = draft.hour === null ? null : twelve ? draft.hour % 12 || 12 : draft.hour;
  const complete = draft.hour !== null && draft.minute !== null;
  const valueText = complete
    ? new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hourCycle }).format(new Date(2000, 0, 1, draft.hour ?? 0, draft.minute ?? 0))
    : undefined;

  useEffect(() => {
    const listeners = (["hour", "minute", "period"] as const).map((s) => {
      const el = refs[s].current;
      const handler = (e: Event) => beforeInput.current(s, e as InputEvent);
      el?.addEventListener("beforeinput", handler);
      return () => el?.removeEventListener("beforeinput", handler);
    });
    return () => listeners.forEach((off) => off());
    // Segments mount and unmount with the hour cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twelve]);

  const segment = (s: Segment, display: string | null, aria: { now?: number; min: number; max: number; text?: string; label: string }) => (
    <span
      ref={refs[s]}
      id={s === "hour" ? field.id : undefined}
      role="spinbutton"
      tabIndex={field.disabled ? -1 : 0}
      aria-label={aria.label}
      aria-valuenow={aria.now}
      aria-valuemin={aria.min}
      aria-valuemax={aria.max}
      aria-valuetext={aria.text ?? (aria.now === undefined ? "Empty" : undefined)}
      aria-readonly={readOnly || undefined}
      aria-disabled={field.disabled || undefined}
      aria-invalid={field["aria-invalid"]}
      aria-describedby={field["aria-describedby"]}
      aria-required={field.required}
      onKeyDown={onKeyDown(s)}
      // Editable so phones open a keyboard (numeric for hour and minute).
      contentEditable={interactive || undefined}
      suppressContentEditableWarning
      inputMode={s === "period" ? "text" : "numeric"}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      enterKeyHint="next"
      onPaste={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onFocus={() => {
        cursor.current = s;
      }}
      onBlur={() => {
        typed.current = { segment: null, text: "" };
      }}
      className={cn(
        "rounded-sm px-0.5 text-center tabular-nums outline-none caret-transparent focus:bg-primary-subtle focus:text-primary-on-subtle",
        s === "period" ? "ms-1.5 min-w-[2.5ch]" : "min-w-[2.2ch]",
        display === null && "text-foreground-muted",
      )}
    >
      {display ?? "––"}
    </span>
  );

  return (
    <div className={cn("relative inline-flex w-fit max-w-full", className)}>
      {name ? <input type="hidden" name={name} value={complete ? fromMinutes((draft.hour ?? 0) * 60 + (draft.minute ?? 0)) : ""} /> : null}
      <div
        ref={ref}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={field["aria-describedby"]}
        // The whole field focuses its first segment when clicked outside one.
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && interactive) {
            e.preventDefault();
            focusSegment(order[0]);
          }
        }}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          cursor.current = null;
          onBlur?.();
        }}
        data-disabled={field.disabled || undefined}
        className={cn(
          fieldVariants({ size }),
          "inline-flex w-auto cursor-text items-center gap-1.5 focus-within:border-focus-ring focus-within:ring-3 focus-within:ring-focus-ring/25",
          clearable && complete && "pe-9",
          field.disabled && "pointer-events-none opacity-60",
        )}
        {...props}
      >
        <Clock aria-hidden className="size-4 shrink-0 text-foreground-muted" />
        {/* Time reads hour → minute → period even in RTL scripts, so arrows match what you see. */}
        <span dir="ltr" className="inline-flex items-center">
          {segment("hour", shownHour === null ? null : digits.format(shownHour), {
            now: shownHour ?? undefined,
            min: twelve ? 1 : 0,
            max: twelve ? 12 : 23,
            label: labels?.hour ?? "Hours",
          })}
          <span aria-hidden className="px-px text-foreground-muted">
            :
          </span>
          {segment("minute", draft.minute === null ? null : digits.format(draft.minute), {
            now: draft.minute ?? undefined,
            min: 0,
            max: 59,
            label: labels?.minute ?? "Minutes",
          })}
          {twelve
            ? segment("period", periods[draft.pm ? 1 : 0], {
                now: draft.pm ? 1 : 0,
                min: 0,
                max: 1,
                text: periods[draft.pm ? 1 : 0],
                label: labels?.period ?? "AM/PM",
              })
            : null}
        </span>
        {valueText ? <span className="sr-only">{valueText}</span> : null}
      </div>
      {clearable && complete && interactive ? (
        <button
          type="button"
          aria-label={labels?.clear ?? "Clear time"}
          onClick={() => {
            update({ hour: null, minute: null, pm: latest.current.pm });
            onValueChange?.(null);
            focusSegment("hour");
          }}
          className={cn("absolute end-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-3.5", focusRing)}
        >
          <X />
        </button>
      ) : null}
    </div>
  );
});
