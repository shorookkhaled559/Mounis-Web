// Pure Hijri month-grid helpers (no React / browser APIs) so they can be unit tested.
import { toHijri, type DayParts } from "./prayer";

const DAY_MS = 86_400_000;

/** A calendar day as a UTC-noon instant (immune to DST / timezone edges). */
export function noonUtc(d: DayParts): Date {
  return new Date(Date.UTC(d.y, d.m - 1, d.d, 12));
}

function partsOf(date: Date): DayParts {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

const hijriDayOf = (date: Date, isArabic: boolean) => toHijri(date, "UTC", isArabic).day;

/** Gregorian noon-UTC instant of day 1 of the Hijri month containing `date`. */
function startOfHijriMonth(date: Date, isArabic: boolean): Date {
  return new Date(date.getTime() - (hijriDayOf(date, isArabic) - 1) * DAY_MS);
}

/** Day 1 of the Hijri month that is `delta` months away from the month of `start`. */
function shiftHijriMonth(start: Date, delta: number, isArabic: boolean): Date {
  let cur = start;
  for (let i = 0; i < Math.abs(delta); i++) {
    if (delta > 0) {
      // Hijri months have 29 or 30 days: start+29 is day 30 (30-day month) or day 1 (29-day month)
      let next = new Date(cur.getTime() + 29 * DAY_MS);
      if (hijriDayOf(next, isArabic) !== 1) next = new Date(next.getTime() + DAY_MS);
      cur = next;
    } else {
      cur = startOfHijriMonth(new Date(cur.getTime() - DAY_MS), isArabic);
    }
  }
  return cur;
}

export interface HijriMonthCell {
  /** Hijri day of month (1-30) */
  hDay: number;
  /** Matching Gregorian calendar day */
  g: DayParts;
}

export interface HijriMonthGrid {
  monthName: string;
  year: number;
  /** empty slots before day 1 so the grid lines up with the weekday header */
  blanks: number;
  cells: HijriMonthCell[];
}

/**
 * Month grid for the Hijri month that is `monthDelta` months away from the month
 * that contains the Gregorian day `today`. `weekStart` is 0=Sunday … 6=Saturday.
 */
export function buildHijriMonth(
  today: DayParts,
  monthDelta: number,
  isArabic: boolean,
  weekStart: number,
): HijriMonthGrid {
  const first = shiftHijriMonth(startOfHijriMonth(noonUtc(today), isArabic), monthDelta, isArabic);
  const head = toHijri(first, "UTC", isArabic);

  const cells: HijriMonthCell[] = [];
  for (let i = 0; i < 31; i++) {
    const date = new Date(first.getTime() + i * DAY_MS);
    const h = toHijri(date, "UTC", isArabic);
    if (i > 0 && h.day === 1) break; // reached the next month
    cells.push({ hDay: h.day, g: partsOf(date) });
  }

  const blanks = (first.getUTCDay() - weekStart + 7) % 7;
  return { monthName: head.monthName, year: head.year, blanks, cells };
}
