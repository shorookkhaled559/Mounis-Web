// Next-prayer + countdown maths (pure, unit tested).
import type { PrayerKey, PrayerTimesMap } from "./prayer";

export const FARD_ORDER: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export interface NextPrayer {
  key: PrayerKey;
  remainingMs: number;
}

/** The next fard prayer after `now`; after Isha it is tomorrow's Fajr. */
export function getNextPrayer(now: Date, times: PrayerTimesMap, tomorrowFajr: Date): NextPrayer {
  const upcoming = FARD_ORDER.find((k) => times[k].getTime() > now.getTime());
  if (upcoming) return { key: upcoming, remainingMs: times[upcoming].getTime() - now.getTime() };
  return { key: "fajr", remainingMs: Math.max(0, tomorrowFajr.getTime() - now.getTime()) };
}

export function splitCountdown(ms: number): { h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
