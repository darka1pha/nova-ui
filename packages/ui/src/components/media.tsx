"use client";

import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { forwardRef, useEffect, useRef, useState, type ImgHTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { useOptionalTheme } from "../theme/theme-provider.tsx";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { usePortalContainer } from "./portal.tsx";
import { focusRing, transition } from "./shared.ts";

/* ------------------------------------------------------------------- Image */

const shimmer =
  "animate-ks-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--ks-color-surface-sunken)_0%,var(--ks-color-surface-active)_50%,var(--ks-color-surface-sunken)_100%)] motion-reduce:animate-none";

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Required: describe the image, or pass "" for a decorative one. */
  alt: string;
  /** Width / height, e.g. 16 / 9. Reserves space so the page doesn't jump. */
  ratio?: number;
  fit?: "cover" | "contain";
  /** Shown if the image fails to load. Defaults to an icon and the alt text. */
  fallback?: ReactNode;
  wrapperClassName?: string;
}

/**
 * An `<img>` that reserves its space, shimmers while loading, fades in when
 * ready and shows a fallback if it fails. Lazy-loads by default.
 */
export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image({ alt, ratio, fit = "cover", fallback, wrapperClassName, className, onLoad, onError, loading = "lazy", src, ...props }, ref) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const inner = useRef<HTMLImageElement>(null);
  const composed = useComposedRefs(ref, inner);

  useEffect(() => {
    setStatus("loading");
    // A cached image can finish before React attaches onLoad.
    const img = inner.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : src ? "error" : "loading");
  }, [src]);

  return (
    <span
      data-status={status}
      className={cn("relative block overflow-hidden rounded-(--ks-card-radius) bg-surface-sunken", status === "loading" && shimmer, wrapperClassName)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {status === "error" ? (
        <span role={alt ? "img" : undefined} aria-label={alt || undefined} className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-xs text-foreground-muted">
          {fallback ?? (
            <>
              <ImageOff aria-hidden className="size-5" />
              {alt ? <span aria-hidden className="line-clamp-2">{alt}</span> : null}
            </>
          )}
        </span>
      ) : (
        <img
          ref={composed}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={(e) => {
            setStatus("loaded");
            onLoad?.(e);
          }}
          onError={(e) => {
            setStatus("error");
            onError?.(e);
          }}
          className={cn(
            "block size-full transition-opacity duration-(--ks-duration-slow) ease-(--ks-ease-out) motion-reduce:transition-none",
            fit === "cover" ? "object-cover" : "object-contain",
            status === "loaded" ? "opacity-100" : "opacity-0",
            className,
          )}
          {...props}
        />
      )}
    </span>
  );
});

/* ---------------------------------------------------------------- Lightbox */

export interface LightboxImage {
  src: string;
  alt: string;
  srcSet?: string;
  caption?: ReactNode;
}

export interface LightboxLabels {
  close: string;
  previous: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  /** "2 of 5" */
  counter: (index: number, total: number) => string;
}

const defaultLabels: LightboxLabels = {
  close: "Close",
  previous: "Previous image",
  next: "Next image",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  counter: (i, n) => `${i} of ${n}`,
};

export interface LightboxProps {
  images: readonly LightboxImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Wrap from the last image to the first. */
  loop?: boolean;
  labels?: Partial<LightboxLabels>;
}

/**
 * A full-screen image viewer: arrow keys (mirrored in RTL) and swipes move
 * between images, a click or the zoom button magnifies, Escape closes and
 * focus returns to whatever opened it. Neighbors are preloaded.
 */
