"use client";

import { contrastRatio, generateScale, normalizeHex, palette, parseHex, SCALE_STEPS, toHex, WCAG, type Rgb } from "@kaleido/tokens";
import { Check, Pipette, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { forwardRef, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Input, InputGroup, type InputProps } from "./input.tsx";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface, focusRing, transition } from "./shared.ts";

/* ------------------------------------------------------------------ Color math */

/** Hue 0–360, saturation and value 0–1. */
interface Hsv {
  h: number;
  s: number;
  v: number;
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5), g: f(3), b: f(1) };
}

const hexToHsv = (hex: string): Hsv | null => {
  const rgb = parseHex(hex);
  return rgb ? rgbToHsv(rgb) : null;
};
const hsvToHex = (hsv: Hsv) => toHex(hsvToRgb(hsv));
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ------------------------------------------------------------------ Labels */

export interface ColorPickerLabels {
  area: string;
  /** Spoken value of the 2D area. */
  areaValue: (saturation: number, brightness: number) => string;
  hue: string;
  hex: string;
  eyeDropper: string;
  swatches: string;
  swatch: (hex: string) => string;
  contrast: (ratio: string, against: string) => string;
  scale: string;
}

const defaultLabels: ColorPickerLabels = {
  area: "Saturation and brightness",
  areaValue: (s, b) => `Saturation ${s}%, brightness ${b}%`,
  hue: "Hue",
  hex: "Hex color",
  eyeDropper: "Pick a color from the screen",
  swatches: "Suggested colors",
  swatch: (hex) => `Use ${hex}`,
  contrast: (ratio, against) => `Contrast ${ratio} to 1 against ${against}`,
  scale: "Generated tonal scale",
};

/** The 600 step of every Kaleido palette: vivid, and readable on white. */
export const defaultSwatches: readonly string[] = (["violet", "blue", "sky", "teal", "green", "lime", "amber", "orange", "coral", "red", "pink", "magenta", "slate", "ink"] as const).map((name) => palette[name][600]);

/* -------------------------------------------------------------- ColorPicker */

export interface ColorPickerProps {
  /** Hex, e.g. "#6c5ce7". */
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  /** Quick picks. `[]` hides them. */
  swatches?: readonly string[];
  /** Backgrounds to show WCAG contrast against. `[]` hides the check. */
  contrastWith?: readonly string[];
  /** Preview the 12-step tonal scale Kaleido would generate from this color. */
  showScale?: boolean;
  labels?: Partial<ColorPickerLabels>;
  disabled?: boolean;
  className?: string;
}

/**
 * An inline color picker: saturation/brightness area, hue slider, hex field,
 * swatches, eyedropper (where supported), a live WCAG contrast check and an
 * optional preview of the tonal scale Kaleido's color engine builds from it.
 * Every part works with the keyboard; Shift moves in bigger steps.
 */
