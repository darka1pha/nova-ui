"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { forwardRef, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocale } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { toLatinDigits } from "../utils/jalali.ts";
import { fieldVariants, Input, NumberInput, type InputProps, type NumberInputProps } from "./input.tsx";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface, menuItem } from "./shared.ts";

/* ----------------------------------------------------------- CurrencyInput */

export interface CurrencyInputProps extends Omit<NumberInputProps, "formatOptions" | "precision"> {
  /** ISO 4217 code, e.g. "USD", "EUR", "IRR". */
  currency: string;
  currencyDisplay?: Intl.NumberFormatOptions["currencyDisplay"];
}

/**
 * A NumberInput for money: shows "€1,200.50" when not focused, a plain number
 * while editing, and rounds to the currency's minor units (2 for EUR, 0 for JPY).
 * Stores a `number | null` in major units.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput({ currency, currencyDisplay = "symbol", locale: localeProp, ...props }, ref) {
  const { locale } = useLocale(localeProp);
  const precision = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2, [locale, currency]);
  return <NumberInput ref={ref} locale={localeProp} formatOptions={{ style: "currency", currency, currencyDisplay }} precision={precision} {...props} />;
});

/* -------------------------------------------------------------- PhoneInput */

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, e.g. "US". */
  code: string;
  /** Calling code without "+". */
  dial: string;
  /** National number pattern, one `#` per digit. Without it, digits are grouped 3-3-4. */
  format?: string;
  /** Valid national number lengths, [min, max]. */
  lengths?: [number, number];
  /** Keep a leading 0 (Italy); elsewhere a typed trunk 0 is dropped. */
  keepLeadingZero?: boolean;
}

/** A starter list. Pass `countries` to PhoneInput to add or narrow. */
export const phoneCountries: PhoneCountry[] = [
  { code: "US", dial: "1", format: "(###) ###-####", lengths: [10, 10] },
  { code: "CA", dial: "1", format: "(###) ###-####", lengths: [10, 10] },
  { code: "GB", dial: "44", format: "#### ######", lengths: [10, 10] },
  { code: "IE", dial: "353", format: "## ### ####", lengths: [9, 9] },
  { code: "FR", dial: "33", format: "# ## ## ## ##", lengths: [9, 9] },
  { code: "DE", dial: "49", format: "### ########", lengths: [10, 11] },
  { code: "ES", dial: "34", format: "### ## ## ##", lengths: [9, 9] },
  { code: "IT", dial: "39", format: "### ### ####", lengths: [9, 10], keepLeadingZero: true },
  { code: "NL", dial: "31", format: "# ########", lengths: [9, 9] },
  { code: "SE", dial: "46", format: "## ### ## ##", lengths: [9, 9] },
  { code: "CH", dial: "41", format: "## ### ## ##", lengths: [9, 9] },
  { code: "PL", dial: "48", format: "### ### ###", lengths: [9, 9] },
  { code: "TR", dial: "90", format: "### ### ## ##", lengths: [10, 10] },
  { code: "IR", dial: "98", format: "### ### ####", lengths: [10, 10] },
  { code: "AE", dial: "971", format: "## ### ####", lengths: [9, 9] },
  { code: "SA", dial: "966", format: "## ### ####", lengths: [9, 9] },
  { code: "EG", dial: "20", format: "### ### ####", lengths: [10, 10] },
  { code: "IN", dial: "91", format: "##### #####", lengths: [10, 10] },
  { code: "PK", dial: "92", format: "### #######", lengths: [10, 10] },
  { code: "CN", dial: "86", format: "### #### ####", lengths: [11, 11] },
  { code: "JP", dial: "81", format: "##-####-####", lengths: [10, 10] },
  { code: "KR", dial: "82", format: "##-####-####", lengths: [9, 10] },
  { code: "AU", dial: "61", format: "### ### ###", lengths: [9, 9] },
  { code: "NZ", dial: "64", format: "## ### ####", lengths: [8, 10] },
  { code: "BR", dial: "55", format: "(##) #####-####", lengths: [10, 11] },
  { code: "MX", dial: "52", format: "## #### ####", lengths: [10, 10] },
  { code: "ZA", dial: "27", format: "## ### ####", lengths: [9, 9] },
  { code: "NG", dial: "234", format: "### ### ####", lengths: [10, 10] },
];

/** Formats national digits with the country's pattern, stopping after the last digit. */
export function formatPhoneNumber(digits: string, country?: PhoneCountry): string {
  const pattern = country?.format ?? "### ### ####";
  let out = "";
  let i = 0;
  for (const ch of pattern) {
    if (i >= digits.length) break;
    if (ch === "#") out += digits[i++];
    else out += ch;
  }
  return i < digits.length ? `${out}${digits.slice(i)}` : out;
}

/** Splits an E.164 string into a country and national digits. Prefers `preferred` when calling codes are shared (+1). */
export function parsePhoneNumber(value: string, countries: PhoneCountry[] = phoneCountries, preferred?: string): { country: PhoneCountry | undefined; national: string } {
  const digits = toLatinDigits(value).replace(/\D/g, "");
  if (!digits) return { country: countries.find((c) => c.code === preferred), national: "" };
  const pref = countries.find((c) => c.code === preferred && digits.startsWith(c.dial));
  const match = pref ?? [...countries].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
  return match ? { country: match, national: digits.slice(match.dial.length) } : { country: undefined, national: digits };
}

const isValid = (national: string, country?: PhoneCountry) => {
  const [min, max] = country?.lengths ?? [6, 14];
  return national.length >= min && national.length <= max;
};

