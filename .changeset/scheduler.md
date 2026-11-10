---
"@darkalpha/nova-ui": minor
---

New experimental `Scheduler` (`@darkalpha/nova-ui/experimental`): events (`{ id, title, start, end, allDay?, color? }`) in month, week and day views, controlled or not (`view`, `date`). The month view is a keyboard grid (arrows mirrored in RTL, PageUp/PageDown, Enter picks a day, Tab reaches its events, "+N more" opens the day). Week and day views place timed events on an hour grid (`dayStartHour`, `dayEndHour`, `hourHeight`), side by side when they overlap, with all-day events above and a current-time line. Follows the locale's calendar (Jalali for fa), week start, weekend and digits. `onEventClick`, `onSlotClick`, `labels`.

The Gregorian/Persian month math Calendar uses moved to an internal module shared with Scheduler; Calendar's behavior is unchanged.
