import { forwardRef, useId, type CSSProperties, type HTMLAttributes, type ImgHTMLAttributes, type ReactNode, type SVGProps } from "react";
import { cn } from "../utils/cn.ts";
import { ANCHOR_DOT, ANCHOR_DROP_LARGE, ANCHOR_DROP_SMALL, ANCHOR_EYE, ANCHOR_INLINE, ANCHOR_OUTLINE, ANCHOR_RATIO, ANCHOR_SILHOUETTE, ANCHOR_VIEWBOX, KMS_OUTLINE, KMS_RATIO, KMS_SOLID, KMS_SOLID_VIEWBOX, KMS_VIEWBOX, WORDMARK, WORDMARK_RATIO, WORDMARK_VIEWBOX } from "./kaveh-artwork.ts";

/*
 * Kaveh Port & Marine Services (KMS) brand components, drawn from the heritage
 * logo: the anchor (a deep navy body inside a heavy outline with a white inline
 * between them, a white eye with a navy dot, a violet drop under the ring and a
 * large drop on the shank), the orange outlined KMS monogram, the KAVEH wordmark with its
 * open "A", the "Since 1948" line and the periwinkle tagline band.
 *
 * Inlines and outlines are cut out with masks rather than painted white, so every
 * piece sits on any background without a halo.
 */

export const kavehBrandColors = {
  navy: "#295097",
  deepNavy: "#0b1f3f",
  orange: "#f37537",
  rust: "#c44e00",
  flare: "#fc7d40",
  periwinkle: "#8fa6dc",
  mist: "#e9effa",
  /** The master logo's ink: the anchor and KAVEH. */
  ink: "#04287e",
  /** The small drop under the anchor's ring in the master logo. */
  violet: "#3e4095",
} as const;
const k = kavehBrandColors;

/**
 * - `auto`: navy parts use the theme's secondary text color. Under the Kaveh
 *   presets that is exactly KMS navy in light mode and a light navy in dark.
 * - `brand`: the master logo's colors (deep navy ink, violet drop, Kaveh orange), for light backgrounds.
 * - `reversed`: white and Flare orange, for navy or photographic backgrounds.
 * - `on-orange`: Deep Harbour navy, for Kaveh orange backgrounds.
 * - `mono`: one color, `currentColor`, for stamps and engraving.
 */
export type KavehLogoTone = "auto" | "brand" | "reversed" | "on-orange" | "mono";

interface ToneSet {
  /** Anchor, wordmark, tagline. */
  navy: string;
  /** KMS monogram, "Since 1948". */
  orange: string;
  /** The small drop under the stock. */
  drop: string;
  /** The tagline band. */
  band: string;
}

const tones: Record<KavehLogoTone, ToneSet> = {
  auto: {
    navy: `var(--nv-color-secondary-text, ${k.navy})`,
    orange: k.orange,
    drop: k.periwinkle,
    band: `linear-gradient(90deg, color-mix(in srgb, ${k.periwinkle} 85%, transparent), color-mix(in srgb, ${k.periwinkle} 12%, transparent))`,
  },
  brand: { navy: k.ink, orange: k.orange, drop: k.violet, band: `linear-gradient(90deg, ${k.periwinkle}, ${k.mist} 80%, transparent)` },
  reversed: { navy: "#ffffff", orange: k.flare, drop: "#a9bee3", band: "linear-gradient(90deg, rgb(255 255 255 / 0.28), rgb(255 255 255 / 0.04))" },
  "on-orange": { navy: k.deepNavy, orange: k.deepNavy, drop: "#ffffff", band: "linear-gradient(90deg, rgb(11 31 63 / 0.22), rgb(11 31 63 / 0.02))" },
  mono: { navy: "currentColor", orange: "currentColor", drop: "currentColor", band: "linear-gradient(90deg, color-mix(in srgb, currentColor 18%, transparent), transparent)" },
};


/** A water drop whose tip is at (cx, top), `h` tall. */
const drop = (cx: number, top: number, h: number) => {
  const r = h * 0.31;
  const y = top + h - r;
  return `M${cx} ${top}C${cx} ${top} ${cx - r} ${top + h * 0.48} ${cx - r} ${y}a${r} ${r} 0 0 0 ${2 * r} 0C${cx + r} ${top + h * 0.48} ${cx} ${top} ${cx} ${top}Z`;
};

/* The anchor, KMS and KAVEH are the traced heritage artwork, not redrawings (see kaveh-artwork.ts). */
const ANCHOR = { viewBox: ANCHOR_VIEWBOX, ratio: ANCHOR_RATIO };

/**
 * `engraved` keeps the heritage inline; `solid` drops it for small sizes and flat
 * print; `auto` picks by rendered size (see {@link resolveAnchorVariant}).
 */
export type KavehMarkVariant = "auto" | "engraved" | "solid";

/**
 * The anchor's rendered height in px below which the inline is thinner than about
 * 0.75px and turns to a gray smear, so `auto` switches to `solid`.
 */
const ENGRAVED_MIN_PX = 44;
/** Below this height the eye and small drop are under 2px, so the anchor is drawn as a plain silhouette. */
const GLYPH_MAX_PX = 20;

/** `density` draws engraved on high-density screens (2x and up) and solid on standard ones. */
type AnchorDetail = "engraved" | "solid" | "glyph" | "density";

/**
 * The level of detail for an anchor drawn `px` CSS pixels tall (undefined when
 * sized by CSS). Between 20 and 44px the inline is only crisp on a 2x screen,
 * so `auto` leaves that choice to the screen.
 */
function resolveAnchorVariant(variant: KavehMarkVariant, px: number | undefined): AnchorDetail {
  if (px !== undefined && px < GLYPH_MAX_PX && variant !== "engraved") return "glyph";
  if (variant !== "auto") return variant;
  if (px === undefined || px >= ENGRAVED_MIN_PX) return "engraved";
  return "density";
}

/**
 * The anchor layered as in the master logo: the silhouette filled and outlined in
 * navy, with the white inline, the eye and the rings around the drops cut out
 * through a mask so they show whatever is behind the mark.
 */
