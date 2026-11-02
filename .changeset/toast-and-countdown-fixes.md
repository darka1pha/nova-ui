---
"@darkalpha/nova-ui": patch
---

Fix `toast.dismiss()` leaving closed toasts in the store, which let them count toward the five-toast limit and push an open (e.g. `duration: Infinity`) toast off the stack. The oldest open toasts now animate out when the limit is passed, and swipe-to-dismiss follows the reading direction in RTL. `Countdown` now renders a `<span>` (its ref is an `HTMLSpanElement`), so it can sit inside a sentence without invalid `<p><div>` nesting.
