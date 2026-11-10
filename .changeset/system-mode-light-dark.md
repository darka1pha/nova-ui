---
"@darkalpha/nova-tokens": patch
"@darkalpha/nova-ui": patch
---

Fix system color mode in apps whose CSS pipeline lowers `light-dark()`, including every Tailwind v4 app that imports `@darkalpha/nova-ui/tailwind.css` (Tailwind's Lightning CSS targets browsers without `light-dark()`). The lowered form only resolves where `color-scheme` is set, and the default color tokens were declared on `:root` alone, so with no explicit mode every color became an invalid value like `#fff#1a1510`: black text on no background. The `light-dark()` tokens are now also declared on the outermost theme root (`.nv-theme` / `[data-nv-theme]`), where the color scheme lives. Explicit light and dark modes, nested themes and native `light-dark()` are unaffected.
