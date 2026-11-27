import { describe, expect, it } from "vitest";
import { HADITH_OF_DAY_POOL, dateKey, pickHadithOfDay, type HadithOfDayEntry } from "./hadith-of-day";
import { isValidHadithNumber } from "./hadith-view";

const entries: HadithOfDayEntry[] = [0, 1, 2].map((i) => ({
  c: "bukhari",
  b: 1,
  n: String(i),
  ar: `ar${i}`,
  en: `en${i}`,
}));

describe("pickHadithOfDay", () => {
  it("is stable within a day and changes at midnight (Cairo)", () => {
    const morning = pickHadithOfDay(new Date("2026-11-20T06:00:00+02:00"), entries);
    const night = pickHadithOfDay(new Date("2026-11-20T23:59:00+02:00"), entries);
    const next = pickHadithOfDay(new Date("2026-11-21T00:01:00+02:00"), entries);
    expect(morning).toEqual(night);
    expect(next?.n).not.toBe(morning?.n);
  });
  it("cycles through every entry before repeating", () => {
    const seen = new Set<string>();
    for (let day = 0; day < 3; day++) {
      const date = new Date(Date.UTC(2026, 10, 1 + day, 12));
      seen.add(pickHadithOfDay(date, entries)?.n ?? "");
    }
    expect(seen.size).toBe(3);
  });
  it("returns null for an empty pool", () => {
    expect(pickHadithOfDay(new Date(), [])).toBeNull();
  });
  it("uses the calendar date of the time zone", () => {
    expect(dateKey(new Date("2026-11-20T23:30:00Z"), "Africa/Cairo")).toEqual({ y: 2026, m: 11, d: 21 });
    expect(dateKey(new Date("2026-11-20T23:30:00Z"), "UTC")).toEqual({ y: 2026, m: 11, d: 20 });
  });
});

describe("the pool", () => {
  it("only draws from the two Sahih collections", () => {
    for (const e of HADITH_OF_DAY_POOL) expect(["bukhari", "muslim"].includes(e.c)).toBe(true);
  });
  it("has valid, unique references", () => {
    const keys = new Set(HADITH_OF_DAY_POOL.map((e) => `${e.c}:${e.b}:${e.n}`));
    expect(keys.size).toBe(HADITH_OF_DAY_POOL.length);
    for (const e of HADITH_OF_DAY_POOL) expect(isValidHadithNumber(e.n)).toBe(true);
  });
  it("has text in both languages", () => {
    for (const e of HADITH_OF_DAY_POOL) {
      expect(e.ar.length > 20).toBe(true);
      expect(e.en.length > 20).toBe(true);
    }
  });
});