export interface PhoneValueDetails {
  country: string | undefined;
  /** National digits only. */
  national: string;
  /** Length matches the country's numbering plan. A hint, not a carrier lookup. */
  valid: boolean;
}

export interface PhoneInputProps extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "type"> {
  /** E.164, e.g. "+14155550123". Empty string when cleared. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, details: PhoneValueDetails) => void;
  country?: string;
  defaultCountry?: string;
  onCountryChange?: (country: string) => void;
  countries?: PhoneCountry[];
  /** Accessible name prefix for the country picker. */
  countryLabel?: string;
}

/**
 * A phone number field with a country picker (names localized with
 * Intl.DisplayNames) and as-you-type formatting that keeps the caret in place.
 * Stores E.164 (`+14155550123`); a `name` posts that value with native forms.
 * Pasting an international number switches the country.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, defaultValue = "", onValueChange, country: countryProp, defaultCountry = "US", onCountryChange, countries = phoneCountries, countryLabel = "Country", name, size, disabled, className, ...props },
  ref,
) {
  const { locale } = useLocale();
  const container = usePortalContainer();
  const [countryState, setCountryState] = useState(() => parsePhoneNumber(value ?? defaultValue, countries, countryProp ?? defaultCountry).country?.code ?? defaultCountry);
  const countryCode = countryProp ?? countryState;
  const country = countries.find((c) => c.code === countryCode);
  const [nationalState, setNationalState] = useState(() => parsePhoneNumber(value ?? defaultValue, countries, countryCode).national);
  const national = value !== undefined ? parsePhoneNumber(value, countries, countryCode).national : nationalState;

  const inner = useRef<HTMLInputElement>(null);
  const composed = useComposedRefs(ref, inner);
  // Digits before the caret, so the caret can be restored after reformatting.
  const caretDigits = useRef<number | null>(null);
  const formatted = formatPhoneNumber(national, country);

  useLayoutEffect(() => {
    const el = inner.current;
    if (caretDigits.current === null || !el || document.activeElement !== el) return;
    let seen = 0;
    let pos = 0;
    while (pos < formatted.length && seen < caretDigits.current) if (/\d/.test(formatted.charAt(pos++))) seen++;
    el.setSelectionRange(pos, pos);
    caretDigits.current = null;
  }, [formatted]);

  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames(locale ? [locale] : undefined, { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);
  const countryName = (code: string) => names?.of(code) ?? code;

  const emit = (nextNational: string, next: PhoneCountry | undefined) => {
    if (value === undefined) setNationalState(nextNational);
    const e164 = nextNational ? `+${next?.dial ?? ""}${nextNational}` : "";
    onValueChange?.(e164, { country: next?.code, national: nextNational, valid: isValid(nextNational, next) });
  };

  const setCountry = (code: string) => {
    if (countryProp === undefined) setCountryState(code);
    onCountryChange?.(code);
    emit(national, countries.find((c) => c.code === code));
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = toLatinDigits(e.target.value);
    const caret = e.target.selectionStart ?? raw.length;
    let next = country;
    let digits = raw.replace(/\D/g, "");
    let before = raw.slice(0, caret).replace(/\D/g, "").length;
    if (raw.trimStart().startsWith("+")) {
      // An international number was pasted or typed: pick its country.
      const parsed = parsePhoneNumber(raw, countries, countryCode);
      if (parsed.country) {
        next = parsed.country;
        if (countryProp === undefined) setCountryState(parsed.country.code);
        if (parsed.country.code !== countryCode) onCountryChange?.(parsed.country.code);
        before = Math.max(0, before - parsed.country.dial.length);
      }
      digits = parsed.national;
    }
    if (!next?.keepLeadingZero && digits.startsWith("0")) {
      digits = digits.replace(/^0+/, "");
      before = Math.max(0, before - 1);
    }
    digits = digits.slice(0, next?.lengths?.[1] ?? 14);
    caretDigits.current = Math.min(before, digits.length);
    emit(digits, next);
  };

  return (
    <div className={cn("flex w-full gap-2", className)}>
      <SelectPrimitive.Root value={countryCode} onValueChange={setCountry} disabled={disabled}>
        <SelectPrimitive.Trigger
          aria-label={`${countryLabel}: ${countryName(countryCode)}`}
          className={cn(fieldVariants({ size }), "flex w-auto shrink-0 items-center gap-1.5 tabular-nums")}
        >
          <span className="font-medium">{countryCode}</span>
          <span className="text-foreground-muted">+{country?.dial}</span>
          <ChevronDown aria-hidden className="size-4 text-foreground-muted" />
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal container={container}>
          <SelectPrimitive.Content position="popper" sideOffset={6} className={cn(floatingSurface, "max-h-72 min-w-56")}>
            <SelectPrimitive.Viewport className="p-1">
              {countries.map((c) => (
                <SelectPrimitive.Item key={c.code} value={c.code} className={cn(menuItem, "pe-8")}>
                  <SelectPrimitive.ItemText>{countryName(c.code)}</SelectPrimitive.ItemText>
                  <span className="ms-auto text-foreground-muted tabular-nums">+{c.dial}</span>
                  <SelectPrimitive.ItemIndicator className="absolute end-2">
                    <Check />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      <Input
        ref={composed}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        size={size}
        disabled={disabled}
        placeholder={country?.format?.replace(/#/g, "0")}
        value={formatted}
        onChange={onChange}
        className="tabular-nums"
        {...props}
      />
      {name ? <input type="hidden" name={name} value={national ? `+${country?.dial ?? ""}${national}` : ""} disabled={disabled} /> : null}
    </div>
  );
});
