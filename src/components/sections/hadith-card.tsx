import { BookOpen, User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Hadith } from "@/types/hadith";
import { HadithGradeBadge } from "@/components/sections/hadith-grade";
import {
  arabicReference,
  excerpt,
  hadithBodyAr,
  hadithPath,
  narratorArabic,
  normalizeGrade,
} from "@/lib/hadith-view";

interface HadithCardProps {
  hadith: Hadith;
  locale: string;
  collectionId: string;
  collectionNameAr: string;
  collectionNameEn: string;
  bookNumber: number;
}

export async function HadithCard({ hadith, locale, collectionId, collectionNameAr, collectionNameEn, bookNumber }: HadithCardProps) {
  const t = await getTranslations({ locale, namespace: "hadithPage" });
  const isArabic = locale === "ar";
  const reference = isArabic ? arabicReference(collectionNameAr, hadith.hadith_number) : hadith.reference;
  const text = excerpt(isArabic ? hadithBodyAr(hadith) : hadith.matn_en, 600);
  const grade = normalizeGrade(hadith.grade_en, hadith.source_grade);
  // Arabic UI: only a vetted Arabic name, never the English text.
  const narrator = isArabic ? narratorArabic(hadith.narrator) : hadith.narrator || null;
  const href = hadithPath(collectionId, bookNumber, hadith.hadith_number);
  const full = isArabic ? hadithBodyAr(hadith) : hadith.matn_en;
  const collectionName = isArabic ? collectionNameAr : collectionNameEn;
  const isSahihayn = collectionId === "bukhari" || collectionId === "muslim";
  const gradeLine = grade
    ? isArabic && grade.labelAr
      ? `${grade.labelAr}${grade.graderAr ? ` — ${t("gradeBy", { grader: grade.graderAr })}` : ""}`
      : t("gradeRaw", { raw: grade.raw })
    : null;

  return (
    <article className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary/50">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium">{reference}</span>
        </div>
        {grade && <HadithGradeBadge grade={grade} isArabic={isArabic} />}
      </div>

      {narrator && (
        <div className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
          <User className="h-4 w-4" aria-hidden="true" />
          <span>
            {t("narrator")}: {narrator}
          </span>
        </div>
      )}

      <p lang={isArabic ? "ar" : "en"} className={`text-ink ${isArabic ? "text-lg leading-loose" : "leading-relaxed"}`}>
        {text}
      </p>

      <details className="group mt-4 border-t border-border pt-3">
        <summary className="cursor-pointer select-none text-sm font-medium text-primary hover:underline">
          {t("quickView")}
        </summary>
        <div className="mt-3 space-y-3 text-sm">
          {full !== text && (
            <p lang={isArabic ? "ar" : "en"} className={`text-ink ${isArabic ? "leading-loose" : "leading-relaxed"}`}>
              {full}
            </p>
          )}
          {isArabic && hadith.isnad_ar && (
            <div>
              <p className="text-xs text-ink-muted">{t("chain")}</p>
              <p lang="ar" className="mt-1 leading-loose text-ink-muted">{hadith.isnad_ar}</p>
            </div>
          )}
          {!isArabic && hadith.isnad_en && (
            <div>
              <p className="text-xs text-ink-muted">{t("chain")}</p>
              <p lang="en" className="mt-1 text-ink-muted">{hadith.isnad_en}</p>
            </div>
          )}
          {isArabic && hadith.closing_ar && (
            <div>
              <p className="text-xs text-ink-muted">{t("authorComment")}</p>
              <p lang="ar" className="mt-1 leading-loose text-ink">{hadith.closing_ar.replace(/^[\s.]+/, "")}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-ink-muted">{t("grade")}</p>
            <p className="mt-1 text-ink-muted">
              {gradeLine ?? (isSahihayn ? t("gradeSahihayn", { collection: collectionName }) : t("gradeNone"))}
            </p>
          </div>
          <Link href={href} className="inline-flex items-center gap-1 text-primary hover:underline">
            {t("openPage")}
            <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
          </Link>
        </div>
      </details>
    </article>
  );
}
