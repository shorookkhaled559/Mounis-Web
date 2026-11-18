import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { QuranReader } from "@/components/quran/quran-reader";
import { TOTAL_PAGES, isValidPage, juzOfPage, parseRouteNumber } from "@/lib/quran";
import { getPageSections } from "@/lib/quran/data";
import { buildQuranRouteMetadata } from "@/lib/quran/metadata";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Array.from({ length: TOTAL_PAGES }, (_, i) => ({ locale, page: String(i + 1) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  const n = parseRouteNumber(page);
  if (!isValidPage(n)) return { title: "Not Found" };
  const t = await getTranslations({ locale, namespace: "quran" });
  const siteName = (await getTranslations({ locale, namespace: "meta" }))("siteName");
  return buildQuranRouteMetadata({
    locale,
    path: `/quran/page/${n}`,
    title: t("pageOf", { page: n, total: TOTAL_PAGES }),
    description: t("metaPage", { page: n, juz: juzOfPage(n) }),
    siteName,
  });
}

export default async function MushafPage({ params }: { params: Promise<{ locale: string; page: string }> }) {
  const { locale, page } = await params;
  setRequestLocale(locale);
  const n = parseRouteNumber(page);
  if (!isValidPage(n)) notFound();

  return (
    <QuranReader
      key={n}
      locale={locale}
      mode="page"
      page={n}
      sections={getPageSections(n)}
      juz={juzOfPage(n)}
      prev={n > 1 ? `/quran/page/${n - 1}` : null}
      next={n < TOTAL_PAGES ? `/quran/page/${n + 1}` : null}
    />
  );
}
