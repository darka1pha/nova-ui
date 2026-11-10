import { forwardRef, useMemo, type SVGAttributes } from "react";
import { cn } from "../utils/cn.ts";
import { devWarn } from "../utils/dev.ts";
import { encodeQR, type QRErrorCorrection } from "../utils/qr.ts";

export interface QRCodeProps extends Omit<SVGAttributes<SVGSVGElement>, "children" | "color"> {
  /** The text or URL to encode (UTF-8). */
  value: string;
  /** Accessible name, e.g. "Link to the tracking page". Say where it leads, not "QR code". */
  label: string;
  /** Width and height in px, or any CSS length. Default 160. */
  size?: number | string;
  /** Error correction: L 7%, M 15% (default), Q 25%, H 30% of the code can be damaged or covered. */
  ecc?: QRErrorCorrection;
  /** Quiet zone around the code, in modules. The spec asks for 4 (default); scanners need it. */
  margin?: number;
  /**
   * Module color. Default black. Keep it dark on a light background: many scanners can't
   * read light-on-dark codes, so the code doesn't follow dark mode.
   */
  color?: string;
  /** Background, including the quiet zone. Default white. */
  background?: string;
}

/**
 * A QR code drawn as one SVG path, so it stays sharp at any size and prints well.
 * Encoded in the browser or on the server with the built-in encoder (no dependency).
 * Long text makes a denser code: keep URLs short for codes printed small.
 */
export const QRCode = forwardRef<SVGSVGElement, QRCodeProps>(function QRCode(
  { value, label, size = 160, ecc = "M", margin = 4, color = "#000", background = "#fff", className, style, ...props },
  ref,
) {
  const qr = useMemo(() => {
    try {
      return encodeQR(value, { ecc });
    } catch (error) {
      devWarn(`QRCode: ${(error as Error).message}`);
      return null;
    }
  }, [value, ecc]);

  if (!qr) return null;
  const quiet = Math.max(0, Math.floor(margin));
  const dim = qr.size + quiet * 2;
  let d = "";
  qr.modules.forEach((row, y) => {
    // One subpath per horizontal run of dark modules keeps the path short.
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      let end = x;
      while (row[end + 1]) end++;
      d += `M${x + quiet} ${y + quiet}h${end - x + 1}v1h${x - end - 1}z`;
      x = end;
    }
  });
  const length = typeof size === "number" ? `${size}px` : size;

  return (
    <svg
      ref={ref}
      role="img"
      aria-label={label}
      viewBox={`0 0 ${dim} ${dim}`}
      shapeRendering="crispEdges"
      data-slot="qr-code"
      data-version={qr.version}
      className={cn("block shrink-0", className)}
      style={{ width: length, height: length, ...style }}
      {...props}
    >
      <rect width={dim} height={dim} fill={background} />
      <path d={d} fill={color} />
    </svg>
  );
});
