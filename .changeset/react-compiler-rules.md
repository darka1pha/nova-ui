---
"@darkalpha/nova-ui": patch
---

Internal cleanup so components follow the React Compiler rules (no public API changes):

- Callbacks that hold the latest props (Countdown's `onComplete`, Kanban's pointer drag, RichTextEditor's handlers) update in a layout effect instead of during render, which stays correct under concurrent rendering.
- State that follows a prop is adjusted during render instead of in an effect, saving a re-render: ColorPicker's controlled `value`, `Image` resetting on a new `src`, Lightbox zoom resetting on close, FileUploadList announcements and the editor's link field. `Image` checks for an already-loaded server-rendered image through a callback ref.
- Countdown with `initialNow` switches to the browser clock on hydration instead of in a follow-up effect.
- Tour no longer shows the previous step's spotlight for a frame when reopened.
- RichTextEditor's image and link popovers drop `autoFocus`; the popover already focuses its first field when it opens.
