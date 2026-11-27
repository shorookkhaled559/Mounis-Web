import type { Hadith, HadithCollection } from "@/types/hadith";

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 100;
export const SEARCH_MAX_TOKENS = 8;

/** Searching "everything" would parse ~156 MB per request, so the default is the two Sahih books. */
export const DEFAULT_SEARCH_SCOPE = ["bukhari", "muslim"] as const;

const DIACRITICS = /[ً-ٰٟـ]/g;
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeSearchText(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)))
    .replace(DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type ParsedQuery =
  | { kind: "empty" }
  | { kind: "number"; number: string }
  | { kind: "words"; tokens: string[] };

/** A bare number looks the hadith up by its number; anything else is a word search (all words must appear). */
export function parseQuery(raw: string): ParsedQuery {
  const normalized = normalizeSearchText(raw);
  if (normalized.length < SEARCH_MIN_LENGTH && !/^\d$/.test(normalized)) return { kind: "empty" };
  // "12", or "8a": Sahih Muslim numbers many hadiths with a letter suffix
  const numeric = /^(\d{1,6})([a-z]?)$/.exec(normalized);
  if (numeric) return { kind: "number", number: `${Number(numeric[1])}${numeric[2]}` };
  const tokens = normalized.split(" ").filter(Boolean).slice(0, SEARCH_MAX_TOKENS);
  return tokens.length ? { kind: "words", tokens } : { kind: "empty" };
}

// Normalising 7,000+ hadiths per request is wasteful: remember it per hadith object.
const haystacks = new WeakMap<Hadith, string>();

function haystack(hadith: Hadith): string {
  let value = haystacks.get(hadith);
  if (value === undefined) {
    value = normalizeSearchText(
      [hadith.matn_ar, hadith.matn_en, hadith.narrator].filter(Boolean).join(" "),
    );
    haystacks.set(hadith, value);
  }
  return value;
}

/** "8" matches "8" and also "8a" / "8b"; "8a" matches only "8a". */
function matchesNumber(hadithNumber: string, wanted: string): boolean {
  if (hadithNumber === wanted) return true;
  return (
    !/[a-z]$/.test(wanted) &&
    hadithNumber.startsWith(wanted) &&
    /^[a-z]$/.test(hadithNumber.slice(wanted.length))
  );
}

export interface HadithSearchHit {
  collectionId: string;
  collectionName_ar: string;
  collectionName_en: string;
  bookNumber: number;
  bookName_ar: string;
  bookName_en: string;
  hadithNumber: string;
  reference: string;
  matn_ar: string;
  matn_en: string;
}

export function searchCollection(
  data: HadithCollection,
  query: ParsedQuery,
  limit: number,
): HadithSearchHit[] {
  if (query.kind === "empty") return [];
  const hits: HadithSearchHit[] = [];
  const meta = data.collection;

  outer: for (const book of data.books) {
    for (const hadith of book.hadiths) {
      const matches =
        query.kind === "number"
          ? matchesNumber(hadith.hadith_number, query.number)
          : query.tokens.every((token) => haystack(hadith).includes(token));
      if (!matches) continue;

      hits.push({
        collectionId: meta.id,
        collectionName_ar: meta.name_ar,
        collectionName_en: meta.name_en,
        bookNumber: book.book_number,
        bookName_ar: book.name_ar,
        bookName_en: book.name_en,
        hadithNumber: hadith.hadith_number,
        reference: hadith.reference,
        matn_ar: hadith.matn_ar,
        matn_en: hadith.matn_en,
      });
      if (hits.length >= limit) break outer;
    }
  }
  return hits;
}
