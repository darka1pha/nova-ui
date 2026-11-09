---
"@darkalpha/nova-ui": minor
---

`Countdown` gains `as` and `format`:

- `as="div"` renders a block element for layouts that hold block content (the default is still an inline `<span>`). The ref type is now `HTMLElement`; a `RefObject<HTMLSpanElement>` still type-checks.
- `format={(parts) => …}` replaces the built-in markup with your own, e.g. `02:15:09`. It gets `days`, `hours`, `minutes`, `seconds`, `total`, `done` and `placeholder` (true on the server without `initialNow`). The timer keeps its spoken label, and `completed` still wins once it finishes. `CountdownParts` is exported.
