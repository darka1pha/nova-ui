"use client";

import { ArrowBigUp, Check, Eye, EyeOff, X } from "lucide-react";
import { forwardRef, useId, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Input, InputGroup, type InputProps } from "./input.tsx";
import { VisuallyHidden } from "./layout.tsx";
import { transition } from "./shared.ts";

/* ---------------------------------------------------------------- Strength */

/** 0 too weak · 1 weak · 2 fair · 3 good · 4 strong. */
export type PasswordScore = 0 | 1 | 2 | 3 | 4;

// The handful of passwords every breach list starts with; anything here scores 0.
const common = new Set(["password", "password1", "password123", "passw0rd", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop", "iloveyou", "letmein", "welcome1", "admin123", "abc12345", "11111111"]);

/**
 * A quick, dependency-free strength estimate from length and character variety.
 * Letters from any script count (Persian, Cyrillic…). It is a nudge for the UI,
 * not a security check: validate on the server, and pass `strength` to
 * PasswordInput to plug in something stronger such as zxcvbn.
 */
export function passwordStrength(password: string): PasswordScore {
  if (!password) return 0;
  if (common.has(password.toLowerCase())) return 0;
  const kinds = [/[\p{Ll}\p{Lo}]/u, /\p{Lu}/u, /\p{Nd}/u, /[^\p{L}\p{Nd}]/u].filter((re) => re.test(password)).length;
  const length = [...password].length;
  let score = length >= 16 ? 3 : length >= 12 ? 2 : length >= 8 ? 1 : 0;
  if (kinds >= 3) score++;
  // Runs like "aaa" or "111" add length without adding guesses.
  if (/(.)\1\1/u.test(password)) score--;
  if (length < 8) score = Math.min(score, 1);
  return Math.max(0, Math.min(4, score)) as PasswordScore;
}

/* ------------------------------------------------------------ Requirements */

export interface PasswordRequirement {
  /** Shown in the checklist. */
  label: ReactNode;
  test: (password: string) => boolean;
}

/** Ready-made checklist requirements. Pass your own label to localize. */
export const passwordRequirements = {
  minLength: (n: number, label: ReactNode = `At least ${n} characters`): PasswordRequirement => ({ label, test: (p) => [...p].length >= n }),
  uppercase: (label: ReactNode = "An uppercase letter"): PasswordRequirement => ({ label, test: (p) => /\p{Lu}/u.test(p) }),
  lowercase: (label: ReactNode = "A lowercase letter"): PasswordRequirement => ({ label, test: (p) => /\p{Ll}/u.test(p) }),
  number: (label: ReactNode = "A number"): PasswordRequirement => ({ label, test: (p) => /\p{Nd}/u.test(p) }),
  symbol: (label: ReactNode = "A symbol"): PasswordRequirement => ({ label, test: (p) => /[^\p{L}\p{Nd}\s]/u.test(p) }),
};

/* ----------------------------------------------------------- PasswordInput */

const meterTone = ["bg-danger", "bg-danger", "bg-warning", "bg-success", "bg-success"] as const;
const meterText = ["text-danger-text", "text-danger-text", "text-warning-text", "text-success-text", "text-success-text"] as const;

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  /** Controlled visibility. */
  visible?: boolean;
  /** Show the password on first render. */
  defaultVisible?: boolean;
  /** Called when the password is shown or hidden. */
  onVisibleChange?: (visible: boolean) => void;
  /** Show a strength meter under the field. */
  showStrength?: boolean;
  /** Replace the built-in estimate (e.g. with zxcvbn). Return 0–4. */
  strength?: (password: string) => PasswordScore;
  /** Five labels for scores 0–4. */
  strengthLabels?: [ReactNode, ReactNode, ReactNode, ReactNode, ReactNode];
  /** Text before the strength label, e.g. "Strength:". */
  strengthPrefix?: ReactNode;
  /** Requirements shown as a live checklist. See `passwordRequirements`. */
  requirements?: PasswordRequirement[];
  /** Screen-reader text after each requirement. */
  requirementMetLabel?: string;
  /** Spoken after a requirement that isn't met yet. */
  requirementUnmetLabel?: string;
  /** Warning shown while Caps Lock is on. `false` turns it off. */
  capsLockWarning?: ReactNode | false;
  /** Accessible name of the toggle while the password is hidden. */
  showLabel?: string;
  /** Accessible name of the toggle while the password is shown. */
  hideLabel?: string;
  /** Classes for the wrapper around the field, meter and checklist. */
  wrapperClassName?: string;
}

/**
 * A password field with a show/hide toggle, an optional strength meter and
 * requirement checklist, and a Caps Lock hint. Defaults `autoComplete` to
 * "new-password" when a meter or requirements are shown, else "current-password".
 * Wires itself to a surrounding FormField like Input.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  {
    visible: visibleProp,
    defaultVisible = false,
    onVisibleChange,
    showStrength = false,
    strength = passwordStrength,
    strengthLabels = ["Too weak", "Weak", "Fair", "Good", "Strong"],
    strengthPrefix = "Strength:",
    requirements,
    requirementMetLabel = "met",
    requirementUnmetLabel = "not met",
    capsLockWarning = "Caps Lock is on",
    showLabel = "Show password",
    hideLabel = "Hide password",
    wrapperClassName,
    value,
    defaultValue,
    onChange,
    onKeyDown,
    onKeyUp,
    onBlur,
    size,
    disabled,
    autoComplete,
    "aria-describedby": describedByProp,
    ...props
  },
  ref,
) {
  const [visibleState, setVisibleState] = useState(defaultVisible);
  const visible = visibleProp ?? visibleState;
  const [uncontrolled, setUncontrolled] = useState(String(defaultValue ?? ""));
  const current = value !== undefined ? String(value) : uncontrolled;
  const [capsLock, setCapsLock] = useState(false);
  const ids = useId();
  const requirementsId = `${ids}-rules`;
  const strengthId = `${ids}-strength`;

  const toggle = () => {
    setVisibleState(!visible);
    onVisibleChange?.(!visible);
  };
  const trackCapsLock = (e: KeyboardEvent<HTMLInputElement>) => {
    // getModifierState is missing on some synthetic/older events.
    if (typeof e.getModifierState === "function") setCapsLock(e.getModifierState("CapsLock"));
  };

  const score = strength(current);
  const hasRequirements = !!requirements?.length;
  const describedBy = [describedByProp, hasRequirements && requirementsId, showStrength && strengthId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex w-full flex-col gap-2", wrapperClassName)}>
      <InputGroup
        size={size ?? undefined}
        end={
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-label={visible ? hideLabel : showLabel}
            className="inline-flex size-7 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        }
      >
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          // Keep the browser from capitalizing or "correcting" a revealed password.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete={autoComplete ?? (showStrength || hasRequirements ? "new-password" : "current-password")}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (value === undefined) setUncontrolled(e.target.value);
            onChange?.(e);
          }}
          onKeyDown={(e) => {
            trackCapsLock(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            trackCapsLock(e);
            onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </InputGroup>

      {capsLockWarning !== false ? (
        <p aria-live="polite" className="text-xs text-warning-text empty:sr-only">
          {capsLock ? (
            <span className="inline-flex items-center gap-1 [&_svg]:size-3.5">
              <ArrowBigUp aria-hidden />
              {capsLockWarning}
            </span>
          ) : null}
        </p>
      ) : null}

      {showStrength ? (
        <div className="flex flex-col gap-1">
          <div aria-hidden className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                data-filled={current && Math.max(score, 1) >= step ? "" : undefined}
                className={cn("h-1 rounded-full bg-surface-active", transition, current && Math.max(score, 1) >= step && meterTone[score])}
              />
            ))}
          </div>
          {/* Only the label text changes, so screen readers hear each new level once. */}
          <p id={strengthId} aria-live="polite" className={cn("min-h-4 text-xs", current ? meterText[score] : "text-foreground-muted")}>
            {current ? (
              <>
                {strengthPrefix} <span className="font-medium">{strengthLabels[score]}</span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {requirements?.length ? (
        <ul id={requirementsId} className="flex flex-col gap-1 text-xs">
          {requirements.map((rule, i) => {
            const met = rule.test(current);
            return (
              <li key={i} data-met={met || undefined} className={cn("flex items-center gap-1.5 [&_svg]:size-3.5", transition, met ? "text-success-text" : "text-foreground-muted")}>
                {met ? <Check aria-hidden /> : <X aria-hidden />}
                <span>{rule.label}</span>
                <VisuallyHidden>({met ? requirementMetLabel : requirementUnmetLabel})</VisuallyHidden>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
});
