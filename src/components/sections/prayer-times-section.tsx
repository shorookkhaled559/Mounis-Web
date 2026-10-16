"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin, Calendar, Settings, Clock, Sunrise, Sun, Cloud, Sunset, Moon, Star,
  Loader2, X, ChevronLeft, ChevronRight, Navigation,
} from "lucide-react";
import {
  CITIES, METHODS, DEFAULT_LOCATION, DEFAULT_METHOD_ID,
  getPrayerTimes, dayPartsInTz, addDays, formatPrayerTime,
  toHijri, formatHijri, formatGregorian,
  type PrayerKey, type PrayerLocation,
} from "@/lib/prayer";

const STORAGE_KEY = "mounis-prayer-prefs-v1";

const PRAYERS: {
  key: PrayerKey; labelAr: string; labelEn: string; Icon: typeof Star; isPrayer: boolean;
}[] = [
  { key: "fajr",    labelAr: "الفجر",  labelEn: "Fajr",    Icon: Star,    isPrayer: true },
  { key: "sunrise", labelAr: "الشروق", labelEn: "Sunrise", Icon: Sunrise, isPrayer: false },
  { key: "dhuhr",   labelAr: "الظهر",  labelEn: "Dhuhr",   Icon: Sun,     isPrayer: true },
  { key: "asr",     labelAr: "العصر",  labelEn: "Asr",     Icon: Cloud,   isPrayer: true },
  { key: "maghrib", labelAr: "المغرب", labelEn: "Maghrib", Icon: Sunset,  isPrayer: true },
  { key: "isha",    labelAr: "العشاء", labelEn: "Isha",    Icon: Moon,    isPrayer: true },
];

interface Prefs {
  loc: PrayerLocation;
  methodId: string;
}

interface PrayerTimesSectionProps {
  locale: string;
}

