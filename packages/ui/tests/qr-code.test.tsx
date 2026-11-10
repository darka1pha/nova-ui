import { render, screen } from "@testing-library/react";
import jsQRModule from "jsqr";
import { describe, expect, it, vi } from "vitest";
import { QRCode } from "../src/experimental.ts";
import { ThemeProvider } from "../src/index.ts";
import { byteCapacity, encodeQR, type QRErrorCorrection, type QRMatrix } from "../src/utils/qr.ts";
import { axeViolations } from "./axe.ts";

// jsqr is CommonJS: depending on interop, the default import is the function or its module.
type Decoder = (data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts?: "dontInvert" }) => { data: string } | null;
const jsQR = ((jsQRModule as unknown as { default?: Decoder }).default ?? jsQRModule) as unknown as Decoder;

/** Rasterizes a matrix (with a 4-module quiet zone) and reads it back with an independent decoder. */
function decode(qr: QRMatrix, scale = 4): string | undefined {
  const quiet = 4;
  const dim = (qr.size + quiet * 2) * scale;
  const pixels = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.modules[y]?.[x]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (((y + quiet) * scale + dy) * dim + (x + quiet) * scale + dx) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
    }
  }
  return jsQR(pixels, dim, dim, { inversionAttempts: "dontInvert" })?.data;
}

describe("encodeQR", () => {
  it("matches the spec's byte-mode capacities", () => {
    // ISO/IEC 18004 table 7, byte mode.
    const table: [number, QRErrorCorrection, number][] = [
      [1, "L", 17], [1, "M", 14], [1, "Q", 11], [1, "H", 7],
      [2, "L", 32], [2, "M", 26], [2, "Q", 20], [2, "H", 14],
      [7, "L", 154], [7, "M", 122], [7, "Q", 86], [7, "H", 64],
      [10, "L", 271], [10, "M", 213], [10, "Q", 151], [10, "H", 119],
      [40, "L", 2953], [40, "M", 2331], [40, "Q", 1663], [40, "H", 1273],
    ];
    for (const [version, ecc, bytes] of table) expect(byteCapacity(version, ecc), `v${version}-${ecc}`).toBe(bytes);
  });

  it("produces codes an independent decoder reads, across versions and levels", () => {
    const texts = [
      "https://nova.example/track/KMS-94812",
      "HELLO WORLD",
      "",
      "a".repeat(100),
      "یلدا مبارک — Persian and emoji 🚢",
      "x".repeat(400),
      "Line one\nLine two\ttab",
    ];
    for (const text of texts) {
      for (const ecc of ["L", "M", "Q", "H"] as const) {
        const qr = encodeQR(text, { ecc, boostEcc: false });
        expect(qr.size).toBe(qr.version * 4 + 17);
        expect(decode(qr), `${JSON.stringify(text.slice(0, 20))} at ${ecc} (v${qr.version})`).toBe(text);
      }
    }
  });

  it("decodes with every mask pattern", () => {
    for (let mask = 0; mask < 8; mask++) {
      const qr = encodeQR("Mask test 0123456789", { mask });
      expect(qr.mask).toBe(mask);
      expect(decode(qr), `mask ${mask}`).toBe("Mask test 0123456789");
    }
  });

  it("fits the largest code and refuses one byte more", () => {
    const max = "z".repeat(2953);
    const qr = encodeQR(max, { ecc: "L" });
    expect(qr.version).toBe(40);
    expect(decode(qr, 2)).toBe(max);
    expect(() => encodeQR(`${max}z`, { ecc: "L" })).toThrow(RangeError);
  });

  it("picks the smallest version and raises the level when it fits for free", () => {
    const qr = encodeQR("hi", { ecc: "L" });
    expect(qr.version).toBe(1);
    expect(qr.ecc).toBe("H");
    expect(encodeQR("hi", { ecc: "L", boostEcc: false }).ecc).toBe("L");
    expect(encodeQR("hi", { minVersion: 5 }).version).toBe(5);
  });
});

describe("QRCode", () => {
  it("is a named image that decodes, and isn't mirrored in RTL", async () => {
    const { container } = render(
      <ThemeProvider dir="rtl">
        <QRCode value="nova.example" label="Link to the Nova site" size={120} />
      </ThemeProvider>,
    );
    const svg = screen.getByRole("img", { name: "Link to the Nova site" });
    expect(svg).toHaveStyle({ width: "120px", height: "120px" });
    expect(svg.getAttribute("viewBox")).toBe("0 0 29 29"); // version 1 (21) + 2 × 4 quiet modules
    expect(svg.querySelector("path")?.getAttribute("d")).toMatch(/^M4 4h7v1h-7z/); // the top-left finder starts the path
    expect(getComputedStyle(svg).transform).not.toContain("-1");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("draws exactly the encoder's modules", () => {
    const value = "https://nova.example/track/KMS-94812?ref=docs";
    const { container } = render(<QRCode value={value} label="Tracking" ecc="Q" margin={2} />);
    const qr = encodeQR(value, { ecc: "Q" });
    const d = container.querySelector("path")?.getAttribute("d") ?? "";
    const drawn = Array.from({ length: qr.size }, () => new Array<boolean>(qr.size).fill(false));
    for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
      for (let i = 0; i < Number(w); i++) {
        const row = drawn[Number(y) - 2];
        if (row) row[Number(x) - 2 + i] = true;
      }
    }
    expect(drawn).toEqual(qr.modules);
  });

  it("renders nothing and warns when the text doesn't fit", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<QRCode value={"z".repeat(3000)} label="Too long" ecc="L" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("too long"));
    warn.mockRestore();
  });
});