function AnchorArt({ tone, detail = "engraved" }: { tone: KavehLogoTone; detail?: AnchorDetail }) {
  if (detail === "density") {
    return (
      <>
        <g className="hidden [@media(min-resolution:2dppx)]:inline">
          <AnchorLayers tone={tone} detail="engraved" />
        </g>
        <g className="[@media(min-resolution:2dppx)]:hidden">
          <AnchorLayers tone={tone} detail="solid" />
        </g>
      </>
    );
  }
  return <AnchorLayers tone={tone} detail={detail} />;
}

function AnchorLayers({ tone, detail }: { tone: KavehLogoTone; detail: Exclude<AnchorDetail, "density"> }) {
  const mask = `nv-kaveh-anchor-${useId().replace(/:/g, "")}`;
  const t = tones[tone];
  const engraved = detail === "engraved";
  if (detail === "glyph") return <path d={ANCHOR_SILHOUETTE} fill={t.navy} stroke={t.navy} strokeWidth={ANCHOR_OUTLINE} strokeMiterlimit={2.6} />;
  return (
    <>
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x="400" y="40" width="1580" height="1280">
          <rect x="400" y="40" width="1580" height="1280" fill="#fff" />
          {engraved ? <path d={ANCHOR_SILHOUETTE} fill="none" stroke="#000" strokeWidth={ANCHOR_INLINE} strokeMiterlimit={2.6} /> : null}
          <path d={ANCHOR_EYE} fill="#000" />
          <path d={ANCHOR_DROP_SMALL} fill="#000" stroke="#000" strokeWidth={ANCHOR_INLINE} />
          {engraved ? <path d={ANCHOR_DROP_LARGE} fill="none" stroke="#000" strokeWidth={ANCHOR_INLINE} /> : null}
        </mask>
      </defs>
      <path d={ANCHOR_SILHOUETTE} fill={t.navy} stroke={t.navy} strokeWidth={ANCHOR_OUTLINE} strokeMiterlimit={2.6} mask={`url(#${mask})`} />
      <path d={ANCHOR_DOT} fill={t.navy} />
      <path d={ANCHOR_DROP_SMALL} fill={t.drop} />
      {engraved ? <path d={ANCHOR_DROP_LARGE} fill={t.navy} /> : null}
    </>
  );
}

const KMS = { viewBox: KMS_VIEWBOX, ratio: KMS_RATIO };
/** KMS heights in px: the outline's white inline is about 2.4% of the height, so it is only crisp from 32px on a standard screen and 16px on a 2x one. */
const KMS_OUTLINE_MIN_PX = 32;
const KMS_DENSITY_MIN_PX = 16;

/** `density` draws the outline on high-density screens (2x and up) and the solid letters on standard ones. */
type KmsDetail = KmsMonogramVariant | "density";

/** The lettering for a KMS drawn `px` CSS pixels tall (undefined when sized by CSS). Only `outline` steps down. */
function resolveKmsVariant(variant: KmsMonogramVariant, px: number | undefined): KmsDetail {
  if (variant === "solid" || px === undefined || px >= KMS_OUTLINE_MIN_PX) return variant;
  return px >= KMS_DENSITY_MIN_PX ? "density" : "solid";
}

/** KMS in a box of the given size, each variant in its own viewBox so both fill the same footprint. */
function KmsBox({ tone, detail, x = 0, y = 0, width, height }: { tone: KavehLogoTone; detail: KmsDetail; x?: number; y?: number; width: number; height: number }) {
  const box = (variant: KmsMonogramVariant, className?: string) => (
    <svg x={x} y={y} width={width} height={height} viewBox={variant === "outline" ? KMS_VIEWBOX : KMS_SOLID_VIEWBOX} preserveAspectRatio="xMidYMid meet" className={className}>
      <KmsArt tone={tone} variant={variant} />
    </svg>
  );
  if (detail !== "density") return box(detail);
  return (
    <>
      {box("outline", "hidden [@media(min-resolution:2dppx)]:inline")}
      {box("solid", "[@media(min-resolution:2dppx)]:hidden")}
    </>
  );
}

/** `outline` is the heritage lettering (outline, white inline, letters); `solid` is the letters alone. */
export type KmsMonogramVariant = "outline" | "solid";

function KmsArt({ tone, variant = "outline" }: { tone: KavehLogoTone; variant?: KmsMonogramVariant }) {
  return <path d={variant === "outline" ? KMS_OUTLINE : KMS_SOLID} fill={tones[tone].orange} fillRule="evenodd" />;
}

/* ---------------------------------------------------------------- Shared */

interface BrandSvgProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Height in px or CSS. */
  size?: number | string;
  tone?: KavehLogoTone;
  /** Accessible name. Pass `""` when a visible name sits next to it. */
  title?: string;
}

function svgSize(size: number | string, ratio: number) {
  // Whole pixels: a fractional box puts every edge of the artwork on a half pixel, which reads as blur at small sizes.
  return typeof size === "number" ? { height: Math.round(size), width: Math.round(size * ratio) } : { height: size, style: { width: "auto" } };
}

function svgA11y(title: string | undefined) {
  return title ? { role: "img" as const } : { "aria-hidden": true as const };
}

/* ------------------------------------------------------------ KavehMark */

export interface KavehMarkProps extends BrandSvgProps {
  /** Height in px or CSS. The anchor is about 6:5 wide. Defaults to 40. */
  size?: number | string;
  /** "auto" (theme secondary text), "brand" (KMS navy), "reversed" (white), "on-orange" or "mono". Defaults to "auto". */
  tone?: KavehLogoTone;
  /** Accessible name. Defaults to "Kaveh". Pass `""` when a visible name sits next to it. */
  title?: string;
  /** `auto` (engraved from 44px tall, solid below), `engraved` (heritage inline) or `solid` (flat). Defaults to "auto". */
  variant?: KavehMarkVariant;
}

/** The engraved KMS anchor on its own: app icons, avatars, favicons, tight spaces. */
export const KavehMark = forwardRef<SVGSVGElement, KavehMarkProps>(function KavehMark({ size = 40, tone = "auto", title = "Kaveh", variant = "auto", className, style, ...props }, ref) {
  const dims = svgSize(size, ANCHOR.ratio);
  const detail = resolveAnchorVariant(variant, typeof dims.height === "number" ? dims.height : undefined);
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={ANCHOR.viewBox}
      height={dims.height}
      width={"width" in dims ? dims.width : undefined}
      focusable="false"
      className={cn("nv-kaveh-mark shrink-0", className)}
      style={{ ...("style" in dims ? dims.style : null), ...style }}
      {...svgA11y(title)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <AnchorArt tone={tone} detail={detail} />
    </svg>
  );
});

