---
"@darkalpha/nova-ui": minor
---

- `TreeView` gains `checkable` (with `checkedIds`, `defaultCheckedIds`, `onCheckedIdsChange`) for picking several items: checking a branch checks every enabled leaf under it, and branches show checked, mixed or unchecked (`aria-checked`, `aria-multiselectable`).
- New experimental `TreeSelect` (`@darkalpha/nova-ui/experimental`): a field-styled trigger that opens a searchable `TreeView`. Pick one item (branches open instead, unless `branchesSelectable`), or several with `multiple`. Works with `FormField` and submits through `name`.
