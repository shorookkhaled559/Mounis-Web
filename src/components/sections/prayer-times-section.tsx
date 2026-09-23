"use client";

import { useState, useEffect } from "react";
import { MapPin, Calendar, Settings, Clock, Sunrise, Sun, Cloud, Sunset, Moon, Star } from "lucide-react";

const PRAYERS = [
  { key: "fajr",    labelAr: "الفجر",  labelEn: "Fajr",    time: "4:42",  periodAr: "صباحاً", periodEn: "AM", Icon: Star,    next: false },
  { key: "sunrise", labelAr: "الشروق", labelEn: "Sunrise", time: "6:10",  periodAr: "صباحاً", periodEn: "AM", Icon: Sunrise, next: false },
  { key: "dhuhr",   labelAr: "الظهر",  labelEn: "Dhuhr",   time: "12:38", periodAr: "ظهراً",  periodEn: "PM", Icon: Sun,     next: false },
  { key: "asr",     labelAr: "العصر",  labelEn: "Asr",     time: "4:16",  periodAr: "عصراً",  periodEn: "PM", Icon: Cloud,   next: false },
  { key: "maghrib", labelAr: "المغرب", labelEn: "Maghrib", time: "7:05",  periodAr: "مساءً",  periodEn: "PM", Icon: Sunset,  next: true  },
  { key: "isha",    labelAr: "العشاء", labelEn: "Isha",    time: "8:27",  periodAr: "مساءً",  periodEn: "PM", Icon: Moon,    next: false },
];

interface PrayerTimesSectionProps {
  locale: string;
}

export function PrayerTimesSection({ locale }: PrayerTimesSectionProps) {
  const isArabic = locale === "ar";
  const [countdown, setCountdown] = useState({ h: 2, m: 34, s: 17 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

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
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-ink">
            {isArabic ? "القاهرة، مصر" : "Cairo, Egypt"}
          </span>
          <span className="text-ink-muted text-xs ms-auto">▾</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{isArabic ? "السبت، 23 سبتمبر 2026" : "Saturday, Sep 23, 2026"}</span>
          <span className="mx-2">|</span>
          <span>{isArabic ? "1 ربيع الآخر 1448 هـ" : "1 Rabi' al-Akhir 1448 H"}</span>
        </div>
      </div>

      {/* Prayer Times Grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {PRAYERS.map(({ key, labelAr, labelEn, time, periodAr, periodEn, Icon, next }) => (
          <div
            key={key}
            className={`flex flex-col items-center gap-1 rounded-xl py-3 px-1 transition-all ${
              next ? "bg-primary/10 ring-2 ring-primary/30" : "bg-surface hover:bg-surface-raised"
            }`}
          >
            <Icon className={`w-5 h-5 ${next ? "text-primary" : "text-ink-muted"}`} />
            <span className={`text-xs font-medium ${next ? "text-primary" : "text-ink-muted"}`}>
              {isArabic ? labelAr : labelEn}
            </span>
            <span className={`text-sm font-bold tabular-nums ${next ? "text-primary" : "text-ink"}`} dir="ltr">
              {time}
            </span>
            <span className="text-[10px] text-ink-muted">
              {isArabic ? periodAr : periodEn}
            </span>
          </div>
        ))}
      </div>

      {/* Countdown */}
      <div className="bg-surface rounded-xl p-4 grid grid-cols-2 gap-4">
        {/* Next Prayer */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">
            {isArabic ? "الصلاة القادمة" : "Next Prayer"}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sunset className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {isArabic ? "المغرب" : "Maghrib"}
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col gap-1 items-end text-end">
          <span className="text-xs text-ink-muted">
            {isArabic ? "الوقت المتبقي" : "Time Remaining"}
          </span>
          <span className="font-display text-2xl font-bold text-ink tabular-nums" dir="ltr">
            {pad(countdown.h)} : {pad(countdown.m)} : {pad(countdown.s)}
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
            Icon: MapPin,
            labelAr: "موقعك الحالي",   labelEn: "Your Location",
            valueAr: "القاهرة، مصر",   valueEn: "Cairo, Egypt",
            actionAr: "تغيير الموقع",  actionEn: "Change Location",
          },
          {
            Icon: Settings,
            labelAr: "طريقة الحساب",         labelEn: "Calc Method",
            valueAr: "هيئة المساحة المصرية", valueEn: "Egyptian Survey",
            actionAr: "تغيير طريقة الحساب", actionEn: "Change Method",
          },
          {
            Icon: Calendar,
            labelAr: "التقويم الهجري",       labelEn: "Hijri Calendar",
            valueAr: "1 ربيع الآخر 1448 هـ", valueEn: "1 Rabi' al-Akhir 1448",
            actionAr: "عرض التقويم الكامل", actionEn: "Full Calendar",
          },
        ].map(({ Icon, labelAr, labelEn, valueAr, valueEn, actionAr, actionEn }, i) => (
          <div key={i} className="bg-surface rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-ink">
                {isArabic ? labelAr : labelEn}
              </span>
            </div>
            <p className="text-xs text-ink-muted leading-snug">
              {isArabic ? valueAr : valueEn}
            </p>
            <button className="text-[11px] text-primary font-medium hover:underline mt-auto text-start">
              {isArabic ? actionAr : actionEn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