/* ----------------------------------------------------------- KmsMonogram */

export interface KmsMonogramProps extends BrandSvgProps {
  /** Height in px or CSS. The monogram is 16:5. Defaults to 24. */
  size?: number | string;
  /** Orange in `auto` and `brand`, Flare on navy, navy on orange. Defaults to "auto". */
  tone?: KavehLogoTone;
  /** Defaults to "KMS". */
  title?: string;
  /** `outline` (heritage hollow letters) or `solid`. Defaults to "outline", which steps down to solid when too small to be crisp: under 32px tall on a standard screen, 16px on a 2x one. */
  variant?: KmsMonogramVariant;
}

/** The orange outlined KMS monogram from the heritage logo. */
export const KmsMonogram = forwardRef<SVGSVGElement, KmsMonogramProps>(function KmsMonogram({ size = 24, tone = "auto", title = "KMS", variant = "outline", className, style, ...props }, ref) {
  const dims = svgSize(size, KMS.ratio);
  // The outline and white inline merge below about 16px tall; the letters alone stay crisp.
  const detail = resolveKmsVariant(variant, typeof dims.height === "number" ? dims.height : undefined);
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${KMS.ratio * 100} 100`}
      height={dims.height}
      width={"width" in dims ? dims.width : undefined}
      focusable="false"
      className={cn("nv-kms-monogram shrink-0", className)}
      style={{ ...("style" in dims ? dims.style : null), ...style }}
      {...svgA11y(title)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <KmsBox tone={tone} detail={detail} width={KMS.ratio * 100} height={100} />
    </svg>
  );
});

/* --------------------------------------------------------- KavehWordmark */

export interface KavehWordmarkProps extends BrandSvgProps {
  /** Height in px or CSS, including the H's foot. The wordmark is about 4.2:1. Defaults to 24. */
  size?: number | string;
  tone?: KavehLogoTone;
  /** Defaults to "Kaveh". */
  title?: string;
}

/** The KAVEH wordmark from the logo artwork (not typeset), so it matches the logo on every device. */
export const KavehWordmark = forwardRef<SVGSVGElement, KavehWordmarkProps>(function KavehWordmark({ size = 24, tone = "auto", title = "Kaveh", className, style, ...props }, ref) {
  const dims = svgSize(size, WORDMARK_RATIO);
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={WORDMARK_VIEWBOX}
      height={dims.height}
      width={"width" in dims ? dims.width : undefined}
      focusable="false"
      className={cn("nv-kaveh-wordmark shrink-0", className)}
      style={{ ...("style" in dims ? dims.style : null), ...style }}
      {...svgA11y(title)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d={WORDMARK} fill={tones[tone].navy} fillRule="evenodd" />
    </svg>
  );
});

/* ----------------------------------------------------------- KavehEmblem */

export interface KavehEmblemProps extends BrandSvgProps {
  /** Height in px or CSS. Defaults to 96. */
  size?: number | string;
  tone?: KavehLogoTone;
  /** Defaults to "Kaveh Marine Services (KMS)". */
  title?: string;
}

const EMBLEM_RATIO = 460 / 420;

/** The heritage emblem: the anchor over the KMS monogram, as in the left of the logo. */
export const KavehEmblem = forwardRef<SVGSVGElement, KavehEmblemProps>(function KavehEmblem(
  { size = 96, tone = "auto", title = "Kaveh Marine Services (KMS)", className, style, ...props },
  ref,
) {
  const dims = svgSize(size, EMBLEM_RATIO);
  // In the 420-unit emblem the anchor is 283 units tall and KMS 114.
  const px = typeof dims.height === "number" ? dims.height / 420 : undefined;
  const anchorDetail = resolveAnchorVariant("auto", px === undefined ? undefined : px * 283);
  const kms = resolveKmsVariant("outline", px === undefined ? undefined : px * 114);
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 460 420"
      height={dims.height}
      width={"width" in dims ? dims.width : undefined}
      focusable="false"
      className={cn("nv-kaveh-emblem shrink-0", className)}
      style={{ ...("style" in dims ? dims.style : null), ...style }}
      {...svgA11y(title)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <svg x="60" y="0" width="340" height="283" viewBox={ANCHOR.viewBox}>
        <AnchorArt tone={tone} detail={anchorDetail} />
      </svg>
      <KmsBox tone={tone} detail={kms} x={0} y={300} width={460} height={114} />
    </svg>
  );
});

/* ------------------------------------------------------------- KavehLogo */

export interface KavehLogoProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * - `horizontal`: anchor beside the wordmark. Everyday use.
   * - `stacked`: anchor above, centered. Square spaces.
   * - `heritage`: the full logo: emblem, "Since 1948 · تأسیس ۱۳۲۷", the tagline band and the bilingual name.
   * - `persian`: Persian-first, right to left: the anchor, «کاوه» and the Persian tagline. Domestic use.
   * - `badge`: the anchor in a filled tile beside the wordmark. App bars and sign-in screens.
   */
  layout?: "horizontal" | "stacked" | "heritage" | "persian" | "badge";
  /** "auto" (theme secondary text), "brand" (KMS navy), "reversed" (white), "on-orange" or "mono". Defaults to "auto". */
  tone?: KavehLogoTone;
  /** Anchor height in px; everything else scales with it. Defaults to 40. */
  size?: number;
  /** Show "Port & Marine Services". Always on in `heritage`. */
  tagline?: boolean;
  /** Show the Persian name, خدمات بندری و دریایی کاوه. Always on in `heritage`. */
  persian?: boolean;
}

/** The Kaveh logo lockups, from the compact anchor-and-wordmark to the full heritage logo. */
export const KavehLogo = forwardRef<HTMLDivElement, KavehLogoProps>(function KavehLogo(
  { layout = "horizontal", tone = "auto", size = 40, tagline = true, persian = false, className, style, ...props },
  ref,
) {
  const c = tones[tone];
  // `data-nv-logotype`: the lockup's lettering is the trademark itself, which WCAG 1.4.3
  // exempts from contrast minimums ("text that is part of a logo or brand name").
  // The docs' axe checks skip color-contrast inside it, and nothing else.
  const shared = { ref, role: "img" as const, "aria-label": "Kaveh Port & Marine Services", "data-nv-logotype": "", ...props };

  if (layout === "heritage") {
    const h = size * 2.4;
    return (
      <div {...shared} className={cn("nv-kaveh-logo inline-flex shrink-0 items-center", className)} style={{ gap: h * 0.14, ...style }}>
        <KavehEmblem size={h} tone={tone} title="" />
        <div className="flex min-w-0 flex-col" style={{ gap: h * 0.045 }}>
          <div className="flex items-baseline justify-between font-bold leading-none" style={{ color: c.orange, gap: h * 0.12 }}>
            <span className="font-display" style={{ fontSize: h * 0.2, letterSpacing: "0.32em" }}>
              Since 1948
            </span>
            <span lang="fa" dir="rtl" style={{ fontSize: h * 0.2 }}>
              تأسیس ۱۳۲۷
            </span>
          </div>
          <div className="flex items-center font-display leading-none" style={{ background: c.band, borderInlineStart: `${Math.max(1.5, h * 0.012)}px solid ${c.drop}`, color: c.navy, padding: `${h * 0.03}px ${h * 0.05}px`, fontSize: h * 0.155, letterSpacing: "0.3em" }}>
            Port and Marine Services
          </div>
          <div className="flex items-center" style={{ gap: h * 0.12, marginTop: h * 0.03 }}>
            <KavehWordmark size={h * 0.3} tone={tone} title="" />
            <span lang="fa" dir="rtl" className="font-black leading-tight" style={{ fontSize: h * 0.19, color: c.navy }}>
              خدمات بندری و دریایی کاوه
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (layout === "persian") {
    return (
      <div {...shared} dir="rtl" lang="fa" className={cn("nv-kaveh-logo inline-flex shrink-0 items-center", className)} style={{ gap: size * 0.3, ...style }}>
        <KavehMark size={size} tone={tone} title="" />
        <div className="flex flex-col items-start">
          <span className="font-black leading-none" style={{ fontSize: size * 0.95, color: c.navy }}>
            کاوه
          </span>
          {tagline ? (
            <span className="font-bold leading-normal" style={{ fontSize: Math.max(10, size * 0.27), marginTop: size * 0.1, color: c.orange }}>
              خدمات بندری و دریایی · تأسیس ۱۳۲۷
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (layout === "badge") {
    const tile = tone === "reversed" ? k.orange : k.deepNavy;
    const markTone: KavehLogoTone = tone === "reversed" ? "on-orange" : tone === "mono" ? "mono" : "reversed";
    return (
      <div {...shared} className={cn("nv-kaveh-logo inline-flex shrink-0 items-center", className)} style={{ gap: size * 0.3, ...style }}>
        <span className="grid shrink-0 place-items-center" style={{ width: size * 1.25, height: size * 1.25, borderRadius: size * 0.3, background: tone === "mono" ? "transparent" : tile, boxShadow: tone === "mono" ? "inset 0 0 0 2px currentColor" : undefined }}>
          <KavehMark size={size * 0.62} tone={markTone} title="" variant="solid" />
        </span>
        <div className="flex flex-col items-start">
          <KavehWordmark size={size * 0.46} tone={tone} title="" />
          {tagline ? (
            <span className="font-semibold uppercase leading-none" style={{ fontSize: Math.max(8, size * 0.18), letterSpacing: "0.22em", marginTop: size * 0.16, color: c.orange }}>
              Since 1948
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  const stacked = layout === "stacked";
  return (
    <div
      {...shared}
      className={cn("nv-kaveh-logo inline-flex shrink-0 items-center", stacked ? "flex-col text-center" : "flex-row text-start", className)}
      style={{ gap: size * 0.3, ...style }}
    >
      <KavehMark size={size} tone={tone} title="" />
      <div className="flex flex-col" style={{ alignItems: stacked ? "center" : "flex-start" }}>
        <KavehWordmark size={size * 0.52} tone={tone} title="" />
        {tagline ? (
          <span className="flex items-center font-semibold uppercase leading-none" style={{ fontSize: Math.max(8, size * 0.19), letterSpacing: "0.24em", marginTop: size * 0.18, gap: size * 0.15, color: c.navy }}>
            <span aria-hidden className="inline-block" style={{ width: size * 0.38, height: Math.max(1.5, size * 0.05), background: c.orange }} />
            Port &amp; Marine Services
          </span>
        ) : null}
        {persian ? (
          <span lang="fa" dir="rtl" className="font-bold leading-normal" style={{ fontSize: Math.max(10, size * 0.28), marginTop: size * 0.08, color: c.orange }}>
            خدمات بندری و دریایی کاوه
          </span>
        ) : null}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------- KavehSeal */

export type KavehSealVariant = "navy" | "orange" | "light" | "outline";

const sealStyles: Record<KavehSealVariant, { bg: string; ring: string; inner: string; art: KavehLogoTone }> = {
  navy: { bg: k.deepNavy, ring: k.orange, inner: "rgb(255 255 255 / 0.22)", art: "reversed" },
  orange: { bg: k.orange, ring: k.deepNavy, inner: "rgb(11 31 63 / 0.3)", art: "on-orange" },
  light: { bg: "#ffffff", ring: k.orange, inner: "rgb(41 80 151 / 0.25)", art: "brand" },
  outline: { bg: "none", ring: "currentColor", inner: "currentColor", art: "mono" },
};

export interface KavehSealProps extends Omit<BrandSvgProps, "tone"> {
  /** Diameter in px or CSS. Defaults to 96. */
  size?: number | string;
  /** `navy` (default), `orange`, `light` (white with an orange ring) or `outline` (one color, for stamps). */
  variant?: KavehSealVariant;
  /** @deprecated The seal no longer shows the founding year, so this has no effect. */
  persian?: boolean;
  /** Defaults to "KMS". */
  title?: string;
}

/** A round heritage seal: the anchor over KMS on Deep Harbour navy with an orange ring. */
export const KavehSeal = forwardRef<SVGSVGElement, KavehSealProps>(function KavehSeal({ size = 96, variant = "navy", persian: _persian, title = "KMS", className, ...props }, ref) {
  const v = sealStyles[variant];
  // In the 200-unit seal the anchor is 93 units tall and KMS 22.
  const px = typeof size === "number" ? size / 200 : undefined;
  const anchorDetail = resolveAnchorVariant("auto", px === undefined ? undefined : px * 93);
  const kms = resolveKmsVariant("outline", px === undefined ? undefined : px * 22);
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width={size} height={size} focusable="false" className={cn("nv-kaveh-seal shrink-0", className)} {...svgA11y(title)} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="100" cy="100" r="98" fill={v.bg} stroke={variant === "outline" || variant === "light" ? v.ring : "none"} strokeWidth={variant === "outline" ? 3 : 1.5} />
      <circle cx="100" cy="100" r="90" fill="none" stroke={v.ring} strokeWidth="4" />
      <circle cx="100" cy="100" r="80" fill="none" stroke={v.inner} strokeWidth="1.5" strokeDasharray={variant === "outline" ? "2 4" : undefined} />
      <svg x="44" y="40" width="112" height="93" viewBox={ANCHOR.viewBox}>
        <AnchorArt tone={v.art} detail={anchorDetail} />
      </svg>
      <KmsBox tone={v.art} detail={kms} x={56} y={139} width={88} height={22} />
    </svg>
  );
});

/* -------------------------------------------------------- HorizonDivider */

/**
 * - `solid`: the 3px orange rule.
 * - `double`: the orange rule over a thin navy line, for footers and certificates.
 * - `fade`: orange fading toward the inline end, for headings.
 * - `dashed`: an orange dash, for timelines and maps.
 */
export type HorizonDividerVariant = "solid" | "double" | "fade" | "dashed";

const horizonLine: Record<HorizonDividerVariant, string> = {
  solid: k.orange,
  double: k.orange,
  fade: `linear-gradient(90deg, ${k.orange}, color-mix(in srgb, ${k.orange} 0%, transparent))`,
  dashed: `repeating-linear-gradient(90deg, ${k.orange} 0 14px, transparent 14px 22px)`,
};

export interface HorizonDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: HorizonDividerVariant;
  /** Line length as CSS. Defaults to the full width. */
  length?: string;
  /** Add the orange drop above the line's start (or centre when `align="center"`). */
  drop?: boolean;
  /** Add a navy wave under the line. */
  wave?: boolean;
  align?: "start" | "center";
  /** A label set in the middle of the line, e.g. "Since 1948". */
  children?: ReactNode;
}

function HorizonLine({ variant, className }: { variant: HorizonDividerVariant; className?: string }) {
  return (
    <span aria-hidden className={cn("flex w-full flex-col gap-[3px]", className)}>
      <span className={cn("block h-[3px] w-full rounded-full", variant === "fade" && "rtl:-scale-x-100")} style={{ background: horizonLine[variant] }} />
      {variant === "double" ? <span className="block h-px w-full bg-secondary-text opacity-60" /> : null}
    </span>
  );
}

/**
 * The Horizon: the brand's orange rule, from the anchor's stock. Separates a
 * headline from its body, an image from its caption. Decorative.
 */
export const HorizonDivider = forwardRef<HTMLDivElement, HorizonDividerProps>(function HorizonDivider(
  { variant = "solid", length = "100%", drop: withDrop = false, wave = false, align = "start", className, style, children, ...props },
  ref,
) {
  if (children) {
    return (
      <div ref={ref} role="separator" className={cn("nv-horizon flex items-center gap-3", className)} style={{ width: length, ...style }} {...props}>
        <HorizonLine variant={variant === "fade" ? "solid" : variant} className="flex-1" />
        <span className="shrink-0 font-display text-xs font-semibold uppercase tracking-[0.24em] text-secondary-text [&:lang(fa)]:tracking-normal">{children}</span>
        <HorizonLine variant={variant === "fade" ? "solid" : variant} className="flex-1" />
      </div>
    );
  }
  return (
    <div ref={ref} role="presentation" className={cn("nv-horizon flex flex-col gap-1", align === "center" ? "items-center" : "items-start", className)} style={{ width: length, ...style }} {...props}>
      {withDrop ? (
        <svg aria-hidden viewBox="0 0 20 26" width="12" height="16" className={cn(align === "start" && "ms-3")}>
          <path d={drop(10, 1, 24)} fill={k.orange} />
        </svg>
      ) : null}
      <HorizonLine variant={variant} />
      {wave ? (
        <svg aria-hidden viewBox="0 0 120 8" preserveAspectRatio="none" className="h-2 w-full text-secondary-text">
          <path d="M0 4q7.5-4 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0" fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
    </div>
  );
});

/* -------------------------------------------------------------- Tideband */

/**
 * - `light`: the heritage periwinkle band, for white or sand backgrounds.
 * - `dark`: a translucent mist band, for navy backgrounds.
 * - `orange`: a warm band with navy text, for campaign labels.
 * - `solid`: a KMS blue strip with white text and an orange edge, for table and section headers.
 */
export type TidebandTone = "light" | "dark" | "orange" | "solid";

const tidebandTone: Record<TidebandTone, string> = {
  light: "border-[#8fa6dc] bg-[linear-gradient(90deg,#b9c8ec,#e9effa_70%,transparent)] text-[#295097] rtl:bg-[linear-gradient(270deg,#b9c8ec,#e9effa_70%,transparent)]",
  dark: "border-[#a9bee3] bg-[linear-gradient(90deg,rgb(169_190_227/0.35),transparent)] text-white rtl:bg-[linear-gradient(270deg,rgb(169_190_227/0.35),transparent)]",
  orange: "border-[#f37537] bg-[linear-gradient(90deg,#ffc9a3,#ffefe3_70%,transparent)] text-[#0b1f3f] rtl:bg-[linear-gradient(270deg,#ffc9a3,#ffefe3_70%,transparent)]",
  solid: "border-[#f37537] bg-[#295097] text-white",
};

const tidebandSize = {
  sm: "px-2.5 py-1 text-[11px]",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2.5 text-base",
} as const;

export interface TidebandProps extends HTMLAttributes<HTMLDivElement> {
  tone?: TidebandTone;
  size?: keyof typeof tidebandSize;
  /** Optional element at the band's end, e.g. a link or a Persian translation. */
  end?: ReactNode;
}

/**
 * The periwinkle tagline band from the heritage logo: a strip that fades toward
 * the inline end, for section labels, captions and data strips.
 */
export const Tideband = forwardRef<HTMLDivElement, TidebandProps>(function Tideband({ tone = "light", size = "md", end, className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        // Persian must never be letter-spaced: it breaks the joins.
        "nv-tideband flex items-center justify-between gap-4 border-s-[3px] font-display uppercase tracking-[0.24em] rtl:tracking-normal [&:lang(fa)]:tracking-normal",
        tidebandSize[size],
        tidebandTone[tone],
        className,
      )}
      {...props}
    >
      <span className="min-w-0">{children}</span>
      {end ? <span className="shrink-0 normal-case tracking-normal">{end}</span> : null}
    </div>
  );
});

/* --------------------------------------------------------- PortholeFrame */

/**
 * - `navy`: a Deep Harbour rim with orange bolts.
 * - `orange`: a Kaveh orange rim with navy bolts.
 * - `double`: a navy rim inside an orange ring.
 * - `thin`: a slim navy line, no bolts, for dense lists.
 */
export type PortholeVariant = "navy" | "orange" | "double" | "thin";

const portholeStyle: Record<PortholeVariant, { rim: string; bolt: string | null; ring?: string }> = {
  navy: { rim: k.deepNavy, bolt: k.orange },
  orange: { rim: k.orange, bolt: k.deepNavy },
  double: { rim: k.deepNavy, bolt: k.orange, ring: k.orange },
  thin: { rim: k.navy, bolt: null },
};

export interface PortholeFrameProps extends ImgHTMLAttributes<HTMLImageElement> {
  variant?: PortholeVariant;
  /** Diameter in px. Defaults to 160. */
  size?: number;
  /** Overrides the rim color. */
  ringColor?: string;
  /** A small element pinned to the bottom end of the frame, e.g. a status dot or a flag. */
  badge?: ReactNode;
}

/** A circular image frame from the anchor's ring: a rim with four bolts. For portraits and vessel photos. */
export const PortholeFrame = forwardRef<HTMLImageElement, PortholeFrameProps>(function PortholeFrame(
  { variant = "navy", size = 160, ringColor, badge, className, style, alt, ...props },
  ref,
) {
  const v = portholeStyle[variant];
  const rim = variant === "thin" ? Math.max(2, size * 0.02) : Math.max(4, size * 0.055);
  const bolt = Math.max(3, size * 0.035);
  const wrap: CSSProperties = {
    width: size,
    height: size,
    padding: rim,
    background: ringColor ?? v.rim,
    boxShadow: v.ring ? `0 0 0 ${Math.max(2, size * 0.025)}px ${v.ring}` : undefined,
  };
  return (
    <span className={cn("nv-porthole relative inline-block shrink-0 rounded-full", variant !== "thin" && "shadow-md", className)} style={{ ...wrap, ...style }}>
      <img ref={ref} alt={alt} className={cn("block size-full rounded-full object-cover", variant !== "thin" && "ring-2 ring-white/25")} {...props} />
      {v.bolt
        ? [0, 90, 180, 270].map((deg) => (
            <span
              key={deg}
              aria-hidden
              className="absolute rounded-full"
              style={{ width: bolt, height: bolt, background: v.bolt ?? undefined, left: "50%", top: "50%", transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(${-(size / 2 - rim / 2)}px)` }}
            />
          ))
        : null}
      {badge ? (
        <span className="absolute bottom-[6%] end-[6%] translate-x-1/4 translate-y-1/4 rtl:-translate-x-1/4">{badge}</span>
      ) : null}
    </span>
  );
});

