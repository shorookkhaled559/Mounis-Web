"use client";

import { Sunrise, Sun, CloudSun, Sunset, Moon, MoonStar, Clock, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrayerTime, type PrayerKey, type PrayerTimesMap } from "@/lib/prayer";
import { pad2 } from "@/lib/prayer-next";
import { PrayerCard, CardHeading } from "./prayer-card";
import { MosqueIllustration } from "./prayer-art";

const TILES: { key: PrayerKey; Icon: LucideIcon }[] = [
  { key: "fajr", Icon: Sunrise },
  { key: "sunrise", Icon: Sun },
  { key: "dhuhr", Icon: Sun },
  { key: "asr", Icon: CloudSun },
  { key: "maghrib", Icon: Sunset },
  { key: "isha", Icon: Moon },
];

interface PrayerTimesCardProps {
  isArabic: boolean;
  times: PrayerTimesMap | null;
  /** zone the clock times are shown in */
  tz: string;
  nextKey: PrayerKey | null;
  countdown: { h: number; m: number; s: number };
  gregorianStr: string;
  hijriStr: string;
}

export function PrayerTimesCard({
  isArabic, times, tz, nextKey, countdown, gregorianStr, hijriStr,
}: PrayerTimesCardProps) {
  const t = useTranslations("prayerPage");

  return (
    <PrayerCard className="flex h-full flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <CardHeading
          icon={<MoonStar className="h-6 w-6" />}
          title={t("timesTitle")}
          subtitle={t("timesSubtitle")}
        />
        <p className="text-sm text-ink-muted">
          {gregorianStr || "…"} <span className="mx-1">|</span> {hijriStr || "…"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {TILES.map(({ key, Icon }) => {
          const isNext = key === nextKey;
          const f = times ? formatPrayerTime(times[key], tz, key, isArabic) : null;
          return (
            <div
              key={key}
              aria-current={isNext ? "true" : undefined}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-4 text-center transition-colors ${
                isNext
                  ? "border-primary/40 bg-primary-subtle shadow-sm"
                  : "border-border bg-surface"
              }`}
            >
              <Icon className={`h-6 w-6 ${isNext ? "text-primary-deep" : "text-primary"}`} />
              <span className="text-sm font-medium text-ink">{t(key)}</span>
              <span className="font-display text-xl font-bold tabular-nums text-ink" dir="ltr">
                {f ? f.time : "--:--"}
              </span>
              <span className="text-sm text-ink-muted">{f ? f.period : ""}</span>
            </div>
          );
        })}
      </div>

      {/* Countdown */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-primary-subtle px-4 py-5 text-center">
        <MosqueIllustration className="pointer-events-none absolute bottom-0 start-0 h-full w-1/2 text-primary opacity-35" />
        <div className="relative">
          <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-ink">
            <Clock className="h-4 w-4 text-primary-deep" aria-hidden="true" />
            <span className="font-normal text-ink-muted">{t("nextPrayer")}:</span>
            <span>{nextKey ? t(nextKey) : "…"}</span>
          </p>
          <div
            className="mt-2 inline-grid grid-cols-[auto_auto_auto_auto_auto] items-center gap-x-3 gap-y-0"
            dir="ltr"
            role="timer"
            aria-live="off"
          >
            {[
              { v: countdown.h },
              null,
              { v: countdown.m },
              null,
              { v: countdown.s },
            ].map((x, i) =>
              x ? (
                <span key={i} className="font-display text-4xl font-bold tabular-nums text-ink sm:text-5xl">
                  {nextKey ? pad2(x.v) : "--"}
                </span>
              ) : (
                <span key={i} className="font-display text-3xl font-bold text-ink sm:text-4xl">:</span>
              ),
            )}
            {[t("hours"), "", t("minutes"), "", t("seconds")].map((l, i) => (
              <span key={i} className="text-xs text-ink-muted">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </PrayerCard>
  );
}
