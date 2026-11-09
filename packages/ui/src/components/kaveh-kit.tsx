"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronDown, Info, Mail, MapPin, Phone, Sparkles, X } from "lucide-react";
import { forwardRef, useMemo, useState, type AnchorHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { HorizonDivider, KavehEmblem, KavehLogo, KavehMark, kavehBrandColors as k, PortholeFrame, Tideband } from "./brand.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, MenuShortcut } from "./menu.tsx";
import { focusRing } from "./shared.ts";
import { DataTable, type DataTableColumn } from "./table.tsx";

/*
 * The Kaveh kit: everyday product components dressed in the Kaveh brand. They
 * build on Nova UI's own primitives and theme tokens, so they follow the
 * `kaveh` presets (navy base, orange actions) and keep their accessibility.
 * "navy" variants use KMS blue directly, so they stay on brand even inside
 * another theme; the light variants are the defaults for app chrome.
 */

/** "navy" surfaces use KMS blue: on brand, lighter than Deep Harbour. Text on it is white, white/75+ or peach #ffd0b0 (Flare orange is only 3.6:1 there). */
const NAVY = "bg-[#295097] text-white";
const depth = "radial-gradient(110% 90% at 100% 0%, rgb(143 166 220 / 0.35), transparent 62%)";
/** Persian set right to left, never letter-spaced. */
const Fa = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span lang="fa" dir="rtl" className={cn("block w-fit max-w-full font-bold tracking-normal normal-case", className)}>
    {children}
  </span>
);

/* =================================================================== Cards */

/**
 * - `horizon`: white card with the orange Horizon along its top edge. The default.
 * - `navy`: a KMS blue header band carrying the title.
 * - `band`: the periwinkle Tideband as the header.
 * - `elevated`: shadow and lift, the Horizon grows in on hover.
 * - `outline`: border only, for cards on tinted panels.
 */
export type KavehCardVariant = "horizon" | "navy" | "band" | "elevated" | "outline";

export interface KavehCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  variant?: KavehCardVariant;
  title?: ReactNode;
  /** Persian title, under the English one. */
  titleFa?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Media above the header, e.g. an image. */
  media?: ReactNode;
  /** An element at the header's end, e.g. a badge or menu. */
  headerEnd?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

/** A content card in the Kaveh style, with bilingual title and the brand's Horizon. */
export const KavehCard = forwardRef<HTMLElement, KavehCardProps>(function KavehCard(
  { variant = "horizon", title, titleFa, eyebrow, description, media, headerEnd, actions, footer, className, children, ...props },
  ref,
) {
  const navy = variant === "navy";
  const header =
    title || eyebrow || headerEnd ? (
      variant === "band" ? (
        <Tideband end={headerEnd} className="-mx-px">
          {title}
        </Tideband>
      ) : (
        <header className={cn("flex items-start justify-between gap-3", navy ? cn(NAVY, "px-5 py-4") : "px-5 pt-5")}>
          <div className="min-w-0">
            {eyebrow ? <p className={cn("mb-1 text-xs font-semibold uppercase tracking-[0.18em]", navy ? "text-[#ffd0b0]" : "text-[light-dark(#b34700,#fc7d40)]")}>{eyebrow}</p> : null}
            {title ? <h3 className="font-display text-lg font-bold leading-snug">{title}</h3> : null}
            {titleFa ? <Fa className={cn("text-sm", navy ? "text-[#ffd0b0]" : "text-secondary-text")}>{titleFa}</Fa> : null}
          </div>
          {headerEnd ? <div className="shrink-0">{headerEnd}</div> : null}
        </header>
      )
    ) : null;
  return (
    <article
      ref={ref}
      className={cn(
        "nv-kaveh-card group/kc relative flex flex-col overflow-hidden rounded-lg text-foreground",
        variant === "outline" ? "border border-border-strong bg-transparent" : "border border-border bg-surface",
        variant === "elevated" && "shadow-md transition-[translate,box-shadow] duration-(--nv-duration-normal) hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    >
      {variant === "horizon" ? <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: k.orange }} /> : null}
      {variant === "elevated" ? <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-(--nv-duration-slow) group-hover/kc:scale-x-100 rtl:origin-right motion-reduce:scale-x-100" style={{ background: k.orange }} /> : null}
      {media ? <div className="overflow-hidden [&_img]:w-full [&_img]:object-cover">{media}</div> : null}
      {header}
      {variant === "band" && titleFa ? <Fa className="px-5 pt-2 text-sm text-secondary-text">{titleFa}</Fa> : null}
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-3">
        {description ? <p className="text-sm text-foreground-secondary">{description}</p> : null}
        {children}
        {actions ? <div className="mt-auto flex flex-wrap gap-2 pt-1">{actions}</div> : null}
      </div>
      {footer ? <footer className="border-t border-border bg-surface-sunken/60 px-5 py-3 text-xs text-foreground-secondary">{footer}</footer> : null}
    </article>
  );
});

/* ------------------------------------------------------- KavehServiceCard */

export interface KavehServiceCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** `light` (white, orange icon well), `navy` (KMS blue) or `tinted` (navy mist). */
  variant?: "light" | "navy" | "tinted";
  icon: ReactNode;
  title: ReactNode;
  titleFa?: ReactNode;
  description?: ReactNode;
  /** Makes the whole card a link. */
  href?: string;
  /** Link text shown at the bottom. Defaults to "Learn more". */
  linkLabel?: ReactNode;
}

/** A service tile: icon, bilingual title, one line of description and a link. For service grids on the website. */
export const KavehServiceCard = forwardRef<HTMLElement, KavehServiceCardProps>(function KavehServiceCard(
  { variant = "light", icon, title, titleFa, description, href, linkLabel = "Learn more", className, ...props },
  ref,
) {
  const navy = variant === "navy";
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          "grid size-12 place-items-center rounded-lg [&_svg]:size-6",
          navy ? "bg-[#f37537] text-[#0b1f3f]" : variant === "tinted" ? "bg-surface text-[light-dark(#b34700,#fc7d40)]" : "bg-[light-dark(#ffefe3,#3a2112)] text-[light-dark(#bc4b00,#fc7d40)]",
        )}
      >
        {icon}
      </span>
      <div>
        <h3 className="font-display text-base font-bold">{title}</h3>
        {titleFa ? <Fa className={cn("text-sm", navy ? "text-[#ffd0b0]" : "text-secondary-text")}>{titleFa}</Fa> : null}
      </div>
      {description ? <p className={cn("text-sm", navy ? "text-white/75" : "text-foreground-secondary")}>{description}</p> : null}
      {href ? (
        <span className={cn("mt-auto inline-flex items-center gap-1 text-sm font-semibold", navy ? "text-[#ffd0b0]" : "text-secondary-text")}>
          {linkLabel}
          <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </span>
      ) : null}
    </>
  );
  const classes = cn(
    "nv-kaveh-service flex h-full flex-col gap-3 rounded-lg p-5 transition-[translate,box-shadow] duration-(--nv-duration-normal)",
    navy ? NAVY : variant === "tinted" ? "bg-primary-subtle text-foreground" : "border border-border bg-surface text-foreground shadow-xs",
    href && "hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0",
  );
  return (
    <article ref={ref} className={cn("relative", className)} {...props}>
      {href ? (
        <a href={href} className={cn(classes, focusRing, "no-underline")}>
          {body}
        </a>
      ) : (
        <div className={classes}>{body}</div>
      )}
    </article>
  );
});

