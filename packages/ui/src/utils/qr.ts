/*
 * QR Code encoder (ISO/IEC 18004): byte mode (UTF-8), error correction L/M/Q/H,
 * versions 1–40, automatic mask selection. No dependencies; the output is a module
 * matrix the QRCode component draws as SVG.
 */

export type QRErrorCorrection = "L" | "M" | "Q" | "H";

export interface QRMatrix {
  /** Modules per side, without the quiet zone. */
  size: number;
  version: number;
  ecc: QRErrorCorrection;
  mask: number;
  /** `modules[y][x]` is true for a dark module. */
  modules: boolean[][];
}

export interface EncodeQROptions {
  /** Error correction level. Default "M" (about 15% of the code can be damaged). */
  ecc?: QRErrorCorrection;
  /** Use a higher level when it fits in the same version. Default true. */
  boostEcc?: boolean;
  minVersion?: number;
  maxVersion?: number;
  /** Force a mask pattern (0–7) instead of picking the one with the lowest penalty. */
  mask?: number;
}

const LEVELS: QRErrorCorrection[] = ["L", "M", "Q", "H"];
const FORMAT_BITS: Record<QRErrorCorrection, number> = { L: 1, M: 0, Q: 3, H: 2 };

// Indexed by level then version (index 0 unused).
// prettier-ignore
const ECC_PER_BLOCK: Record<QRErrorCorrection, number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};
// prettier-ignore
const BLOCKS: Record<QRErrorCorrection, number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

const at = (table: number[], i: number) => table[i] ?? 0;

/** Bits available for data and error correction, after the function patterns. */
function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** Data codewords (bytes) a version holds at a level. */
export function dataCodewords(version: number, ecc: QRErrorCorrection): number {
  return Math.floor(rawDataModules(version) / 8) - at(ECC_PER_BLOCK[ecc], version) * at(BLOCKS[ecc], version);
}

/** Bits a byte-mode segment of `bytes` bytes needs in a version. */
const segmentBits = (version: number, bytes: number) => 4 + (version <= 9 ? 8 : 16) + bytes * 8;

/** The most bytes of text a version holds at a level in byte mode. */
export function byteCapacity(version: number, ecc: QRErrorCorrection): number {
  return Math.floor((dataCodewords(version, ecc) * 8 - 4 - (version <= 9 ? 8 : 16)) / 8);
}

/* ------------------------------------------------------------ Reed–Solomon */

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j] ?? 0, root);
      if (j + 1 < degree) result[j] = (result[j] ?? 0) ^ (result[j + 1] ?? 0);
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] = (result[i] ?? 0) ^ gfMultiply(coef, factor)));
  }
  return result;
}

/** Splits data into blocks, adds error correction to each, and interleaves them. */
function addEccAndInterleave(data: number[], version: number, ecc: QRErrorCorrection): number[] {
  const numBlocks = at(BLOCKS[ecc], version);
  const blockEccLen = at(ECC_PER_BLOCK[ecc], version);
  const rawCodewords = Math.floor(rawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(blockEccLen);

  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dataLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const block = data.slice(k, k + dataLen);
    k += dataLen;
    const eccBytes = rsRemainder(block, divisor);
    if (i < numShortBlocks) block.push(0); // placeholder, skipped when interleaving
    blocks.push(block.concat(eccBytes));
  }

  const result: number[] = [];
  const width = blocks[0]?.length ?? 0;
  for (let i = 0; i < width; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i] ?? 0);
    });
  }
  return result;
}

/* ---------------------------------------------------------------- Matrix */

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const result = [6];
  for (let pos = version * 4 + 17 - 7; result.length < count; pos -= step) result.splice(1, 0, pos);
  return result;
}

const bit = (value: number, i: number) => ((value >>> i) & 1) !== 0;

class Builder {
  readonly size: number;
  readonly modules: boolean[][];
  private readonly fn: boolean[][];

  constructor(
    readonly version: number,
    readonly ecc: QRErrorCorrection,
  ) {
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.fn = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.drawFunctionPatterns();
  }

  private set(x: number, y: number, dark: boolean) {
    const row = this.modules[y];
    if (row) row[x] = dark;
  }

  private setFunction(x: number, y: number, dark: boolean) {
    this.set(x, y, dark);
    const row = this.fn[y];
    if (row) row[x] = true;
  }

  private isFunction(x: number, y: number) {
    return this.fn[y]?.[x] ?? false;
  }

