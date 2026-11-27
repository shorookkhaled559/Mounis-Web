/**
 * Optional, sourced enrichment for individual hadiths: an explanation (sharh)
 * and word meanings. The scraped corpus contains neither, and we do not write
 * religious explanations ourselves, so these only appear when a file
 *   public/data/hadith-extras/<collection>.json
 * provides them WITH a named source. An entry without a source is dropped.
 *
 * File shape (keys are "<book number>:<hadith number>"):
 * {
 *   "1:1": {
 *     "sharh": { "text": "…", "source": "Name of the book / site", "url": "https://…" },
 *     "words": { "items": [{ "word": "…", "meaning": "…" }], "source": "…", "url": "https://…" }
 *   }
 * }
 */
import fs from "node:fs/promises";
import path from "node:path";
import { isValidCollectionId } from "@/lib/hadith";

export interface SourcedText {
  text: string;
  source: string;
  url?: string;
}

export interface WordMeaning {
  word: string;
  meaning: string;
}

export interface SourcedWords {
  items: WordMeaning[];
  source: string;
  url?: string;
}

export interface HadithExtras {
  sharh?: SourcedText;
  words?: SourcedWords;
}

export const EXTRAS_DIR = path.join(process.cwd(), "public/data/hadith-extras");

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function httpUrl(value: unknown): string | undefined {
  const v = str(value);
  if (!v) return undefined;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Validates one raw entry. Anything without a named source is discarded. */
export function parseExtrasEntry(raw: unknown): HadithExtras | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const out: HadithExtras = {};

  const sharh = entry.sharh as Record<string, unknown> | undefined;
  const sharhText = str(sharh?.text);
  const sharhSource = str(sharh?.source);
  if (sharhText && sharhSource) {
    out.sharh = { text: sharhText, source: sharhSource, url: httpUrl(sharh?.url) };
  }

  const words = entry.words as Record<string, unknown> | undefined;
  const wordsSource = str(words?.source);
  if (wordsSource && Array.isArray(words?.items)) {
    const items: WordMeaning[] = [];
    for (const item of words.items as unknown[]) {
      const rec = item as Record<string, unknown> | null;
      const word = str(rec?.word);
      const meaning = str(rec?.meaning);
      if (word && meaning) items.push({ word, meaning });
    }
    if (items.length) out.words = { items, source: wordsSource, url: httpUrl(words.url) };
  }

  return out.sharh || out.words ? out : null;
}

export function parseExtras(raw: unknown): Record<string, HadithExtras> {
  const result: Record<string, HadithExtras> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d+:[A-Za-z0-9._-]+$/.test(key)) continue;
    const entry = parseExtrasEntry(value);
    if (entry) result[key] = entry;
  }
  return result;
}

const extrasCache = new Map<string, Promise<Record<string, HadithExtras>>>();

/** Extras of one collection; `{}` when there is no file (the normal case today). */
export function getExtras(collectionId: string): Promise<Record<string, HadithExtras>> {
  if (!isValidCollectionId(collectionId)) return Promise.resolve({});
  let cached = extrasCache.get(collectionId);
  if (!cached) {
    cached = fs
      .readFile(path.join(EXTRAS_DIR, `${collectionId}.json`), "utf-8")
      .then((content) => parseExtras(JSON.parse(content)))
      .catch(() => ({}));
    extrasCache.set(collectionId, cached);
  }
  return cached;
}

const RELATED_DIR = path.join(process.cwd(), "public/data/hadith-related");
const relatedCache = new Map<string, Promise<Record<string, string[]>>>();

/**
 * Hadiths of the same collection with the most similar Arabic wording, as
 * "<book>:<number>" keys (built by scripts/build-hadith-related.mjs).
 */
export async function getRelatedKeys(
  collectionId: string,
  bookNumber: number,
  hadithNumber: string,
): Promise<string[]> {
  if (!isValidCollectionId(collectionId)) return [];
  let cached = relatedCache.get(collectionId);
  if (!cached) {
    cached = fs
      .readFile(path.join(RELATED_DIR, `${collectionId}.json`), "utf-8")
      .then((content) => JSON.parse(content) as Record<string, string[]>)
      .catch(() => ({}));
    relatedCache.set(collectionId, cached);
  }
  const index = await cached;
  const list = index[`${bookNumber}:${hadithNumber}`];
  return Array.isArray(list) ? list : [];
}
