import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FeaturedArticle } from "@/components/sections/featured-article";
import { Container } from "@/components/ui/container";
import { AdSlot } from "@/components/ui/ad-slot";
import { articles, getArticleBySlug } from "@/lib/data/articles";
import { routing } from "@/i18n/routing";
import { buildAlternates, getSiteUrl, ogImageFor } from "@/lib/page-metadata";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    articles.map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const lang = locale as "ar" | "en";

  return {
    title: article.title[lang],
    description: article.excerpt[lang],
    alternates: buildAlternates(locale, `/articles/${slug}`),
    openGraph: {
      title: article.title[lang],
      description: article.excerpt[lang],
      type: "article",
      siteName: "Mounis",
      locale,
      publishedTime: article.publishedAt,
      images: [{ ...ogImageFor(article.cover), alt: article.title[lang] }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title[lang],
      description: article.excerpt[lang],
      images: [ogImageFor(article.cover).url],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const lang = locale as "ar" | "en";
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/${locale}/articles/${slug}`;

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title[lang],
    "description": article.excerpt[lang],
    "image": `${siteUrl}${ogImageFor(article.cover).url}`,
    "datePublished": article.publishedAt,
    "author": {
      "@type": "Organization",
      "name": "Mounis",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mounis",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/brand/logo.png`,
      },
    },
    "url": articleUrl,
    "inLanguage": locale,
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        // escape "<" so article text can never close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      
      <FeaturedArticle article={article} />
      <Container className="max-w-3xl pb-10">
        <AdSlot width={336} height={280} />
      </Container>
    </>
  );
}
