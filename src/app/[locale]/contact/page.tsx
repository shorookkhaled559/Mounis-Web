import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { PageHero } from "@/components/sections/page-hero";
import { StubNotice } from "@/components/sections/stub-notice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "contact");
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Add artificial delay in development to see loading states
  if (process.env.NODE_ENV === "development") {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  
  const t = await getTranslations({ locale, namespace: "pages.contact" });

  return (
    <>
      <PageHero title={t("title")} description={t("description")} />
      <StubNotice />
    </>
  );
}
