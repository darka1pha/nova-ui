"use client";

import { ArrowDown, ArrowUp, Paperclip, Square, X } from "lucide-react";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "../utils/cn.ts";
import { useComposedRefs } from "../utils/compose-refs.ts";
import { formatFileSize } from "./upload-list.tsx";
import { focusRing, transition } from "./shared.ts";

/* ------------------------------------------------------------- MessageList */

export interface MessageListApi {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export interface MessageListProps extends HTMLAttributes<HTMLDivElement> {
  /** Required: names the conversation for screen readers, e.g. "Chat with Support". */
  "aria-label": string;
  /** Text of the button that appears when new messages arrive while scrolled up. */
  jumpLabel?: string;
  /** Gives you `scrollToBottom()`. */
  apiRef?: Ref<MessageListApi>;
}

/**
 * A scrolling conversation (`role="log"`, so new messages are announced). It
 * sticks to the bottom while you're there, including while a reply streams in,
 * and offers "Jump to latest" when you've scrolled up to read history.
 */
export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(function MessageList({ jumpLabel = "Jump to latest", apiRef, className, children, ...props }, ref) {
  const viewport = useRef<HTMLDivElement>(null);
  const composedRef = useComposedRefs(ref, viewport);
  const content = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = viewport.current;
    if (!el) return;
    if (typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior });
    else el.scrollTop = el.scrollHeight;
    atBottom.current = true;
    setShowJump(false);
  };
  useImperativeHandle(apiRef, () => ({ scrollToBottom }));

  // Start at the newest message.
  useLayoutEffect(() => scrollToBottom(), []);

  // Follow new messages and streaming growth, but only if the reader was already at the bottom.
  useEffect(() => {
    const el = content.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) scrollToBottom();
      else setShowJump(true);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (atBottom.current) scrollToBottom();
    else setShowJump(true);
  }, [children]);

  return (
    <div className={cn("relative flex min-h-0 flex-col", className)}>
      <div
        ref={composedRef}
        role="log"
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          if (atBottom.current) setShowJump(false);
        }}
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-(--nv-card-radius)", focusRing)}
        {...props}
      >
        <div ref={content} className="flex flex-col gap-4 p-4">
          {children}
        </div>
      </div>
      {showJump ? (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className={cn(
            "absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium shadow-md hover:bg-surface-hover animate-nv-pop-in [&_svg]:size-3.5",
            focusRing,
          )}
        >
          <ArrowDown aria-hidden />
          {jumpLabel}
        </button>
      ) : null}
    </div>
  );
});

/* ------------------------------------------------------------ MessageGroup */

const SideContext = createContext<"start" | "end">("start");

export interface MessageGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Shown above the bubbles and used as the group's accessible name. */
  author: string;
  /** Shown once beside the group. */
  avatar?: ReactNode;
  /** `end` for the current user (right in LTR), `start` for everyone else. */
  side?: "start" | "end";
  /** Small text next to the author, e.g. a RelativeTime. */
  meta?: ReactNode;
  /** Hide the author line (it's still the group's accessible name). */
  hideAuthor?: boolean;
}

