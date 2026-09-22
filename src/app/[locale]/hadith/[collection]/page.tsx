import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCollection } from "@/lib/hadith";
import { BookOpen, User } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; collection: string }>;
}): Promise<Metadata> {
  const { locale, collection: collectionId } = await params;
  const collection = await getCollection(collectionId);

  if (!collection) {
    return { title: "Not Found" };
  }

  const name = locale === "ar" ? collection.collection.name_ar : collection.collection.name_en;
  
  return {
    title: name,
    description: locale === "ar" 
      ? `${collection.collection.author_ar} - ${collection.books.length} كتاب`
      : `${collection.collection.author_en} - ${collection.books.length} books`,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; collection: string }>;
}) {
  const { locale, collection: collectionId } = await params;
  setRequestLocale(locale);
  
  const collection = await getCollection(collectionId);

  if (!collection) {
    notFound();
  }

  const isArabic = locale === "ar";
  const name = isArabic ? collection.collection.name_ar : collection.collection.name_en;
  const author = isArabic ? collection.collection.author_ar : collection.collection.author_en;

  // Calculate total hadiths
  const totalHadiths = collection.books.reduce(
    (sum, book) => sum + book.hadiths.length,
    0
  );

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <Link
          href="/hadith"
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-primary mb-4"
        >
          ← {isArabic ? "العودة إلى المجموعات" : "Back to Collections"}
        </Link>
        <h1 className="text-3xl font-bold text-ink mb-2">{name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-ink-muted">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden="true" />
            <span>{author}</span>
          </div>
          <span>•</span>
          <span>
            {totalHadiths.toLocaleString(isArabic ? "ar" : "en")}{" "}
            {isArabic ? "حديث" : "hadiths"}
          </span>
          <span>•</span>
          <span>
            {collection.books.length}{" "}
            {isArabic ? "كتاب" : "books"}
          </span>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collection.books.map((book) => {
          const bookName = isArabic ? book.name_ar : book.name_en;
          return (
            <Link
              key={book.book_number}
              href={`/hadith/${collectionId}/${book.book_number}`}
              className="group block rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {bookName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {isArabic ? "كتاب" : "Book"} {book.book_number}
                    </span>
                    <span>
                      {book.hadiths.length.toLocaleString(isArabic ? "ar" : "en")}{" "}
                      {isArabic ? "حديث" : "hadiths"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
