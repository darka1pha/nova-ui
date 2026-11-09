---
"@darkalpha/nova-ui": minor
---

Combobox async search and creatable options, and a FileUploader:

- `Combobox` `loadOptions(query, signal)` fetches options as the user types (debounced by `debounceMs`, default 250). A newer query or closing the list aborts the older request through `signal`. `loadingMessage` and `errorMessage` cover the pending and failed states. `options` is now optional.
- `Combobox` `creatable` adds a "Create …" item when the search doesn't exactly match an option. `onCreate(label)` can return the new option or its value (or a promise of either); `formatCreateLabel` changes the text.
- The Combobox popup is now named after the field (`aria-label`, else `searchPlaceholder`), so it isn't announced as an unnamed dialog.
- `useFileUploads({ upload, concurrency })` manages an upload queue for `FileUploadList`: progress through `onProgress`, cancel through an `AbortSignal`, retry, image thumbnails, and abort on unmount. `FileUploader` wires it to a `FileDropzone`.
