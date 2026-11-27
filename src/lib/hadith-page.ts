import { getCollection } from "@/lib/hadith";
import { getRelatedKeys } from "@/lib/hadith-extras";
import { isValidHadithNumber } from "@/lib/hadith-view";
import type { Hadith, HadithBook, HadithCollection } from "@/types/hadith";

export interface HadithLocation {
  collection: HadithCollection;
  book: HadithBook;
  hadith: Hadith;
  /** position of the hadith inside the book */
  index: number;
}

/** Strict on purpose: "1abc" must not serve the same page under another URL. */
export function parseBookNumber(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

export async function findHadith(
  collectionId: string,
  bookParam: string,
  numberParam: string,
): Promise<HadithLocation | null> {
  const bookNumber = parseBookNumber(bookParam);
  if (bookNumber === null || !isValidHadithNumber(numberParam)) return null;

  const collection = await getCollection(collectionId);
  if (!collection) return null;

  const book = collection.books.find((b) => b.book_number === bookNumber);
  if (!book) return null;

  const index = book.hadiths.findIndex((h) => h.hadith_number === numberParam);
  if (index === -1) return null;

  return { collection, book, hadith: book.hadiths[index], index };
}

export interface RelatedHadith {
  bookNumber: number;
  bookNameAr: string;
  bookNameEn: string;
  hadith: Hadith;
}

/** Resolves the precomputed "similar wording" keys to hadiths of the same collection. */
export async function getRelatedHadiths(loc: HadithLocation): Promise<RelatedHadith[]> {
  const keys = await getRelatedKeys(
    loc.collection.collection.id,
    loc.book.book_number,
    loc.hadith.hadith_number,
  );
  const out: RelatedHadith[] = [];
  for (const key of keys) {
    const [bookPart, ...rest] = key.split(":");
    const number = rest.join(":");
    const book = loc.collection.books.find((b) => String(b.book_number) === bookPart);
    const hadith = book?.hadiths.find((h) => h.hadith_number === number);
    if (book && hadith) {
      out.push({
        bookNumber: book.book_number,
        bookNameAr: book.name_ar,
        bookNameEn: book.name_en,
        hadith,
      });
    }
  }
  return out;
}
