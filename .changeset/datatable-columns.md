---
"@darkalpha/nova-ui": minor
---

`DataTable` column features, all off by default:

- `resizableColumns` (with `columnWidths` / `onColumnWidthsChange`): a handle on each header edge, dragged or moved with the arrow keys (Shift for bigger steps, mirrored in RTL). The first resize freezes every column at its width in a fixed layout.
- `reorderableColumns` (with `columnOrder` / `onColumnOrderChange`): drag a header onto another, or use its grip button with the arrow keys; moves are announced.
- Column `editable` (boolean or per-row function) with `editValue`, and `onCellEdit(row, columnId, value)` on the table: cells edit in place with InlineEdit (async saves and error messages included).
- `groupBy` (a column id) and `renderGroup`: rows under collapsible group headings with a count.
- New `labels`: `resize`, `move`, `moved`, `group`, `edit`.