  private drawFunctionPatterns() {
    const { size } = this;
    for (let i = 0; i < size; i++) {
      this.setFunction(6, i, i % 2 === 0);
      this.setFunction(i, 6, i % 2 === 0);
    }
    for (const [cx, cy] of [
      [3, 3],
      [size - 4, 3],
      [3, size - 4],
    ] as const) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          this.setFunction(x, y, dist !== 2 && dist !== 4);
        }
      }
    }
    const align = alignmentPositions(this.version);
    const last = align.length - 1;
    align.forEach((ay, i) =>
      align.forEach((ax, j) => {
        // The three corners hold finder patterns.
        if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.setFunction(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }),
    );
    this.drawFormatBits(0); // reserves the area; redrawn once the mask is chosen
    this.drawVersion();
  }

  drawFormatBits(mask: number) {
    const data = (FORMAT_BITS[this.ecc] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const { size } = this;
    for (let i = 0; i <= 5; i++) this.setFunction(8, i, bit(bits, i));
    this.setFunction(8, 7, bit(bits, 6));
    this.setFunction(8, 8, bit(bits, 7));
    this.setFunction(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunction(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.setFunction(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunction(8, size - 15 + i, bit(bits, i));
    this.setFunction(8, size - 8, true); // the dark module
  }

  private drawVersion() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunction(a, b, bit(bits, i));
      this.setFunction(b, a, bit(bits, i));
    }
  }

  drawCodewords(data: number[]) {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // skip the vertical timing column
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction(x, y) && i < data.length * 8) {
            this.set(x, y, bit(data[i >>> 3] ?? 0, 7 - (i & 7)));
            i++;
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.isFunction(x, y)) continue;
        let invert: boolean;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (invert) this.set(x, y, !this.modules[y]?.[x]);
      }
    }
  }

  /** The spec's mask penalty: long runs, 2×2 blocks, finder-like patterns and dark/light balance. */
  penalty(): number {
    const { size, modules } = this;
    const get = (x: number, y: number) => modules[y]?.[x] ?? false;
    let score = 0;
    const finderA = [true, false, true, true, true, false, true, false, false, false, false];
    const finderB = [...finderA].reverse();
    for (const horizontal of [true, false]) {
      for (let a = 0; a < size; a++) {
        const line = Array.from({ length: size }, (_, b) => (horizontal ? get(b, a) : get(a, b)));
        let run = 1;
        for (let b = 1; b <= size; b++) {
          if (b < size && line[b] === line[b - 1]) run++;
          else {
            if (run >= 5) score += 3 + (run - 5);
            run = 1;
          }
        }
        for (let b = 0; b + 11 <= size; b++) {
          const matches = (p: boolean[]) => p.every((v, k) => line[b + k] === v);
          if (matches(finderA) || matches(finderB)) score += 40;
        }
      }
    }
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = get(x, y);
        if (c === get(x + 1, y) && c === get(x, y + 1) && c === get(x + 1, y + 1)) score += 3;
      }
    }
    const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    const total = size * size;
    score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  }
}

/**
 * Encodes text as a QR code. Text is UTF-8 in byte mode. Throws a RangeError when it
 * doesn't fit in `maxVersion` at the requested level.
 */
export function encodeQR(text: string, options: EncodeQROptions = {}): QRMatrix {
  const { boostEcc = true, minVersion = 1, maxVersion = 40, mask: forcedMask } = options;
  let ecc = options.ecc ?? "M";
  if (!(minVersion >= 1 && minVersion <= maxVersion && maxVersion <= 40)) throw new RangeError("QR versions must satisfy 1 ≤ minVersion ≤ maxVersion ≤ 40");
  if (forcedMask !== undefined && !(Number.isInteger(forcedMask) && forcedMask >= 0 && forcedMask <= 7)) throw new RangeError("QR mask must be 0–7");

  const bytes = Array.from(new TextEncoder().encode(text));
  let version = minVersion;
  while (segmentBits(version, bytes.length) > dataCodewords(version, ecc) * 8) {
    if (version >= maxVersion) throw new RangeError(`Text is too long for a QR code (${bytes.length} bytes; at most ${byteCapacity(maxVersion, ecc)} at level ${ecc}).`);
    version++;
  }
  if (boostEcc) {
    for (const level of LEVELS.slice(LEVELS.indexOf(ecc) + 1)) {
      if (segmentBits(version, bytes.length) <= dataCodewords(version, level) * 8) ecc = level;
    }
  }

  // Byte-mode segment, terminator, padding to whole bytes, then the 0xEC/0x11 pad pattern.
  const capacity = dataCodewords(version, ecc) * 8;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));

  const qr = new Builder(version, ecc);
  qr.drawCodewords(addEccAndInterleave(data, version, ecc));

  let mask = forcedMask ?? 0;
  if (forcedMask === undefined) {
    let best = Infinity;
    for (let m = 0; m < 8; m++) {
      qr.applyMask(m);
      qr.drawFormatBits(m);
      const score = qr.penalty();
      if (score < best) {
        best = score;
        mask = m;
      }
      qr.applyMask(m); // XOR again to undo
    }
  }
  qr.applyMask(mask);
  qr.drawFormatBits(mask);
  return { size: qr.size, version, ecc, mask, modules: qr.modules };
}
