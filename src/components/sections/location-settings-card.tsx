"use client";

import { useState, type ReactNode } from "react";
import { MapPin, Calculator, Clock, Check, Settings, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { CITIES, METHODS, type PrayerLocation } from "@/lib/prayer";
import { PrayerCard, CardHeading } from "./prayer-card";

export type TzMode = "location" | "device";

export interface SettingsValue {
  /** CITIES id, or "gps" to keep the current device location */
  locId: string;
  methodId: string;
  tzMode: TzMode;
}

interface LocationSettingsCardProps {
  isArabic: boolean;
  /** the saved location (may be a GPS one that is not in CITIES) */
  loc: PrayerLocation;
  methodId: string;
  tzMode: TzMode;
  justSaved: boolean;
  onSave: (v: SettingsValue) => void;
}

/** A row that looks like a dropdown; the real <select> sits invisibly on top. */
function SelectRow({
  icon, label, display, children, value, onChange,
}: {
  icon: ReactNode;
  label: string;
  display: string;
  children: ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:ring-2 focus-within:ring-primary/40">
      <span className="text-primary-deep">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="truncate text-xs text-ink-muted">{display}</p>
      </div>
      <ChevronDown className="h-4 w-4 flex-shrink-0 text-ink-muted" aria-hidden="true" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {children}
      </select>
    </div>
  );
}

export function LocationSettingsCard({
  isArabic, loc, methodId, tzMode, justSaved, onSave,
}: LocationSettingsCardProps) {
  const t = useTranslations("prayerPage");

  // Draft values: only applied (and persisted) when the user presses "Save".
  // The parent re-mounts this card (via `key`) whenever saved values change.
  const [locId, setLocId] = useState(loc.id);
  const [draftMethod, setDraftMethod] = useState(methodId);
  const [draftTz, setDraftTz] = useState<TzMode>(tzMode);

  const draftCity = CITIES.find((c) => c.id === locId);
  const cityName = draftCity ? (isArabic ? draftCity.nameAr : draftCity.nameEn) : isArabic ? loc.nameAr : loc.nameEn;
  const method = METHODS.find((m) => m.id === draftMethod) ?? METHODS[0];

  return (
    <PrayerCard className="flex h-full flex-col gap-4 p-6" corners={["tl", "bl"]}>
      <CardHeading icon={<Settings className="h-6 w-6" />} title={t("settingsTitle")} />

      {/* City */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
        <MapPin className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{cityName}</p>
        <label className="relative flex-shrink-0 cursor-pointer rounded-full bg-primary-subtle px-4 py-1.5 text-xs font-semibold text-primary-deep focus-within:ring-2 focus-within:ring-primary/40">
          {t("changeCity")}
          <select
            aria-label={t("pickCity")}
            value={draftCity ? locId : ""}
            onChange={(e) => setLocId(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {!draftCity && <option value="">{cityName}</option>}
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {isArabic ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </label>
      </div>

      <SelectRow
        icon={<Calculator className="h-5 w-5" />}
        label={t("methodLabel")}
        display={isArabic ? method.nameAr : method.nameEn}
        value={draftMethod}
        onChange={setDraftMethod}
      >
        {METHODS.map((m) => (
          <option key={m.id} value={m.id}>
            {isArabic ? m.nameAr : m.nameEn}
          </option>
        ))}
      </SelectRow>

      <SelectRow
        icon={<Clock className="h-5 w-5" />}
        label={t("timezoneLabel")}
        display={draftTz === "location" ? t("tzLocation") : t("tzDevice")}
        value={draftTz}
        onChange={(v) => setDraftTz(v === "device" ? "device" : "location")}
      >
        <option value="location">{t("tzLocation")}</option>
        <option value="device">{t("tzDevice")}</option>
      </SelectRow>

      {draftMethod === "egyptian" && <p className="text-[11px] leading-relaxed text-ink-muted">{t("methodNote")}</p>}

      <button
        type="button"
        onClick={() => onSave({ locId, methodId: draftMethod, tzMode: draftTz })}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-primary-deep px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
      >
        {justSaved ? t("saved") : t("saveSettings")}
        <Check className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="sr-only" role="status">{justSaved ? t("saved") : ""}</span>
    </PrayerCard>
  );
}
