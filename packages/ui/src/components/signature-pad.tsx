"use client";

import { Eraser, Keyboard, PenLine, Undo2 } from "lucide-react";
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { useFormField } from "./field.tsx";
import { fieldVariants } from "./input.tsx";

type Point = [x: number, y: number, pressure: number];

/** `list[i]` for an index known to be in range. */
const at = <V,>(list: readonly V[], i: number) => list[i] as V;

export interface SignaturePadApi {
  clear: () => void;
  undo: () => void;
  isEmpty: () => boolean;
  /** The signature as an image, or null when empty. */
  toDataURL: (type?: string) => string | null;
}

export interface SignaturePadLabels {
  /** Accessible name of the drawing area. */
  canvas?: string;
  placeholder?: string;
  clear?: string;
  undo?: string;
  typeInstead?: string;
  drawInstead?: string;
  typedName?: string;
}

export interface SignaturePadProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Fires after each stroke or edit with a PNG data URL, or null when cleared. */
  onChange?: (dataUrl: string | null) => void;
  /** Drawing area height in pixels. */
  height?: number;
  /** Pen width in pixels (pressure-sensitive pens vary around it). */
  strokeWidth?: number;
  /** Pen color. Defaults to the text color. */
  color?: string;
  /** Font for the typed alternative. */
  typedFont?: string;
  disabled?: boolean;
  /** Submits the PNG data URL with native forms via a hidden input. */
  name?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
  labels?: SignaturePadLabels;
}

/**
 * A pad for drawing a signature with a mouse, pen or finger, with undo and clear.
 * People who can't draw can type their name instead (rendered in a script font),
 * so signing never depends on a dragging gesture.
 */
export const SignaturePad = forwardRef<SignaturePadApi, SignaturePadProps>(function SignaturePad(
  {
    onChange,
    height = 180,
    strokeWidth = 2.5,
    color,
    typedFont = '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive',
    disabled,
    name,
    id,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    required,
    labels,
    className,
    ...props
  },
  ref,
) {
  const field = useFormField({ id, "aria-describedby": describedBy, "aria-invalid": invalid, disabled, required });
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const drawing = useRef(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typed, setTyped] = useState("");
  const [empty, setEmpty] = useState(true);
  const [dataUrl, setDataUrl] = useState("");
  const typedId = useId();

  const context = () => canvas.current?.getContext?.("2d") ?? null;

  const paint = () => {
    const el = canvas.current;
    const ctx = context();
    if (!el || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height: h } = el.getBoundingClientRect();
    if (el.width !== Math.round(width * dpr) || el.height !== Math.round(h * dpr)) {
      el.width = Math.round(width * dpr);
      el.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, h);
    const ink = color ?? getComputedStyle(el).color;
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "type") {
      if (!typed.trim()) return;
      let size = Math.min(h * 0.45, 56);
      ctx.font = `${size}px ${typedFont}`;
      while (size > 12 && ctx.measureText(typed).width > width - 32) {
        size -= 2;
        ctx.font = `${size}px ${typedFont}`;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typed, width / 2, h / 2);
      return;
    }
    for (const stroke of strokes.current) {
      if (stroke.length === 1) {
        const [x, y, p] = at(stroke, 0);
        ctx.beginPath();
        ctx.arc(x, y, (strokeWidth * (0.5 + p)) / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      for (let i = 1; i < stroke.length; i++) {
        const [x0, y0] = at(stroke, i - 1);
        const [x1, y1, p] = at(stroke, i);
        ctx.lineWidth = strokeWidth * (0.5 + p);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
  };

  const isEmpty = () => (mode === "type" ? !typed.trim() : strokes.current.length === 0);
  const toDataURL = (type = "image/png") => {
    if (isEmpty()) return null;
    try {
      return canvas.current?.toDataURL(type) ?? null;
    } catch {
      return null;
    }
  };
  const emit = () => {
    paint();
    const url = toDataURL();
    setEmpty(url === null && isEmpty());
    setDataUrl(url ?? "");
    onChange?.(url);
  };
  const clear = () => {
    strokes.current = [];
    setTyped("");
  };
  const undo = () => {
    strokes.current = strokes.current.slice(0, -1);
    emit();
  };

  useImperativeHandle(ref, () => ({ clear: () => (clear(), emit()), undo, isEmpty, toDataURL }));

  // Repaint (and re-emit) when the mode or typed name changes, and on resize.
  useEffect(() => {
    emit();
    const el = canvas.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => paint());
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typed, color, strokeWidth]);

  const point = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Mice report 0 or 0.5; treat anything without real pressure as medium.
    const pressure = e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.5;
    return [e.clientX - rect.left, e.clientY - rect.top, pressure];
  };

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {name ? <input type="hidden" name={name} value={dataUrl} /> : null}
      <div className="relative">
        <canvas
          ref={canvas}
          id={mode === "draw" ? field.id : undefined}
          role="img"
          aria-label={labels?.canvas ?? "Signature"}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          data-empty={empty || undefined}
          style={{ height }}
          className={cn(
            fieldVariants(),
            "block h-auto w-full touch-none bg-surface p-0 text-foreground",
            mode === "draw" && !field.disabled ? "cursor-crosshair" : "",
            field.disabled && "cursor-not-allowed bg-surface-sunken opacity-60",
          )}
          onPointerDown={(e) => {
            if (mode !== "draw" || field.disabled || e.button !== 0) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            drawing.current = true;
            strokes.current = [...strokes.current, [point(e)]];
            paint();
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            at(strokes.current, strokes.current.length - 1).push(point(e));
            paint();
          }}
          onPointerUp={() => {
            if (!drawing.current) return;
            drawing.current = false;
            emit();
          }}
          onPointerCancel={() => {
            if (!drawing.current) return;
            drawing.current = false;
            emit();
          }}
        />
        {/* The baseline people sign on. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-border-strong" />
        {empty && mode === "draw" ? (
          <span aria-hidden className="pointer-events-none absolute inset-x-6 bottom-2 text-center text-xs text-foreground-muted">
            {labels?.placeholder ?? "Sign above the line"}
          </span>
        ) : null}
      </div>
      {mode === "type" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={field.id ?? typedId} className="text-sm font-medium text-foreground">
            {labels?.typedName ?? "Type your full name"}
          </label>
          <input
            id={field.id ?? typedId}
            className={fieldVariants({ size: "sm" })}
            value={typed}
            disabled={field.disabled}
            aria-describedby={field["aria-describedby"]}
            aria-invalid={field["aria-invalid"]}
            aria-required={field.required}
            autoComplete="name"
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {mode === "draw" ? (
          <Button size="sm" variant="ghost" startIcon={<Undo2 />} disabled={field.disabled || empty} onClick={undo}>
            {labels?.undo ?? "Undo"}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          startIcon={<Eraser />}
          disabled={field.disabled || empty}
          onClick={() => {
            clear();
            emit();
          }}
        >
          {labels?.clear ?? "Clear"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ms-auto"
          startIcon={mode === "draw" ? <Keyboard /> : <PenLine />}
          disabled={field.disabled}
          onClick={() => {
            clear();
            setMode((m) => (m === "draw" ? "type" : "draw"));
          }}
        >
          {mode === "draw" ? (labels?.typeInstead ?? "Type instead") : (labels?.drawInstead ?? "Draw instead")}
        </Button>
      </div>
    </div>
  );
});
