/** Class fragments shared across components so states look and move identically everywhere. */

/**
 * Visible focus for keyboard users. The ring "pops" in from a wider offset
 * using the theme's interactive easing, so focus moves are easy to follow.
 */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-(--ks-focus-ring-offset) focus-visible:outline-focus-ring focus-visible:animate-ks-focus-in";

export const disabledState = "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

/** Colors fade on the standard curve; movement (translate/scale) uses the theme's spring. */
export const transition =
  "transition-[color,background-color,border-color,box-shadow,opacity,translate,scale,filter] [transition-duration:var(--ks-duration-fast),var(--ks-duration-fast),var(--ks-duration-fast),var(--ks-duration-normal),var(--ks-duration-fast),var(--ks-duration-slow),var(--ks-duration-slow),var(--ks-duration-normal)] [transition-timing-function:var(--ks-ease-standard),var(--ks-ease-standard),var(--ks-ease-standard),var(--ks-ease-standard),var(--ks-ease-standard),var(--ks-ease-interactive),var(--ks-ease-interactive),var(--ks-ease-standard)] motion-reduce:transition-none";

/** Shrinks slightly while pressed. */
export const pressable = "active:scale-(--ks-press-scale) motion-reduce:active:scale-100";

/** Floating surfaces: menus, popovers, selects, comboboxes. */
export const floatingSurface =
  "z-(--ks-z-popover) overflow-hidden rounded-(--ks-popover-radius) border border-border bg-surface-raised text-foreground shadow-(--ks-popover-shadow) " +
  "data-[state=open]:animate-ks-pop-in data-[state=closed]:animate-ks-pop-out origin-(--radix-popper-transform-origin)";

/** A selectable row inside a floating surface. The highlight slides in rather than blinking. */
export const menuItem =
  "relative flex min-h-8 cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-[background-color,color,padding] duration-(--ks-duration-fast) ease-(--ks-ease-standard) " +
  "data-[highlighted]:bg-primary-subtle data-[highlighted]:text-primary-on-subtle data-[highlighted]:ps-2.5 " +
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-(--ks-duration-normal) data-[highlighted]:[&_svg]:scale-110";

export type Size = "sm" | "md" | "lg";
