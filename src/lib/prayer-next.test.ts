import { describe, expect, it } from "vitest";
import { getNextPrayer, splitCountdown, pad2 } from "./prayer-next";
import { CITIES, getPrayerTimes } from "./prayer";

const cairo = CITIES[0];
const times = getPrayerTimes(cairo, "egyptian", { y: 2026, m: 11, d: 26 });
const tomorrow = getPrayerTimes(cairo, "egyptian", { y: 2026, m: 11, d: 27 }).fajr;

describe("getNextPrayer", () => {
  it("before Fajr → Fajr", () => {
    const r = getNextPrayer(new Date(times.fajr.getTime() - 60_000), times, tomorrow);
    expect(r.key).toBe("fajr");
    expect(r.remainingMs).toBe(60_000);
  });
  it("after Fajr (sunrise is not a fard) → Dhuhr", () => {
    expect(getNextPrayer(new Date(times.sunrise.getTime() + 1000), times, tomorrow).key).toBe("dhuhr");
  });
  it("after Isha → tomorrow's Fajr", () => {
    const r = getNextPrayer(new Date(times.isha.getTime() + 1000), times, tomorrow);
    expect(r.key).toBe("fajr");
    expect(r.remainingMs).toBe(tomorrow.getTime() - times.isha.getTime() - 1000);
  });
});

describe("splitCountdown", () => {
  it("splits h/m/s", () => expect(splitCountdown((1 * 3600 + 46 * 60 + 34) * 1000)).toEqual({ h: 1, m: 46, s: 34 }));
  it("never goes negative", () => expect(splitCountdown(-5000)).toEqual({ h: 0, m: 0, s: 0 }));
  it("pads", () => expect(pad2(5)).toBe("05"));
});
