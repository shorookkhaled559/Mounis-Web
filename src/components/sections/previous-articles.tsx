import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ArticleCard } from "./article-card";
import type { Article } from "@/lib/data/articles";

export function PreviousArticles({ articles }: { articles: Article[] }) {
  const t = useTranslations("home.articleSection");

  return (
    <section className="border-t border-border py-10 sm:py-14">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl text-ink sm:text-2xl">
            {t("heading")}
          </h2>
          <Link
            href="/articles"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            {t("viewMore")}
          </Link>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Container>
    </section>
  );
}
