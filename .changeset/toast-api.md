---
"@darkalpha/nova-ui": minor
---

Toast API additions:

- `toast.promise(promise, { loading, success, error })` shows a spinner while the promise is pending, then turns the same toast into a success or error toast. `success` and `error` take a title, full toast options, or a function of the result or the rejection reason. It returns the promise you passed in (or that the function returned), so `await` still gives you the value or throws. If the loading toast is dismissed, the outcome isn't shown.
- `onDismiss(id)` on a toast runs once however it closes: its timer, the close button, a swipe, `toast.dismiss()`, or being pushed out by newer toasts. It doesn't run when a toast with the same `id` replaces it.
- `<Toaster max>` sets how many toasts can be open at once (default 5, as before). Lowering it closes the oldest open toasts right away.