export function PrayerTimesSection({ locale }: PrayerTimesSectionProps) {
  const isArabic = locale === "ar";

  const [prefs, setPrefs] = useState<Prefs>({ loc: DEFAULT_LOCATION, methodId: DEFAULT_METHOD_ID });
  const [now, setNow] = useState<Date | null>(null); // null until mounted (avoids hydration mismatch)
  const [panel, setPanel] = useState<null | "location" | "method" | "calendar">(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">("idle");
  const [geoError, setGeoError] = useState("");

  // calendar month being viewed
  const [calMonth, setCalMonth] = useState<{ y: number; m: number } | null>(null);

  // ── Load saved preferences once ────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Prefs;
          if (saved?.loc?.lat != null && saved?.methodId) setPrefs(saved);
        }
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const savePrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

  // Today's day in the *selected location's* timezone (not the device's)
  const todayKey = now ? dayPartsInTz(now, loc.tz) : null;
  const dayStr = todayKey ? `${todayKey.y}-${todayKey.m}-${todayKey.d}` : "";

  const times = useMemo(() => {
    if (!todayKey) return null;
    return getPrayerTimes(loc, methodId, todayKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, methodId, dayStr]);

  const tomorrowFajr = useMemo(() => {
    if (!todayKey) return null;
    return getPrayerTimes(loc, methodId, addDays(todayKey, 1)).fajr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, methodId, dayStr]);

  // ── Next prayer + countdown ────────────────────────────────────────────────
  let nextKey: PrayerKey | null = null;
  let remainingMs = 0;
  if (now && times && tomorrowFajr) {
    const order: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const upcoming = order.find((k) => times[k].getTime() > now.getTime());
    if (upcoming) {
      nextKey = upcoming;
      remainingMs = times[upcoming].getTime() - now.getTime();
    } else {
      nextKey = "fajr"; // after Isha → tomorrow's Fajr
      remainingMs = tomorrowFajr.getTime() - now.getTime();
    }
  }
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const cd = { h: Math.floor(totalSec / 3600), m: Math.floor((totalSec % 3600) / 60), s: totalSec % 60 };
  const pad = (n: number) => String(n).padStart(2, "0");
  const nextMeta = PRAYERS.find((p) => p.key === nextKey);

  // ── Dates ──────────────────────────────────────────────────────────────────
  const gregorianStr = now ? formatGregorian(now, loc.tz, isArabic) : "";
  const hijriToday = now ? toHijri(now, loc.tz, isArabic) : null;
  const hijriStr = hijriToday ? formatHijri(hijriToday, isArabic) : "";
  const locName = isArabic ? loc.nameAr : loc.nameEn;

  // ── Location actions ───────────────────────────────────────────────────────
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState("error");
      setGeoError(isArabic ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation is not supported");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Reverse geocode for a readable name (best effort)
        let name = isArabic ? "موقعك الحالي" : "Your current location";
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 6000);
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${isArabic ? "ar" : "en"}`,
            { signal: ctrl.signal }
          );
          clearTimeout(t);
          if (res.ok) {
            const j = await res.json();
            const place = j.city || j.locality || j.principalSubdivision;
            if (place) name = j.countryName ? `${place}، ${j.countryName}` : place;
            if (place && j.countryName && !isArabic) name = `${place}, ${j.countryName}`;
          }
        } catch {
          /* keep fallback name */
        }

        savePrefs({
          methodId: prefs.methodId,
          loc: { id: "gps", nameAr: name, nameEn: name, lat, lng, tz },
        });
        setGeoState("idle");
        setPanel(null);
      },
      (err) => {
        setGeoState("error");
        setGeoError(
          err.code === 1
            ? isArabic ? "تم رفض إذن الموقع. اختاري مدينة من القائمة." : "Location permission denied. Pick a city below."
            : isArabic ? "تعذّر تحديد موقعك." : "Could not get your location."
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [isArabic, prefs.methodId, savePrefs]);

  // ── Calendar ───────────────────────────────────────────────────────────────
  const openCalendar = () => {
    if (todayKey && !calMonth) setCalMonth({ y: todayKey.y, m: todayKey.m });
    setPanel(panel === "calendar" ? null : "calendar");
  };

  const calendar = useMemo(() => {
    if (!calMonth) return null;
    const { y, m } = calMonth;
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const weekStart = isArabic ? 6 : 0; // Saturday for Arabic, Sunday for English
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const blanks = (firstDow - weekStart + 7) % 7;

    const cells = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const noonUtc = new Date(Date.UTC(y, m - 1, d, 12));
      const h = toHijri(noonUtc, "UTC", isArabic);
      return { d, h };
    });

    const weekdayFmt = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", { weekday: "short", timeZone: "UTC" });
    const weekdays = Array.from({ length: 7 }, (_, i) =>
      weekdayFmt.format(new Date(Date.UTC(2023, 0, 1 + ((weekStart + i) % 7))))
    );

    const monthTitle = new Intl.DateTimeFormat(isArabic ? "ar-EG-u-nu-latn" : "en-US", {
      month: "long", year: "numeric", timeZone: "UTC",
    }).format(new Date(Date.UTC(y, m - 1, 1, 12)));

    const first = cells[0].h;
    const last = cells[cells.length - 1].h;
    const hijriTitle =
      first.monthName === last.monthName
        ? `${first.monthName} ${first.year}`
        : `${first.monthName} – ${last.monthName} ${last.year}`;

    return { blanks, cells, weekdays, monthTitle, hijriTitle };
  }, [calMonth, isArabic]);

  const shiftMonth = (delta: number) =>
    setCalMonth((c) => {
      if (!c) return c;
      const dt = new Date(Date.UTC(c.y, c.m - 1 + delta, 1));
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1 };
    });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {isArabic ? "مواقيت الصلاة" : "Prayer Times"}
          </h2>
          <p className="text-xs text-ink-muted">
            {isArabic ? "مواقيت الصلاة اليوم حسب موقعك" : "Today's prayer times by your location"}
          </p>
        </div>
      </div>

      {/* Location + Date */}
      <div className="bg-surface rounded-xl px-4 py-3 space-y-2">
        <button
          type="button"
          onClick={() => setPanel(panel === "location" ? null : "location")}
          className="flex items-center gap-2 w-full text-start"
        >
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-ink">{locName}</span>
          <span className="text-ink-muted text-xs ms-auto">▾</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap min-h-[1rem]">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{gregorianStr || "…"}</span>
          <span className="mx-1">|</span>
          <span>{hijriStr || "…"}</span>
        </div>
      </div>

      {/* Prayer Times Grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {PRAYERS.map(({ key, labelAr, labelEn, Icon }) => {
          const isNext = key === nextKey;
          const f = times ? formatPrayerTime(times[key], loc.tz, key, isArabic) : null;
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-1 rounded-xl py-3 px-1 transition-all ${
                isNext ? "bg-primary/10 ring-2 ring-primary/30" : "bg-surface hover:bg-surface-raised"
              }`}
            >
              <Icon className={`w-5 h-5 ${isNext ? "text-primary" : "text-ink-muted"}`} />
              <span className={`text-xs font-medium ${isNext ? "text-primary" : "text-ink-muted"}`}>
                {isArabic ? labelAr : labelEn}
              </span>
              <span className={`text-sm font-bold tabular-nums ${isNext ? "text-primary" : "text-ink"}`} dir="ltr">
                {f ? f.time : "--:--"}
              </span>
              <span className="text-[10px] text-ink-muted">{f ? f.period : ""}</span>
            </div>
          );
        })}
      </div>

      {/* Countdown */}
      <div className="bg-surface rounded-xl p-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">{isArabic ? "الصلاة القادمة" : "Next Prayer"}</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {nextMeta ? <nextMeta.Icon className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-primary" />}
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {nextMeta ? (isArabic ? nextMeta.labelAr : nextMeta.labelEn) : "…"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end text-end">
          <span className="text-xs text-ink-muted">{isArabic ? "الوقت المتبقي" : "Time Remaining"}</span>
          <span className="font-display text-2xl font-bold text-ink tabular-nums" dir="ltr">
            {nextKey ? `${pad(cd.h)} : ${pad(cd.m)} : ${pad(cd.s)}` : "-- : -- : --"}
          </span>
          <div className="flex gap-3 text-[10px] text-ink-muted" dir={isArabic ? "rtl" : "ltr"}>
            <span>{isArabic ? "ساعة" : "hr"}</span>
            <span>{isArabic ? "دقيقة" : "min"}</span>
            <span>{isArabic ? "ثانية" : "sec"}</span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            Icon: MapPin, panelKey: "location" as const,
            label: isArabic ? "موقعك الحالي" : "Your Location",
            value: locName,
            action: isArabic ? "تغيير الموقع" : "Change Location",
            onClick: () => setPanel(panel === "location" ? null : "location"),
          },
          {
            Icon: Settings, panelKey: "method" as const,
            label: isArabic ? "طريقة الحساب" : "Calc Method",
            value: isArabic ? method.nameAr : method.nameEn,
            action: isArabic ? "تغيير طريقة الحساب" : "Change Method",
            onClick: () => setPanel(panel === "method" ? null : "method"),
          },
          {
            Icon: Calendar, panelKey: "calendar" as const,
            label: isArabic ? "التقويم الهجري" : "Hijri Calendar",
            value: hijriStr || "…",
            action: isArabic ? "عرض التقويم الكامل" : "Full Calendar",
            onClick: openCalendar,
          },
        ].map(({ Icon, panelKey, label, value, action, onClick }) => (
          <div
            key={panelKey}
            className={`bg-surface rounded-xl p-3 flex flex-col gap-2 ${panel === panelKey ? "ring-2 ring-primary/30" : ""}`}
          >
            <div className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-ink">{label}</span>
            </div>
            <p className="text-xs text-ink-muted leading-snug">{value}</p>
            <button
              type="button"
              onClick={onClick}
              className="text-[11px] text-primary font-medium hover:underline mt-auto text-start"
            >
              {action}
            </button>
          </div>
        ))}
      </div>

      {/* ── Panels ─────────────────────────────────────────────────────────── */}
      {panel && (
        <div className="bg-surface rounded-xl p-4 space-y-3 border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">
              {panel === "location" && (isArabic ? "تغيير الموقع" : "Change Location")}
              {panel === "method" && (isArabic ? "طريقة الحساب" : "Calculation Method")}
              {panel === "calendar" && (isArabic ? "التقويم" : "Calendar")}
            </h3>
            <button type="button" onClick={() => setPanel(null)} aria-label="close" className="text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Location panel */}
          {panel === "location" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoState === "loading"}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:opacity-90 disabled:opacity-60"
              >
                {geoState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                {isArabic ? "استخدام موقعي الحالي" : "Use my current location"}
              </button>
              {geoState === "error" && <p className="text-xs text-red-600">{geoError}</p>}
              <select
                value={loc.id === "gps" ? "" : loc.id}
                onChange={(e) => {
                  const city = CITIES.find((c) => c.id === e.target.value);
                  if (city) {
                    savePrefs({ ...prefs, loc: city });
                    setPanel(null);
                  }
                }}
                className="w-full border border-border rounded-lg bg-white text-sm px-3 py-2 text-ink"
              >
                <option value="" disabled>
                  {isArabic ? "أو اختاري مدينة…" : "Or pick a city…"}
                </option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isArabic ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Method panel */}
          {panel === "method" && (
            <div className="space-y-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    savePrefs({ ...prefs, methodId: m.id });
                    setPanel(null);
                  }}
                  className={`w-full text-start text-sm rounded-lg px-3 py-2 border transition-colors ${
                    m.id === methodId
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-white text-ink hover:bg-surface-raised"
                  }`}
                >
                  {isArabic ? m.nameAr : m.nameEn}
                </button>
              ))}
              <p className="text-[11px] text-ink-muted">
                {isArabic
                  ? "الطريقة الافتراضية في مصر هي هيئة المساحة المصرية (الفجر 19.5° والعشاء 17.5°)."
                  : "Egypt's standard is the Egyptian General Authority of Survey (Fajr 19.5°, Isha 17.5°)."}
              </p>
            </div>
          )}

          {/* Calendar panel */}
          {panel === "calendar" && calendar && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => shiftMonth(isArabic ? 1 : -1)} aria-label="prev"
                  className="p-1.5 rounded-lg hover:bg-white text-ink">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <div className="text-sm font-bold text-ink">{calendar.monthTitle}</div>
                  <div className="text-[11px] text-primary">{calendar.hijriTitle}</div>
                </div>
                <button type="button" onClick={() => shiftMonth(isArabic ? -1 : 1)} aria-label="next"
                  className="p-1.5 rounded-lg hover:bg-white text-ink">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center" dir={isArabic ? "rtl" : "ltr"}>
                {calendar.weekdays.map((w, i) => (
                  <div key={i} className="text-[10px] font-medium text-ink-muted py-1">{w}</div>
                ))}
                {Array.from({ length: calendar.blanks }).map((_, i) => <div key={`b${i}`} />)}
                {calendar.cells.map(({ d, h }) => {
                  const isToday =
                    !!todayKey && calMonth!.y === todayKey.y && calMonth!.m === todayKey.m && d === todayKey.d;
                  return (
                    <div
                      key={d}
                      className={`rounded-lg py-1.5 flex flex-col items-center leading-tight ${
                        isToday ? "bg-primary text-white" : "bg-white text-ink"
                      }`}
                    >
                      <span className="text-sm font-semibold tabular-nums">{d}</span>
                      <span className={`text-[10px] tabular-nums ${isToday ? "text-white/90" : "text-ink-muted"}`}>
                        {h.day === 1 ? h.monthName : h.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}