export function Lightbox({ images, open, onOpenChange, index: indexProp, defaultIndex = 0, onIndexChange, loop = true, labels: labelsProp }: LightboxProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const container = usePortalContainer();
  const rtl = useOptionalTheme()?.dir === "rtl";
  const [indexState, setIndexState] = useState(defaultIndex);
  const index = Math.min(images.length - 1, Math.max(0, indexProp ?? indexState));
  const [zoomed, setZoomed] = useState(false);
  const swipe = useRef<{ x: number; id: number } | null>(null);
  // Opened without a Dialog trigger, so remember the opener ourselves to return focus to it.
  const opener = useRef<HTMLElement | null>(null);
  const total = images.length;
  const image = images[index];

  const go = (next: number) => {
    const target = loop ? (next + total) % total : Math.min(total - 1, Math.max(0, next));
    if (target === index) return;
    setZoomed(false);
    if (indexProp === undefined) setIndexState(target);
    onIndexChange?.(target);
  };
  const canPrev = loop || index > 0;
  const canNext = loop || index < total - 1;

  useEffect(() => {
    if (!open) setZoomed(false);
  }, [open]);

  // Warm the cache for the neighbors so arrowing through feels instant.
  useEffect(() => {
    if (!open || total < 2 || typeof window === "undefined") return;
    for (const n of [index - 1, index + 1]) {
      const neighbor = images[(n + total) % total];
      if (neighbor) new window.Image().src = neighbor.src;
    }
  }, [open, index, images, total]);

  const onPointerDown = (e: PointerEvent) => {
    if (!zoomed && e.pointerType !== "mouse") swipe.current = { x: e.clientX, id: e.pointerId };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) < 50) return;
    // Swiping left shows the next image (the previous one in RTL).
    go(index + ((dx < 0) !== rtl ? 1 : -1));
  };

  const control =
    "inline-flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/65 disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-5 " +
    `${transition} ${focusRing}`;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-(--ks-z-overlay) bg-black/85 data-[state=open]:animate-ks-fade-in data-[state=closed]:animate-ks-fade-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(e) => {
            if (!opener.current?.isConnected) return;
            e.preventDefault();
            opener.current.focus();
          }}
          className="fixed inset-0 z-(--ks-z-modal) flex flex-col text-white outline-none data-[state=open]:animate-ks-fade-in data-[state=closed]:animate-ks-fade-out"
          onKeyDown={(e) => {
            const back = rtl ? 1 : -1;
            const key = { ArrowLeft: index + back, ArrowRight: index - back, Home: 0, End: total - 1 }[e.key];
            if (key === undefined) return;
            e.preventDefault();
            go(key);
          }}
        >
          <div className="flex items-center justify-between gap-3 p-3">
            <DialogPrimitive.Title aria-live="polite" className="min-w-0 truncate text-sm font-medium">
              {image ? `${labels.counter(index + 1, total)}: ${image.alt}` : null}
            </DialogPrimitive.Title>
            <div className="flex gap-2">
              <button type="button" className={control} aria-label={zoomed ? labels.zoomOut : labels.zoomIn} aria-pressed={zoomed} onClick={() => setZoomed((z) => !z)}>
                {zoomed ? <ZoomOut /> : <ZoomIn />}
              </button>
              <DialogPrimitive.Close className={control} aria-label={labels.close}>
                <X />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div
            className={cn("relative flex min-h-0 flex-1 touch-pan-y items-center justify-center", zoomed ? "overflow-auto" : "overflow-hidden")}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (swipe.current = null)}
          >
            {image ? (
              <img
                key={image.src}
                src={image.src}
                srcSet={image.srcSet}
                alt={image.alt}
                draggable={false}
                onClick={() => setZoomed((z) => !z)}
                className={cn(
                  "select-none animate-ks-fade-in",
                  zoomed ? "max-w-none cursor-zoom-out" : "max-h-full max-w-full cursor-zoom-in object-contain",
                )}
                style={zoomed ? { width: "200%" } : undefined}
              />
            ) : null}
            {total > 1 ? (
              <>
                <button type="button" className={cn(control, "absolute start-3 top-1/2 -translate-y-1/2")} aria-label={labels.previous} disabled={!canPrev} onClick={() => go(index - 1)}>
                  <ChevronLeft className="rtl:rotate-180" />
                </button>
                <button type="button" className={cn(control, "absolute end-3 top-1/2 -translate-y-1/2")} aria-label={labels.next} disabled={!canNext} onClick={() => go(index + 1)}>
                  <ChevronRight className="rtl:rotate-180" />
                </button>
              </>
            ) : null}
          </div>
          {image?.caption ? <div className="mx-auto max-w-prose p-4 text-center text-sm text-white/85">{image.caption}</div> : <div className="h-4" />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ----------------------------------------------------------- ImageGallery */

export interface ImageGalleryProps extends Pick<LightboxProps, "loop" | "labels"> {
  images: readonly (LightboxImage & { thumbnail?: string })[];
  columns?: 2 | 3 | 4;
  /** Thumbnail width / height. */
  ratio?: number;
  /** Accessible name for each thumbnail button. */
  openLabel?: (image: LightboxImage) => string;
  className?: string;
}

const galleryColumns = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" } as const;

/** A thumbnail grid that opens a Lightbox at the clicked image. */
export function ImageGallery({ images, columns = 3, ratio = 4 / 3, openLabel = (image) => `View ${image.alt}`, className, ...lightbox }: ImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <>
      <ul className={cn("grid gap-2", galleryColumns[columns], className)}>
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              aria-label={openLabel(image)}
              onClick={() => {
                setIndex(i);
                setOpen(true);
              }}
              className={cn("group/thumb block w-full cursor-zoom-in overflow-hidden rounded-(--ks-card-radius)", focusRing)}
            >
              <Image
                src={image.thumbnail ?? image.src}
                alt=""
                ratio={ratio}
                className="transition-transform duration-(--ks-duration-slow) ease-(--ks-ease-out) group-hover/thumb:scale-105 motion-reduce:transition-none motion-reduce:group-hover/thumb:scale-100"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={images} open={open} onOpenChange={setOpen} index={index} onIndexChange={setIndex} {...lightbox} />
    </>
  );
}
