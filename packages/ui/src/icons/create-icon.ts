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
/** How far, in grid px, a corner between two straight segments is rounded back along each side. */
const CORNER_RADIUS = 1.25;

export interface CreateIconOptions {
  /** Corner rounding in grid px for path vertices between two straight segments. 0 keeps them sharp. Defaults to 1.25. */
  corner?: number;
}

/**
 * Builds an icon on the Nova UI grid: 24×24, 1.5px round strokes, `currentColor`,
 * with `linear`, `duotone` and `soft` variants driven by per-element flags.
 * Sharp corners in paths are rounded once, here, so every icon shares the same soft geometry.
 *
 * @param name kebab-case name, used for the `nv-icon-<name>` class.
 */
export function createIcon(name: string, source: IconElement[], { corner = CORNER_RADIUS }: CreateIconOptions = {}): IconComponent {
  const elements: IconElement[] =
    corner > 0
      ? source.map(([tag, attrs, flags]) => (tag === "path" && typeof attrs.d === "string" ? [tag, { ...attrs, d: roundCorners(attrs.d, corner) }, flags] : [tag, attrs, flags]))
      : source;
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

type Pt = [x: number, y: number];
/** A path segment in absolute coordinates; `p` holds the command's arguments. */
type Seg = { c: "M" | "L" | "C" | "S" | "Q" | "T" | "A" | "Z"; p: number[] };

const ARGS: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

/** Parses SVG path data into absolute segments, with H and V turned into L. */
function parsePath(d: string): Seg[] {
  const segs: Seg[] = [];
  let i = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i] as string)) i++;
  };
  const num = () => {
    skip();
    const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/i.exec(d.slice(i));
    if (!m) throw new Error(`Bad path data at ${i}: ${d}`);
    i += m[0].length;
    return Number(m[0]);
  };
  // Arc flags are single digits and may be packed without separators ("01").
  const flag = () => {
    skip();
    return d[i++] === "1" ? 1 : 0;
  };

  let [cx, cy, sx, sy] = [0, 0, 0, 0];
  let cmd = "";
  for (skip(); i < d.length; skip()) {
    const ch = d[i] as string;
    if (/[a-z]/i.test(ch)) {
      cmd = ch;
      i++;
    } else if (!cmd) {
      throw new Error(`Path data must start with a command: ${d}`);
    }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === "Z") {
      segs.push({ c: "Z", p: [] });
      cx = sx;
      cy = sy;
      continue;
    }
    // Drawing straight on after a Z starts a new subpath at the old start.
    if (C !== "M" && segs[segs.length - 1]?.c === "Z") segs.push({ c: "M", p: [sx, sy] });
    const a = Array.from({ length: ARGS[C] as number }, (_, k) => (C === "A" && (k === 3 || k === 4) ? flag() : num()));
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;
    if (C === "H") a.splice(0, 1, (a[0] ?? 0) + ox, cy);
    else if (C === "V") a.splice(0, 1, cx, (a[0] ?? 0) + oy);
    else if (C === "A") {
      a[5] = (a[5] ?? 0) + ox;
      a[6] = (a[6] ?? 0) + oy;
    } else {
      for (let k = 0; k < a.length; k += 2) {
        a[k] = (a[k] ?? 0) + ox;
        a[k + 1] = (a[k + 1] ?? 0) + oy;
      }
    }
    const c = (C === "H" || C === "V" ? "L" : C) as Seg["c"];
    segs.push({ c, p: a });
    cx = (a[a.length - 2] ?? 0);
    cy = (a[a.length - 1] ?? 0);
    if (C === "M") {
      sx = cx;
      sy = cy;
      cmd = rel ? "l" : "L"; // extra pairs after M are lines
    }
  }
  return segs;
}

const end = (s: Seg): Pt => [(s.p[s.p.length - 2] ?? 0), (s.p[s.p.length - 1] ?? 0)];
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** The two points where a fillet of `r` at corner `p` meets its sides, or null when the corner is (nearly) straight. */
function fillet(a: Pt, p: Pt, b: Pt, r: number): [Pt, Pt] | null {
  const la = dist(a, p);
  const lb = dist(p, b);
  if (la < 1e-6 || lb < 1e-6) return null;
  const u: Pt = [(p[0] - a[0]) / la, (p[1] - a[1]) / la];
  const w: Pt = [(b[0] - p[0]) / lb, (b[1] - p[1]) / lb];
  if (u[0] * w[0] + u[1] * w[1] > 0.995) return null;
  // Half of each side at most, so neighbouring fillets never overlap.
  const t = Math.min(r, la / 2, lb / 2);
  return [
    [p[0] - u[0] * t, p[1] - u[1] * t],
    [p[0] + w[0] * t, p[1] + w[1] * t],
  ];
}

/**
 * Rounds every corner where two straight segments meet with a small quadratic
 * fillet, including the corner a `Z` closes. Curves, arcs and open ends are
 * left as they are. Returns absolute path data.
 */
export function roundCorners(d: string, r: number): string {
  const out: string[] = [];
  const emit = (c: string, ...n: number[]) => out.push(c + n.map(r2).join(" "));
  const segs = parsePath(d);

  for (let s = 0; s < segs.length; ) {
    // One subpath: an M, its drawing segments, and an optional Z.
    let e = s + 1;
    while (e < segs.length && (segs[e] as Seg).c !== "M") e++;
    const sub = segs.slice(s, e);
    s = e;
    const closed = (sub[sub.length - 1] as Seg).c === "Z";
    const body = closed ? sub.slice(1, -1) : sub.slice(1);
    const start = end((sub[0] as Seg));
    const pts: Pt[] = [start, ...body.map(end)];
    const n = body.length;
    const line = (k: number) => body[k]?.c === "L";

    // corners[k]: fillet at the end of body[k] (k = n - 1 for the last segment).
    const corners: ([Pt, Pt] | null)[] = Array.from({ length: n }, () => null);
    for (let k = 0; k < n - 1; k++) {
      if (line(k) && line(k + 1)) corners[k] = fillet((pts[k] as Pt), (pts[k + 1] as Pt), (pts[k + 2] as Pt), r);
    }
    let startCorner: [Pt, Pt] | null = null;
    let lastCorner: [Pt, Pt] | null = null;
    if (closed && n > 0) {
      const last = (pts[n] as Pt);
      if (dist(last, start) > 1e-6) {
        // Z draws a real closing line: round both of its ends.
        if (line(n - 1)) lastCorner = fillet((pts[n - 1] as Pt), last, start, r);
        if (line(0)) startCorner = fillet(last, start, (pts[1] as Pt), r);
      } else if (line(n - 1) && line(0)) {
        // The last segment already returns to the start; that vertex is the corner.
        startCorner = fillet((pts[n - 1] as Pt), start, (pts[1] as Pt), r);
        corners[n - 1] = startCorner;
      }
    }
    if (lastCorner) corners[n - 1] = lastCorner;

    emit("M", ...(startCorner ? startCorner[1] : start));
    body.forEach((seg, k) => {
      const f = corners[k];
      if (seg.c === "L" && f) {
        emit("L", ...f[0]);
        emit("Q", ...(pts[k + 1] as Pt), ...f[1]);
      } else {
        emit(seg.c, ...seg.p);
      }
    });
    if (closed) {
      if (startCorner && dist((pts[n] as Pt), start) > 1e-6) {
        emit("L", ...startCorner[0]);
        emit("Q", ...start, ...startCorner[1]);
      }
      out.push("Z");
    }
  }
  return out.join("");
}

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
