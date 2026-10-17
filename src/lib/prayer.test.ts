import { describe, expect, it } from "vitest";
import {
  addDays, CITIES, formatPrayerTime, getPrayerTimes, isValidTimeZone, parseSavedPrefs,
} from "./prayer";

const cairo = CITIES.find((c) => c.id === "cairo")!;

describe("getPrayerTimes", () => {
  const times = getPrayerTimes(cairo, "egyptian", { y: 2026, m: 10, d: 17 });

  it("returns the prayers in chronological order", () => {
    const order = [times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha];
    for (let i = 1; i < order.length; i++) expect(order[i].getTime()).toBeGreaterThan(order[i - 1].getTime());
  });

  it("puts Dhuhr around solar noon in Cairo local time", () => {
    const { time, period } = formatPrayerTime(times.dhuhr, cairo.tz, "dhuhr", false);
    expect(period).toBe("PM");
    const [h] = time.split(":").map(Number);
    expect([11, 12]).toContain(h);
  });
});

describe("addDays", () => {
  it("rolls over month and year boundaries", () => {
    expect(addDays({ y: 2026, m: 12, d: 31 }, 1)).toEqual({ y: 2027, m: 1, d: 1 });
    expect(addDays({ y: 2026, m: 3, d: 1 }, -1)).toEqual({ y: 2026, m: 2, d: 28 });
  });
});

describe("saved preferences", () => {
  const good = JSON.stringify({ loc: cairo, methodId: "egyptian" });
  it("accepts a valid payload", () => expect(parseSavedPrefs(good)?.methodId).toBe("egyptian"));
  it.each([
    ["null", null],
    ["not json", "{oops"],
    ["bad timezone", JSON.stringify({ loc: { ...cairo, tz: "Mars/Base" }, methodId: "egyptian" })],
    ["bad latitude", JSON.stringify({ loc: { ...cairo, lat: 999 }, methodId: "egyptian" })],
    ["unknown method", JSON.stringify({ loc: cairo, methodId: "nope" })],
  ])("rejects %s", (_n, raw) => expect(parseSavedPrefs(raw as string | null)).toBeNull());

  it("isValidTimeZone", () => {
    expect(isValidTimeZone("Africa/Cairo")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });
});
