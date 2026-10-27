import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { ZakatStyleHero } from "@/components/sections/zakat-style-hero";
import { ZakatCalculator } from "@/components/sections/zakat-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "zakat");
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "pages.zakat" });
  const isArabic = locale === "ar";

  return (
    <>
      <ZakatStyleHero
        title={t("title")}
        description={t("description")}
        breadcrumb={isArabic ? "حاسبة الزكاة" : "Zakat Calculator"}
        locale={locale}
      />
      <ZakatCalculator locale={locale} />
    </>
  );
}
