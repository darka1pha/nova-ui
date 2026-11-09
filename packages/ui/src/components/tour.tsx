"use client";

import { X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface, focusRing } from "./shared.ts";

export interface TourStep {
  /** A CSS selector, an element, or a function returning one. Missing targets are skipped. */
  target: string | HTMLElement | (() => HTMLElement | null);
  title: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export interface TourLabels {
  back: string;
  next: string;
  done: string;
  skip: string;
  /** "Step 2 of 4" */
  progress: (step: number, total: number) => string;
}

const defaultLabels: TourLabels = { back: "Back", next: "Next", done: "Done", skip: "Skip tour", progress: (s, n) => `Step ${s} of ${n}` };

export interface TourProps {
  /** The stops: each a target (selector, element or function), a title and content. */
  steps: readonly TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step?: number;
  /** Starting step when uncontrolled. */
  defaultStep?: number;
  /** Called with the new step index. */
  onStepChange?: (step: number) => void;
  /** Called when the last step's Done is pressed (not on skip). */
  onFinish?: () => void;
  /** Dim the page around the target. */
  spotlight?: boolean;
  labels?: Partial<TourLabels>;
}

const resolve = (target: TourStep["target"]) =>
  typeof document === "undefined" ? null : typeof target === "string" ? document.querySelector<HTMLElement>(target) : typeof target === "function" ? target() : target;

/** The target's box in viewport coordinates, kept current while scrolling and resizing. */
function useTargetRect(el: HTMLElement | null) {
  // Keyed by element, so a stale box never shows for a new (or no) target.
  const [measured, setMeasured] = useState<{ el: HTMLElement; rect: DOMRect } | null>(null);
  useLayoutEffect(() => {
    if (!el) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setMeasured({ el, rect: el.getBoundingClientRect() }));
    };
    // Measuring the DOM before paint is what a layout effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeasured({ el, rect: el.getBoundingClientRect() });
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resize?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      resize?.disconnect();
    };
  }, [el]);
  return measured && measured.el === el ? measured.rect : null;
}

/**
 * Step-by-step onboarding: a popover points at each target in turn while the
 * rest of the page is dimmed. Back/Next/Done move through the steps, Escape or
 * Skip ends the tour, and focus stays in the popover while it's open.
 */
export function Tour({ steps, open, onOpenChange, step: stepProp, defaultStep = 0, onStepChange, onFinish, spotlight = true, labels: labelsProp }: TourProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const container = usePortalContainer();
  const [stepState, setStepState] = useState(defaultStep);
  const index = Math.min(steps.length - 1, Math.max(0, stepProp ?? stepState));
  const current = steps[index];
  // The resolved element for a step; it only counts while that step is open.
  const [resolved, setResolved] = useState<{ step: TourStep; el: HTMLElement | null } | null>(null);
  const target = open && current && resolved?.step === current ? resolved.el : null;
  const anchor = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const rect = useTargetRect(target);

  useEffect(() => {
    if (!open || !current) return;
    const el = resolve(current.target);
    anchor.current = el;
    // The target is found in the DOM, which only exists after commit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolved({ step: current, el });
    if (el) {
      const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView?.({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  }, [open, current]);

  const goTo = (next: number) => {
    // Skip steps whose target isn't on the page.
    const dir = next >= index ? 1 : -1;
    let n = next;
    for (; n >= 0 && n < steps.length; n += dir) {
      const candidate = steps[n];
      if (candidate && resolve(candidate.target)) break;
    }
    if (n < 0 || n >= steps.length) return;
    if (stepProp === undefined) setStepState(n);
    onStepChange?.(n);
  };
  const last = index === steps.length - 1;
  const finish = () => {
    onOpenChange(false);
    onFinish?.();
  };

  const pad = 6;
  return (
    <>
      {open && spotlight && rect ? (
        <div
          aria-hidden
          data-tour-spotlight=""
          className="pointer-events-none fixed z-(--nv-z-overlay) rounded-(--nv-card-radius) shadow-[0_0_0_9999px_color-mix(in_oklab,var(--nv-color-overlay)_55%,transparent)] ring-2 ring-primary transition-[top,left,width,height] duration-(--nv-duration-slow) ease-(--nv-ease-interactive) motion-reduce:transition-none"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      ) : null}
      <PopoverPrimitive.Root open={open && !!target} onOpenChange={(next) => !next && onOpenChange(false)}>
        <PopoverPrimitive.Anchor virtualRef={anchor} />
        <PopoverPrimitive.Portal container={container}>
          <PopoverPrimitive.Content
            key={index}
            side={current?.side ?? "bottom"}
            align={current?.align ?? "center"}
            sideOffset={pad + 8}
            collisionPadding={12}
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            // A stray click shouldn't end the tour; Escape and Skip do.
            onInteractOutside={(e) => e.preventDefault()}
            className={cn(floatingSurface, "z-(--nv-z-modal) flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 p-4 outline-none")}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="font-display text-md font-semibold">
                {current?.title}
              </h2>
              <PopoverPrimitive.Close
                aria-label={labels.skip}
                className={cn("-me-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-4", focusRing)}
              >
                <X />
              </PopoverPrimitive.Close>
            </div>
            <div id={bodyId} className="text-sm text-foreground-muted">
              {current?.content}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-foreground-muted tabular-nums">{labels.progress(index + 1, steps.length)}</span>
              <div className="flex gap-2">
                {index > 0 ? (
                  <Button size="sm" variant="ghost" onClick={() => goTo(index - 1)}>
                    {labels.back}
                  </Button>
                ) : null}
                <Button size="sm" variant="primary" onClick={() => (last ? finish() : goTo(index + 1))}>
                  {last ? labels.done : labels.next}
                </Button>
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}
