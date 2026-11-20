import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CategoryReader } from "@/components/adhkar/category-reader";
import { categoryIds, getCategory, getGroupOf, getNeighbours } from "@/lib/adhkar/data";
import { parseRouteNumber } from "@/lib/quran";
import { buildQuranRouteMetadata } from "@/lib/quran/metadata";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => categoryIds.map((id) => ({ locale, category: String(id) })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const cat = getCategory(parseRouteNumber(category));
  if (!cat) return { title: "Not Found" };
  const t = await getTranslations({ locale, namespace: "adhkar" });
  const siteName = (await getTranslations({ locale, namespace: "meta" }))("siteName");
  const title = locale === "en" ? cat.en : cat.ar;
  return buildQuranRouteMetadata({
    locale,
    path: `/thought/${cat.id}`,
    title,
    description: t("metaCategory", { title }),
    siteName,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const id = parseRouteNumber(category);
  const cat = getCategory(id);
  if (!cat) notFound();

  const group = getGroupOf(id);
  const { prev, next } = getNeighbours(id);
  const label = (cid: number | null) => {
    const c = cid === null ? undefined : getCategory(cid);
    return c ? { id: c.id, title: locale === "en" ? c.en : c.ar } : null;
  };

  return (
    <CategoryReader
      key={id}
      locale={locale}
      category={cat}
      groupTitle={group ? (locale === "en" ? group.en : group.ar) : ""}
      prev={label(prev)}
      next={label(next)}
    />
  );
}
