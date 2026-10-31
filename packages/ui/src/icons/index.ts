/**
 * Kaleido icon pack: `@kaleido/ui/icons`.
 *
 * Modern, minimal icons on one grid: 24px, 1.5px rounded strokes, soft corners,
 * in three variants (`linear`, `duotone`, `soft`). Includes everyday interface
 * icons and a shipping & marine set.
 *
 * Each icon is its own export, so bundlers keep only the ones you use. The
 * searchable metadata lives in `@kaleido/ui/icons/catalog` (docs and pickers).
 */
export {
  createIcon,
  IconProvider,
  type IconComponent,
  type IconComponentProps,
  type IconElement,
  type IconElementFlags,
  type IconVariant,
} from "./create-icon.ts";
export * from "./essentials.ts";
export * from "./marine.ts";
