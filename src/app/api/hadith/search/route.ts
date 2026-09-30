import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { HadithCollection, Hadith } from "@/types/hadith";

const HADITHS_DIR = path.join(process.cwd(), "public/data/hadiths");

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
  const query = searchParams.get("q") ?? "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 30;

  if (!query.trim() || query.trim().length < 2) {
    return NextResponse.json<HadithSearchResponse>({
      results: [],
      total: 0,
      query,
    });
  }

  const normalizedQuery = normalize(query);
  const results: HadithSearchResult[] = [];

  try {
    const files = fs.readdirSync(HADITHS_DIR).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      if (results.length >= limit) break;

      try {
        const filePath = path.join(HADITHS_DIR, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data: HadithCollection = JSON.parse(content);

        if (!data.books || !data.collection) continue;

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
      } catch {
        continue;
      }
    }
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json<HadithSearchResponse>({
    results,
    total: results.length,
    query,
  });
}
