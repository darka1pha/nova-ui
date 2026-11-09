---
"@darkalpha/nova-ui": minor
---

New `VirtualTable` for very large data. Only the rows in view are rendered, and with `virtualizeColumns` only the columns in view too, so 100,000 rows × 50 columns scroll smoothly. It stays a real `<table>` with `aria-rowcount`/`aria-rowindex` and `aria-colcount`/`aria-colindex`, a sticky header, and `pinned` leading columns. `selectable` adds a checkbox column: shift-click selects a range, and "Select all" covers every row, not only the rendered ones. It also has client-side sorting (or controlled `sort`), `onEndReached` for loading more, and `apiRef.scrollToRow()`. `virtualRange()`, the range math it shares with `VirtualList`, is exported.
