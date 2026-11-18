import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { QuranReader } from "@/components/quran/quran-reader";
import { TOTAL_SURAHS, getSurah, parseRouteNumber, surahs } from "@/lib/quran";
import { getSurahSection } from "@/lib/quran/data";
import { buildQuranRouteMetadata } from "@/lib/quran/metadata";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => surahs.map((s) => ({ locale, surah: String(s.n) })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; surah: string }>;
}): Promise<Metadata> {
  const { locale, surah } = await params;
  const meta = getSurah(parseRouteNumber(surah));
  if (!meta) return { title: "Not Found" };
  const t = await getTranslations({ locale, namespace: "quran" });
  const siteName = (await getTranslations({ locale, namespace: "meta" }))("siteName");
  const name = locale === "en" ? meta.tr : meta.ar;
  return buildQuranRouteMetadata({
    locale,
    path: `/quran/${meta.n}`,
    title: t("surahName", { name }),
    description: t("metaSurah", { name, count: meta.ayahs, type: t(meta.type) }),
    siteName,
  });
}

export default async function SurahPage({ params }: { params: Promise<{ locale: string; surah: string }> }) {
  const { locale, surah } = await params;
  setRequestLocale(locale);
  const n = parseRouteNumber(surah);
  const meta = getSurah(n);
  if (!meta) notFound();

  return (
    <QuranReader
      key={n}
      locale={locale}
      mode="surah"
      sections={[getSurahSection(n)]}
      juz={meta.juz}
      prev={n > 1 ? `/quran/${n - 1}` : null}
      next={n < TOTAL_SURAHS ? `/quran/${n + 1}` : null}
    />
  );
}
