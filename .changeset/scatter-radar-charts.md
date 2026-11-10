---
"@darkalpha/nova-ui": minor
---

New experimental charts in `@darkalpha/nova-ui/experimental`, built like the existing ones (dependency-free SVG, hover and keyboard tooltips, a legend, and a data table that's always available to screen readers):

- `ScatterChart`: `x` and `y` fields per row, with optional `group` (colors and legend), `size` (bubbles, area scaled), `pointLabel`, axis titles and formatters. Arrow keys step through points in x order; RTL mirrors the x axis.
- `RadarChart`: one spoke per row of `data`, one polygon per series, from zero at the center. Arrow keys walk the spokes and wrap; RTL mirrors the direction.
