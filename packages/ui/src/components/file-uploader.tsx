"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn.ts";
import { useLatestRef } from "../utils/use-latest-ref.ts";
import { FileDropzone, type FileDropzoneProps } from "./entry.tsx";
import { FileUploadList, type FileUploadListProps, type UploadItem } from "./upload-list.tsx";

/* --------------------------------------------------------- useFileUploads */

export interface UploadContext {
  /** Fires when the upload is canceled or the component unmounts; pass it to fetch/XHR. */
  signal: AbortSignal;
  /** Report progress from 0 to 100. Without calls, the bar is indeterminate. */
  onProgress: (percent: number) => void;
}

export interface UseFileUploadsOptions {
  /** Uploads one file. Resolve when it's stored; reject (or throw) to mark it failed. */
  upload: (file: File, context: UploadContext) => Promise<unknown>;
  /** How many files upload at once. Default 3. */
  concurrency?: number;
  /** Show thumbnails for images (object URLs, revoked on remove and unmount). Default true. */
  previews?: boolean;
  /** Called with each finished file and what `upload` resolved to. */
  onUploaded?: (item: UploadItem, file: File, result: unknown) => void;
  /** Called with each failed file and the error. */
  onError?: (item: UploadItem, file: File, error: unknown) => void;
  /** Turns an error into the message shown on the row. Default: FileUploadList's "Upload failed". */
  getErrorMessage?: (error: unknown) => string | undefined;
}

export interface FileUploads {
  /** Pass to `<FileUploadList items>`. */
  items: UploadItem[];
  /** Queue files for upload. Returns their ids. */
  add: (files: readonly File[]) => string[];
  /** Abort an upload that's queued or running and drop its row. */
  cancel: (id: string) => void;
  /** Queue a failed upload again. */
  retry: (id: string) => void;
  /** Drop a finished or failed row. */
  remove: (id: string) => void;
  /** Abort everything and empty the list. */
  clear: () => void;
  /** The File behind a row. */
  getFile: (id: string) => File | undefined;
  /** True while anything is queued or uploading. */
  busy: boolean;
}

interface Entry {
  file: File;
  controller?: AbortController;
}

let nextId = 0;

const release = (item: UploadItem | undefined) => {
  if (item?.preview?.startsWith("blob:")) URL.revokeObjectURL(item.preview);
};

/**
 * State for a list of uploads: a queue with a concurrency limit, progress,
 * cancel (via `AbortSignal`), retry and image thumbnails. Feed `items` to
 * `FileUploadList`, and `add` to a `FileDropzone`'s `onFilesChange`, or use
 * `FileUploader`, which wires both for you.
 */
