---
"@darkalpha/nova-tokens": minor
---

Chart colors meet 3:1 against the page and cards (WCAG 1.4.11). Light mode: `chart-3` `#1baf7a` → `#00a470`, `chart-4` `#eda100` → `#c18200`, `chart-5` `#e87ba4` → `#d86d96`. Kaveh presets: light `chart-1` `#e76a2a`, `chart-3` `#b34700`, `chart-6` `#7b8fb2` (Yalda `chart-4` `#c38100`, Nowruz `chart-4` `#039fa1`), dark `chart-6` `#4978c4`. `auditContrast` now also checks every `chart-*` token against `background`, `surface` and `surface-raised`, so a custom theme with an unreadable series color is reported.
