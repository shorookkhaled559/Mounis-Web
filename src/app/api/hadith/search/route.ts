import { NextRequest, NextResponse } from "next/server";
import type { Hadith } from "@/types/hadith";
import { getCollectionIds, readCollectionUncached } from "@/lib/hadith";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

/** Always returns a number in [1, MAX_LIMIT]; junk like "abc" or "-5" falls back to the default. */
function parseLimit(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export interface HadithSearchResult {
  hadith: Hadith;
  collectionId: string;
  collectionName_ar: string;
  collectionName_en: string;
  bookName_ar: string;
  bookName_en: string;
}

export interface HadithSearchResponse {
  results: HadithSearchResult[];
  total: number;
  query: string;
}

// Simple normalize: remove diacritics (tashkeel) for Arabic search
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove harakat
    .replace(/أ|إ|آ/g, "ا") // normalize alef
    .replace(/ة/g, "ه")     // normalize ta marbuta
    .replace(/ى/g, "ي");    // normalize alef maqsura
}

function normalize(text: string): string {
  return normalizeArabic(text).toLowerCase().trim();
}

function searchInHadith(hadith: Hadith, normalizedQuery: string): boolean {
  const fields = [
    hadith.matn_ar,
    hadith.matn_en,
    hadith.text_ar,
    hadith.text_en,
    hadith.narrator,
    hadith.reference,
  ];

  return fields.some((field) => {
    if (!field) return false;
    return normalize(field).includes(normalizedQuery);
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const limit = parseLimit(searchParams.get("limit"));

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json<HadithSearchResponse>({
      results: [],
      total: 0,
      query,
    });
  }

  const normalizedQuery = normalize(query);
  const results: HadithSearchResult[] = [];

  try {
    for (const id of await getCollectionIds()) {
      if (results.length >= limit) break;

      const data = await readCollectionUncached(id);
      if (!data?.books || !data.collection) continue;

      for (const book of data.books) {
        if (results.length >= limit) break;

        for (const hadith of book.hadiths ?? []) {
          if (results.length >= limit) break;

          if (searchInHadith(hadith, normalizedQuery)) {
            results.push({
              hadith,
              collectionId: data.collection.id,
              collectionName_ar: data.collection.name_ar,
              collectionName_en: data.collection.name_en,
              bookName_ar: book.name_ar,
              bookName_en: book.name_en,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Hadith search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json<HadithSearchResponse>({
    results,
    total: results.length,
    query,
  });
}
