import fs from "node:fs/promises";
import path from "node:path";
import type { HadithCollection, CollectionSummary } from "@/types/hadith";

export const HADITHS_DIR = path.join(process.cwd(), "public/data/hadiths");

// Collection ids come from the URL, so they must never be used to build a file
// path unless they match this allowlist (blocks "../" style traversal).
const ID_PATTERN = /^[a-z0-9-]+$/;

export function isValidCollectionId(id: string): boolean {
  return ID_PATTERN.test(id);
}

/** Ids of every collection that exists on disk (e.g. "bukhari"). */
export async function getCollectionIds(): Promise<string[]> {
  const files = await fs.readdir(HADITHS_DIR);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .filter(isValidCollectionId)
    .sort();
}

/**
 * Reads + parses one collection straight from disk, without caching.
 * Use this for one-off scans (search); use `getCollection` for page rendering.
 */
export async function readCollectionUncached(
  id: string,
): Promise<HadithCollection | null> {
  if (!isValidCollectionId(id)) return null;
  try {
    const content = await fs.readFile(path.join(HADITHS_DIR, `${id}.json`), "utf-8");
    return JSON.parse(content) as HadithCollection;
  } catch {
    return null;
  }
}

// Parsing the biggest collection (~28 MB) takes ~1s, and a page render needs it
// twice (generateMetadata + the page itself). Keep the most recently used few
// parsed in memory. Raise MAX_CACHED only if the host has memory to spare:
// a parsed collection takes roughly 2-3x its file size in heap.
const MAX_CACHED = 2;
const parsedCache = new Map<string, Promise<HadithCollection | null>>();

/** Full collection data by id, or null when the id is invalid / doesn't exist. */
export function getCollection(id: string): Promise<HadithCollection | null> {
  if (!isValidCollectionId(id)) return Promise.resolve(null);

  const cached = parsedCache.get(id);
  if (cached) {
    // refresh recency
    parsedCache.delete(id);
    parsedCache.set(id, cached);
    return cached;
  }

  const pending = readCollectionUncached(id).then((data) => {
    // never keep misses around, otherwise junk ids would evict real data
    if (!data) parsedCache.delete(id);
    return data;
  });
  parsedCache.set(id, pending);
  while (parsedCache.size > MAX_CACHED) {
    const oldest = parsedCache.keys().next().value;
    if (oldest === undefined) break;
    parsedCache.delete(oldest);
  }
  return pending;
}

let summaryCache: Promise<CollectionSummary[]> | null = null;

/** Summary info (names, counts) for the collections listing page. */
export function getCollectionsSummary(): Promise<CollectionSummary[]> {
  summaryCache ??= buildSummaries().catch((error) => {
    summaryCache = null; // don't cache a failure
    throw error;
  });
  return summaryCache;
}

async function buildSummaries(): Promise<CollectionSummary[]> {
  const summaries: CollectionSummary[] = [];

  for (const id of await getCollectionIds()) {
    // Sequential on purpose: each file is tens of MB, so parse one, keep only
    // the small summary, and let the big object be garbage collected.
    const data = await readCollectionUncached(id);
    if (!data?.books || !data.collection) {
      console.warn(`Skipping ${id}: missing books or collection metadata`);
      continue;
    }

    summaries.push({
      id: data.collection.id,
      name_ar: data.collection.name_ar,
      name_en: data.collection.name_en,
      author_ar: data.collection.author_ar,
      author_en: data.collection.author_en,
      type: data.collection.type,
      cover_image: data.collection.cover_image,
      totalHadiths: data.books.reduce(
        (sum, book) => sum + (book.hadiths?.length || 0),
        0,
      ),
      totalBooks: data.books.length,
    });
  }

  // primary first, then compilation, then dua; biggest first inside each type
  const typeOrder = { primary: 1, compilation: 2, dua: 3 };
  summaries.sort(
    (a, b) =>
      typeOrder[a.type] - typeOrder[b.type] || b.totalHadiths - a.totalHadiths,
  );

  return summaries;
}
