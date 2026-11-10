---
"@darkalpha/nova-ui": patch
---

Every component is about 2.5 kB gzip smaller (Button 14.4 → 11.9 kB). `cn()` now uses a tailwind-merge config cut down to the class groups the components use and the groups that conflict with them, generated from tailwind-merge's own config. A consumer's `className` overrides a component's classes exactly as before. One difference: two conflicting classes that both come from your own `className` are only deduplicated when their utility family is one the components use.
