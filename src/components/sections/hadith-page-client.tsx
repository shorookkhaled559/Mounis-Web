"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { HadithCollectionCard } from "@/components/sections/hadith-collection-card";
import { Search } from "lucide-react";
import type { CollectionSummary } from "@/types/hadith";

interface HadithPageClientProps {
  collections: CollectionSummary[];
  locale: string;
}

export function HadithPageClient({ collections, locale }: HadithPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isArabic = locale === "ar";

  // Filter collections based on search query
  const filteredCollections = collections.filter((collection) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const nameAr = collection.name_ar.toLowerCase();
    const nameEn = collection.name_en.toLowerCase();
    const authorAr = collection.author_ar.toLowerCase();
    const authorEn = collection.author_en.toLowerCase();
    
    return (
      nameAr.includes(query) ||
      nameEn.includes(query) ||
      authorAr.includes(query) ||
      authorEn.includes(query)
    );
  });

  // Group filtered collections by type
  const primaryCollections = filteredCollections.filter((c) => c.type === "primary");
  const compilationCollections = filteredCollections.filter((c) => c.type === "compilation");
  const duaCollections = filteredCollections.filter((c) => c.type === "dua");

  return (
    <>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
          style={{ 
            backgroundImage: 'url(/hadiths/hadith.png)',
          }}
        />
        
        {/* Content */}
        <Container className="relative py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div className={`flex items-center gap-2 text-sm text-gray-700 my-4 ${isArabic ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
              <span className="text-primary font-medium">{isArabic ? 'الأحاديث' : 'Hadiths'}</span>
              <span>•</span>
              <span>{isArabic ? 'الرئيسية' : 'Home'}</span>
            </div>

            {/* Title */}
            <h1 className={`font-display text-4xl md:text-5xl font-bold text-primary-deep mb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
              {isArabic ? 'الأحاديث' : 'Hadiths'}
            </h1>

            {/* Description */}
            <p className={`text-lg text-gray-700 mb-8 ${isArabic ? 'text-right' : 'text-left'}`}>
              {isArabic 
                ? 'مجموعة مختارة من الأحاديث النبوية الشريفة من أشهر المصادر'
                : 'A curated collection of authentic prophetic hadiths from renowned sources'}
            </p>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث في أي الأحاديث أو اسم الكتاب ...' : 'Search hadiths or book name...'}
                className={`w-full px-6 py-4 ${isArabic ? 'pr-14 text-right' : 'pl-14 text-left'} rounded-lg bg-white shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder:text-ink-muted`}
              />
              <Search className={`absolute ${isArabic ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted`} />
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8 space-y-10">
        {/* No Results Message */}
        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-ink-muted">
              {isArabic ? 'لا توجد نتائج للبحث' : 'No results found'}
            </p>
          </div>
        )}

        {/* Primary Collections */}
        {primaryCollections.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-ink mb-4">
              {locale === "ar" ? "الكتب الستة والمسانيد" : "Primary Collections"}
            </h2>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
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

        {/* Compilation Collections */}
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

        {/* Du'a Collections */}
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
      </Container>
    </>
  );
}
