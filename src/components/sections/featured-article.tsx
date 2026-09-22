import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { ArticleActions } from "./article-actions";
import type { Article } from "@/lib/data/articles";

export function FeaturedArticle({ article }: { article: Article }) {
  const t = useTranslations("article");
  const locale = useLocale() as "ar" | "en";

  const publishedLabel = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(article.publishedAt));

  return (
    <section className="py-10 sm:py-14">
      <Container className="max-w-3xl">
        <p className="text-sm font-medium text-accent">
          {article.category[locale]}
        </p>
        <h2 className="mt-2 font-display text-2xl leading-snug text-ink sm:text-3xl">
          {article.title[locale]}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          {article.excerpt[locale]}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span>{article.category[locale]}</span>
          <span aria-hidden="true">·</span>
          <span>{t("readMinutes", { minutes: article.readMinutes })}</span>
          <span aria-hidden="true">·</span>
          <span>{t("publishedOn", { date: publishedLabel })}</span>
        </div>

        <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-xl bg-surface">
          <Image
            src={article.cover}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>

        {article.body && (
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink">
            {article.body[locale].map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

        {locale === "ar" ? (
          <blockquote className="mt-6 border-s-4 border-accent ps-4 font-display text-lg leading-relaxed text-primary">
            الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا
            بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
            <cite className="mt-2 block text-sm font-sans not-italic text-ink-muted">
              سورة الرعد: ٢٨
            </cite>
          </blockquote>
        ) : (
          <blockquote className="mt-6 border-s-4 border-accent ps-4 text-base leading-relaxed text-primary">
            A verse from Surah Ar-Ra&apos;d reminding that hearts find rest in
            the remembrance of God.
            <cite className="mt-2 block text-sm not-italic text-ink-muted">
              Qur&apos;an 13:28
            </cite>
          </blockquote>
        )}

        <div className="mt-6">
          <ArticleActions />
        </div>
      </Container>
    </section>
  );
}
