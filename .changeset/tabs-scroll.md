---
"@darkalpha/nova-ui": patch
---

A horizontal `TabsList` (underline and segmented) that's wider than its container now scrolls sideways instead of pushing the page wider. The scrollbar is hidden; swiping, a trackpad, or the arrow keys move along it, and the active tab is scrolled into view when it changes. Pills still wrap onto more lines.

The underline rule is now an inset shadow instead of a bottom border, so scrolling doesn't clip it or the indicator, and the underline variant's focus ring is drawn inside the tab. It looks the same as before.