/* ----------------------------------------------------- VesselStatusBadge */

export type VesselStatus = "underway" | "berthing" | "berthed" | "anchored" | "delayed";

const vesselStatus: Record<VesselStatus, { label: string; soft: string; solid: string; outline: string; dot: string }> = {
  underway: { label: "Underway", soft: "bg-info-subtle text-info-on-subtle", solid: "bg-info-solid text-info-on-solid", outline: "border-info-border text-info-text", dot: "bg-info-solid" },
  berthing: { label: "Berthing", soft: "bg-primary-solid text-primary-on-solid", solid: "bg-primary-solid text-primary-on-solid", outline: "border-primary-solid text-foreground", dot: "bg-primary-solid" },
  berthed: { label: "Berthed", soft: "bg-success-subtle text-success-on-subtle", solid: "bg-success-solid text-success-on-solid", outline: "border-success-border text-success-text", dot: "bg-success-solid" },
  anchored: { label: "At anchor", soft: "bg-neutral-subtle text-neutral-on-subtle", solid: "bg-neutral-solid text-neutral-on-solid", outline: "border-border-strong text-foreground-secondary", dot: "bg-neutral-solid" },
  delayed: { label: "Delayed", soft: "bg-danger-subtle text-danger-on-subtle", solid: "bg-danger-solid text-danger-on-solid", outline: "border-danger-border text-danger-text", dot: "bg-danger-solid" },
};

