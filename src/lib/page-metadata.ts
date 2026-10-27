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

let warnedAboutSiteUrl = false;

/** The one place that knows the public origin. Set NEXT_PUBLIC_SITE_URL in production. */
export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url && process.env.NODE_ENV === "production" && !warnedAboutSiteUrl) {
    warnedAboutSiteUrl = true;
    console.warn("[seo] NEXT_PUBLIC_SITE_URL is not set - canonical URLs will use https://example.com");
  }
  return (url ?? "https://example.com").replace(/\/$/, "");
}

/** Real pixel size of /brand/logo.png - declaring a fake 1200x630 breaks social cards. */
export const DEFAULT_OG_IMAGE = { url: "/brand/logo.png", width: 1000, height: 348 };

/** Social crawlers can't render SVG, so SVG covers fall back to the logo. */
export function ogImageFor(cover?: string) {
  return cover && /\.(png|jpe?g|webp)$/i.test(cover) ? { url: cover } : DEFAULT_OG_IMAGE;
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
  const siteName = (await getTranslations({ locale, namespace: "meta" }))("siteName");
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
      // child openGraph replaces the parent's wholesale, so repeat these
      siteName,
      locale,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
