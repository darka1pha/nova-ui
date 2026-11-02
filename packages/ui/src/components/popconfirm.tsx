"use client";

import { CircleAlert } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Button } from "./button.tsx";
import { usePortalContainer } from "./portal.tsx";
import { floatingSurface } from "./shared.ts";

export interface PopconfirmProps {
  /** The element that asks for confirmation, e.g. a delete button. Rendered as the trigger. */
  children: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** May be async: the confirm button shows a spinner until it settles. Throw to keep it open with the error's message. */
  onConfirm: () => unknown;
  /** Called when cancelled, by the button, Escape or an outside click. */
  onCancel?: () => void;
  /** Text of the confirm button. */
  confirmLabel?: string;
  /** Text of the cancel button. */
  cancelLabel?: string;
  /** `danger` styles the confirm button red and focuses Cancel first. */
  tone?: "danger" | "primary";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A lightweight confirmation that pops up next to the action, for things that
 * deserve a second thought but not a full dialog. It's an alertdialog: focus
 * moves in (to Cancel for destructive actions), Escape cancels, and focus
 * returns to the trigger.
 */
export function Popconfirm({
  children,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  side = "top",
  align = "center",
  open: openProp,
  onOpenChange,
}: PopconfirmProps) {
  const container = usePortalContainer();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const setOpen = (next: boolean) => {
    if (busy) return;
    if (!next) setError(undefined);
    setOpenState(next);
    onOpenChange?.(next);
  };
  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await onConfirm();
      setBusy(false);
      setOpenState(false);
      onOpenChange?.(false);
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={description || error ? descId : undefined}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(e) => {
            if (tone !== "danger") return;
            // Destructive: start on the safe choice.
            e.preventDefault();
            cancelRef.current?.focus();
          }}
          onEscapeKeyDown={() => onCancel?.()}
          className={cn(floatingSurface, "flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-3 p-4 outline-none")}
        >
          <div className="flex gap-2.5">
            <CircleAlert aria-hidden className={cn("mt-0.5 size-4 shrink-0", tone === "danger" ? "text-danger-text" : "text-primary-text")} />
            <div className="flex min-w-0 flex-col gap-1">
              <p id={titleId} className="text-sm font-semibold">
                {title}
              </p>
              {description || error ? (
                <div id={descId} className="flex flex-col gap-1 text-sm text-foreground-muted">
                  {description ? <p>{description}</p> : null}
                  {error ? <p className="text-danger-text">{error}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              ref={cancelRef}
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                onCancel?.();
                setOpen(false);
              }}
            >
              {cancelLabel}
            </Button>
            <Button size="sm" variant={tone === "danger" ? "danger" : "primary"} loading={busy} onClick={() => void confirm()}>
              {confirmLabel}
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
