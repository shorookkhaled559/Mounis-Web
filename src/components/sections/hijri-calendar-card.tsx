"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MoonStar } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildHijriMonth } from "@/lib/hijri-calendar";
import type { DayParts } from "@/lib/prayer";
import { PrayerCard, CardHeading } from "./prayer-card";
import { MosqueIllustration } from "./prayer-art";

const DOW_KEYS = ["wdSun", "wdMon", "wdTue", "wdWed", "wdThu", "wdFri", "wdSat"] as const;

interface HijriCalendarCardProps {
  isArabic: boolean;
  /** today's calendar day in the selected location; null until mounted */
  today: DayParts | null;
  hijriStr: string;
  gregorianStr: string;
}

export function HijriCalendarCard({
  isArabic, today, hijriStr, gregorianStr,
}: HijriCalendarCardProps) {
  const t = useTranslations("prayerPage");
  const [delta, setDelta] = useState(0);

  const weekStart = isArabic ? 6 : 0; // Saturday for Arabic, Sunday for English
  const grid = useMemo(
    () => (today ? buildHijriMonth(today, delta, isArabic, weekStart) : null),
    [today, delta, isArabic, weekStart],
  );

  const weekdays = Array.from({ length: 7 }, (_, i) => t(DOW_KEYS[(weekStart + i) % 7]));
  const suffix = t("hijriYearSuffix");
  // In a right-to-left page "previous" sits on the right and points right
  const PrevIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  const isToday = (g: DayParts) => !!today && g.y === today.y && g.m === today.m && g.d === today.d;

  return (
    <PrayerCard className="relative bg-gradient-to-b from-primary-subtle/50 to-surface/90" corners={[]}>
      <MosqueIllustration className="pointer-events-none absolute bottom-0 end-0 hidden h-full w-[40%] text-primary opacity-40 lg:block" />

      <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:pe-[38%]">
        {/* Heading + today's date */}
        <div className="flex flex-col gap-4">
          <CardHeading
            icon={<CalendarDays className="h-6 w-6" />}
            title={t("calendarTitle")}
            subtitle={t("calendarSubtitle")}
          />
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-6 text-center">
            <MoonStar className="h-14 w-14 text-primary-deep" aria-hidden="true" />
            <p className="font-display text-xl font-bold text-ink">{hijriStr || "…"}</p>
            <p className="text-sm text-ink-muted">{gregorianStr || "…"}</p>
          </div>
        </div>

        {/* Month grid */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDelta((d) => d - 1)}
              aria-label={t("prevMonth")}
              className="rounded-full p-1.5 text-ink hover:bg-primary-subtle"
            >
              <PrevIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setDelta(0)}
              disabled={delta === 0}
              title={t("backToToday")}
              className="font-display text-lg font-bold text-ink disabled:cursor-default"
            >
              {grid ? `${grid.monthName} ${grid.year} ${suffix}` : "…"}
            </button>
            <button
              type="button"
              onClick={() => setDelta((d) => d + 1)}
              aria-label={t("nextMonth")}
              className="rounded-full p-1.5 text-ink hover:bg-primary-subtle"
            >
              <NextIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-border pb-2 text-center">
            {weekdays.map((w) => (
              <div key={w} className="text-[11px] font-medium text-ink-muted sm:text-xs">{w}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
            {grid &&
              Array.from({ length: grid.blanks }).map((_, i) => <div key={`b${i}`} />)}
            {grid?.cells.map((c) => {
              const todayCell = isToday(c.g);
              return (
                <div key={c.hDay} className="flex justify-center">
                  <div
                    aria-current={todayCell ? "date" : undefined}
                    title={`${c.g.d}/${c.g.m}/${c.g.y}`}
                    className={`flex h-11 w-11 flex-col items-center justify-center rounded-full leading-none ${
                      todayCell ? "bg-primary-deep text-primary-foreground" : "text-ink"
                    }`}
                  >
                    <span className="text-base font-semibold tabular-nums">{c.hDay}</span>
                    <span className={`mt-0.5 text-[9px] tabular-nums ${todayCell ? "text-primary-foreground/80" : "text-ink-muted"}`}>
                      {c.g.d}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PrayerCard>
  );
}