export function useFileUploads({ upload, concurrency = 3, previews = true, onUploaded, onError, getErrorMessage }: UseFileUploadsOptions): FileUploads {
  const [items, setItems] = useState<UploadItem[]>([]);
  // The source of truth lives in a ref so async callbacks see the latest list;
  // every change is mirrored into state for rendering.
  const list = useRef<UploadItem[]>([]);
  const entries = useRef(new Map<string, Entry>());
  const options = useLatestRef({ upload, concurrency, onUploaded, onError, getErrorMessage });

  const commit = useCallback((next: UploadItem[]) => {
    list.current = next;
    setItems(next);
  }, []);
  const patch = useCallback(
    (id: string, change: Partial<UploadItem>) => commit(list.current.map((item) => (item.id === id ? { ...item, ...change } : item))),
    [commit],
  );

  const pump = useCallback(() => {
    // A named inner function so a finished upload can start the next one.
    function step() {
      const { upload: run, concurrency: limit } = options.current;
      let running = list.current.filter((i) => i.status === "uploading").length;
      for (const item of list.current) {
        if (running >= limit) break;
        if (item.status !== "queued") continue;
        const entry = entries.current.get(item.id);
        if (!entry) continue;
        running++;
        const controller = new AbortController();
        entry.controller = controller;
        patch(item.id, { status: "uploading", progress: undefined, error: undefined });
        const onProgress = (percent: number) => {
          if (!controller.signal.aborted) patch(item.id, { progress: Math.min(100, Math.max(0, percent)) });
        };
        Promise.resolve()
          .then(() => run(entry.file, { signal: controller.signal, onProgress }))
          .then(
            (result) => {
              if (controller.signal.aborted) return;
              patch(item.id, { status: "done", progress: 100 });
              const done = list.current.find((i) => i.id === item.id);
              if (done) options.current.onUploaded?.(done, entry.file, result);
            },
            (error: unknown) => {
              if (controller.signal.aborted) return;
              patch(item.id, { status: "error", error: options.current.getErrorMessage?.(error) });
              const failed = list.current.find((i) => i.id === item.id);
              if (failed) options.current.onError?.(failed, entry.file, error);
            },
          )
          .finally(() => {
            if (entry.controller === controller) entry.controller = undefined;
            if (!controller.signal.aborted) step();
          });
      }
    }
    step();
  }, [options, patch]);

  const add = useCallback(
    (files: readonly File[]) => {
      const added: UploadItem[] = files.map((file) => {
        const id = `nv-upload-${++nextId}`;
        entries.current.set(id, { file });
        const preview =
          previews && file.type.startsWith("image/") && typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
            ? URL.createObjectURL(file)
            : undefined;
        return { id, name: file.name, size: file.size, type: file.type, status: "queued", preview };
      });
      commit([...list.current, ...added]);
      pump();
      return added.map((i) => i.id);
    },
    [commit, pump, previews],
  );

  const drop = useCallback(
    (id: string) => {
      entries.current.get(id)?.controller?.abort();
      entries.current.delete(id);
      release(list.current.find((i) => i.id === id));
      commit(list.current.filter((i) => i.id !== id));
    },
    [commit],
  );
  const cancel = useCallback(
    (id: string) => {
      drop(id);
      pump();
    },
    [drop, pump],
  );
  const retry = useCallback(
    (id: string) => {
      patch(id, { status: "queued", error: undefined, progress: undefined });
      pump();
    },
    [patch, pump],
  );
  const clear = useCallback(() => {
    for (const item of list.current) {
      entries.current.get(item.id)?.controller?.abort();
      release(item);
    }
    entries.current.clear();
    commit([]);
  }, [commit]);

  // Abort uploads and revoke thumbnails when the owner unmounts.
  useEffect(() => {
    const map = entries.current;
    return () => {
      for (const item of list.current) {
        map.get(item.id)?.controller?.abort();
        release(item);
      }
      map.clear();
    };
  }, []);

  const getFile = useCallback((id: string) => entries.current.get(id)?.file, []);
  const busy = items.some((i) => i.status === "queued" || i.status === "uploading");
  return { items, add, cancel, retry, remove: drop, clear, getFile, busy };
}

/* ------------------------------------------------------------ FileUploader */

export interface FileUploaderProps
  extends UseFileUploadsOptions, Pick<FileDropzoneProps, "accept" | "multiple" | "maxSize" | "onReject" | "title" | "description" | "disabled" | "labels"> {
  /** Labels for the list rows. */
  listLabels?: FileUploadListProps["labels"];
  locale?: string;
  /** Extra content per row, e.g. a link to the uploaded file. */
  renderActions?: (item: UploadItem) => ReactNode;
  /** Called whenever the list changes, e.g. to enable a submit button when nothing is `busy`. */
  onItemsChange?: (items: UploadItem[]) => void;
  className?: string;
}

/**
 * A FileDropzone and a FileUploadList wired together: dropped or picked files
 * upload right away through your `upload` function, with progress, cancel and
 * retry. For a custom layout, use `useFileUploads` with the two components.
 */
export function FileUploader({
  upload,
  concurrency,
  previews,
  onUploaded,
  onError,
  getErrorMessage,
  listLabels,
  locale,
  renderActions,
  onItemsChange,
  className,
  ...dropzone
}: FileUploaderProps) {
  const uploads = useFileUploads({ upload, concurrency, previews, onUploaded, onError, getErrorMessage });
  const onItemsChangeRef = useLatestRef(onItemsChange);
  const { items } = uploads;
  useEffect(() => {
    onItemsChangeRef.current?.(items);
  }, [items, onItemsChangeRef]);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Controlled with an empty list: the rows below show the files instead. */}
      <FileDropzone {...dropzone} files={NO_FILES} onFilesChange={uploads.add} />
      {items.length ? (
        <FileUploadList
          items={items}
          onCancel={uploads.cancel}
          onRetry={uploads.retry}
          onRemove={uploads.remove}
          labels={listLabels}
          locale={locale}
          renderActions={renderActions}
        />
      ) : null}
    </div>
  );
}

const NO_FILES: File[] = [];
