---
"@kaleido/ui": minor
---

Forms: FormField gains `warning`, `success`, multiple errors and an `optional` hint; messages use a polite live region and controls reflect valid/warning states. Composite controls (Combobox, DatePicker, PinInput, TagInput, FileDropzone) accept `name` and `onBlur` for native forms and form libraries. New optional entry `@kaleido/ui/react-hook-form` with `Form`, `FormController`, bound fields for every control, `FormErrorSummary`, `FormRootError`, `FormSuccess`, `FormSubmit`, `FormReset`, `FormError` and schema-derived required markers (zod v3/v4). Alerts are now named by their title, and the DatePicker trigger uses the combobox role.
