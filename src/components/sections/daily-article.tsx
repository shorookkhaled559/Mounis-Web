"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ChevronLeft, ChevronRight, Clock, Calendar, Eye } from "lucide-react";
import type { Article } from "@/lib/data/articles";

interface DailyArticleProps {
  articles: Article[];
}

export function DailyArticle({ articles }: DailyArticleProps) {
  const locale = useLocale() as "ar" | "en";
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentArticle = articles[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));
  };

  const publishedLabel = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(currentArticle.publishedAt));

  return (
    <section className="py-12 sm:py-16 bg-background">
      <Container>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">
            {locale === "ar" ? "مقال اليوم" : "Article of the Day"}
          </h2>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="w-10 h-10 rounded-full border border-border bg-surface hover:bg-surface-raised hover:border-primary transition-all flex items-center justify-center group"
              aria-label={locale === "ar" ? "السابق" : "Previous"}
            >
              <ChevronRight className="w-5 h-5 text-ink-muted group-hover:text-primary" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-border bg-surface hover:bg-surface-raised hover:border-primary transition-all flex items-center justify-center group"
              aria-label={locale === "ar" ? "التالي" : "Next"}
            >
              <ChevronLeft className="w-5 h-5 text-ink-muted group-hover:text-primary" />
            </button>
          </div>
        </div>

        {/* Article Card */}
        <Link
          href={`/articles/${currentArticle.slug}`}
          className="block group"
        >
          <div className="grid md:grid-cols-2 gap-6 bg-surface rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all">
            {/* Image */}
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px] overflow-hidden bg-surface-raised">
              <Image
                src={currentArticle.cover}
                alt={currentArticle.title[locale]}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              {/* Category Badge */}
              <span className="inline-flex items-center gap-2 text-xs font-medium text-primary mb-3 w-fit">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {currentArticle.category[locale]}
              </span>

              {/* Title */}
              <h3 className="font-display text-xl sm:text-2xl leading-snug text-ink mb-3 group-hover:text-primary transition-colors">
                {currentArticle.title[locale]}
              </h3>

              {/* Excerpt */}
              <p className="text-base leading-relaxed text-ink-muted mb-5 line-clamp-3">
                {currentArticle.excerpt[locale]}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {publishedLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {currentArticle.readMinutes}{" "}
                  {locale === "ar" ? "دقيقة" : "min"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {locale === "ar" ? "١٢٥" : "125"}
                </span>
              </div>

              {/* Read More Link */}
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  {locale === "ar" ? "اقرأ المقالة" : "Read Article"}
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-border hover:bg-primary/30"
              }`}
              aria-label={`${locale === "ar" ? "انتقل إلى المقال" : "Go to article"} ${index + 1}`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
