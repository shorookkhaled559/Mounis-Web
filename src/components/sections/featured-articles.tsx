import { useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Clock, ArrowLeft } from "lucide-react";
import type { Article } from "@/lib/data/articles";

interface FeaturedArticlesProps {
  articles: Article[];
}

export function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  const locale = useLocale() as "ar" | "en";

  return (
    <section className="py-12 sm:py-16 bg-surface-raised/50">
      <Container>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">
            {locale === "ar" ? "مقالات مختارة" : "Featured Articles"}
          </h2>
          <Link
            href="/articles"
            className="text-sm font-medium text-primary hover:text-primary-deep transition-colors flex items-center gap-1"
          >
            {locale === "ar" ? "عرض المزيد" : "View More"}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {articles.map((article) => {
            const publishedLabel = new Intl.DateTimeFormat(locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(new Date(article.publishedAt));

            return (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-raised">
                  <Image
                    src={article.cover}
                    alt={article.title[locale]}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface/95 backdrop-blur-sm border border-border">
                    <span className="text-xs font-medium text-primary">
                      {article.category[locale]}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                  {/* Title */}
                  <h3 className="font-display text-lg leading-snug text-ink mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title[locale]}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm leading-relaxed text-ink-muted mb-4 line-clamp-2 flex-1">
                    {article.excerpt[locale]}
                  </p>

                  {/* Meta Footer */}
                  <div className="flex items-center justify-between text-xs text-ink-muted pt-3 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {article.readMinutes} {locale === "ar" ? "دقيقة" : "min"}
                    </span>
                    <span>{publishedLabel}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
