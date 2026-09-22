import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getCollectionsSummary } from "@/lib/hadith";
import { HadithPageClient } from "@/components/sections/hadith-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "hadith");
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const collections = await getCollectionsSummary();

  return <HadithPageClient collections={collections} locale={locale} />;
}
