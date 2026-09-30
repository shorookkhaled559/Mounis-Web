"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Container } from "@/components/ui/container";
import { HadithCollectionCard } from "@/components/sections/hadith-collection-card";
import { Search, BookOpen, User, Loader2, X } from "lucide-react";
import type { CollectionSummary } from "@/types/hadith";
import type { HadithSearchResult, HadithSearchResponse } from "@/app/api/hadith/search/route";
import Link from "next/link";

interface HadithPageClientProps {
  collections: CollectionSummary[];
  locale: string;
}

// ─── Search Result Card ───────────────────────────────────────────────────────
function HadithSearchResultCard({
  result,
  locale,
}: {
  result: HadithSearchResult;
  locale: string;
}) {
  const isArabic = locale === "ar";
  const text = isArabic ? result.hadith.matn_ar : result.hadith.matn_en;
  const collectionName = isArabic ? result.collectionName_ar : result.collectionName_en;
  const bookName = isArabic ? result.bookName_ar : result.bookName_en;

  return (
    <article className="rounded-lg border border-border bg-surface p-5 hover:border-primary/50 transition-colors">
      {/* Collection + Book */}
      <div
        className={`flex flex-wrap items-center gap-2 text-xs text-ink-muted mb-3 ${
          isArabic ? "flex-row-reverse" : ""
        }`}
      >
        <Link
          href={`/${locale}/hadith/${result.collectionId}`}
          className="font-semibold text-primary hover:underline"
        >
          {collectionName}
        </Link>
        <span>•</span>
        <span>{bookName}</span>
        <span>•</span>
        <div className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          <span>{result.hadith.reference}</span>
        </div>
      </div>

      {/* Narrator */}
      {result.hadith.narrator && (
        <div
          className={`flex items-center gap-1.5 mb-2 text-sm text-ink-muted ${
            isArabic ? "flex-row-reverse" : ""
          }`}
        >
          <User className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {isArabic ? "عن" : "Narrated by"} {result.hadith.narrator}
          </span>
        </div>
      )}

      {/* Hadith Text */}
      <p
        className={`text-ink leading-relaxed line-clamp-4 ${
          isArabic ? "text-right font-arabic text-base" : "text-left text-sm"
        }`}
      >
        {text}
      </p>

      {/* Grade + Source */}
      <div
        className={`flex items-center justify-between mt-3 ${
          isArabic ? "flex-row-reverse" : ""
        }`}
      >
        {result.hadith.grade_ar || result.hadith.grade_en ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {isArabic ? result.hadith.grade_ar : result.hadith.grade_en}
          </span>
        ) : (
          <span />
        )}
        <a
          href={result.hadith.url_source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          {isArabic ? "عرض الحديث كاملاً ←" : "View full hadith →"}
        </a>
      </div>
    </article>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export function HadithPageClient({ collections, locale }: HadithPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HadithSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isArabic = locale === "ar";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived: are we in "text search" mode? ──────────────────────────────────
  const trimmed = searchQuery.trim();
  const isTextSearch = trimmed.length >= 2;

  // ── Collection filter (used when NOT in text-search mode) ───────────────────
  const filteredCollections = isTextSearch
    ? []
    : collections.filter((c) => {
        if (!trimmed) return true;
        const q = trimmed.toLowerCase();
        return (
          c.name_ar.toLowerCase().includes(q) ||
          c.name_en.toLowerCase().includes(q) ||
          c.author_ar.toLowerCase().includes(q) ||
          c.author_en.toLowerCase().includes(q)
        );
      });

  const primaryCollections = filteredCollections.filter((c) => c.type === "primary");
  const compilationCollections = filteredCollections.filter((c) => c.type === "compilation");
  const duaCollections = filteredCollections.filter((c) => c.type === "dua");

  // ── Debounced full-text search ──────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/hadith/search?q=${encodeURIComponent(q)}&limit=30`
      );
      if (!res.ok) throw new Error("Search request failed");
      const data: HadithSearchResponse = await res.json();
      setSearchResults(data.results);
      setHasSearched(true);
    } catch {
      setSearchError(isArabic ? "حدث خطأ أثناء البحث" : "Search failed, please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isArabic]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed.length >= 2) {
      debounceRef.current = setTimeout(() => runSearch(trimmed), 500);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setSearchError(null);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmed, runSearch]);

  const clearSearch = () => setSearchQuery("");

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
          style={{ backgroundImage: "url(/hadiths/hadith.png)" }}
        />

        <Container className="relative py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div
              className={`flex items-center gap-2 text-sm text-gray-700 my-4 ${
                isArabic ? "justify-end flex-row-reverse" : "justify-start"
              }`}
            >
              <span className="text-primary font-medium">
                {isArabic ? "الأحاديث" : "Hadiths"}
              </span>
              <span>•</span>
              <span>{isArabic ? "الرئيسية" : "Home"}</span>
            </div>

            {/* Title */}
            <h1
              className={`font-display text-4xl md:text-5xl font-bold text-primary-deep mb-3 ${
                isArabic ? "text-right" : "text-left"
              }`}
            >
              {isArabic ? "الأحاديث" : "Hadiths"}
            </h1>

            {/* Description */}
            <p
              className={`text-lg text-gray-700 mb-8 ${
                isArabic ? "text-right" : "text-left"
              }`}
            >
              {isArabic
                ? "مجموعة مختارة من الأحاديث النبوية الشريفة من أشهر المصادر"
                : "A curated collection of authentic prophetic hadiths from renowned sources"}
            </p>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isArabic
                    ? "ابحث في نصوص الأحاديث أو اسم الكتاب ..."
                    : "Search hadith text or book name..."
                }
                className={`w-full px-6 py-4 ${
                  isArabic ? "pr-14 text-right" : "pl-14 text-left"
                } ${searchQuery ? (isArabic ? "pl-12" : "pr-12") : ""} rounded-lg bg-white shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder:text-ink-muted`}
              />
              {/* Search icon */}
              <Search
                className={`absolute ${
                  isArabic ? "right-5" : "left-5"
                } top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none`}
              />
              {/* Loading spinner or clear button */}
              {isSearching ? (
                <Loader2
                  className={`absolute ${
                    isArabic ? "left-4" : "right-4"
                  } top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin`}
                />
              ) : searchQuery ? (
                <button
                  onClick={clearSearch}
                  aria-label={isArabic ? "مسح البحث" : "Clear search"}
                  className={`absolute ${
                    isArabic ? "left-4" : "right-4"
                  } top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted hover:text-ink transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              ) : null}
            </div>

            {/* Hint text */}
            {!isTextSearch && trimmed.length === 1 && (
              <p className={`mt-2 text-xs text-gray-500 ${isArabic ? "text-right" : "text-left"}`}>
                {isArabic ? "اكتب حرفين على الأقل للبحث في نصوص الأحاديث" : "Type at least 2 characters to search hadith texts"}
              </p>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-8 space-y-10">
        {/* ── Full-text search results ── */}
        {isTextSearch && (
          <>
            {/* Error */}
            {searchError && (
              <p className={`text-center text-sm text-red-500 py-4 ${isArabic ? "text-right" : "text-left"}`}>
                {searchError}
              </p>
            )}

            {/* Loading skeleton */}
            {isSearching && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-surface p-5 space-y-3 animate-pulse"
                  >
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {!isSearching && hasSearched && (
              <>
                {/* Results count */}
                <p
                  className={`text-sm text-ink-muted ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  {isArabic
                    ? `${searchResults.length} نتيجة${searchResults.length === 30 ? " (أول ٣٠ نتيجة)" : ""}`
                    : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}${searchResults.length === 30 ? " (first 30)" : ""}`}
                </p>

                {searchResults.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-lg text-ink-muted">
                      {isArabic
                        ? `لا توجد أحاديث تحتوي على "${trimmed}"`
                        : `No hadiths found for "${trimmed}"`}
                    </p>
                    <p className="text-sm text-ink-muted mt-2">
                      {isArabic
                        ? "جرب كلمات أخرى أو تحقق من الإملاء"
                        : "Try different keywords or check your spelling"}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {searchResults.map((result, i) => (
                      <HadithSearchResultCard
                        key={`${result.collectionId}-${result.hadith.hadith_number}-${i}`}
                        result={result}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Collection browse (shown when not in text-search mode) ── */}
        {!isTextSearch && (
          <>
            {filteredCollections.length === 0 && trimmed.length > 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-ink-muted">
                  {isArabic ? "لا توجد نتائج للبحث" : "No results found"}
                </p>
              </div>
            )}

            {primaryCollections.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-ink mb-4">
                  {locale === "ar" ? "الكتب الستة والمسانيد" : "Primary Collections"}
                </h2>
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4">
                  <div className="flex gap-4" style={{ width: "max-content" }}>
                    {primaryCollections.map((collection) => (
                      <div key={collection.id} className="w-[180px] flex-shrink-0">
                        <HadithCollectionCard
                          collection={collection}
                          locale={locale}
                          variant="primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {compilationCollections.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-ink mb-4">
                  {locale === "ar" ? "المختارات والمجاميع" : "Compilation Collections"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {compilationCollections.map((collection) => (
                    <HadithCollectionCard
                      key={collection.id}
                      collection={collection}
                      locale={locale}
                    />
                  ))}
                </div>
              </section>
            )}

            {duaCollections.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-ink mb-4">
                  {locale === "ar" ? "مجاميع الأدعية" : "Du'a Collections"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {duaCollections.map((collection) => (
                    <HadithCollectionCard
                      key={collection.id}
                      collection={collection}
                      locale={locale}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Container>
    </>
  );
}
