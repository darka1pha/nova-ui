/*
 * Jalali (Solar Hijri, Persian) calendar arithmetic and Persian digit helpers.
 *
 * Conversion goes through Julian Day Numbers using the 33-year-cycle "breaks"
 * algorithm (Borkowski), which matches the official Iranian calendar for
 * Jalali years -61…3177. Dates are plain local `Date`s at midnight, like every
 * other date in the system: Jalali is only a way of naming and grouping days.
 */

export interface JalaliDate {
  year: number;
  /** 1 (Farvardin) … 12 (Esfand). */
  month: number;
  day: number;
}

const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b;

/** Jalali years where the leap pattern of the 33-year cycle shifts. */
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

/** Leap status, matching Gregorian year and the March day of Nowruz for a Jalali year. */
function jalCal(jy: number) {
  const last = BREAKS[BREAKS.length - 1] as number;
  if (jy < (BREAKS[0] as number) || jy >= last) throw new RangeError(`Jalali year ${jy} is out of range`);
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0] as number;
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i] as number;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

/** Gregorian date → Julian Day Number. */
function g2d(gy: number, gm: number, gd: number) {
  const d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

/** Julian Day Number → Gregorian date. */
function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaliDate {
  const { gy } = d2g(jdn);
  let jy = gy - 621;
  const r = jalCal(jy);
  let k = jdn - g2d(gy, 3, r.march);
  if (k >= 0) {
    if (k <= 185) return { year: jy, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { year: jy, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
}

/** The Jalali year, month and day of a local date. */
export function toJalali(date: Date): JalaliDate {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

/**
 * A local date (midnight) from a Jalali year, month and day. Out-of-range
 * months and days roll over, like `new Date(y, m, d)` does.
 */
export function fromJalali(year: number, month: number, day: number): Date {
  // Normalize the month so callers can step across years with month ± n.
  const y = year + Math.floor((month - 1) / 12);
  const m = ((((month - 1) % 12) + 12) % 12) + 1;
  const { gy, gm, gd } = d2g(j2d(y, m, 1) + day - 1);
  return new Date(gy, gm - 1, gd);
}

/** True when Esfand has 30 days. */
export function isJalaliLeapYear(year: number): boolean {
  return jalCal(year).leap === 0;
}

/** Days in a Jalali month: 31 for months 1–6, 30 for 7–11, 29 or 30 for Esfand. */
export function jalaliMonthLength(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

/* ---------------------------------------------------------------- Digits */

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/** Replaces Latin digits with Persian ones (۰–۹). Other characters are kept. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN[Number(d)] as string);
}

/**
 * Normalizes Persian (۰–۹) and Arabic-Indic (٠–٩) digits to Latin, and the
 * Persian decimal (٫) and thousands (٬) separators to "." and "", so what a
 * user types on a Persian keyboard can be parsed with `Number()`.
 */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/٬/g, "");
}
