/*
 * Where the caret is inside a textarea or input, in px from the element's border box.
 *
 * Browsers don't expose caret coordinates for form fields, so this lays the text out in a
 * hidden copy (a "mirror") with the same box, font and wrapping, puts a marker where the
 * caret is, and measures the marker. Scrolling inside the field is subtracted.
 */

// Everything that affects where text wraps and lines fall.
const COPIED = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
  "MozTabSize",
] as const;

export interface CaretCoordinates {
  top: number;
  left: number;
  /** Height of the line the caret is on. */
  height: number;
}

export function caretCoordinates(element: HTMLTextAreaElement | HTMLInputElement, position: number): CaretCoordinates {
  const doc = element.ownerDocument;
  const style = doc.defaultView?.getComputedStyle(element);
  const mirror = doc.createElement("div");
  doc.body.appendChild(mirror);
  const s = mirror.style;
  const isInput = element.nodeName === "INPUT";
  s.position = "absolute";
  s.visibility = "hidden";
  s.top = "0";
  s.left = "-9999px";
  s.whiteSpace = isInput ? "nowrap" : "pre-wrap";
  if (!isInput) s.overflowWrap = "break-word";
  if (style) {
    for (const prop of COPIED) (s as unknown as Record<string, string>)[prop] = (style as unknown as Record<string, string>)[prop] ?? "";
  }
  s.overflow = "hidden";

  mirror.textContent = element.value.slice(0, position);
  const marker = doc.createElement("span");
  // The rest of the text keeps wrapping the same; "." gives an empty tail a height.
  marker.textContent = element.value.slice(position) || ".";
  mirror.appendChild(marker);

  const lineHeight = Number.parseFloat(style?.lineHeight ?? "") || Number.parseFloat(style?.fontSize ?? "16") * 1.4;
  const coords = {
    top: marker.offsetTop + (Number.parseFloat(style?.borderTopWidth ?? "0") || 0) - element.scrollTop,
    left: marker.offsetLeft + (Number.parseFloat(style?.borderLeftWidth ?? "0") || 0) - element.scrollLeft,
    height: lineHeight,
  };
  mirror.remove();
  return coords;
}
