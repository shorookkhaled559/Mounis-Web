import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const PAGE_PATHS = {
  prayer: "/prayer",
  zakat: "/zakat",
  hadith: "/hadith",
  thisDay: "/this-day",
  fatwas: "/fatwas",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
  articles: "/articles",
} as const;

export type PageKey = keyof typeof PAGE_PATHS;

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url && process.env.NODE_ENV === "production") {
    console.warn("[seo] NEXT_PUBLIC_SITE_URL is not set - canonical URLs will use https://example.com");
  }
  return (url ?? "https://example.com").replace(/\/$/, "");
}

/** canonical + hreflang alternates for ONE path (path without locale, may include ?query). */
export function buildAlternates(locale: string, path: string): NonNullable<Metadata["alternates"]> {
  const site = getSiteUrl();
  return {
    canonical: `${site}/${locale}${path}`,
    languages: {
      ar: `${site}/ar${path}`,
      en: `${site}/en${path}`,
      "x-default": `${site}/ar${path}`,
    },
  };
}

export async function buildPageMetadata(locale: string, pageKey: PageKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `pages.${pageKey}` });
  const path = PAGE_PATHS[pageKey];
  const title = t("title");
  const hasDescription = ["prayer", "zakat", "hadith", "thisDay", "fatwas", "about", "contact"].includes(pageKey);
  const description = hasDescription ? t("description") : undefined;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: {
      title,
      description,
      url: `${getSiteUrl()}/${locale}${path}`,
      images: ["/brand/logo.png"],
    },
  };
}
