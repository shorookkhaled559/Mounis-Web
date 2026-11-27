import pool from "@/data/hadith-of-day.json";

export interface HadithOfDayEntry {
  /** collection id, e.g. "bukhari" */
  c: string;
  /** book number */
  b: number;
  /** hadith number */
  n: string;
  ar: string;
  en: string;
}

export const HADITH_OF_DAY_POOL: readonly HadithOfDayEntry[] = pool;

const DAY_MS = 86_400_000;

/** Calendar date (year, month, day) as it is in the given time zone. */
export function dateKey(date: Date, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/**
 * Same hadith for everybody all day, a new one at local midnight (Cairo time by
 * default), cycling through the whole pool before repeating.
 */
export function pickHadithOfDay(
  date: Date,
  entries: readonly HadithOfDayEntry[] = HADITH_OF_DAY_POOL,
  timeZone = "Africa/Cairo",
): HadithOfDayEntry | null {
  if (entries.length === 0) return null;
  const { y, m, d } = dateKey(date, timeZone);
  const days = Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
  return entries[((days % entries.length) + entries.length) % entries.length];
}
