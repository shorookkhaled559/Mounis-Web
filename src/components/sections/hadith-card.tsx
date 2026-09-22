import type { Hadith } from "@/types/hadith";
import { BookOpen, User } from "lucide-react";

interface HadithCardProps {
  hadith: Hadith;
  locale: string;
  collectionId: string;
}

export function HadithCard({ hadith, locale, collectionId }: HadithCardProps) {
  const isArabic = locale === "ar";
  const text = isArabic ? hadith.matn_ar : hadith.matn_en;
  const fullText = isArabic ? hadith.text_ar : hadith.text_en;

  return (
    <article className="rounded-lg border border-border bg-surface p-6 hover:border-primary/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium">{hadith.reference}</span>
        </div>
        {hadith.grade_ar && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {isArabic ? hadith.grade_ar : hadith.grade_en}
          </span>
        )}
      </div>

      {/* Narrator */}
      {hadith.narrator && (
        <div className="flex items-center gap-2 mb-3 text-sm text-ink-muted">
          <User className="h-4 w-4" aria-hidden="true" />
          <span>
            {isArabic ? "عن" : "Narrated by"} {hadith.narrator}
          </span>
        </div>
      )}

      {/* Main Text */}
      <div
        className={`text-ink leading-relaxed ${
          isArabic ? "text-right font-arabic text-lg" : "text-left"
        }`}
      >
        {/* Show matn (main content) by default */}
        <p className="mb-3">{text}</p>
        
        {/* Full text toggle could be added here */}
      </div>

      {/* Footer - Link to full hadith */}
      <a
        href={hadith.url_source}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
      >
        {isArabic ? "عرض الحديث كاملاً" : "View full hadith"}
        <span aria-hidden="true">→</span>
      </a>
    </article>
  );
}
