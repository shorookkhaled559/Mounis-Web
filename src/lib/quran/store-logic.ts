/** Pure, testable logic behind the localStorage-backed reader state. */
import { DEFAULT_RECITER_ID, isReciterId } from "./audio";
import { isValidAyah, isValidPage, pageOf } from "./index";

export const STORAGE_KEY = "mounis:quran:v1";
export const MAX_BOOKMARKS = 300;
export const FONT_SIZE_MIN = 0;
export const FONT_SIZE_MAX = 4;

export type ReaderView = "cards" | "flow";

export interface QuranSettings {
  /** 0..4, index into the font-size ladder. */
  fontSize: number;
  /** null = never chosen: follow the UI language (on for English, off for Arabic). */
  translation: boolean | null;
  reciter: string;
  /** Surah reader layout: verse cards or continuous flowing text. */
  view: ReaderView;
  /** In the page reader, go on to the next page when the last ayah ends. */
  autoNextPage: boolean;
}

export interface Bookmark {
  surah: number;
  ayah: number;
  ts: number;
}

export interface LastRead {
  surah: number;
  ayah: number;
  page: number;
  mode: "surah" | "page";
  ts: number;
}

export interface QuranState {
  settings: QuranSettings;
  bookmarks: Bookmark[];
  lastRead: LastRead | null;
}

export const DEFAULT_SETTINGS: QuranSettings = Object.freeze({
  fontSize: 2,
  translation: null,
  reciter: DEFAULT_RECITER_ID,
  view: "cards",
  autoNextPage: true,
}) as QuranSettings;

export const DEFAULT_STATE: QuranState = Object.freeze({
  settings: DEFAULT_SETTINGS,
  bookmarks: Object.freeze([]) as unknown as Bookmark[],
  lastRead: null,
}) as QuranState;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function sanitizeSettings(raw: unknown): QuranSettings {
  const r = isObj(raw) ? raw : {};
  const fs = typeof r.fontSize === "number" && Number.isFinite(r.fontSize) ? Math.round(r.fontSize) : DEFAULT_SETTINGS.fontSize;
  return {
    fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, fs)),
    translation: typeof r.translation === "boolean" ? r.translation : null,
    reciter: isReciterId(r.reciter) ? r.reciter : DEFAULT_RECITER_ID,
    view: r.view === "flow" ? "flow" : "cards",
    autoNextPage: typeof r.autoNextPage === "boolean" ? r.autoNextPage : true,
  };
}

function sanitizeBookmarks(raw: unknown): Bookmark[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Bookmark[] = [];
  for (const item of raw) {
    if (!isObj(item)) continue;
    const { surah, ayah, ts } = item;
    if (typeof surah !== "number" || typeof ayah !== "number" || !isValidAyah(surah, ayah)) continue;
    const key = `${surah}:${ayah}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ surah, ayah, ts: typeof ts === "number" && Number.isFinite(ts) ? ts : 0 });
  }
  return out.sort((a, b) => b.ts - a.ts).slice(0, MAX_BOOKMARKS);
}

function sanitizeLastRead(raw: unknown): LastRead | null {
  if (!isObj(raw)) return null;
  const { surah, ayah, page, mode, ts } = raw;
  if (typeof surah !== "number" || typeof ayah !== "number" || !isValidAyah(surah, ayah)) return null;
  return {
    surah,
    ayah,
    page: typeof page === "number" && isValidPage(page) ? page : pageOf(surah, ayah),
    mode: mode === "page" ? "page" : "surah",
    ts: typeof ts === "number" && Number.isFinite(ts) ? ts : 0,
  };
}

/** Turns whatever is in localStorage (possibly garbage or an older shape) into a valid state. */
export function sanitizeState(raw: unknown): QuranState {
  if (!isObj(raw)) return DEFAULT_STATE;
  return {
    settings: sanitizeSettings(raw.settings),
    bookmarks: sanitizeBookmarks(raw.bookmarks),
    lastRead: sanitizeLastRead(raw.lastRead),
  };
}

export function isBookmarked(bookmarks: readonly Bookmark[], surah: number, ayah: number): boolean {
  return bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
}

/** Adds the bookmark (newest first) or removes it when it already exists. */
export function toggleBookmark(bookmarks: readonly Bookmark[], surah: number, ayah: number, now: number): Bookmark[] {
  if (!isValidAyah(surah, ayah)) return [...bookmarks];
  if (isBookmarked(bookmarks, surah, ayah)) {
    return bookmarks.filter((b) => !(b.surah === surah && b.ayah === ayah));
  }
  return [{ surah, ayah, ts: now }, ...bookmarks].slice(0, MAX_BOOKMARKS);
}
