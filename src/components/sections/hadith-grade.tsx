import type { GradeInfo } from "@/lib/hadith-view";

const TONES = {
  accepted: "bg-primary-subtle text-primary",
  weak: "border border-border bg-surface-raised text-ink",
  neutral: "border border-border bg-surface text-ink-muted",
} as const;

/**
 * Grade badge. In Arabic it shows the Arabic ruling plus who gave it; when the
 * ruling is not one we can translate with certainty it shows the source's own
 * wording instead of a guess.
 */
export function HadithGradeBadge({ grade, isArabic }: { grade: GradeInfo; isArabic: boolean }) {
  const label = isArabic
    ? grade.labelAr
      ? grade.graderAr
        ? `${grade.labelAr} (${grade.graderAr})`
        : grade.labelAr
      : grade.raw
    : grade.raw;
  return (
    <span
      lang={isArabic && grade.labelAr ? "ar" : "en"}
      dir={isArabic && grade.labelAr ? "rtl" : "ltr"}
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${TONES[grade.tone]}`}
    >
      {label}
    </span>
  );
}
