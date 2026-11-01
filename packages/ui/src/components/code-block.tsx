"use client";

import { forwardRef, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { CopyButton } from "./chip.tsx";
import { focusRing } from "./shared.ts";

/* --------------------------------------------------------------- CodeBlock */

/** Parses "1,3-5" (or an array) into a set of 1-based line numbers. */
function parseLines(spec: string | readonly number[] | undefined): Set<number> {
  if (!spec) return new Set();
  if (typeof spec !== "string") return new Set(spec);
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const [a, b] = part.split("-").map((n) => Number.parseInt(n, 10));
    if (a === undefined || Number.isNaN(a)) continue;
    for (let n = a; n <= (b === undefined || Number.isNaN(b) ? a : b); n++) out.add(n);
  }
  return out;
}

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  code: string;
  /** Shown in the header, e.g. "tsx". Also set as `data-language` for highlighters. */
  language?: string;
  filename?: ReactNode;
  showLineNumbers?: boolean;
  /** Lines to emphasize: "1,3-5" or [1, 3, 4, 5]. */
  highlightLines?: string | readonly number[];
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean;
  /** Scroll vertically past this height, e.g. 320 or "20rem". */
  maxHeight?: number | string;
  /**
   * Render a line yourself, e.g. with a syntax highlighter's tokens. Receives the
   * raw text and 1-based line number. Defaults to the plain text.
   */
  renderLine?: (line: string, lineNumber: number) => ReactNode;
  copyLabel?: string;
  copiedLabel?: string;
  /** Hide the copy button. */
  hideCopy?: boolean;
}

/**
 * A block of code with a header, copy button, optional line numbers and
 * highlighted lines. Brings no highlighter of its own: pass `renderLine` to plug
 * one in (Shiki, Prism…). The scrolling area is keyboard-focusable.
 */
export const CodeBlock = forwardRef<HTMLElement, CodeBlockProps>(function CodeBlock(
  { code, language, filename, showLineNumbers = false, highlightLines, wrap = false, maxHeight, renderLine, copyLabel = "Copy code", copiedLabel, hideCopy = false, className, ...props },
  ref,
) {
  const lines = code.replace(/\n$/, "").split("\n");
  const highlighted = parseLines(highlightLines);
  const gutter = String(lines.length).length;
  const captionId = useId();
  const hasHeader = !!(filename || language);

  return (
    <figure
      ref={ref}
      aria-labelledby={hasHeader ? captionId : undefined}
      className={cn("group/code relative overflow-hidden rounded-(--ks-card-radius) border border-border bg-surface-sunken text-sm", className)}
      {...props}
    >
      {hasHeader ? (
        <figcaption id={captionId} className="flex min-h-10 items-center gap-2 border-b border-border px-4 pe-12 text-xs text-foreground-muted">
          {filename ? <span className="truncate font-medium text-foreground">{filename}</span> : null}
          {language ? <span className="ms-auto rounded-sm bg-surface-active px-1.5 py-0.5 font-mono uppercase tracking-wide">{language}</span> : null}
        </figcaption>
      ) : null}
      {!hideCopy ? (
        <CopyButton
          value={code}
          aria-label={copyLabel}
          copiedLabel={copiedLabel}
          size="sm"
          variant="ghost"
          className={cn("absolute end-1.5 z-10", hasHeader ? "top-1" : "top-1.5 opacity-0 group-hover/code:opacity-100 focus-visible:opacity-100")}
        />
      ) : null}
      {/* Code reads left to right in every locale. */}
      <pre
        dir="ltr"
        tabIndex={0}
        data-language={language}
        className={cn("overflow-auto py-3 font-mono text-[0.8125rem] leading-6", focusRing, "focus-visible:outline-offset-[-2px]")}
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <code className={cn("grid min-w-full", wrap ? "whitespace-pre-wrap break-words" : "w-max")}>
          {lines.map((line, i) => {
            const n = i + 1;
            const on = highlighted.has(n);
            return (
              <span
                key={i}
                data-line={n}
                data-highlighted={on || undefined}
                className={cn("flex px-4", on && "border-s-2 border-primary bg-primary/10 ps-[calc(1rem-2px)]")}
              >
                {showLineNumbers ? (
                  // Line numbers aren't part of the code: hidden from copy and screen readers.
                  <span aria-hidden className="me-4 inline-block shrink-0 select-none text-end text-foreground-muted" style={{ width: `${gutter}ch` }}>
                    {n}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">{renderLine ? renderLine(line, n) : line || "​"}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
});

/* ---------------------------------------------------------- ExpandableText */

export interface ExpandableTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Lines shown while collapsed. */
  lines?: number;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  moreLabel?: string;
  lessLabel?: string;
}

/**
 * Long text clamped to a few lines with a "Show more" toggle. The toggle only
 * appears when the text actually overflows, and re-checks on resize.
 */
export const ExpandableText = forwardRef<HTMLDivElement, ExpandableTextProps>(function ExpandableText(
  { lines = 3, defaultExpanded = false, expanded: expandedProp, onExpandedChange, moreLabel = "Show more", lessLabel = "Show less", className, children, ...props },
  ref,
) {
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = expandedProp ?? expandedState;
  const [overflows, setOverflows] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const bodyId = useId();

  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const measure = () => {
      // Measure as if clamped, even while expanded, so "Show less" stays available.
      if (expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(el);
    return () => resize?.disconnect();
  }, [expanded, lines, children]);

  const toggle = () => {
    setExpandedState(!expanded);
    onExpandedChange?.(!expanded);
  };

  return (
    <div ref={ref} className={cn("flex flex-col items-start gap-1", className)} {...props}>
      <div id={bodyId} ref={body} className="w-full" style={expanded ? undefined : { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }}>
        {children}
      </div>
      {overflows || expanded ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={toggle}
          className={cn("rounded-sm text-sm font-medium text-primary-text underline-offset-4 hover:underline", focusRing)}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      ) : null}
    </div>
  );
});
