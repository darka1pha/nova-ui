/** Class fragments shared across components so states look and move identically everywhere. */

/**
 * Visible focus for keyboard users. The ring "pops" in from a wider offset
 * using the theme's interactive easing, so focus moves are easy to follow.
 */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-(--nv-focus-ring-offset) focus-visible:outline-focus-ring focus-visible:animate-nv-focus-in";

export const disabledState = "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

/** Colors fade on the standard curve; movement (translate/scale) uses the theme's spring. */
export const transition =
  "transition-[color,background-color,border-color,box-shadow,opacity,translate,scale,filter] [transition-duration:var(--nv-duration-fast),var(--nv-duration-fast),var(--nv-duration-fast),var(--nv-duration-normal),var(--nv-duration-fast),var(--nv-duration-slow),var(--nv-duration-slow),var(--nv-duration-normal)] [transition-timing-function:var(--nv-ease-standard),var(--nv-ease-standard),var(--nv-ease-standard),var(--nv-ease-standard),var(--nv-ease-standard),var(--nv-ease-interactive),var(--nv-ease-interactive),var(--nv-ease-standard)] motion-reduce:transition-none";

/** Shrinks slightly while pressed. */
export const pressable = "active:scale-(--nv-press-scale) motion-reduce:active:scale-100";

/** Floating surfaces: menus, popovers, selects, comboboxes. */
export const floatingSurface =
  "z-(--nv-z-popover) overflow-hidden rounded-(--nv-popover-radius) border border-border bg-surface-raised text-foreground shadow-(--nv-popover-shadow) " +
  "data-[state=open]:animate-nv-pop-in data-[state=closed]:animate-nv-pop-out origin-(--radix-popper-transform-origin)";

/** A selectable row inside a floating surface. The highlight slides in rather than blinking. */
export const menuItem =
  "relative flex min-h-8 cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-[background-color,color,padding] duration-(--nv-duration-fast) ease-(--nv-ease-standard) " +
  "data-[highlighted]:bg-primary-subtle data-[highlighted]:text-primary-on-subtle data-[highlighted]:ps-2.5 " +
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-(--nv-duration-normal) data-[highlighted]:[&_svg]:scale-110";

/**
 * Room at the start of a menuItem for a check/radio indicator (or to line up with
 * those rows). It keeps the highlight nudge, which would otherwise reset the
 * padding and slide the label under the indicator.
 */
export const menuItemInset = "ps-8 data-[highlighted]:ps-8.5";

export type Size = "sm" | "md" | "lg";
