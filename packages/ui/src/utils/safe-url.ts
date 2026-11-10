/* URL checks shared by the rich text editor and its static renderer (no Tiptap imports). */

/** Schemes a link may use. Anything else (javascript:, data:, vbscript:…) is refused. */
const SAFE_LINK_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Turns what the user typed into a link href: bare domains get https://, bare
 * emails get mailto:. Returns "" for a scheme outside {@link SAFE_LINK_SCHEMES},
 * which removes the link instead of storing a script URL.
 */
export function normalizeUrl(raw: string): string {
  // Browsers ignore ASCII whitespace and control characters inside a scheme ("java\tscript:").
  // eslint-disable-next-line no-control-regex
  const url = raw.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (!url) return url;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(url)?.[1];
  if (scheme) return SAFE_LINK_SCHEMES.has(`${scheme.toLowerCase()}:`) ? url : "";
  if (/^[/#?]/.test(url)) return url;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) return `mailto:${url}`;
  return `https://${url}`;
}

/**
 * An image `src` that is safe to render: http(s), protocol-relative or relative URLs, and
 * base64 `data:` URLs of raster image types (the editor accepts pasted base64 images).
 * Returns "" for anything else (javascript:, data:text/html, svg data URLs…).
 */
export function safeImageSrc(raw: string): string {
  // eslint-disable-next-line no-control-regex
  const url = raw.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (!url) return "";
  if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z\d+/=\s]+$/i.test(url)) return url;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(url)?.[1];
  if (scheme) return /^https?$/i.test(scheme) ? url : "";
  return url;
}
