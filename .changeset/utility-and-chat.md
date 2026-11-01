---
"@kaleido/ui": minor
---

Add a utility pack and a chat kit:

- **CodeBlock**: header, copy button, line numbers and highlighted lines; `renderLine` plugs in any syntax highlighter.
- **ExpandableText**: clamps to a few lines with a "Show more" toggle that only appears when the text overflows.
- **Popconfirm**: a small confirmation next to an action, focusing Cancel first for destructive ones, with async confirm.
- **Countdown**: time left until a moment, with localized units and a screen-reader label that updates once a minute.
- **Gauge**: a 240° meter with optional color bands.
- **TransferList**: move checked items between two searchable lists; posts values with native forms.
- **FileUploadList**: per-file upload progress with cancel, retry and remove; results are announced.
- **Chat**: `MessageList`, `MessageGroup`, `Message` (with a streaming state), `ChatComposer` and `TypingIndicator`.

Also exports `formatFileSize` and `splitDuration`.
