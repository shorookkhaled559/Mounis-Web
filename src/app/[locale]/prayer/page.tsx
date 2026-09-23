import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { HadithStyleHero } from "@/components/sections/hadith-style-hero";
import { PrayerSection } from "@/components/sections/prayer-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "prayer");
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "pages.prayer" });
  const isArabic = locale === "ar";

  return (
    <>
      <HadithStyleHero
        title={t("title")}
        description={t("description")}
        breadcrumb={isArabic ? "مواقيت الصلاة والقبلة" : "Prayer & Qibla"}
        locale={locale}
      />
      <PrayerSection locale={locale} />
    </>
  );
}