export interface VesselStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: VesselStatus;
  /** `soft` (default), `solid`, `outline`, or `dot` (a colored dot before plain text). */
  variant?: "soft" | "solid" | "outline" | "dot";
  /** Replaces the default English label, e.g. for translation. */
  label?: ReactNode;
}

/** A vessel's status as a badge. The status is always written out, never color alone. */
export const VesselStatusBadge = forwardRef<HTMLSpanElement, VesselStatusBadgeProps>(function VesselStatusBadge({ status, variant = "soft", label, className, ...props }, ref) {
  const s = vesselStatus[status];
  const text = label ?? s.label;
  if (variant === "dot") {
    return (
      <span ref={ref} className={cn("nv-vessel-status inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary", className)} {...props}>
        <span aria-hidden className={cn("size-2 rounded-full", s.dot, status === "underway" && "motion-safe:animate-pulse")} />
        {text}
      </span>
    );
  }
  return (
    <span
      ref={ref}
      className={cn("nv-vessel-status inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variant === "outline" ? cn("border", s.outline) : s[variant], className)}
      {...props}
    >
      {text}
    </span>
  );
});

/* ---------------------------------------------------------- KavehAppIcon */

/**
 * - `navy`: white anchor and Flare orange KMS on Deep Harbour. The default app icon.
 * - `orange`: navy anchor and KMS on Kaveh orange.
 * - `light`: navy anchor and orange KMS on white with a hairline border.
 * - `sunset`: white anchor and KMS on the navy-to-orange harbour sunset.
 */
export type KavehAppIconVariant = "navy" | "orange" | "light" | "sunset";

const appIconStyle: Record<KavehAppIconVariant, { background: string; tone: KavehLogoTone; kms: string; border?: string }> = {
  navy: { background: k.deepNavy, tone: "reversed", kms: k.flare },
  orange: { background: k.orange, tone: "on-orange", kms: k.deepNavy },
  light: { background: "#ffffff", tone: "brand", kms: k.orange, border: "inset 0 0 0 1px rgb(11 31 63 / 0.12)" },
  // The sunset ends on true Kaveh orange in the corner rather than a navy-orange mix.
  sunset: { background: `linear-gradient(160deg, ${k.deepNavy} 0%, ${k.navy} 50%, ${k.orange} 100%)`, tone: "reversed", kms: "#ffffff" },
};

/** Below this edge length KMS would be under 11px tall and unreadable, so the icon shows the anchor alone. */
const APP_ICON_KMS_MIN = 64;

export interface KavehAppIconProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: KavehAppIconVariant;
  /** Edge length in px. Defaults to 64. */
  size?: number;
  /** `rounded` (iOS-style squircle), `square` or `circle`. */
  shape?: "rounded" | "square" | "circle";
  /** Accessible name. Defaults to "Kaveh". Pass `""` when decorative. */
  label?: string;
  /** Show the KMS monogram under the anchor. Defaults to true; always hidden below 64px, where it can't be read. */
  monogram?: boolean;
}

/** The anchor over the KMS monogram in a tile: app icons, favicons, avatars and home-screen shortcuts. */
export const KavehAppIcon = forwardRef<HTMLSpanElement, KavehAppIconProps>(function KavehAppIcon(
  { variant = "navy", size = 64, shape = "rounded", label = "Kaveh", monogram = true, className, style, ...props },
  ref,
) {
  const v = appIconStyle[variant];
  const radius = shape === "circle" ? "50%" : shape === "rounded" ? size * 0.23 : size * 0.06;
  const showKms = monogram && size >= APP_ICON_KMS_MIN;
  return (
    <span
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn("nv-kaveh-app-icon inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size, borderRadius: radius, background: v.background, boxShadow: v.border, ...style }}
      {...props}
    >
      {showKms ? (
        // Proportions of the master emblem: KMS runs about 1.4 times the anchor's width.
        // Sizes are whole pixels so the artwork sits on the pixel grid.
        <span className="flex flex-col items-center" style={{ gap: Math.round(size * 0.035) }}>
          <KavehMark size={Math.round(size * 0.4)} tone={v.tone} title="" />
          <KmsMonogram size={Math.round(size * 0.17)} tone="mono" title="" style={{ color: v.kms }} />
        </span>
      ) : (
        <KavehMark size={Math.round(size * 0.5)} tone={v.tone} title="" />
      )}
    </span>
  );
});

/* ------------------------------------------------------------- BrandStat */

export interface BrandStatProps extends HTMLAttributes<HTMLDivElement> {
  /** The number, e.g. "78" or "24/7". */
  value: ReactNode;
  /** What it counts. */
  label: ReactNode;
  /** The label in Persian, shown under the English one. */
  labelFa?: ReactNode;
  /** `navy` (navy figure on the page), `orange` (orange figure), `inverse` (on a KMS blue panel) or `tile` (inside a tinted card). */
  variant?: "navy" | "orange" | "inverse" | "tile";
  align?: "start" | "center";
}

/** A headline figure with the Horizon under it: years of service, ports, vessels handled. */
export const BrandStat = forwardRef<HTMLDivElement, BrandStatProps>(function BrandStat({ value, label, labelFa, variant = "navy", align = "start", className, ...props }, ref) {
  const inverse = variant === "inverse";
  return (
    <div
      ref={ref}
      className={cn(
        "nv-brand-stat flex flex-col gap-2",
        align === "center" ? "items-center text-center" : "items-start text-start",
        inverse && "rounded-lg bg-neutral-solid p-5 text-neutral-on-solid",
        variant === "tile" && "rounded-lg border border-primary-border bg-primary-subtle p-5",
        className,
      )}
      {...props}
    >
      <span className={cn("font-display text-4xl font-extrabold leading-none tracking-tight", variant === "orange" ? "text-[light-dark(#b34700,#fc7d40)]" : inverse ? "text-white" : "text-secondary-text")}>{value}</span>
      <HorizonDivider length="2.5rem" align={align} />
      <span className={cn("text-sm font-medium", inverse ? "text-white/80" : "text-foreground-secondary")}>{label}</span>
      {labelFa ? (
        <span lang="fa" dir="rtl" className={cn("text-sm font-bold", inverse ? "text-[#ffd0b0]" : "text-foreground")}>
          {labelFa}
        </span>
      ) : null}
    </div>
  );
});

/* ------------------------------------------------------ BilingualHeading */

const headingSize = {
  sm: { en: "text-xl", fa: "text-base" },
  md: { en: "text-3xl", fa: "text-xl" },
  lg: { en: "text-5xl", fa: "text-3xl" },
} as const;

export interface BilingualHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The English headline. */
  title: ReactNode;
  /** The Persian headline, set right to left under (or, in `split`, beside) the English one. */
  titleFa?: ReactNode;
  /** A small label above, e.g. "Port services". */
  eyebrow?: ReactNode;
  /** Heading level for the English title. Defaults to 2. */
  level?: 1 | 2 | 3 | 4;
  size?: keyof typeof headingSize;
  /** `stacked` (Persian under English), `split` (English start, Persian end) or `centered`. */
  variant?: "stacked" | "split" | "centered";
  /** Draw the Horizon under the heading. Defaults to true. */
  divider?: boolean;
}

/** A section heading in English and Persian with the brand's Horizon rule. */
export const BilingualHeading = forwardRef<HTMLDivElement, BilingualHeadingProps>(function BilingualHeading(
  { title, titleFa, eyebrow, level = 2, size = "md", variant = "stacked", divider = true, className, ...props },
  ref,
) {
  const H = `h${level}` as const;
  const sz = headingSize[size];
  const centered = variant === "centered";
  const fa = titleFa ? (
    <p lang="fa" dir="rtl" className={cn("font-black leading-snug text-secondary-text", sz.fa, variant !== "split" && "w-fit")}>
      {titleFa}
    </p>
  ) : null;
  return (
    <div ref={ref} className={cn("nv-bilingual-heading flex flex-col gap-2", centered && "items-center text-center", className)} {...props}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[light-dark(#b34700,#fc7d40)]">{eyebrow}</p> : null}
      {variant === "split" ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <H className={cn("font-display font-bold leading-tight tracking-tight", sz.en)}>{title}</H>
          {fa}
        </div>
      ) : (
        <>
          <H className={cn("font-display font-bold leading-tight tracking-tight", sz.en)}>{title}</H>
          {fa}
        </>
      )}
      {divider ? <HorizonDivider length={variant === "split" ? "100%" : "4rem"} variant={variant === "split" ? "fade" : "solid"} align={centered ? "center" : "start"} className="mt-1" /> : null}
    </div>
  );
});

/* ----------------------------------------------------------- KavehHeader */

export interface KavehHeaderProps extends HTMLAttributes<HTMLElement> {
  /**
   * `light`: white surface with a hairline border.
   * `navy`: Deep Harbour navy with a soft light from the top corner.
   * `glass`: frosted navy, for headers that float over imagery.
   * `transparent`: no surface, a faint scrim keeps text readable over hero photos.
   */
  variant?: "navy" | "light" | "glass" | "transparent";
  /** Replaces the default logo. */
  logo?: ReactNode;
  /**
   * Navigation links, set in a pill track. Mark the current page with
   * `aria-current="page"` to give it the raised active pill.
   */
  nav?: ReactNode;
  /** Actions at the end, e.g. a language switch and a call to action. */
  actions?: ReactNode;
  /** Draw the signature orange Horizon along the bottom edge. Defaults to true. */
  horizon?: boolean;
  /** Keep the header sticky at the top of its scroll container. */
  sticky?: boolean;
}

// Nav links: pill shaped, with a clear hover, keyboard focus and current-page state.
const headerLink =
  "[&_nav_a]:inline-flex [&_nav_a]:h-8 [&_nav_a]:items-center [&_nav_a]:rounded-full [&_nav_a]:px-3.5 [&_nav_a]:outline-none [&_nav_a]:transition-[color,background-color,box-shadow] [&_nav_a]:duration-(--nv-duration-fast) " +
  "[&_nav_a:focus-visible]:ring-2 [&_nav_a:focus-visible]:ring-[#fc7d40]";

const headerVariants = {
  light: [
    "border border-border bg-surface text-foreground shadow-[0_1px_2px_rgb(11_31_63/0.04),0_8px_24px_-12px_rgb(11_31_63/0.12)]",
    "[&_nav]:bg-surface-hover/70 [&_nav]:ring-1 [&_nav]:ring-border/60",
    "[&_nav_a]:text-foreground-secondary [&_nav_a:hover]:text-foreground [&_nav_a:hover]:bg-surface",
    "[&_nav_a[aria-current=page]]:bg-surface [&_nav_a[aria-current=page]]:text-foreground [&_nav_a[aria-current=page]]:shadow-[0_1px_2px_rgb(11_31_63/0.1),0_0_0_1px_rgb(11_31_63/0.06)]",
  ],
  navy: [
    "bg-[#0b1f3f] bg-[radial-gradient(120%_180%_at_0%_0%,rgb(22_74_150/0.9)_0%,transparent_55%)] text-white",
    "shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_12px_32px_-16px_rgb(11_31_63/0.6)]",
  ],
  glass: [
    "border border-white/12 bg-[rgb(11_31_63/0.55)] text-white backdrop-blur-xl backdrop-saturate-150",
    "shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_16px_40px_-20px_rgb(0_0_0/0.5)]",
  ],
  transparent: ["bg-[linear-gradient(180deg,rgb(8_20_48/0.45),transparent)] text-white"],
} as const;

// Shared by the three dark variants: a translucent track, white links, and
// ghost, outline and glass buttons switched to white so they stay legible.
const headerOnDark = [
  "[&_nav]:bg-white/8 [&_nav]:ring-1 [&_nav]:ring-white/10",
  "[&_nav_a]:text-white/75 [&_nav_a:hover]:text-white [&_nav_a:hover]:bg-white/10",
  "[&_nav_a[aria-current=page]]:bg-white/15 [&_nav_a[aria-current=page]]:text-white [&_nav_a[aria-current=page]]:shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
  "[&_[data-slot=button]:is([data-variant=ghost],[data-variant=outline],[data-variant=glass])]:border-white/20 [&_[data-slot=button]:is([data-variant=ghost],[data-variant=outline],[data-variant=glass])]:bg-white/8 [&_[data-slot=button]:is([data-variant=ghost],[data-variant=outline],[data-variant=glass])]:text-white [&_[data-slot=button]:is([data-variant=ghost],[data-variant=outline],[data-variant=glass])]:shadow-none",
  "[&_[data-slot=button]:is([data-variant=ghost],[data-variant=outline],[data-variant=glass]):hover]:bg-white/15",
];

/** An app or site header in the Kaveh style: logo, centered pill navigation, actions, and the signature orange Horizon. */
export const KavehHeader = forwardRef<HTMLElement, KavehHeaderProps>(function KavehHeader(
  { variant = "light", logo, nav, actions, horizon = true, sticky = false, className, children, ...props },
  ref,
) {
  const dark = variant !== "light";

  return (
    <header
      ref={ref}
      data-variant={variant}
      className={cn(
        // From md up, three columns keep the navigation centered on the header, whatever the logo and actions
        // measure. Below md the navigation hides and the logo and actions sit at either end.
        "nv-kaveh-header relative flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]",
        sticky && "sticky top-0 z-(--nv-z-sticky)",
        headerLink,
        headerVariants[variant],
        dark && headerOnDark,
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center justify-self-start">
        {logo ?? <KavehLogo size={30} tagline={false} tone={dark ? "reversed" : "auto"} />}
      </div>

      {nav ? (
        <nav className="hidden items-center gap-0.5 rounded-full p-1 text-sm font-semibold md:flex">{nav}</nav>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2 justify-self-end">
        {actions}
        {children}
      </div>

      {horizon && variant !== "transparent" ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[12%] -bottom-px h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${k.orange} 25%, ${k.flare} 50%, ${k.orange} 75%, transparent)`,
            boxShadow: dark ? `0 0 10px ${k.orange}80` : undefined,
          }}
        />
      ) : null}
    </header>
  );
});
