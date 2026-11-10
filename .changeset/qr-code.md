---
"@darkalpha/nova-ui": minor
---

New experimental `QRCode` (`@darkalpha/nova-ui/experimental`): a QR code for a URL or text, drawn as one SVG path with a built-in encoder (no new dependency), so it renders on the server and stays sharp at any size. Byte mode (UTF-8), error correction `ecc` L/M/Q/H, versions 1–40 and automatic mask selection; `size`, `margin` (quiet zone), `color` and `background`. `role="img"` with a required `label`. The encoder is exported as `encodeQR()` for other renderers.
