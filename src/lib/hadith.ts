import fs from "fs";
import path from "path";
import type { HadithCollection, CollectionSummary } from "@/types/hadith";

const HADITHS_DIR = path.join(process.cwd(), "public/data/hadiths");

/**
 * Get list of all available hadith collections with summary info
 */
export async function getCollectionsSummary(): Promise<CollectionSummary[]> {
  // Add artificial delay in development to see loading states
  if (process.env.NODE_ENV === "development") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const files = fs.readdirSync(HADITHS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const summaries: CollectionSummary[] = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(HADITHS_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data: HadithCollection = JSON.parse(content);

      // Skip if no books array or collection metadata
      if (!data.books || !data.collection) {
        console.warn(`Skipping ${file}: missing books or collection metadata`);
        continue;
      }

      // Count total hadiths across all books
      const totalHadiths = data.books.reduce(
        (sum, book) => sum + (book.hadiths?.length || 0),
        0
      );

      summaries.push({
        id: data.collection.id,
        name_ar: data.collection.name_ar,
        name_en: data.collection.name_en,
        author_ar: data.collection.author_ar,
        author_en: data.collection.author_en,
        type: data.collection.type,
        cover_image: data.collection.cover_image,
        totalHadiths,
        totalBooks: data.books.length,
      });
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      continue;
    }
  }

  // Sort: primary first, then compilation, then dua
  const typeOrder = { primary: 1, compilation: 2, dua: 3 };
  summaries.sort((a, b) => {
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    // Within same type, sort by total hadiths descending
    return b.totalHadiths - a.totalHadiths;
  });

  return summaries;
}

/**
 * Get full hadith collection data by ID
 */
export async function getCollection(id: string): Promise<HadithCollection | null> {
  // Add artificial delay in development to see loading states
  if (process.env.NODE_ENV === "development") {
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  try {
    const filePath = path.join(HADITHS_DIR, `${id}.json`);
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