export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  { value, defaultValue = "#6d4aff", onValueChange, swatches = defaultSwatches, contrastWith = ["#ffffff", "#000000"], showScale = false, labels: labelsProp, disabled, className },
  ref,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value ?? defaultValue) ?? { h: 0, s: 0, v: 0 });
  const hex = hsvToHex(hsv);

  // Follow a controlled value, but keep our hue when the new color is gray (hex can't carry it).
  useEffect(() => {
    if (value === undefined || normalizeHex(value) === hex) return;
    const next = hexToHsv(value);
    if (next) setHsv(next.s === 0 || next.v === 0 ? { ...next, h: hsv.h } : next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (next: Hsv) => {
    setHsv(next);
    const nextHex = hsvToHex(next);
    if (nextHex !== hex) onValueChange?.(nextHex);
  };
  const setHex = (input: string) => {
    const next = hexToHsv(input);
    if (next) update(next.s === 0 || next.v === 0 ? { ...next, h: hsv.h } : next);
  };

  const [draft, setDraft] = useState<string | null>(null);
  const eyeDropperSupported = typeof window !== "undefined" && "EyeDropper" in window;

  return (
    <div ref={ref} data-disabled={disabled || undefined} className={cn("flex w-64 flex-col gap-3 data-disabled:pointer-events-none data-disabled:opacity-60", className)}>
      <SaturationArea hsv={hsv} onChange={update} label={labels.area} valueText={labels.areaValue} disabled={disabled} />
      <HueSlider hsv={hsv} onChange={update} label={labels.hue} disabled={disabled} />
      <div className="flex items-center gap-2">
        <span aria-hidden className="size-8 shrink-0 rounded-(--ks-input-radius) border border-border shadow-xs" style={{ background: hex }} />
        <Input
          size="sm"
          aria-label={labels.hex}
          value={draft ?? hex}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          className="font-mono uppercase"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== null) setHex(draft);
            setDraft(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || draft === null) return;
            e.preventDefault();
            setHex(draft);
            setDraft(null);
          }}
        />
        {eyeDropperSupported ? (
          <button
            type="button"
            aria-label={labels.eyeDropper}
            disabled={disabled}
            onClick={async () => {
              try {
                const EyeDropper = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
                setHex((await new EyeDropper().open()).sRGBHex);
              } catch {
                // Cancelled with Escape.
              }
            }}
            className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-(--ks-input-radius) border border-border text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-4", transition, focusRing)}
          >
            <Pipette />
          </button>
        ) : null}
      </div>

      {swatches.length ? (
        <div role="group" aria-label={labels.swatches} className="grid grid-cols-7 gap-1.5">
          {swatches.map((swatch) => {
            const selected = normalizeHex(swatch) === hex;
            return (
              <button
                key={swatch}
                type="button"
                aria-label={labels.swatch(swatch)}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => setHex(swatch)}
                className={cn("aspect-square rounded-sm border border-black/10 hover:scale-110 motion-reduce:hover:scale-100", transition, focusRing, selected && "ring-2 ring-focus-ring ring-offset-2 ring-offset-surface-raised")}
                style={{ background: swatch }}
              />
            );
          })}
        </div>
      ) : null}

      {contrastWith.length ? (
        <div className="flex flex-wrap gap-1.5">
          {contrastWith.map((bg) => (
            <ContrastBadge key={bg} color={hex} against={bg} label={labels.contrast} />
          ))}
        </div>
      ) : null}

      {showScale ? <ScalePreview hex={hex} label={labels.scale} /> : null}
    </div>
  );
});

/* ------------------------------------------------------------------- Parts */

function usePointerDrag(onMove: (x: number, y: number) => void, disabled?: boolean) {
  const dragging = useRef(false);
  const move = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onMove(clamp01((e.clientX - rect.left) / (rect.width || 1)), clamp01((e.clientY - rect.top) / (rect.height || 1)));
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (disabled || e.button !== 0) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      // Keep keyboard focus on the thumb so arrow keys continue from here.
      e.currentTarget.querySelector<HTMLElement>("[role=slider]")?.focus();
      e.preventDefault();
      move(e);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => dragging.current && move(e),
    onPointerUp: () => (dragging.current = false),
    onPointerCancel: () => (dragging.current = false),
  };
}

const thumb = "absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_1px_3px_rgb(0_0_0/0.4)] outline-none focus-visible:ring-3 focus-visible:ring-focus-ring";

function SaturationArea({ hsv, onChange, label, valueText, disabled }: { hsv: Hsv; onChange: (hsv: Hsv) => void; label: string; valueText: (s: number, b: number) => string; disabled?: boolean }) {
  const drag = usePointerDrag((x, y) => onChange({ ...hsv, s: x, v: 1 - y }), disabled);
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const deltas: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();
    onChange({ ...hsv, s: clamp01(hsv.s + delta[0]), v: clamp01(hsv.v + delta[1]) });
  };
  const s = Math.round(hsv.s * 100);
  const b = Math.round(hsv.v * 100);
  return (
    // The area is a picture of the color space; its axes are physical, so it doesn't mirror in RTL.
    <div
      dir="ltr"
      className="relative h-40 w-full touch-none rounded-(--ks-input-radius) select-none"
      style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
      {...drag}
    >
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={s}
        aria-valuetext={valueText(s, b)}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        className={thumb}
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv) }}
      />
    </div>
  );
}

function HueSlider({ hsv, onChange, label, disabled }: { hsv: Hsv; onChange: (hsv: Hsv) => void; label: string; disabled?: boolean }) {
  const drag = usePointerDrag((x) => onChange({ ...hsv, h: Math.min(359, x * 360) }), disabled);
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    const targets: Record<string, number> = { ArrowLeft: hsv.h - step, ArrowDown: hsv.h - step, ArrowRight: hsv.h + step, ArrowUp: hsv.h + step, Home: 0, End: 359 };
    const target = targets[e.key];
    if (target === undefined) return;
    e.preventDefault();
    onChange({ ...hsv, h: Math.min(359, Math.max(0, target)) });
  };
  return (
    <div
      dir="ltr"
      className="relative h-3 w-full touch-none rounded-full select-none"
      style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      {...drag}
    >
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(hsv.h)}
        aria-valuetext={`${Math.round(hsv.h)}°`}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        className={thumb}
        style={{ left: `${(hsv.h / 359) * 100}%`, top: "50%", background: `hsl(${hsv.h} 100% 50%)` }}
      />
    </div>
  );
}

