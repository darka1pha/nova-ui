---
"@darkalpha/nova-ui": minor
---

New experimental `MentionTextarea` (`@darkalpha/nova-ui/experimental`): a textarea that suggests people, tags or anything else after a trigger character typed at the start of a word. Each trigger has fixed `options` or `loadOptions(query, signal)` (debounced; a newer query aborts the older request). Arrows move, Enter or Tab inserts plain text ("@Sara Ahmadi "), Escape closes; `onMention` reports what was picked. Focus stays in the textarea, which drives the listbox through `aria-activedescendant`, and the list opens at the caret.
