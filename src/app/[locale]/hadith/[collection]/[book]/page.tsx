import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCollection } from "@/lib/hadith";
import { HadithCard } from "@/components/sections/hadith-card";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; collection: string; book: string }>;
}): Promise<Metadata> {
  const { locale, collection: collectionId, book: bookNumber } = await params;
  const collection = await getCollection(collectionId);

  if (!collection) {
    return { title: "Not Found" };
  }

  const book = collection.books.find((b) => b.book_number === parseInt(bookNumber));
  if (!book) {
    return { title: "Not Found" };
  }

  const bookName = locale === "ar" ? book.name_ar : book.name_en;
  const collectionName = locale === "ar" ? collection.collection.name_ar : collection.collection.name_en;
  
  return {
    title: `${bookName} - ${collectionName}`,
    description: locale === "ar" 
      ? `${book.hadiths.length} حديث`
      : `${book.hadiths.length} hadiths`,
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string; collection: string; book: string }>;
}) {
  const { locale, collection: collectionId, book: bookNumber } = await params;
  setRequestLocale(locale);
  
  const collection = await getCollection(collectionId);

  if (!collection) {
    notFound();
  }

  const book = collection.books.find((b) => b.book_number === parseInt(bookNumber));
  
  if (!book) {
    notFound();
  }

  const isArabic = locale === "ar";
  const bookName = isArabic ? book.name_ar : book.name_en;
  const collectionName = isArabic ? collection.collection.name_ar : collection.collection.name_en;

  return (
    <Container className="py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
        <Link href="/hadith" className="hover:text-primary">
          {isArabic ? "الأحاديث" : "Hadiths"}
        </Link>
        <span>/</span>
        <Link href={`/hadith/${collectionId}`} className="hover:text-primary">
          {collectionName}
        </Link>
        <span>/</span>
        <span className="text-ink">{bookName}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-ink mb-2">{bookName}</h1>
        <p className="text-ink-muted">
          {book.hadiths.length.toLocaleString(isArabic ? "ar" : "en")}{" "}
          {isArabic ? "حديث" : "hadiths"}
        </p>
      </div>

      {/* Hadiths List */}
      <div className="space-y-6">
        {book.hadiths.map((hadith) => (
          <HadithCard
            key={hadith.hadith_number}
            hadith={hadith}
            locale={locale}
            collectionId={collectionId}
          />
        ))}
      </div>
    </Container>
  );
}
