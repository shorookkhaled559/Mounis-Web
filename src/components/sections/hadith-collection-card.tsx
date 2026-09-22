import { Link } from "@/i18n/navigation";
import { ChevronLeft, BookOpen } from "lucide-react";
import type { CollectionSummary } from "@/types/hadith";
import Image from "next/image";

interface HadithCollectionCardProps {
  collection: CollectionSummary;
  locale: string;
  variant?: "primary" | "default";
}

export function HadithCollectionCard({
  collection,
  locale,
  variant = "default",
}: HadithCollectionCardProps) {
  const isArabic = locale === "ar";
  const name = isArabic ? collection.name_ar : collection.name_en;
  const author = isArabic ? collection.author_ar : collection.author_en;

  // Type badge colors
  const typeBadge = {
    primary: { bg: "bg-primary/10", text: "text-primary", label: isArabic ? "الكتب الستة" : "Primary" },
    compilation: { bg: "bg-accent/10", text: "text-accent", label: isArabic ? "مختارات" : "Compilation" },
    dua: { bg: "bg-ink/10", text: "text-ink", label: isArabic ? "أدعية" : "Du'a" },
  }[collection.type];

  // Primary variant (with book cover image)
  if (variant === "primary") {
    return (
      <Link
        href={`/hadith/${collection.id}`}
        className="group block"
      >
        <div className="relative bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
          {/* Book Cover Image */}
          <div className="flex justify-center mb-3">
            <div className="relative w-24 h-32">
              {collection.cover_image ? (
                <Image
                  src={collection.cover_image}
                  alt={name}
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-arabic">📖</span>
                </div>
              )}
            </div>
          </div>

          {/* Book Title */}
          <h3 className="text-center text-base font-bold text-ink mb-1 line-clamp-1">
            {name}
          </h3>

          {/* Author */}
          <p className="text-center text-sm text-ink-muted mb-3 line-clamp-1">
            {author}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 text-xs text-ink-muted mb-3">
            <span>
              {isArabic ? "كتاب" : "books"} {collection.totalBooks}
            </span>
            <span>•</span>
            <span>
              {isArabic ? "حديث" : "hadiths"} {collection.totalHadiths.toLocaleString(isArabic ? "ar" : "en")}
            </span>
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-between text-ink text-sm">
            <span>{isArabic ? "تصفح الكتاب" : "Browse Book"}</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <ChevronLeft className={`w-4 h-4 ${isArabic ? "" : "rotate-180"}`} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant (original design)
  return (
    <Link
      href={`/hadith/${collection.id}`}
      className="group block rounded-lg border border-border bg-surface p-5 transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-ink group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>
          <p className="text-sm text-ink-muted mb-3">{author}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
              {typeBadge.label}
            </span>
            <span className="text-ink-muted">
              {collection.totalHadiths.toLocaleString(isArabic ? "ar" : "en")}{" "}
              {isArabic ? "حديث" : "hadiths"}
            </span>
            <span className="text-border">•</span>
            <span className="text-ink-muted">
              {collection.totalBooks}{" "}
              {isArabic ? "كتاب" : "books"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
