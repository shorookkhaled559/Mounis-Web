import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { DailyArticle } from "@/components/sections/daily-article";
import { Categories } from "@/components/sections/categories";
import { FeaturedArticles } from "@/components/sections/featured-articles";
import { Newsletter } from "@/components/sections/newsletter";
import { DidYouKnow } from "@/components/sections/did-you-know";
import { CTASection } from "@/components/sections/cta-section";
import { articles, getLatestArticles } from "@/lib/data/articles";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get articles for different sections
  const latestArticles = getLatestArticles(4);
  const featuredArticles = articles.slice(0, 3);

  return (
    <>
      <Hero />
      <DailyArticle articles={latestArticles} />
      <Categories />
      <FeaturedArticles articles={featuredArticles} />
      <DidYouKnow />
      <Newsletter />
      <CTASection />
    </>
  );
}
