import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { articles } from "@/lib/data/articles";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.6,
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
