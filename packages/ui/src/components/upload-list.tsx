"use client";

import { CircleCheck, CircleX, File, FileArchive, FileAudio, FileImage, FileText, FileVideo, RotateCw, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { Progress } from "./feedback.tsx";
import { focusRing, transition } from "./shared.ts";

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  /** Bytes. */
  size?: number;
  /** MIME type, used for the icon. */
  type?: string;
  status: UploadStatus;
  /** 0–100 while uploading. Omit for an indeterminate bar. */
  progress?: number;
  /** Shown when `status` is "error". */
  error?: string;
  /** Thumbnail URL for images. */
  preview?: string;
}

export interface FileUploadListLabels {
  queued: string;
  done: string;
  error: string;
  cancel: (name: string) => string;
  retry: (name: string) => string;
  remove: (name: string) => string;
  progress: (name: string) => string;
  /** Announced when an upload finishes or fails. */
  announceDone: (name: string) => string;
  announceError: (name: string) => string;
}

const defaultLabels: FileUploadListLabels = {
  queued: "Waiting…",
  done: "Uploaded",
  error: "Upload failed",
  cancel: (n) => `Cancel upload of ${n}`,
  retry: (n) => `Retry ${n}`,
  remove: (n) => `Remove ${n}`,
  progress: (n) => `Uploading ${n}`,
  announceDone: (n) => `${n} uploaded.`,
  announceError: (n) => `${n} failed to upload.`,
};

/** "1.4 MB": binary units, one decimal, localized digits. */
export function formatFileSize(bytes: number, locale?: string): string {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u++;
  }
  return new Intl.NumberFormat(locale, { style: "unit", unit: units[u], unitDisplay: "short", maximumFractionDigits: u === 0 ? 0 : 1 }).format(n);
}

const iconFor = (type = "") =>
  type.startsWith("image/")
    ? FileImage
    : type.startsWith("video/")
      ? FileVideo
      : type.startsWith("audio/")
        ? FileAudio
        : /zip|rar|tar|7z|gzip/.test(type)
          ? FileArchive
          : /pdf|text|word|document|sheet|presentation/.test(type)
            ? FileText
            : File;

export interface FileUploadListProps {
  /** Files and their state: progress, done, or error with a retry. */
  items: readonly UploadItem[];
  /** Shown while uploading or queued. Without it, no cancel button. */
  onCancel?: (id: string) => void;
  /** Shown on failed items. */
  onRetry?: (id: string) => void;
  /** Shown on finished or failed items. */
  onRemove?: (id: string) => void;
  labels?: Partial<FileUploadListLabels>;
  locale?: string;
  /** Extra content per row, e.g. a link to the uploaded file. */
  renderActions?: (item: UploadItem) => ReactNode;
  className?: string;
}

/**
 * Per-file upload progress to pair with FileDropzone: icon or thumbnail, name,
 * size, a progress bar and status, with cancel, retry and remove. Finished and
 * failed uploads are announced politely; status never relies on color alone.
 */
export function FileUploadList({ items, onCancel, onRetry, onRemove, labels: labelsProp, locale, renderActions, className }: FileUploadListProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const [announcement, setAnnouncement] = useState("");
  // Announce items that just finished or failed, comparing with the previous render's items.
  const [previous, setPrevious] = useState(items);
  if (items !== previous) {
    setPrevious(items);
    const before = new Map(previous.map((i) => [i.id, i.status]));
    const changes: string[] = [];
    for (const item of items) {
      const status = before.get(item.id);
      if (status && status !== item.status) {
        if (item.status === "done") changes.push(labels.announceDone(item.name));
        if (item.status === "error") changes.push(labels.announceError(item.name));
      }
    }
    if (changes.length) setAnnouncement(changes.join(" "));
  }

  const iconButton = cn("inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-4", transition, focusRing);

  return (
    <>
      <ul className={cn("flex flex-col gap-2", className)}>
        {items.map((item) => {
          const Icon = iconFor(item.type);
          const active = item.status === "uploading" || item.status === "queued";
          return (
            <li key={item.id} data-status={item.status} className="flex items-center gap-3 rounded-(--nv-card-radius) border border-border bg-surface p-3 data-[status=error]:border-danger-border">
              {item.preview ? (
                <img src={item.preview} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
              ) : (
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface-sunken text-foreground-muted [&_svg]:size-5">
                  <Icon />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  {item.size !== undefined ? <span className="shrink-0 text-xs text-foreground-muted tabular-nums">{formatFileSize(item.size, locale)}</span> : null}
                </div>
                {item.status === "uploading" ? (
                  <div className="flex items-center gap-2">
                    <Progress value={item.progress ?? null} size="sm" tone="primary" aria-label={labels.progress(item.name)} className="flex-1" />
                    {item.progress !== undefined ? <span className="w-9 text-end text-xs text-foreground-muted tabular-nums">{Math.round(item.progress)}%</span> : null}
                  </div>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs [&_svg]:size-3.5",
                      item.status === "done" ? "text-success-text" : item.status === "error" ? "text-danger-text" : "text-foreground-muted",
                    )}
                  >
                    {item.status === "done" ? <CircleCheck aria-hidden /> : item.status === "error" ? <CircleX aria-hidden /> : null}
                    {item.status === "done" ? labels.done : item.status === "error" ? (item.error ?? labels.error) : labels.queued}
                  </span>
                )}
              </div>
              {renderActions?.(item)}
              {item.status === "error" && onRetry ? (
                <button type="button" className={iconButton} aria-label={labels.retry(item.name)} onClick={() => onRetry(item.id)}>
                  <RotateCw />
                </button>
              ) : null}
              {active && onCancel ? (
                <button type="button" className={iconButton} aria-label={labels.cancel(item.name)} onClick={() => onCancel(item.id)}>
                  <X />
                </button>
              ) : null}
              {!active && onRemove ? (
                <button type="button" className={iconButton} aria-label={labels.remove(item.name)} onClick={() => onRemove(item.id)}>
                  <X />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
