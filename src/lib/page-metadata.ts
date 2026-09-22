import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function buildPageMetadata(
  locale: string,
  pageKey:
    | "prayer"
    | "zakat"
    | "hadith"
    | "thisDay"
    | "fatwas"
    | "about"
    | "contact"
    | "privacy"
    | "terms"
    | "cookies"
    | "articles",
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `pages.${pageKey}` });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const title = t("title");
  const hasDescription = ["prayer", "zakat", "hadith", "thisDay", "fatwas", "about", "contact"].includes(
    pageKey,
  );
  const description = hasDescription ? t("description") : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/${pageKey}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/${pageKey}`,
      images: ["/brand/logo.png"],
    },
  };
}
