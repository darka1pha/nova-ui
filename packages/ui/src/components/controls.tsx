"use client";

import { Checkbox as CheckboxPrimitive, RadioGroup as RadioGroupPrimitive, Slider as SliderPrimitive, Switch as SwitchPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn.ts";
import { useFormField } from "./field.tsx";
import { disabledState, focusRing, pressable, transition } from "./shared.ts";

const checkable =
  `peer inline-flex shrink-0 items-center justify-center border border-input bg-surface text-primary-on-solid shadow-xs ${transition} ${focusRing} ${pressable} ${disabledState} ` +
  "hover:border-foreground-muted hover:shadow-focus-glow aria-invalid:border-danger-text aria-invalid:animate-nv-shake " +
  "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary";

export type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { size?: "sm" | "md" };

/** A checkbox supporting checked, unchecked and indeterminate ("mixed") states. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ className, size = "md", ...props }, ref) {
  const fieldProps = useFormField(props);
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkable, "rounded-[calc(var(--nv-radius-sm)+1px)]", size === "sm" ? "size-4" : "size-5", className)}
      {...fieldProps}
    >
      <CheckboxPrimitive.Indicator className="group/indicator flex items-center justify-center">
        {/* The mark draws itself in rather than appearing. */}
        <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 fill-none stroke-current stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            pathLength={24}
            strokeDasharray={24}
            className="animate-nv-check-draw group-data-[state=indeterminate]/indicator:hidden"
          />
          <path d="M4 8h8" pathLength={24} strokeDasharray={24} className="hidden animate-nv-check-draw group-data-[state=indeterminate]/indicator:block" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

export type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

/** A set of mutually exclusive options with arrow-key navigation. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup({ className, orientation, ...props }, ref) {
  const fieldProps = useFormField(props);
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn("flex gap-3", orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col", className)}
      {...fieldProps}
    />
  );
});

export type RadioProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

/** One option of a RadioGroup. Pair with a Label via `id`/`htmlFor`. */
export const Radio = forwardRef<HTMLButtonElement, RadioProps>(function Radio({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(checkable, "size-5 rounded-full data-[state=checked]:bg-surface", className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-primary animate-nv-bounce-in" />
    </RadioGroupPrimitive.Item>
  );
});

/** Alias for {@link Radio}, matching Radix naming. */
export const RadioGroupItem = Radio;

export type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & { size?: "sm" | "md" | "lg" };

const switchSizes = {
  sm: { root: "h-5 w-9", thumb: "size-4 group-active/switch:w-5 data-[state=checked]:translate-x-4 group-active/switch:data-[state=checked]:translate-x-3 rtl:data-[state=checked]:-translate-x-4 rtl:group-active/switch:data-[state=checked]:-translate-x-3" },
  md: { root: "h-6 w-11", thumb: "size-5 group-active/switch:w-6 data-[state=checked]:translate-x-5 group-active/switch:data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-5 rtl:group-active/switch:data-[state=checked]:-translate-x-4" },
  lg: { root: "h-7 w-13", thumb: "size-6 group-active/switch:w-7 data-[state=checked]:translate-x-6 group-active/switch:data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-6 rtl:group-active/switch:data-[state=checked]:-translate-x-5" },
};

/** An on/off switch for settings that apply immediately. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ className, size = "md", ...props }, ref) {
  const fieldProps = useFormField(props);
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        `group/switch peer inline-flex shrink-0 items-center rounded-full border-2 border-transparent bg-input p-0 ${transition} ${focusRing} ${disabledState}`,
        "hover:shadow-focus-glow data-[state=checked]:bg-primary data-[state=checked]:hover:shadow-glow-primary aria-invalid:ring-2 aria-invalid:ring-danger-text",
        switchSizes[size].root,
        className,
      )}
      {...fieldProps}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          // The thumb stretches while pressed and springs across when toggled.
          "pointer-events-none block rounded-full bg-white shadow-sm transition-[translate,width] duration-(--nv-duration-slow) ease-(--nv-ease-interactive) motion-reduce:transition-none",
          switchSizes[size].thumb,
        )}
      />
    </SwitchPrimitive.Root>
  );
});

export interface SliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Accessible names for each thumb, e.g. ["Minimum price", "Maximum price"]. */
  thumbLabels?: string[];
}

/** A range input with one or more thumbs. Supports keyboard, RTL and vertical. */
export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider({ className, thumbLabels, value, defaultValue, ...props }, ref) {
  const count = (value ?? defaultValue ?? [0]).length;
  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-active data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
        <SliderPrimitive.Range className="absolute h-full bg-(image:--nv-gradient-brand) data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {Array.from({ length: count }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={thumbLabels?.[i]}
          className={cn(
            // A soft halo grows on hover and while dragging.
            "block size-5 cursor-grab rounded-full border-2 border-primary bg-surface shadow-md hover:scale-110 hover:shadow-[0_0_0_6px_color-mix(in_srgb,var(--nv-color-primary-solid)_18%,transparent)] active:cursor-grabbing active:scale-125 active:shadow-[0_0_0_9px_color-mix(in_srgb,var(--nv-color-primary-solid)_22%,transparent)] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
            transition,
            focusRing,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