function ContrastBadge({ color, against, label }: { color: string; against: string; label: ColorPickerLabels["contrast"] }) {
  const ratio = contrastRatio(color, against);
  const text = ratio.toFixed(2).replace(/\.?0+$/, "");
  // 7:1 is AAA for body text.
  const level = ratio >= 7 ? "AAA" : ratio >= WCAG.text ? "AA" : ratio >= WCAG.largeText ? "AA Large" : null;
  return (
    <span
      title={label(text, against)}
      aria-label={`${label(text, against)}${level ? `, passes ${level}` : ", fails"}`}
      role="img"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums [&_svg]:size-3",
        level ? "border-success-border bg-success-subtle text-success-on-subtle" : "border-danger-border bg-danger-subtle text-danger-on-subtle",
      )}
    >
      <span aria-hidden className="size-2.5 rounded-full border border-black/15" style={{ background: against }} />
      <span aria-hidden>{text}:1</span>
      {level ? <Check aria-hidden /> : <X aria-hidden />}
      {level ? <span aria-hidden>{level}</span> : null}
    </span>
  );
}

function ScalePreview({ hex, label }: { hex: string; label: string }) {
  const scale = generateScale(hex);
  return (
    <div role="img" aria-label={label} className="flex h-6 overflow-hidden rounded-sm border border-border">
      {SCALE_STEPS.map((step) => (
        <span key={step} title={`${step} ${scale[step]}`} className="flex-1" style={{ background: scale[step] }} />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- ColorInput */

export interface ColorInputProps extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "type">, Pick<ColorPickerProps, "swatches" | "contrastWith" | "showScale" | "labels"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  /** Accessible name of the swatch button that opens the picker. */
  pickerLabel?: string;
  /** Content added below the picker inside the popover. */
  pickerFooter?: ReactNode;
}

/**
 * A hex text field with a swatch that opens a ColorPicker. Typing a valid hex
 * (3 or 6 digits, with or without #) applies it on blur or Enter; invalid text
 * reverts. Wires itself to a surrounding FormField and posts `name` as a hex.
 */
export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(function ColorInput(
  { value, defaultValue = "#6d4aff", onValueChange, swatches, contrastWith, showScale, labels, pickerLabel = "Open color picker", pickerFooter, size, disabled, onBlur, onKeyDown, ...props },
  ref,
) {
  const container = usePortalContainer();
  const [internal, setInternal] = useState(normalizeHex(defaultValue) ?? "#000000");
  const current = value !== undefined ? (normalizeHex(value) ?? internal) : internal;
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (next: string) => {
    const hex = normalizeHex(next);
    if (!hex || hex === current) return;
    if (value === undefined) setInternal(hex);
    onValueChange?.(hex);
  };

  return (
    <PopoverPrimitive.Root>
      <InputGroup
        size={size ?? undefined}
        start={
          <PopoverPrimitive.Trigger
            aria-label={pickerLabel}
            disabled={disabled}
            // 24px: the WCAG 2.2 minimum target size.
            className={cn("-ms-1 size-6 rounded-[6px] border border-black/15 shadow-xs disabled:opacity-50", focusRing)}
            style={{ background: current }}
          />
        }
      >
        <Input
          ref={ref}
          size={size}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          className="font-mono uppercase"
          value={draft ?? current}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            if (draft !== null) commit(draft);
            setDraft(null);
            onBlur?.(e);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.key === "Enter" && draft !== null) {
              e.preventDefault();
              commit(draft);
              setDraft(null);
            }
          }}
          {...props}
        />
      </InputGroup>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content align="start" sideOffset={8} className={cn(floatingSurface, "flex flex-col gap-3 p-3 outline-none")}>
          <ColorPicker value={current} onValueChange={commit} swatches={swatches} contrastWith={contrastWith} showScale={showScale} labels={labels} />
          {pickerFooter}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