/** Consecutive messages from one author: one avatar and name, bubbles stacked with tightened corners. */
export const MessageGroup = forwardRef<HTMLDivElement, MessageGroupProps>(function MessageGroup({ author, avatar, side = "start", meta, hideAuthor = false, className, children, ...props }, ref) {
  return (
    <SideContext.Provider value={side}>
      <div ref={ref} role="group" aria-label={author} data-side={side} className={cn("flex items-end gap-2", side === "end" && "flex-row-reverse", className)} {...props}>
        {avatar ? <div className="shrink-0">{avatar}</div> : null}
        <div className={cn("flex min-w-0 max-w-[min(36rem,85%)] flex-col gap-1", side === "end" ? "items-end" : "items-start")}>
          {!hideAuthor || meta ? (
            <div className={cn("flex items-baseline gap-2 px-1 text-xs text-foreground-muted", side === "end" && "flex-row-reverse")}>
              {!hideAuthor ? <span className="font-medium text-foreground">{author}</span> : null}
              {meta}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </SideContext.Provider>
  );
});

/* ----------------------------------------------------------------- Message */

export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
  /** Text arriving token by token: shows a caret and holds announcements until done. */
  streaming?: boolean;
  /** Delivery state of a sent message. */
  status?: "sending" | "sent" | "error";
  /** Custom text for the status, e.g. a timestamp. */
  statusLabel?: ReactNode;
  /** Shown under the bubble on hover or focus, e.g. Copy and Retry. */
  actions?: ReactNode;
  /** Plain bubble-less layout, for long assistant answers. */
  variant?: "bubble" | "plain";
}

/** One message bubble inside a MessageGroup. Text keeps its line breaks. */
export const Message = forwardRef<HTMLDivElement, MessageProps>(function Message({ streaming = false, status, statusLabel, actions, variant = "bubble", className, children, ...props }, ref) {
  const side = useContext(SideContext);
  const mine = side === "end";
  return (
    <div className={cn("group/message flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <div
        ref={ref}
        aria-busy={streaming || undefined}
        data-status={status}
        className={cn(
          "whitespace-pre-wrap break-words text-sm leading-relaxed",
          variant === "bubble" && "rounded-2xl px-3.5 py-2",
          variant === "bubble" && (mine ? "bg-primary text-primary-on-solid" : "bg-surface-sunken text-foreground"),
          // Tighten the corners that face the next/previous bubble from the same author.
          variant === "bubble" && (mine ? "[&:not(:first-child)]:rounded-se-md" : "[&:not(:first-child)]:rounded-ss-md"),
          status === "sending" && "opacity-70",
          status === "error" && "ring-2 ring-danger-text/60",
          className,
        )}
        {...props}
      >
        {children}
        {streaming ? <span aria-hidden className="ms-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] animate-pulse bg-current motion-reduce:animate-none" /> : null}
      </div>
      {statusLabel ? <span className={cn("px-1 text-xs", status === "error" ? "text-danger-text" : "text-foreground-muted")}>{statusLabel}</span> : null}
      {actions ? <div className="flex gap-1 px-1 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100 [@media(hover:none)]:opacity-100">{actions}</div> : null}
    </div>
  );
});

/* --------------------------------------------------------- TypingIndicator */

export interface TypingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Spoken (and shown, unless `hideLabel`) text, e.g. "Mina is typing". */
  label?: string;
  /** Show only the dots; the label is still announced. */
  hideLabel?: boolean;
}

/** Three bouncing dots, announced once as a status. Still under reduced motion. */
export const TypingIndicator = forwardRef<HTMLDivElement, TypingIndicatorProps>(function TypingIndicator({ label = "Typing", hideLabel = false, className, ...props }, ref) {
  return (
    <div ref={ref} role="status" className={cn("inline-flex items-center gap-2 text-xs text-foreground-muted", className)} {...props}>
      <span aria-hidden className="inline-flex items-center gap-1 rounded-2xl bg-surface-sunken px-3 py-2.5">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="size-1.5 animate-bounce rounded-full bg-foreground-muted motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
    </div>
  );
});

/* ------------------------------------------------------------ ChatComposer */

export interface ChatComposerLabels {
  input: string;
  send: string;
  stop: string;
  attach: string;
  removeFile: (name: string) => string;
}

const composerLabels: ChatComposerLabels = {
  input: "Message",
  send: "Send message",
  stop: "Stop generating",
  attach: "Attach files",
  removeFile: (name) => `Remove ${name}`,
};

export interface ChatComposerProps extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called with the trimmed text and attachments. Return `false` to keep the draft (e.g. on failure). */
  onSend: (message: { text: string; files: File[] }) => unknown;
  /** A reply is being generated: the send button becomes Stop. */
  generating?: boolean;
  /** Called by the Stop button while `generating`. */
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Show the attach button; `accept` is the native filter. */
  attachments?: boolean;
  /** Native file filter for attachments, e.g. "image/*". */
  accept?: string;
  /** Maximum characters, with a live counter beside the send button. */
  maxLength?: number;
  /** Extra controls left of the send button, e.g. a model picker. */
  toolbar?: ReactNode;
  labels?: Partial<ChatComposerLabels>;
}

/**
 * The message box: grows with its text, Enter sends and Shift+Enter adds a
 * line (IME-safe), optional attachments, and a Stop button while a reply is
 * generating. Clears after sending unless `onSend` returns false.
 */
export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(function ChatComposer(
  { value: valueProp, defaultValue = "", onValueChange, onSend, generating = false, onStop, placeholder = "Write a message…", disabled, attachments = false, accept, maxLength, toolbar, labels: labelsProp, className, ...props },
  ref,
) {
  const labels = { ...composerLabels, ...labelsProp };
  const [valueState, setValueState] = useState(defaultValue);
  const value = valueProp ?? valueState;
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => textarea.current as HTMLTextAreaElement);

  const setValue = (next: string) => {
    if (valueProp === undefined) setValueState(next);
    onValueChange?.(next);
  };
  const canSend = !disabled && !generating && (value.trim().length > 0 || files.length > 0);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const result = await onSend({ text: value.trim(), files });
    if (result === false) return;
    setValue("");
    setFiles([]);
    textarea.current?.focus();
  };

  const round = cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4 disabled:pointer-events-none disabled:opacity-40", transition, focusRing);

  return (
    <form
      onSubmit={send}
      className={cn(
        "nv-field flex flex-col gap-2 rounded-(--nv-card-radius) border border-input bg-surface p-2 shadow-xs focus-within:border-focus-ring focus-within:ring-3 focus-within:ring-focus-ring/25",
        transition,
        disabled && "opacity-60",
        className,
      )}
      {...props}
    >
      {files.length ? (
        <ul className="flex flex-wrap gap-1.5 px-1 pt-1">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="inline-flex max-w-56 items-center gap-1.5 rounded-full border border-border bg-surface-sunken py-0.5 ps-2.5 pe-1 text-xs">
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-foreground-muted">{formatFileSize(file.size)}</span>
              <button
                type="button"
                aria-label={labels.removeFile(file.name)}
                onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                className={cn("inline-flex size-6 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-3", focusRing)}
              >
                <X />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        ref={textarea}
        rows={1}
        aria-label={labels.input}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Don't send while an IME is composing (Japanese, Chinese, Korean input).
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void send();
          }
        }}
        className="field-sizing-content max-h-48 min-h-10 w-full resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-foreground-muted"
      />
      <div className="flex items-center gap-1">
        {attachments ? (
          <>
            <button type="button" aria-label={labels.attach} disabled={disabled} onClick={() => fileInput.current?.click()} className={cn(round, "text-foreground-muted hover:bg-surface-hover hover:text-foreground")}>
              <Paperclip />
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={accept}
              hidden
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                if (picked.length) setFiles((f) => [...f, ...picked]);
                e.target.value = "";
              }}
            />
          </>
        ) : null}
        {toolbar}
        <span className="ms-auto flex items-center gap-2">
          {maxLength ? (
            <span className={cn("text-xs tabular-nums", value.length >= maxLength ? "text-danger-text" : "text-foreground-muted")}>
              {value.length}/{maxLength}
            </span>
          ) : null}
          {generating ? (
            <button type="button" aria-label={labels.stop} onClick={onStop} className={cn(round, "bg-foreground text-surface hover:opacity-85")}>
              <Square className="fill-current" />
            </button>
          ) : (
            <button type="submit" aria-label={labels.send} disabled={!canSend} className={cn(round, "bg-primary text-primary-on-solid hover:bg-primary-solid-hover")}>
              <ArrowUp />
            </button>
          )}
        </span>
      </div>
    </form>
  );
});
