import {
  createContext,
  createElement,
  forwardRef,
  useContext,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
  type SVGProps,
} from "react";
import { cn } from "../utils/cn.ts";

/**
 * How an icon is painted.
 * - `linear`: every stroke at full strength. The default.
 * - `duotone`: secondary strokes drop to half opacity, so the key shape leads.
 * - `soft`: duotone plus a light tint inside closed shapes, for a filled, friendly feel.
 */
export type IconVariant = "linear" | "duotone" | "soft";

/** Marks an element: `s` secondary (dimmed in duotone/soft), `f` fillable (tinted in soft). */
export type IconElementFlags = "s" | "f" | "sf";

/** One SVG child: tag, attributes and optional role flags. */
export type IconElement = [
  tag: "path" | "circle" | "rect" | "ellipse" | "line" | "polyline" | "polygon",
  attrs: Record<string, string | number>,
  flags?: IconElementFlags,
];

export interface IconComponentProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Width and height. Defaults to 24 (or the nearest IconProvider). */
  size?: number | string;
  /** Stroke width at 24px. Defaults to 1.5. */
  strokeWidth?: number | string;
  /** Keep the stroke the same on-screen width at any size. */
  absoluteStrokeWidth?: boolean;
  variant?: IconVariant;
  /** Stroke color. Defaults to `currentColor`, so icons follow text color. */
  color?: string;
  /** Accessible name. Without it (or `aria-label`) the icon is decorative and hidden. */
  title?: string;
}

export type IconComponent = ForwardRefExoticComponent<IconComponentProps & RefAttributes<SVGSVGElement>> & {
  /** kebab-case name, also the `nv-icon-<name>` class. */
  iconName: string;
};

type IconDefaults = Pick<IconComponentProps, "size" | "strokeWidth" | "variant" | "absoluteStrokeWidth">;

const IconDefaultsContext = createContext<IconDefaults>({});

/** Sets default size, stroke and variant for every Nova UI icon inside it. */
export function IconProvider({ children, ...defaults }: IconDefaults & { children: ReactNode }) {
  const parent = useContext(IconDefaultsContext);
  return createElement(IconDefaultsContext.Provider, { value: { ...parent, ...defaults } }, children);
}

const SECONDARY_OPACITY = 0.5;
const SOFT_FILL_OPACITY = 0.16;

/**
 * Builds an icon on the Nova UI grid: 24×24, 1.5px round strokes, `currentColor`,
 * with `linear`, `duotone` and `soft` variants driven by per-element flags.
 *
 * @param name kebab-case name, used for the `nv-icon-<name>` class.
 */
export function createIcon(name: string, elements: IconElement[]): IconComponent {
  const Icon = forwardRef<SVGSVGElement, IconComponentProps>(function Icon(props, ref) {
    const defaults = useContext(IconDefaultsContext);
    const {
      size = defaults.size ?? 24,
      strokeWidth = defaults.strokeWidth ?? 1.5,
      absoluteStrokeWidth = defaults.absoluteStrokeWidth ?? false,
      variant = defaults.variant ?? "linear",
      color = "currentColor",
      title,
      className,
      children,
      ...rest
    } = props;
    const stroke = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth;
    const labelled = Boolean(title || rest["aria-label"] || rest["aria-labelledby"]);

    const nodes = elements.map(([tag, attrs, flags = ""], i) => {
      const dim = variant !== "linear" && flags.includes("s");
      const tint = variant === "soft" && flags.includes("f");
      return createElement(tag, {
        key: i,
        ...attrs,
        ...(dim ? { opacity: SECONDARY_OPACITY } : null),
        ...(tint ? { fill: "currentColor", fillOpacity: SOFT_FILL_OPACITY } : null),
      });
    });

    return createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: stroke,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": labelled ? undefined : true,
        role: labelled ? "img" : undefined,
        focusable: "false",
        "data-variant": variant,
        className: cn("nv-icon", `nv-icon-${name}`, className),
        ...rest,
      },
      title ? createElement("title", null, title) : null,
      ...nodes,
      children,
    );
  }) as IconComponent;
  Icon.displayName = name.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());
  Icon.iconName = name;
  return Icon;
}

/* -------------------------------------------------------- Drawing helpers */

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A smooth water line across the icon, centred on `y`. */
export const wave = (y: number, from = 2, to = 22): string => {
  const steps = Math.round((to - from) / 2.5);
  return `M${from} ${y}q1.25-1.6 2.5 0` + "t2.5 0".repeat(Math.max(0, steps - 1));
};

/** A closed polygon through points at alternating radii (stars, gears). */
export const radial = (cx: number, cy: number, radii: number[], count: number, offsetDeg = -90): string => {
  const pts: string[] = [];
  const total = count * radii.length;
  for (let i = 0; i < total; i++) {
    const a = ((offsetDeg + (360 / total) * i) * Math.PI) / 180;
    const r = radii[i % radii.length] as number;
    pts.push(`${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join("L")}Z`;
};

/** A dot that reads at any stroke width (filled, no stroke). */
export const dot = (cx: number, cy: number, r = 1): IconElement => ["circle", { cx, cy, r, fill: "currentColor", stroke: "none" }];
