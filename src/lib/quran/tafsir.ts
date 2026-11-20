/**
 * Tafsir (Quran commentary) lookup.
 *
 * Data comes from the open-source "Tafsir API" dataset (github.com/spa5k/tafsir_api, MIT),
 * which is built from the QUL exports (qul.tarteel.ai) and altafsir.com. It is static JSON,
 * one file per ayah. We pin an exact release tag (the project's own advice for production:
 * jsDelivr caches tags for a year, so a floating tag could serve stale files) and keep a few
 * mirrors of the same tag as fallbacks.
 *
 * All five editions below were checked against the v1.2.3 data: every one of the 6236 ayahs
 * has a non-empty entry, the file's surah/ayah match its path, and there is no HTML in the text.
 * (Arabic Jalalayn is NOT offered: it lacks 226 ayahs.)
 *
 * Pure and framework-free so it can be unit-tested; the network call takes an injectable fetch.
 */
import { isValidAyah } from "./index";

/** Release tag of spa5k/tafsir_api that the data was verified against. Bump deliberately. */
export const TAFSIR_DATA_VERSION = "v1.2.3";

export type TafsirLang = "ar" | "en";

export interface TafsirEdition {
  /** Stable id used by the UI, the API route and localStorage. */
  id: string;
  /** Edition folder name in the dataset. */
  slug: string;
  /** Language of the commentary text. */
  lang: TafsirLang;
  /** Display names (same pattern as RECITERS in ./audio). */
  ar: string;
  en: string;
}

export const TAFSIR_EDITIONS: readonly TafsirEdition[] = [
  { id: "muyassar", slug: "ar-tafsir-muyassar", lang: "ar", ar: "التفسير الميسر", en: "Al-Tafsir al-Muyassar (Arabic)" },
  { id: "saadi", slug: "ar-tafsir-as-saadi", lang: "ar", ar: "تفسير السعدي", en: "Tafsir al-Sa'di (Arabic)" },
  { id: "ibn-kathir-ar", slug: "ar-tafsir-ibn-kathir", lang: "ar", ar: "تفسير ابن كثير", en: "Tafsir Ibn Kathir (Arabic)" },
  { id: "jalalayn-en", slug: "en-al-jalalayn", lang: "en", ar: "تفسير الجلالين (إنجليزي)", en: "Tafsir al-Jalalayn (English)" },
  { id: "ibn-kathir-en", slug: "en-tafisr-ibn-kathir", lang: "en", ar: "تفسير ابن كثير (إنجليزي)", en: "Tafsir Ibn Kathir (English)" },
];

export const DEFAULT_TAFSIR_BY_LOCALE: Readonly<Record<TafsirLang, string>> = {
  ar: "muyassar",
  en: "jalalayn-en",
};

export function isTafsirEdition(id: unknown): id is string {
  return typeof id === "string" && TAFSIR_EDITIONS.some((e) => e.id === id);
}

export function getTafsirEdition(id: string): TafsirEdition | undefined {
  return TAFSIR_EDITIONS.find((e) => e.id === id);
}

/** Editions with the UI language's own editions first (stable order otherwise). */
export function editionsForLocale(locale: string): TafsirEdition[] {
  const own: TafsirLang = locale === "en" ? "en" : "ar";
  return [...TAFSIR_EDITIONS].sort((a, b) => Number(b.lang === own) - Number(a.lang === own));
}

export function defaultEditionForLocale(locale: string): string {
  return DEFAULT_TAFSIR_BY_LOCALE[locale === "en" ? "en" : "ar"];
}

/** Mirrors of the same pinned tag, in the order they are tried. All are listed in the dataset's README. */
const SOURCES: readonly ((version: string) => string)[] = [
  (v) => `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@${v}/tafsir`,
  (v) => `https://raw.githubusercontent.com/spa5k/tafsir_api/${v}/tafsir`,
  (v) => `https://fastly.jsdelivr.net/gh/spa5k/tafsir_api@${v}/tafsir`,
];

/** URLs of one ayah's tafsir, one per mirror. Throws on an unknown edition or an ayah that does not exist. */
export function tafsirUrls(editionId: string, surah: number, ayah: number): string[] {
  const edition = getTafsirEdition(editionId);
  if (!edition) throw new RangeError(`Unknown tafsir edition: ${editionId}`);
  if (!isValidAyah(surah, ayah)) throw new RangeError(`Invalid ayah: ${surah}:${ayah}`);
  return SOURCES.map((base) => `${base(TAFSIR_DATA_VERSION)}/${edition.slug}/${surah}/${ayah}.json`);
}

/**
 * Validates one upstream file and returns its text, or null if it cannot be trusted:
 * not an object, text missing/blank, or the file says it belongs to a different ayah.
 * The wording itself is never altered; only line endings and runs of blank lines are tidied.
 */
export function parseTafsirPayload(raw: unknown, surah: number, ayah: number): string | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.surah !== surah || r.ayah !== ayah) return null;
  if (typeof r.text !== "string") return null;
  const text = r.text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text === "" ? null : text;
}

export type TafsirResult =
  | { status: "ok"; text: string }
  /** Every mirror answered 404: the dataset has no commentary for this ayah in this book. */
  | { status: "not_found" }
  /** Network error, timeout, bad status or bad data from every mirror. */
  | { status: "unavailable" };

type FetchInit = RequestInit & { next?: { revalidate?: number } };
export type FetchLike = (url: string, init?: FetchInit) => Promise<Response>;

const REQUEST_TIMEOUT_MS = 5000;
/** The pinned tag never changes, so Next may keep the upstream response for a month. */
const UPSTREAM_REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

/** Fetches one ayah's tafsir, falling through the mirrors until one returns valid data. */
export async function fetchTafsir(
  editionId: string,
  surah: number,
  ayah: number,
  fetchImpl: FetchLike = (url, init) => fetch(url, init),
): Promise<TafsirResult> {
  const urls = tafsirUrls(editionId, surah, ayah);
  let sawNotFound = false;
  let sawFailure = false;

  for (const url of urls) {
    try {
      const res = await fetchImpl(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { Accept: "application/json" },
        next: { revalidate: UPSTREAM_REVALIDATE_SECONDS },
      });
      if (res.status === 404) {
        sawNotFound = true;
        continue;
      }
      if (!res.ok) {
        sawFailure = true;
        continue;
      }
      const text = parseTafsirPayload(await res.json(), surah, ayah);
      if (text !== null) return { status: "ok", text };
      sawFailure = true;
    } catch {
      sawFailure = true;
    }
  }

  return sawNotFound && !sawFailure ? { status: "not_found" } : { status: "unavailable" };
}
