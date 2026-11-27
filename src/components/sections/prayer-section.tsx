"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  CITIES, METHODS, DEFAULT_LOCATION, DEFAULT_METHOD_ID,
  getPrayerTimes, dayPartsInTz, addDays, parseSavedPrefs,
  toHijri, formatHijri, formatGregorian,
  type PrayerLocation,
} from "@/lib/prayer";
import { getNextPrayer, splitCountdown } from "@/lib/prayer-next";
import { QiblaCompass } from "./qibla-compass";
import { PrayerTimesCard } from "./prayer-times-card";
import { LocationSettingsCard, type SettingsValue, type TzMode } from "./location-settings-card";
import { HijriCalendarCard } from "./hijri-calendar-card";
import { PrayerInfoBar } from "./prayer-info-bar";

const STORAGE_KEY = "mounis-prayer-prefs-v1";
const TZ_KEY = "mounis-prayer-tz-v1";

interface Prefs {
  loc: PrayerLocation;
  methodId: string;
}

interface PrayerSectionProps {
  locale: string;
}

export function PrayerSection({ locale }: PrayerSectionProps) {
  const isArabic = locale === "ar";
  const t = useTranslations("prayerPage");

  const [prefs, setPrefs] = useState<Prefs>({ loc: DEFAULT_LOCATION, methodId: DEFAULT_METHOD_ID });
  const [tzMode, setTzMode] = useState<TzMode>("location");
  const [deviceTz, setDeviceTz] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null); // null until mounted (avoids hydration mismatch)
  const [justSaved, setJustSaved] = useState(false);

  // ── Load saved preferences once ────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const saved = parseSavedPrefs(localStorage.getItem(STORAGE_KEY));
        if (saved) setPrefs(saved);
        if (localStorage.getItem(TZ_KEY) === "device") setTzMode("device");
      } catch {
        /* ignore */
      }
      setDeviceTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const persist = useCallback((next: Prefs, mode: TzMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem(TZ_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Live clock (1s) ────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const { loc, methodId } = prefs;
  const method = METHODS.find((m) => m.id === methodId) ?? METHODS[0];
  // zone the clock times are displayed in
  const displayTz = tzMode === "device" && deviceTz ? deviceTz : loc.tz;

  // Today's day in the *selected location's* timezone (not the device's)
  const todayKey = now ? dayPartsInTz(now, loc.tz) : null;
  // primitives, so the memos below only recompute when the calendar day changes
  const ty = todayKey?.y;
  const tm = todayKey?.m;
  const td = todayKey?.d;

  const times = useMemo(() => {
    if (ty == null || tm == null || td == null) return null;
    return getPrayerTimes(loc, methodId, { y: ty, m: tm, d: td });
  }, [loc, methodId, ty, tm, td]);

  const tomorrowFajr = useMemo(() => {
    if (ty == null || tm == null || td == null) return null;
    return getPrayerTimes(loc, methodId, addDays({ y: ty, m: tm, d: td }, 1)).fajr;
  }, [loc, methodId, ty, tm, td]);

  const next = now && times && tomorrowFajr ? getNextPrayer(now, times, tomorrowFajr) : null;
  const countdown = splitCountdown(next?.remainingMs ?? 0);

  // ── Dates ──────────────────────────────────────────────────────────────────
  const gregorianStr = now ? formatGregorian(now, loc.tz, isArabic) : "";
  const hijriToday = now ? toHijri(now, loc.tz, isArabic) : null;
  const hijriStr = hijriToday ? formatHijri(hijriToday, isArabic) : "";
  const locName = isArabic ? loc.nameAr : loc.nameEn;
  const methodName = isArabic ? method.nameAr : method.nameEn;

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveSettings = useCallback(
    ({ locId, methodId: mId, tzMode: mode }: SettingsValue) => {
      const city = CITIES.find((c) => c.id === locId);
      const nextPrefs: Prefs = { loc: city ?? prefs.loc, methodId: mId };
      setPrefs(nextPrefs);
      setTzMode(mode);
      persist(nextPrefs, mode);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    },
    [prefs.loc, persist],
  );

  // The compass hands us the device position; here we turn it into a saved location
  const applyDeviceLocation = useCallback(
    async (lat: number, lng: number) => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fallback = t("currentLocationName");
      const gps = (name: string): Prefs => ({
        methodId: prefs.methodId,
        loc: { id: "gps", nameAr: name, nameEn: name, lat, lng, tz },
      });
      setPrefs(gps(fallback));
      persist(gps(fallback), tzMode);

      // Reverse geocode for a readable name (best effort)
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${isArabic ? "ar" : "en"}`,
          { signal: ctrl.signal },
        );
        clearTimeout(timer);
        if (!res.ok) return;
        const j = await res.json();
        const place = j.city || j.locality || j.principalSubdivision;
        if (!place) return;
        const name = j.countryName ? `${place}${isArabic ? "، " : ", "}${j.countryName}` : place;
        const named = gps(name);
        // only apply if the user has not picked something else in the meantime
        setPrefs((cur) => (cur.loc.id === "gps" && cur.loc.lat === lat && cur.loc.lng === lng ? named : cur));
        persist(named, tzMode);
      } catch {
        /* keep fallback name */
      }
    },
    [isArabic, prefs.methodId, tzMode, persist, t],
  );

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="bg-[radial-gradient(60rem_30rem_at_50%_0%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_70%)] pb-12">
      <PrayerInfoBar
        labels={{
          gregorian: t("infoGregorian"),
          hijri: t("infoHijri"),
          location: t("infoLocation"),
          method: t("infoMethod"),
        }}
        values={{ gregorian: gregorianStr, hijri: hijriStr, location: locName, method: methodName }}
      />

      <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-6 px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.05fr)]">
          <QiblaCompass lat={loc.lat} lng={loc.lng} onLocate={applyDeviceLocation} />
          <PrayerTimesCard
            isArabic={isArabic}
            times={times}
            tz={displayTz}
            nextKey={next?.key ?? null}
            countdown={countdown}
            gregorianStr={gregorianStr}
            hijriStr={hijriStr}
          />
          <LocationSettingsCard
            key={`${loc.id}|${loc.lat}|${loc.lng}|${methodId}|${tzMode}`}
            isArabic={isArabic}
            loc={loc}
            methodId={methodId}
            tzMode={tzMode}
            justSaved={justSaved}
            onSave={saveSettings}
          />
        </div>

        <HijriCalendarCard
          isArabic={isArabic}
          today={todayKey}
          hijriStr={hijriStr}
          gregorianStr={gregorianStr}
        />
      </div>
    </div>
  );
}
