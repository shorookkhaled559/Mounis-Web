import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Article } from "@/lib/data/articles";

export function ArticleCard({ article }: { article: Article }) {
  const t = useTranslations("article");
  const locale = useLocale() as "ar" | "en";

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={article.cover}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium text-accent">
          {article.category[locale]}
        </p>
        <p className="text-xs text-ink-muted">
          {t("readMinutes", { minutes: article.readMinutes })}
        </p>
        <h3 className="font-display text-base leading-snug text-ink">
          {article.title[locale]}
        </h3>
        <p className="line-clamp-2 text-sm text-ink-muted">
          {article.excerpt[locale]}
        </p>
      </div>
    </Link>
  );
}
