import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { articles } from "@/lib/data/articles";
import { getCollectionIds } from "@/lib/hadith";
import { getSiteUrl } from "@/lib/page-metadata";

const staticPaths = [
  "",
  "/prayer",
  "/zakat",
  "/hadith",
  "/this-day",
  "/fatwas",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
  "/articles",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const collectionIds = await getCollectionIds();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.6,
      });
    }
    for (const id of collectionIds) {
      entries.push({
        url: `${siteUrl}/${locale}/hadith/${id}`,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
    for (const article of articles) {
      entries.push({
        url: `${siteUrl}/${locale}/articles/${article.slug}`,
        lastModified: article.publishedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
