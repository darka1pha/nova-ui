---
"@darkalpha/nova-ui": patch
---

`toast.promise` always settles its toast. A function that throws before returning a promise now counts as a rejection: the error toast shows and the returned promise rejects. Before, the loading spinner never stopped. A `success` formatter that throws shows the error outcome. If the `error` formatter throws, the toast closes and the error is logged with `console.error`.