/* ---------------------------------------------------------- KavehPortCard */

export type PortStatus = "open" | "limited" | "closed";
const portStatus: Record<PortStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-success-subtle text-success-on-subtle" },
  limited: { label: "Limited", className: "bg-warning-subtle text-warning-on-subtle" },
  closed: { label: "Closed", className: "bg-danger-subtle text-danger-on-subtle" },
};

export interface KavehPortCardProps extends HTMLAttributes<HTMLElement> {
  /** `vertical` (photo on top) or `horizontal` (porthole photo beside the facts). */
  layout?: "vertical" | "horizontal";
  name: ReactNode;
  nameFa?: ReactNode;
  /** Port photo. */
  image?: string;
  imageAlt?: string;
  status?: PortStatus;
  statusLabel?: ReactNode;
  /** Key facts, e.g. berths, max draft, cranes. */
  facts?: { label: ReactNode; value: ReactNode }[];
  actions?: ReactNode;
}

/** A port at a glance: photo, bilingual name, operating status and key facts. */
export const KavehPortCard = forwardRef<HTMLElement, KavehPortCardProps>(function KavehPortCard(
  { layout = "vertical", name, nameFa, image, imageAlt = "", status, statusLabel, facts, actions, className, ...props },
  ref,
) {
  const horizontal = layout === "horizontal";
  const s = status ? portStatus[status] : null;
  return (
    <article ref={ref} className={cn("nv-kaveh-port flex overflow-hidden rounded-lg border border-border bg-surface text-foreground shadow-xs", horizontal ? "flex-row items-center gap-4 p-4" : "flex-col", className)} {...props}>
      {image ? (
        horizontal ? (
          <PortholeFrame src={image} alt={imageAlt} size={88} variant="double" className="shrink-0" />
        ) : (
          <div className="relative h-36 overflow-hidden">
            <img src={image} alt={imageAlt} className="size-full object-cover" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: k.orange }} />
          </div>
        )
      ) : null}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-3", !horizontal && "p-4")}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold">{name}</h3>
            {nameFa ? <Fa className="text-sm text-secondary-text">{nameFa}</Fa> : null}
          </div>
          {s ? <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", s.className)}>{statusLabel ?? s.label}</span> : null}
        </header>
        {facts?.length ? (
          <dl className="grid grid-cols-3 gap-2">
            {facts.map((f, i) => (
              <div key={i} className="min-w-0 border-s-2 border-[#f37537] ps-2">
                <dt className="truncate text-[11px] text-foreground-muted">{f.label}</dt>
                <dd className="truncate font-display text-sm font-bold text-secondary-text">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </article>
  );
});

/* ------------------------------------------------------- KavehContactCard */

export interface KavehContactCardProps extends Omit<HTMLAttributes<HTMLElement>, "role"> {
  /** `row` (avatar beside details) or `stacked` (centered, for team grids). */
  layout?: "row" | "stacked";
  name: ReactNode;
  role?: ReactNode;
  roleFa?: ReactNode;
  avatar?: string;
  phone?: string;
  email?: string;
  location?: ReactNode;
}

/** A person to contact: porthole portrait, bilingual role and direct phone, email and office. */
export const KavehContactCard = forwardRef<HTMLElement, KavehContactCardProps>(function KavehContactCard(
  { layout = "row", name, role, roleFa, avatar, phone, email, location, className, ...props },
  ref,
) {
  const stacked = layout === "stacked";
  const initials = typeof name === "string" ? name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("") : "";
  return (
    // min-w-0 here and on the email row let a long address truncate instead of widening the card in a grid or flex parent.
    <article ref={ref} className={cn("nv-kaveh-contact flex min-w-0 gap-4 rounded-lg border border-border bg-surface p-4 text-foreground", stacked ? "flex-col items-center text-center" : "items-start", className)} {...props}>
      {avatar ? (
        <PortholeFrame src={avatar} alt="" size={stacked ? 96 : 64} variant={stacked ? "navy" : "thin"} />
      ) : (
        <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full font-display font-bold", NAVY, stacked ? "size-24 text-2xl" : "size-16 text-lg")} style={{ boxShadow: `0 0 0 3px ${k.orange}` }}>
          {initials}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-display text-base font-bold">{name}</h3>
        {role ? <p className="text-sm text-[light-dark(#b34700,#fc7d40)]">{role}</p> : null}
        {roleFa ? <Fa className="text-sm text-secondary-text">{roleFa}</Fa> : null}
        <ul className={cn("mt-2 flex flex-col gap-1.5 text-sm text-foreground-secondary", stacked && "items-center")}>
          {phone ? (
            <li className="flex items-center gap-2">
              <Phone aria-hidden className="size-4 text-secondary-text" />
              <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} dir="ltr" className={cn("rounded-xs hover:underline", focusRing)}>
                {phone}
              </a>
            </li>
          ) : null}
          {email ? (
            <li className="flex min-w-0 items-center gap-2">
              <Mail aria-hidden className="size-4 shrink-0 text-secondary-text" />
              <a href={`mailto:${email}`} className={cn("truncate rounded-xs hover:underline", focusRing)}>
                {email}
              </a>
            </li>
          ) : null}
          {location ? (
            <li className="flex items-center gap-2">
              <MapPin aria-hidden className="size-4 text-secondary-text" />
              <span>{location}</span>
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  );
});

/* ----------------------------------------------------------- KavehKpiCard */

export interface KavehKpiCardProps extends HTMLAttributes<HTMLElement> {
  /** `light` (white with an orange edge), `navy` (KMS blue) or `tinted`. */
  variant?: "light" | "navy" | "tinted";
  label: ReactNode;
  labelFa?: ReactNode;
  value: ReactNode;
  /** Change versus the previous period, in percent. Positive is shown up, negative down. */
  delta?: number;
  /** What the delta compares with, e.g. "vs last month". */
  deltaLabel?: ReactNode;
  /** Set when a fall is good news (e.g. waiting time), so it shows as positive. */
  invertDelta?: boolean;
  icon?: ReactNode;
}

/** A dashboard metric: label, figure and change, with the Kaveh edge. */
export const KavehKpiCard = forwardRef<HTMLElement, KavehKpiCardProps>(function KavehKpiCard(
  { variant = "light", label, labelFa, value, delta, deltaLabel, invertDelta = false, icon, className, ...props },
  ref,
) {
  const navy = variant === "navy";
  const good = delta === undefined ? null : invertDelta ? delta <= 0 : delta >= 0;
  const Arrow = delta !== undefined && delta < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <article
      ref={ref}
      className={cn(
        "nv-kaveh-kpi flex flex-col gap-2 rounded-lg p-4",
        navy ? NAVY : variant === "tinted" ? "bg-primary-subtle text-foreground" : "border border-border border-s-[3px] border-s-[#f37537] bg-surface text-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-sm font-medium", navy ? "text-white/75" : "text-foreground-secondary")}>{label}</p>
          {labelFa ? <Fa className={cn("text-xs", navy ? "text-[#ffd0b0]" : "text-secondary-text")}>{labelFa}</Fa> : null}
        </div>
        {icon ? <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-md [&_svg]:size-5", navy ? "bg-white/10 text-[#ffd0b0]" : "bg-[light-dark(#ffefe3,#3a2112)] text-[light-dark(#bc4b00,#fc7d40)]")}>{icon}</span> : null}
      </div>
      <p className={cn("whitespace-nowrap font-display text-3xl font-extrabold leading-none tracking-tight tabular-nums", navy ? "text-white" : "text-secondary-text")}>{value}</p>
      {delta !== undefined ? (
        <p className="flex items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", good ? "bg-success-subtle text-success-on-subtle" : "bg-danger-subtle text-danger-on-subtle")}>
            <Arrow aria-hidden className="size-3.5" />
            {Math.abs(delta)}%<span className="sr-only">{delta >= 0 ? " up" : " down"}</span>
          </span>
          {deltaLabel ? <span className={navy ? "text-white/75" : "text-foreground-muted"}>{deltaLabel}</span> : null}
        </p>
      ) : null}
    </article>
  );
});

/* ========================================================== Page sections */

export interface KavehHeroProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * - `navy`: KMS blue with a soft mist glow. The default.
   * - `sunset`: KMS blue warming into the harbour-sunset orange.
   * - `light`: white with a navy headline, for inner pages.
   * - `split`: text on a light half, art on a navy half.
   */
  variant?: "navy" | "sunset" | "light" | "split";
  eyebrow?: ReactNode;
  title: ReactNode;
  titleFa?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Art at the inline end. Defaults to the KMS emblem. Pass `null` for none. */
  art?: ReactNode | null;
}

/** A page hero in the Kaveh style: eyebrow, bilingual headline, Horizon, copy, actions and art. */
export const KavehHero = forwardRef<HTMLElement, KavehHeroProps>(function KavehHero(
  { variant = "navy", eyebrow, title, titleFa, description, actions, art, className, style, ...props },
  ref,
) {
  const dark = variant === "navy" || variant === "sunset";
  const background: CSSProperties =
    variant === "navy"
      ? { backgroundColor: k.navy, backgroundImage: depth }
      : variant === "sunset"
        ? { backgroundImage: `linear-gradient(160deg, ${k.navy} 0%, #2a63b8 55%, ${k.orange} 150%)` }
        : {};
  const defaultArt = <KavehEmblem size={180} tone={dark || variant === "split" ? "reversed" : "brand"} title="" />;
  const artNode = art === null ? null : (art ?? defaultArt);
  return (
    <section
      ref={ref}
      className={cn(
        "nv-kaveh-hero relative grid overflow-hidden rounded-xl",
        dark ? "text-white" : "bg-surface text-foreground",
        variant === "light" && "border border-border",
        artNode ? "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : "",
        className,
      )}
      style={{ ...background, ...style }}
      {...props}
    >
      <div className="relative flex flex-col items-start gap-4 p-8 md:p-12">
        {eyebrow ? <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", dark ? "text-[#ffd0b0]" : "text-[light-dark(#b34700,#fc7d40)]")}>{eyebrow}</p> : null}
        <h2 className={cn("font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl", !dark && "text-secondary-text")}>{title}</h2>
        {titleFa ? <Fa className={cn("text-2xl font-black", dark ? "text-white/90" : "text-foreground")}>{titleFa}</Fa> : null}
        <HorizonDivider length="5rem" />
        {description ? <p className={cn("max-w-xl text-base", dark ? "text-white/75" : "text-foreground-secondary")}>{description}</p> : null}
        {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
      </div>
      {artNode ? (
        <div className={cn("relative hidden items-center justify-center p-8 md:flex", variant === "split" && NAVY)} style={variant === "split" ? { backgroundImage: depth } : undefined}>
          {artNode}
        </div>
      ) : null}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: k.orange }} />
    </section>
  );
});

/* -------------------------------------------------------- KavehPageHeader */

export interface KavehPageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** `plain` (on the page), `band` (Tideband eyebrow) or `navy` (a KMS blue bar). */
  variant?: "plain" | "band" | "navy";
  title: ReactNode;
  titleFa?: ReactNode;
  /** Breadcrumbs or a back link above the title. */
  breadcrumbs?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Tabs or filters under the header. */
  tabs?: ReactNode;
  /** The title's heading level. Defaults to 1, since this is usually the page title; lower it when the header sits inside a page that already has an `h1`. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

/** An app page's title area: breadcrumbs, bilingual title, actions and tabs. */
export const KavehPageHeader = forwardRef<HTMLElement, KavehPageHeaderProps>(function KavehPageHeader(
  { variant = "plain", title, titleFa, breadcrumbs, eyebrow, description, actions, tabs, headingLevel = 1, className, ...props },
  ref,
) {
  const navy = variant === "navy";
  const Title = `h${headingLevel}` as const;
  return (
    <header ref={ref} className={cn("nv-kaveh-page-header flex flex-col gap-4", navy && cn(NAVY, "rounded-lg px-6 pt-5"), !tabs && navy && "pb-5", className)} {...props}>
      {breadcrumbs ? <div className={cn("text-sm", navy && "text-white/75 [&_a]:text-white/75")}>{breadcrumbs}</div> : null}
      {variant === "band" && eyebrow ? <Tideband size="sm" className="w-fit min-w-64">{eyebrow}</Tideband> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && variant !== "band" ? <p className={cn("mb-1 text-xs font-semibold uppercase tracking-[0.2em]", navy ? "text-[#ffd0b0]" : "text-[light-dark(#b34700,#fc7d40)]")}>{eyebrow}</p> : null}
          <Title className={cn("font-display text-3xl font-bold leading-tight tracking-tight", !navy && "text-foreground")}>{title}</Title>
          {titleFa ? <Fa className={cn("text-lg", navy ? "text-[#ffd0b0]" : "text-secondary-text")}>{titleFa}</Fa> : null}
          {description ? <p className={cn("mt-2 max-w-2xl text-sm", navy ? "text-white/75" : "text-foreground-secondary")}>{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {!navy ? <HorizonDivider variant="fade" /> : null}
      {tabs ? <div className={cn(navy && "-mb-px")}>{tabs}</div> : null}
    </header>
  );
});

/* ------------------------------------------------------------ KavehFooter */

export interface KavehFooterProps extends HTMLAttributes<HTMLElement> {
  /** `navy` (KMS blue, the default) or `light`. */
  variant?: "navy" | "light";
  columns?: { title: ReactNode; links: { label: ReactNode; href: string }[] }[];
  /** Address, phone and email, shown beside the logo. */
  contact?: ReactNode;
  /** The bottom line, e.g. copyright. */
  legal?: ReactNode;
  /** Replaces the default heritage logo. */
  logo?: ReactNode;
}

/** A site footer: the heritage logo, link columns, contact and the legal line, with the Horizon on top. */
export const KavehFooter = forwardRef<HTMLElement, KavehFooterProps>(function KavehFooter({ variant = "navy", columns, contact, legal, logo, className, ...props }, ref) {
  const navy = variant === "navy";
  return (
    <footer ref={ref} className={cn("nv-kaveh-footer relative overflow-hidden rounded-lg", navy ? NAVY : "border border-border bg-surface text-foreground", className)} {...props}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: k.orange }} />
      <div className="grid gap-8 px-6 pb-6 pt-8 md:grid-cols-[minmax(0,1.6fr)_repeat(auto-fit,minmax(9rem,1fr))]">
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">{logo ?? <KavehLogo layout="heritage" size={22} tone={navy ? "reversed" : "auto"} />}</div>
          {contact ? <div className={cn("text-sm leading-relaxed", navy ? "text-white/75" : "text-foreground-secondary")}>{contact}</div> : null}
        </div>
        {columns?.map((col, i) => (
          <nav key={i} aria-label={typeof col.title === "string" ? col.title : undefined} className="flex flex-col gap-2 text-sm">
            <p className={cn("mb-1 font-display text-xs font-semibold uppercase tracking-[0.18em]", navy ? "text-[#ffd0b0]" : "text-[light-dark(#b34700,#fc7d40)]")}>{col.title}</p>
            {col.links.map((l, j) => (
              <a key={j} href={l.href} className={cn("w-fit rounded-xs hover:underline", navy ? "text-white/80 hover:text-white" : "text-foreground-secondary hover:text-foreground", focusRing)}>
                {l.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      {legal ? <div className={cn("border-t px-6 py-4 text-xs", navy ? "border-white/10 text-white/75" : "border-border text-foreground-muted")}>{legal}</div> : null}
    </footer>
  );
});

/* ---------------------------------------------------------- KavehTimeline */

export interface KavehTimelineItem {
  /** Year as shown, e.g. 1948. */
  year: ReactNode;
  /** The solar-calendar year, e.g. ۱۳۲۷. */
  yearFa?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}

export interface KavehTimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: KavehTimelineItem[];
  /** `vertical` (default) or `horizontal` (scrolls on small screens). */
  orientation?: "vertical" | "horizontal";
  /** Highlight this item (index) as the current milestone. */
  current?: number;
}

/** Company milestones on a dashed Horizon, with Gregorian and solar years. */
export const KavehTimeline = forwardRef<HTMLOListElement, KavehTimelineProps>(function KavehTimeline({ items, orientation = "vertical", current, className, ...props }, ref) {
  const horizontal = orientation === "horizontal";
  return (
    <ol
      ref={ref}
      // A horizontal timeline scrolls sideways: it must be focusable so keyboard users can scroll it (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable so keyboard users can scroll it
      tabIndex={horizontal ? 0 : undefined}
      className={cn("nv-kaveh-timeline", horizontal ? cn("flex gap-6 overflow-x-auto pb-2 rounded-sm", focusRing) : "flex flex-col", className)}
      {...props}
    >
      {items.map((item, i) => {
        const active = i === current;
        const dot = (
          <span
            aria-hidden
            className={cn("relative z-10 block size-4 shrink-0 rounded-full border-[3px]", active ? "border-[#f37537] bg-[#f37537]" : "border-[#f37537] bg-surface")}
            style={active ? { boxShadow: `0 0 0 4px color-mix(in srgb, ${k.orange} 25%, transparent)` } : undefined}
          />
        );
        return (
          <li key={i} aria-current={active ? "step" : undefined} className={cn("relative", horizontal ? "flex min-w-48 flex-col gap-3" : "flex gap-4 pb-6 last:pb-0")}>
            {horizontal ? (
              <div className="flex items-center">
                {dot}
                {i < items.length - 1 ? <span aria-hidden className="ms-1 h-0.5 flex-1" style={{ background: `repeating-linear-gradient(90deg, ${k.orange} 0 8px, transparent 8px 14px)` }} /> : null}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {dot}
                {i < items.length - 1 ? <span aria-hidden className="mt-1 w-0.5 flex-1" style={{ background: `repeating-linear-gradient(180deg, ${k.orange} 0 8px, transparent 8px 14px)` }} /> : null}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-xl font-extrabold text-secondary-text">{item.year}</span>
                {item.yearFa ? (
                  <span lang="fa" dir="rtl" className="text-sm font-bold text-[light-dark(#b34700,#fc7d40)]">
                    {item.yearFa}
                  </span>
                ) : null}
              </p>
              <p className="font-display text-sm font-bold text-foreground">{item.title}</p>
              {item.description ? <p className="text-sm text-foreground-secondary">{item.description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
});

/* ============================================================= Navigation */

export interface KavehNavItem {
  id: string;
  label: ReactNode;
  /** Persian label, shown under the English one in the sidebar. */
  labelFa?: ReactNode;
  icon?: ReactNode;
  href?: string;
  /** A count or badge at the end of the item. */
  badge?: ReactNode;
  disabled?: boolean;
}

export interface KavehSidebarProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  /** `light` (the default) or `navy` (KMS blue). */
  variant?: "navy" | "light";
  sections: { title?: ReactNode; items: KavehNavItem[] }[];
  /** The id of the current page. */
  activeId?: string;
  /** Called with the item's id when an item without `href` is chosen. */
  onNavigate?: (id: string) => void;
  /** Icons only. Labels stay available to screen readers and as tooltips. */
  collapsed?: boolean;
  /** Replaces the default logo at the top. */
  logo?: ReactNode;
  /** Content pinned to the bottom, e.g. the signed-in user. */
  footer?: ReactNode;
  /** Accessible name for the navigation. Defaults to "Main". */
  label?: string;
}

/** An app sidebar in the Kaveh style: logo, grouped navigation with an orange active marker, and a footer. */
export const KavehSidebar = forwardRef<HTMLElement, KavehSidebarProps>(function KavehSidebar(
  { variant = "light", sections, activeId, onNavigate, collapsed = false, logo, footer, label = "Main", className, style, ...props },
  ref,
) {
  const navy = variant === "navy";
  return (
    <aside
      ref={ref}
      className={cn(
        "nv-kaveh-sidebar relative flex h-full flex-col gap-4 py-4 transition-[width] duration-(--nv-duration-normal)",
        collapsed ? "w-[4.5rem] px-2" : "w-64 px-3",
        navy ? NAVY : "border-e border-border bg-surface text-foreground",
        className,
      )}
      style={style}
      {...props}
    >
      <div className={cn("flex items-center px-2", collapsed && "justify-center px-0")}>
        {logo ?? (collapsed ? <KavehMark size={26} tone={navy ? "reversed" : "auto"} variant="solid" /> : <KavehLogo size={28} tagline={false} tone={navy ? "reversed" : "auto"} />)}
      </div>
      <span aria-hidden className={cn("mx-2 h-[3px] rounded-full", collapsed ? "w-6 self-center" : "w-10")} style={{ background: k.orange }} />
      <nav aria-label={label} className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si} className="flex flex-col gap-1">
            {section.title && !collapsed ? <p className={cn("px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em]", navy ? "text-white/75" : "text-foreground-muted")}>{section.title}</p> : null}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = item.id === activeId;
                const inner = (
                  <>
                    <span aria-hidden className={cn("absolute inset-y-1.5 start-0 w-[3px] rounded-full transition-opacity", active ? "opacity-100" : "opacity-0")} style={{ background: k.orange }} />
                    {item.icon ? <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center [&_svg]:size-[18px]", active ? (navy ? "text-[#ffd0b0]" : "text-[light-dark(#b34700,#fc7d40)]") : "")}>{item.icon}</span> : null}
                    <span className={cn("flex min-w-0 flex-1 flex-col", collapsed && "sr-only")}>
                      <span className="truncate">{item.label}</span>
                      {/* On the lighter active/hover row, 75% white drops under 4.5:1; 85% keeps it. */}
                      {item.labelFa ? <Fa className={cn("truncate text-[11px] font-medium", navy ? "text-white/85" : "text-foreground-muted")}>{item.labelFa}</Fa> : null}
                    </span>
                    {item.badge && !collapsed ? <span className="shrink-0 rounded-full bg-[#f37537] px-1.5 text-[11px] font-bold text-[#0b1f3f]">{item.badge}</span> : null}
                  </>
                );
                const classes = cn(
                  "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  navy ? (active ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5 hover:text-white") : active ? "bg-primary-subtle text-primary-on-subtle" : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
                  item.disabled && "pointer-events-none opacity-50",
                  focusRing,
                );
                const tip = collapsed && typeof item.label === "string" ? item.label : undefined;
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <a href={item.href} aria-current={active ? "page" : undefined} aria-disabled={item.disabled || undefined} title={tip} className={classes}>
                        {inner}
                      </a>
                    ) : (
                      <button type="button" aria-current={active ? "page" : undefined} disabled={item.disabled} title={tip} onClick={() => onNavigate?.(item.id)} className={classes}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {footer ? <div className={cn("border-t pt-3", navy ? "border-white/10" : "border-border", collapsed && "flex justify-center")}>{footer}</div> : null}
    </aside>
  );
});

/* ---------------------------------------------------------- KavehNavMenu */

export interface KavehNavMenuProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  items: KavehNavItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  /** `underline` (orange Horizon under the active link), `pill` (orange pill) or `band` (navy strip). */
  variant?: "underline" | "pill" | "band";
  /** Set `dark` when the menu sits on navy. */
  surface?: "light" | "dark";
  /** Accessible name. Defaults to "Primary". */
  label?: string;
}

/** A horizontal navigation menu with the Kaveh active state. */
export const KavehNavMenu = forwardRef<HTMLElement, KavehNavMenuProps>(function KavehNavMenu(
  { items, activeId, onNavigate, variant = "underline", surface = "light", label = "Primary", className, ...props },
  ref,
) {
  const dark = surface === "dark" || variant === "band";
  return (
    <nav ref={ref} aria-label={label} className={cn("nv-kaveh-nav", variant === "band" && cn(NAVY, "rounded-lg px-2"), className)} {...props}>
      <ul className={cn("flex flex-wrap items-center", variant === "pill" ? "gap-1" : "gap-1 sm:gap-2")}>
        {items.map((item) => {
          const active = item.id === activeId;
          const classes = cn(
            "relative inline-flex items-center gap-2 text-sm font-medium transition-colors [&_svg]:size-4",
            variant === "pill" ? "rounded-full px-4 py-1.5" : "px-3 py-3",
            variant === "pill"
              ? active
                ? "bg-[#f37537] text-[#0b1f3f]"
                : dark
                  ? "text-white/80 hover:bg-white/10 hover:text-white"
                  : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              : active
                ? dark
                  ? "text-white"
                  : "text-secondary-text"
                : dark
                  ? "text-white/70 hover:text-white"
                  : "text-foreground-secondary hover:text-foreground",
            item.disabled && "pointer-events-none opacity-50",
            focusRing,
          );
          const inner = (
            <>
              {item.icon ? <span aria-hidden>{item.icon}</span> : null}
              {item.label}
              {item.badge ? <span className="rounded-full bg-[#f37537] px-1.5 text-[11px] font-bold text-[#0b1f3f]">{item.badge}</span> : null}
              {variant !== "pill" ? <span aria-hidden className={cn("absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-transform duration-(--nv-duration-normal)", active ? "scale-x-100" : "scale-x-0")} style={{ background: k.orange }} /> : null}
            </>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <a href={item.href} aria-current={active ? "page" : undefined} className={classes}>
                  {inner}
                </a>
              ) : (
                <button type="button" aria-current={active ? "page" : undefined} disabled={item.disabled} onClick={() => onNavigate?.(item.id)} className={classes}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

/* -------------------------------------------------------------- KavehMenu */

export interface KavehMenuItem {
  label: ReactNode;
  labelFa?: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Draw a separator before this item. */
  separated?: boolean;
}

export interface KavehMenuProps {
  /** The element that opens the menu. Defaults to a "Menu" button. */
  trigger?: ReactNode;
  items: KavehMenuItem[];
  /** A heading inside the menu, e.g. the signed-in user. */
  header?: ReactNode;
  /** `light` (theme surface with an orange top edge) or `navy` (KMS blue). */
  variant?: "light" | "navy";
  align?: "start" | "center" | "end";
  /** Classes for the menu panel. */
  className?: string;
}

/** A dropdown menu in the Kaveh style, built on Nova UI's DropdownMenu (keyboard, focus and typeahead included). */
export function KavehMenu({ trigger, items, header, variant = "light", align = "end", className }: KavehMenuProps) {
  const navy = variant === "navy";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <button type="button" className={cn("inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover", focusRing)}>
            Menu
            <ChevronDown aria-hidden className="size-4" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn(
          "nv-kaveh-menu relative min-w-56 overflow-hidden border-t-[3px] border-t-[#f37537]",
          navy && "border-x-white/15 border-b-white/15 bg-[#295097] text-white [&_[role=menuitem]]:text-white/85 [&_[role=menuitem][data-highlighted]]:bg-white/10 [&_[role=menuitem][data-highlighted]]:text-white",
          className,
        )}
      >
        {header ? (
          <>
            <DropdownMenuLabel className={cn("py-2", navy && "text-white")}>{header}</DropdownMenuLabel>
            <DropdownMenuSeparator className={navy ? "bg-white/10" : undefined} />
          </>
        ) : null}
        {items.map((item, i) => (
          <div key={i} className="contents">
            {item.separated && i > 0 ? <DropdownMenuSeparator className={navy ? "bg-white/10" : undefined} /> : null}
            <DropdownMenuItem destructive={item.destructive} disabled={item.disabled} onSelect={item.onSelect} className="gap-2.5">
              {item.icon ? <span aria-hidden className={cn("[&_svg]:size-4", navy ? "text-[#ffd0b0]" : "text-secondary-text")}>{item.icon}</span> : null}
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{item.label}</span>
                {item.labelFa ? <Fa className={cn("text-[11px] font-medium", navy ? "text-white/75" : "text-foreground-muted")}>{item.labelFa}</Fa> : null}
              </span>
              {item.shortcut ? <MenuShortcut>{item.shortcut}</MenuShortcut> : null}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ========================================================== Data & status */

export interface KavehTableColumn<T> {
  key: string;
  header: ReactNode;
  /** Persian header, under the English one. */
  headerFa?: ReactNode;
  align?: "start" | "center" | "end";
  /** Renders the cell. Defaults to `row[key]`. */
  render?: (row: T) => ReactNode;
  width?: string;
  /** Let people sort by this column. */
  sortable?: boolean;
  /** Value used for sorting. Defaults to `row[key]`. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Text the search box matches. Defaults to `sortValue`, then `row[key]`. Return "" to exclude. */
  filterValue?: (row: T) => string | number | null | undefined;
  /** Figures: aligned to the end with tabular digits so columns of numbers line up. */
  numeric?: boolean;
  /** Allow hiding this column from the columns menu. Defaults to true. */
  hideable?: boolean;
}

export interface KavehTableProps<T> {
  columns: KavehTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** `band` (pale navy head, the default), `navy` (KMS blue head with the orange edge) or `minimal` (orange rule under the head). */
  variant?: "navy" | "band" | "minimal";
  striped?: boolean;
  density?: "compact" | "comfortable";

  /** Heading in the table's frame. */
  title?: ReactNode;
  titleFa?: ReactNode;
  description?: ReactNode;
  /** Buttons at the end of the frame header, e.g. Export or Add. */
  actions?: ReactNode;
  /** Filters or other controls beside the search box. */
  toolbar?: ReactNode;
  /** Formats the record count next to the title. Pass `null` to hide it. */
  count?: ((total: number) => ReactNode) | null;

  /** Show a search box that filters rows across columns. */
  searchable?: boolean;
  /** Rows per page. Enables pagination. */
  pageSize?: number;
  /** Show the columns menu for hiding and showing columns. */
  columnToggle?: boolean;
  /** Row checkboxes. Selected rows get the orange marker. */
  selectable?: boolean;
  /** Controlled selection. */
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Actions for the selected rows, shown in a navy bar while anything is selected. */
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  /** Content shown under a row when it is expanded. Adds an expand toggle per row. */
  renderExpanded?: (row: T) => ReactNode;
  /** Show skeleton rows instead of data. */
  loading?: boolean;
  /** Keep the head visible while scrolling; pair with `maxHeight`. */
  stickyHeader?: boolean;
  /** Scroll the rows inside this height, e.g. "24rem". */
  maxHeight?: string;

  /** Visible caption under the table; also names it for screen readers. */
  caption?: ReactNode;
  /** Shown when `rows` is empty. Defaults to a Kaveh empty state. */
  empty?: ReactNode;
  /** Accessible and visible labels, for translation. */
  labels?: {
    search?: string;
    columns?: string;
    selected?: (n: number) => ReactNode;
    clearSelection?: string;
    noMatches?: string;
    selectAll?: string;
    loading?: string;
    range?: (from: string, to: string, total: string) => string;
  };
  className?: string;
}

const headStyle = {
  navy: cn(
    "[&_th]:bg-[#295097] [&_th]:text-white [&_th:first-child]:shadow-[inset_3px_0_0_#f37537] rtl:[&_th:first-child]:shadow-[inset_-3px_0_0_#f37537]",
    "[&_th_button]:text-white/90! [&_th_button:hover]:text-[#ffd0b0]! [&_th[aria-sort=ascending]_button]:text-[#ffd0b0]! [&_th[aria-sort=descending]_button]:text-[#ffd0b0]!",
    "[&_th_[role=checkbox]]:border-white/60",
  ),
  band: cn(
    "[&_th]:bg-[light-dark(#e3eaf8,#13305c)] [&_th]:text-[light-dark(#295097,#cfe0ff)] [&_thead_tr]:border-b-2 [&_thead_tr]:border-b-[#8fa6dc]",
    "[&_th_button]:text-inherit! [&_th[aria-sort=ascending]_svg]:text-[#f37537] [&_th[aria-sort=descending]_svg]:text-[#f37537]",
  ),
  minimal: cn(
    "[&_thead_tr]:border-b-[3px] [&_thead_tr]:border-b-[#f37537] [&_th]:bg-surface [&_th]:text-secondary-text",
    "[&_th_button]:text-inherit! [&_th[aria-sort=ascending]_svg]:text-[#f37537] [&_th[aria-sort=descending]_svg]:text-[#f37537]",
  ),
} as const;

/** The orange marker on the first cell of a hovered, focused or selected row. */
const rowMarker = cn(
  "[&_tbody_tr]:transition-colors",
  "[&_tbody_tr:hover]:bg-primary-subtle/50 [&_tbody_tr[data-state=selected]]:bg-primary-subtle",
  "[&_tbody_tr:hover>td:first-child]:shadow-[inset_3px_0_0_#f37537] [&_tbody_tr[data-state=selected]>td:first-child]:shadow-[inset_3px_0_0_#f37537] [&_tbody_tr:focus-within>td:first-child]:shadow-[inset_3px_0_0_#f37537]",
  "rtl:[&_tbody_tr:hover>td:first-child]:shadow-[inset_-3px_0_0_#f37537] rtl:[&_tbody_tr[data-state=selected]>td:first-child]:shadow-[inset_-3px_0_0_#f37537] rtl:[&_tbody_tr:focus-within>td:first-child]:shadow-[inset_-3px_0_0_#f37537]",
);

/**
 * A data table in the Kaveh style, on Nova UI's DataTable: a framed header with
 * a bilingual title, record count and actions; search, sorting, pagination,
 * column toggling and expandable rows; row selection with a navy bulk-action
 * bar; an orange marker on the row under the pointer, keyboard focus or
 * selection; and bilingual column headers.
 */
export function KavehTable<T>({
  columns,
  rows,
  rowKey,
  variant = "band",
  striped = true,
  density = "comfortable",
  title,
  titleFa,
  description,
  actions,
  toolbar,
  count = (n) => `${new Intl.NumberFormat().format(n)} ${n === 1 ? "record" : "records"}`,
  searchable,
  pageSize,
  columnToggle,
  selectable,
  selectedIds,
  onSelectionChange,
  bulkActions,
  renderExpanded,
  loading,
  stickyHeader,
  maxHeight,
  caption,
  empty,
  labels,
  className,
}: KavehTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const selected = selectedIds ?? internalSelected;
  const setSelected = (ids: string[]) => {
    if (selectedIds === undefined) setInternalSelected(ids);
    onSelectionChange?.(ids);
  };
  const clear = () => setSelected([]);
  const ids = useMemo(() => new Map(rows.map((row, i) => [row, rowKey(row, i)])), [rows, rowKey]);

  const dataColumns: DataTableColumn<T>[] = columns.map((col) => {
    const align = col.align ?? (col.numeric ? "end" : "start");
    return {
      id: col.key,
      header: (
        <span className={cn("inline-flex flex-col font-display text-xs font-semibold uppercase tracking-[0.12em]", align === "end" ? "items-end" : align === "center" ? "items-center" : "items-start")}>
          <span>{col.header}</span>
          {/* Full opacity: at 80% the 11px Persian header fell to 4.16:1 on the header tint. */}
          {col.headerFa ? <Fa className="text-[11px] font-medium">{col.headerFa}</Fa> : null}
        </span>
      ),
      menuLabel: typeof col.header === "string" ? col.header : col.key,
      cell: col.numeric ? (row) => <span className="font-medium tabular-nums">{col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}</span> : col.render,
      sortable: col.sortable,
      sortValue: col.sortValue,
      filterValue: col.filterValue,
      hideable: col.hideable,
      align,
      width: col.width,
    };
  });

  const total = rows.length;
  const hasHeader = title || titleFa || description || actions;
  const showBulk = selectable && bulkActions && selected.length > 0;

  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={cn("nv-kaveh-table flex flex-col overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-xs", className)}
      style={maxHeight ? ({ "--nv-kaveh-table-max": maxHeight } as CSSProperties) : undefined}
    >
      {hasHeader ? (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {title ? <h3 className="font-display text-lg font-bold leading-tight">{title}</h3> : null}
              {count && !loading ? <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-semibold text-primary-on-subtle tabular-nums">{count(total)}</span> : null}
            </div>
            {titleFa ? <Fa className="text-sm text-secondary-text">{titleFa}</Fa> : null}
            {description ? <p className="mt-1 text-sm text-foreground-secondary">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}

      {showBulk ? (
        <div role="region" aria-label="Bulk actions" aria-live="polite" className="mx-3 mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary-border border-s-[3px] border-s-[#f37537] bg-primary-subtle px-3 py-2 text-sm text-primary-on-subtle animate-nv-slide-down">
          <span className="rounded-full bg-[#f37537] px-2.5 py-0.5 text-xs font-bold text-[#0b1f3f] tabular-nums">{labels?.selected?.(selected.length) ?? `${selected.length} selected`}</span>
          <div className="flex flex-1 flex-wrap items-center gap-2">{bulkActions(selected, clear)}</div>
          <button type="button" onClick={clear} className={cn("rounded-md px-2 py-1 font-medium text-secondary-text hover:bg-surface", focusRing)}>
            {labels?.clearSelection ?? "Clear"}
          </button>
        </div>
      ) : null}

      <div className="p-3">
        <DataTable<T>
          data={rows}
          columns={dataColumns}
          getRowId={(row) => ids.get(row) ?? String(rows.indexOf(row))}
          density={density}
          striped={striped}
          stickyHeader={stickyHeader}
          containerClassName={cn("rounded-lg border-border", maxHeight && "max-h-(--nv-kaveh-table-max)")}
          className={cn(headStyle[variant], rowMarker, "[&_td]:align-middle [&_tbody_tr:not([id])>td]:whitespace-nowrap")}
          caption={caption}
          searchable={searchable}
          pageSize={pageSize}
          columnToggle={columnToggle}
          selectable={selectable}
          selectedIds={selectable ? selected : undefined}
          onSelectionChange={selectable ? setSelected : undefined}
          renderExpanded={renderExpanded}
          loading={loading}
          toolbar={toolbar}
          labels={{ search: labels?.search ?? "Search", columns: labels?.columns, noMatches: labels?.noMatches, selectAll: labels?.selectAll, loading: labels?.loading, range: labels?.range }}
          empty={empty ?? <KavehEmptyState variant="calm" title="Nothing here yet" description="Records will appear here as they arrive." className="py-6" />}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ KavehNotice */

export type KavehNoticeVariant = "info" | "success" | "warning" | "navy" | "campaign";

const noticeStyle: Record<KavehNoticeVariant, { box: string; icon: ReactNode }> = {
  info: { box: "border-[#a9bee3] bg-primary-subtle text-foreground", icon: <Info /> },
  success: { box: "border-success-border bg-success-subtle text-success-on-subtle", icon: <CheckCircle2 /> },
  warning: { box: "border-[#f37537] bg-[light-dark(#ffefe3,#3a2112)] text-[light-dark(#0b1f3f,#ffd1bc)]", icon: <AlertTriangle /> },
  navy: { box: cn("border-[#f37537]", NAVY), icon: <Info /> },
  campaign: { box: "border-transparent text-[#0b1f3f] bg-[linear-gradient(120deg,#ffc46b,#ff9a4d_40%,#f37537)]", icon: <Sparkles /> },
};

export interface KavehNoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** `info`, `success`, `warning` (orange), `navy` (announcement bar) or `campaign` (the harbour-sunset gradient). */
  variant?: KavehNoticeVariant;
  title?: ReactNode;
  titleFa?: ReactNode;
  /** Replaces the default icon. Pass `null` for none. */
  icon?: ReactNode | null;
  action?: ReactNode;
  /** Shows a close button. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/** A notice or announcement bar with the Kaveh edge: port updates, holiday hours, campaign offers. */
export const KavehNotice = forwardRef<HTMLDivElement, KavehNoticeProps>(function KavehNotice(
  { variant = "info", title, titleFa, icon, action, onDismiss, dismissLabel = "Dismiss", className, children, ...props },
  ref,
) {
  const s = noticeStyle[variant];
  const urgent = variant === "warning";
  return (
    <div ref={ref} role={urgent ? "alert" : "status"} className={cn("nv-kaveh-notice relative flex items-start gap-3 rounded-lg border border-s-[4px] p-4 text-sm", s.box, className)} {...props}>
      {icon === null ? null : <span aria-hidden className={cn("mt-0.5 shrink-0 [&_svg]:size-5", variant === "navy" && "text-[#ffd0b0]", variant === "info" && "text-secondary-text")}>{icon ?? s.icon}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <p className="font-display font-bold">{title}</p> : null}
        {titleFa ? <Fa className="text-sm">{titleFa}</Fa> : null}
        {children ? <div className={cn(variant === "navy" ? "text-white/80" : "opacity-90")}>{children}</div> : null}
        {action ? <div className="mt-2 flex flex-wrap gap-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label={dismissLabel} className={cn("-m-1 shrink-0 rounded-sm p-1 opacity-70 hover:opacity-100", focusRing)}>
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
});

/* -------------------------------------------------------- KavehEmptyState */

export interface KavehEmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** `default` (anchor in a porthole), `calm` (anchor on still water) or `navy` (on a KMS blue panel). */
  variant?: "default" | "calm" | "navy";
  title: ReactNode;
  titleFa?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

/** A friendly empty or "nothing here yet" state with the Kaveh anchor. */
export const KavehEmptyState = forwardRef<HTMLDivElement, KavehEmptyStateProps>(function KavehEmptyState(
  { variant = "default", title, titleFa, description, action, className, ...props },
  ref,
) {
  const navy = variant === "navy";
  return (
    <div ref={ref} className={cn("nv-kaveh-empty flex flex-col items-center gap-3 rounded-lg px-6 py-10 text-center", navy ? NAVY : "text-foreground", className)} {...props}>
      {variant === "calm" ? (
        <span aria-hidden className="flex flex-col items-center">
          <KavehMark size={52} tone="auto" title="" />
          <svg viewBox="0 0 160 30" width="160" height="30" className="-mt-1">
            <path d="M8 10q12-8 24 0t24 0 24 0 24 0 24 0 24 0" fill="none" stroke={k.periwinkle} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 24q10-6 20 0t20 0 20 0 20 0 20 0" fill="none" stroke={k.periwinkle} strokeOpacity=".5" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
      ) : (
        <span aria-hidden className={cn("grid size-24 place-items-center rounded-full", navy ? "bg-white/10" : "bg-primary-subtle")} style={{ boxShadow: `inset 0 0 0 4px ${navy ? "rgb(255 255 255 / 0.15)" : "rgb(41 80 151 / 0.15)"}, 0 0 0 3px ${k.orange}` }}>
          <KavehMark size={44} tone={navy ? "reversed" : "auto"} title="" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg font-bold">{title}</p>
        {titleFa ? <Fa className={cn("text-sm", navy ? "text-[#ffd0b0]" : "text-secondary-text")}>{titleFa}</Fa> : null}
      </div>
      {description ? <p className={cn("max-w-sm text-sm", navy ? "text-white/75" : "text-foreground-secondary")}>{description}</p> : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
});

/* ------------------------------------------------------------ KavehLoader */

export interface KavehLoaderProps extends HTMLAttributes<HTMLSpanElement> {
  /** `ring` (orange ring around the anchor), `wave` (the anchor bobbing on a wave) or `pulse`. */
  variant?: "ring" | "wave" | "pulse";
  /** Diameter in px. Defaults to 48. */
  size?: number;
  /** Accessible label. Defaults to "Loading". */
  label?: string;
  tone?: "auto" | "reversed";
}

/** A loading indicator with the Kaveh anchor. Static under reduced motion; announced politely to screen readers. */
export const KavehLoader = forwardRef<HTMLSpanElement, KavehLoaderProps>(function KavehLoader({ variant = "ring", size = 48, label = "Loading", tone = "auto", className, ...props }, ref) {
  const markTone = tone === "reversed" ? "reversed" : "auto";
  return (
    <span ref={ref} role="status" aria-live="polite" className={cn("nv-kaveh-loader relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }} {...props}>
      <span className="sr-only">{label}</span>
      {variant === "ring" ? (
        <>
          <span aria-hidden className="absolute inset-0 rounded-full border-[3px] border-[rgb(22_74_150/0.18)]" />
          <span aria-hidden className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#f37537] [animation-duration:900ms] motion-reduce:animate-none" />
          <KavehMark size={size * 0.46} tone={markTone} title="" variant="solid" />
        </>
      ) : variant === "wave" ? (
        <>
          <span aria-hidden className="motion-safe:animate-[nv-kaveh-bob_1.6s_ease-in-out_infinite]" style={{ marginBottom: size * 0.18 }}>
            <KavehMark size={size * 0.52} tone={markTone} title="" variant="solid" />
          </span>
          <svg aria-hidden viewBox="0 0 48 8" className="absolute inset-x-0 bottom-[8%] w-full overflow-visible">
            <path d="M0 4q6-4 12 0t12 0 12 0 12 0" fill="none" stroke={k.orange} strokeWidth="2.5" strokeLinecap="round" className="motion-safe:animate-[nv-kaveh-wave_1.6s_linear_infinite]" />
          </svg>
          <style>{"@keyframes nv-kaveh-bob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-12%) rotate(6deg)}}@keyframes nv-kaveh-wave{to{transform:translateX(-12px)}}"}</style>
        </>
      ) : (
        <>
          <span aria-hidden className="absolute inset-0 rounded-full bg-[#f37537] opacity-25 motion-safe:animate-ping" />
          <span aria-hidden className="relative grid size-full place-items-center rounded-full bg-[#295097]">
            <KavehMark size={size * 0.46} tone="reversed" title="" variant="solid" />
          </span>
        </>
      )}
    </span>
  );
});

/* ---------------------------------------------------------------- Links */

export interface KavehLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** `arrow` (navy text with an orange arrow), `underline` (orange Horizon underline) or `button` (navy outline pill). */
  variant?: "arrow" | "underline" | "button";
}

/** A call-to-action link in the Kaveh style. */
export const KavehLink = forwardRef<HTMLAnchorElement, KavehLinkProps>(function KavehLink({ variant = "arrow", className, children, ...props }, ref) {
  return (
    <a
      ref={ref}
      className={cn(
        "nv-kaveh-link group/kl inline-flex items-center gap-1.5 font-semibold no-underline transition-colors",
        variant === "button" ? "rounded-full border-2 border-secondary-text px-4 py-1.5 text-sm text-secondary-text hover:bg-secondary-text hover:text-surface" : "text-secondary-text",
        variant === "underline" && "bg-[linear-gradient(#f37537,#f37537)] bg-[length:100%_3px] bg-[position:0_100%] bg-no-repeat pb-1 hover:bg-[length:100%_100%] hover:text-[#0b1f3f]",
        focusRing,
        variant !== "button" && "rounded-xs",
        className,
      )}
      {...props}
    >
      {children}
      {variant !== "underline" ? <ArrowUpRight aria-hidden className="size-4 text-[#f37537] transition-transform group-hover/kl:-translate-y-0.5 group-hover/kl:translate-x-0.5 rtl:-scale-x-100" /> : null}
    </a>
  );
});
