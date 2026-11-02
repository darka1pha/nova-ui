---
"@darkalpha/nova-ui": minor
---

Add six components: `MultiSelect` (searchable multi-choice with chips, `max` and creatable options), `DateTimePicker` (Calendar and TimeInput in one popover, submits local `YYYY-MM-DDTHH:mm`), `KanbanBoard` (drag or keyboard moves across columns, WIP limits, announcements), `Masonry` (shortest-column packing that keeps DOM order), `InfiniteScroll` (IntersectionObserver loading with a Load more fallback) and `SignaturePad` (pointer drawing with undo, clear and a typed alternative).

Fix `Toaster` logging "The result of getServerSnapshot should be cached" when hydrating server-rendered pages (Next.js App Router).
