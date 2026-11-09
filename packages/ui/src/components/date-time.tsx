"use client";

import { CalendarClock, X } from "lucide-react";
import { forwardRef, useState } from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { Calendar, type CalendarProps } from "./calendar.tsx";
import { useFormField } from "./field.tsx";
import { fieldVariants } from "./input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./overlay.tsx";
import { focusRing } from "./shared.ts";
import { TimeInput, type TimeValue } from "./time.tsx";

export interface DateTimePickerLabels {
  time?: string;
  done?: string;
  clear?: string;
}

export interface DateTimePickerProps extends Omit<CalendarProps, "className" | "defaultMonth" | "value" | "defaultValue" | "onValueChange" | "labels"> {
  value?: Date | null;
  defaultValue?: Date | null;
  /** Fires with the combined date and time, or null when cleared. */
  onValueChange?: (value: Date | null) => void;
  placeholder?: string;
  /** Intl format for the field. */
  format?: Intl.DateTimeFormatOptions;
  /** Time used when a day is picked before any time is set ("HH:mm"). */
  defaultTime?: TimeValue;
  /** 12- or 24-hour time. Defaults to the locale's convention. */
  hourCycle?: "h12" | "h23";
  /** Minutes moved per arrow press in the time field. */
  minuteStep?: number;
  /** Show a button that clears the value. */
  clearable?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
  /** Submits local "YYYY-MM-DDTHH:mm" (like `<input type="datetime-local">`) via a hidden input. */
  name?: string;
  /** Fires when focus leaves the field. */
  onBlur?: () => void;
  labels?: CalendarProps["labels"] & DateTimePickerLabels;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const timeOf = (d: Date): TimeValue => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** `day`'s calendar date at `time`, clamped into [min, max]. */
const combine = (day: Date, time: TimeValue, min?: Date, max?: Date) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  if (min && next < min) return new Date(min);
  if (max && next > max) return new Date(max);
  return next;
};

/**
 * A date and time field: a Calendar and a TimeInput in one popover. Picking a day
 * keeps the chosen time, so people can set either part first. The popover stays
 * open until Done (or Escape), then returns focus to the field.
 */
export const DateTimePicker = forwardRef<HTMLButtonElement, DateTimePickerProps>(function DateTimePicker(
  {
    value,
    defaultValue = null,
    onValueChange,
    placeholder = "Pick a date and time",
    format = { dateStyle: "medium", timeStyle: "short" },
    defaultTime = "09:00",
    hourCycle,
    minuteStep,
    clearable = false,
    size,
    className,
    locale: localeProp,
    calendar: calendarProp,
    min,
    max,
    disabled,
    id,
    "aria-label": ariaLabel,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    required,
    name,
    onBlur,
    labels,
    ...calendarProps
  },
  ref,
) {
  const field = useFormField({ id, "aria-describedby": describedBy, "aria-invalid": invalid, disabled, required });
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<Date | null>(defaultValue);
  const current = value !== undefined ? value : internal;
  const { locale, calendar: localeCalendar } = useLocale(localeProp);
  const calendar = calendarProp ?? localeCalendar;
  const [time, setTime] = useState<TimeValue>(current ? timeOf(current) : defaultTime);
  const text = current ? new Intl.DateTimeFormat(locale, { calendar, hourCycle, ...format }).format(current) : null;

  const commit = (next: Date | null) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {name ? <input type="hidden" name={name} value={current ? toLocalIso(current) : ""} disabled={field.disabled} /> : null}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next && current) setTime(timeOf(current));
          if (!next) onBlur?.();
        }}
      >
        <PopoverTrigger asChild disabled={field.disabled}>
          <button
            ref={ref}
            type="button"
            id={field.id}
            aria-label={ariaLabel}
            aria-describedby={field["aria-describedby"]}
            aria-invalid={field["aria-invalid"]}
            aria-required={field.required}
            // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- PopoverTrigger asChild adds aria-controls and aria-expanded at runtime
            role="combobox"
            aria-haspopup="dialog"
            aria-expanded={open}
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            className={cn(fieldVariants({ size }), "group/date flex items-center gap-2 text-start", clearable && current && "pe-9", !current && "text-foreground-muted")}
          >
            <CalendarClock aria-hidden className="size-4 shrink-0 text-foreground-muted transition-transform duration-(--nv-duration-slow) ease-(--nv-ease-interactive) group-hover/date:scale-110 group-hover/date:text-primary-text" />
            <span className="truncate">{text ?? placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          align="start"
          aria-label={ariaLabel ?? placeholder}
          onOpenAutoFocus={(e) => {
            const day = (e.target as HTMLElement | null)?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]');
            if (day) {
              e.preventDefault();
              day.focus();
            }
          }}
        >
          <Calendar
            {...calendarProps}
            locale={locale}
            calendar={calendar}
            min={min}
            max={max}
            labels={labels}
            value={current}
            defaultMonth={current ?? undefined}
            onValueChange={(day) => commit(combine(day, time, min, max))}
          />
          <div className="mt-2 flex items-end gap-2 border-t border-border px-1 pt-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-foreground-secondary" aria-hidden>
                {labels?.time ?? "Time"}
              </span>
              <TimeInput
                size="sm"
                locale={locale}
                hourCycle={hourCycle}
                minuteStep={minuteStep}
                aria-label={labels?.time ?? "Time"}
                value={time}
                onValueChange={(t) => {
                  if (!t) return;
                  setTime(t);
                  if (current) commit(combine(current, t, min, max));
                }}
              />
            </div>
            <Button size="sm" onClick={() => setOpen(false)}>
              {labels?.done ?? "Done"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && current && !field.disabled ? (
        <button
          type="button"
          aria-label={labels?.clear ?? "Clear date and time"}
          onClick={() => {
            commit(null);
            onBlur?.();
          }}
          className={cn("absolute end-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-3.5", focusRing)}
        >
          <X />
        </button>
      ) : null}
    </div>
  );
});
