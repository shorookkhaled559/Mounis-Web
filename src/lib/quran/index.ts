/**
 * Pure Quran metadata helpers. Safe to import from client components: it only
 * pulls in the small meta.json (surah list, 604 page starts, 30 juz starts),
 * never the full text (see data.ts for that).
 */
import metaJson from "./data/meta.json";

export type SurahType = "meccan" | "medinan";

export interface SurahMeta {
  n: number;
  ar: string;
  tr: string;
  en: string;
  ayahs: number;
  type: SurahType;
  /** Madinah mushaf page where the surah starts. */
  page: number;
  juz: number;
}

/** [surah, ayah] */
export type AyahRef = [number, number];

export interface JuzStart {
  juz: number;
  surah: number;
  ayah: number;
  page: number;
}

export const TOTAL_SURAHS = 114;
export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;
export const TOTAL_AYAHS = 6236;

export const surahs = metaJson.surahs as SurahMeta[];
const pageStarts = metaJson.pages as unknown as AyahRef[];
export const juzStarts: JuzStart[] = (metaJson.juz as unknown as [number, number, number][]).map(
  ([surah, ayah, page], i) => ({ juz: i + 1, surah, ayah, page }),
);

/** Number of ayahs before each surah, so global number = offset + ayah. */
const ayahOffsets: number[] = (() => {
  const out: number[] = [];
  let sum = 0;
  for (const s of surahs) {
    out.push(sum);
    sum += s.ayahs;
  }
  return out;
})();

/** Strictly parses a route segment such as "12"; returns NaN for "12abc", "", "-1", "1e3"... */
export function parseRouteNumber(value: string | undefined): number {
  return value && /^\d{1,4}$/.test(value) ? Number(value) : Number.NaN;
}

export function isValidSurah(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_SURAHS;
}

export function isValidPage(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_PAGES;
}

export function isValidAyah(surah: number, ayah: number): boolean {
  return isValidSurah(surah) && Number.isInteger(ayah) && ayah >= 1 && ayah <= surahs[surah - 1].ayahs;
}

/** The English meaning is only worth showing when it differs from the transliteration (e.g. "Ya-Sin" / "Ya Sin"). */
export function hasDistinctEnglishName(s: SurahMeta): boolean {
  const flat = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
  return flat(s.tr) !== flat(s.en);
}

export function getSurah(n: number): SurahMeta | undefined {
  return isValidSurah(n) ? surahs[n - 1] : undefined;
}

/** 1..6236, the numbering used by the audio CDNs. */
export function globalAyahNumber(surah: number, ayah: number): number {
  if (!isValidAyah(surah, ayah)) throw new RangeError(`invalid ayah ${surah}:${ayah}`);
  return ayahOffsets[surah - 1] + ayah;
}

export function compareRefs(a: AyahRef, b: AyahRef): number {
  return a[0] - b[0] || a[1] - b[1];
}

export function pageStart(page: number): AyahRef {
  if (!isValidPage(page)) throw new RangeError(`invalid page ${page}`);
  return pageStarts[page - 1];
}

/** First and last ayah printed on a Madinah mushaf page. */
export function pageRange(page: number): { first: AyahRef; last: AyahRef } {
  const first = pageStart(page);
  if (page === TOTAL_PAGES) {
    return { first, last: [TOTAL_SURAHS, surahs[TOTAL_SURAHS - 1].ayahs] };
  }
  const [nextSurah, nextAyah] = pageStarts[page];
  const last: AyahRef = nextAyah > 1 ? [nextSurah, nextAyah - 1] : [nextSurah - 1, surahs[nextSurah - 2].ayahs];
  return { first, last };
}

/** The mushaf page an ayah is printed on (binary search over the 604 page starts). */
export function pageOf(surah: number, ayah: number): number {
  if (!isValidAyah(surah, ayah)) throw new RangeError(`invalid ayah ${surah}:${ayah}`);
  const target: AyahRef = [surah, ayah];
  let lo = 0;
  let hi = pageStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (compareRefs(pageStarts[mid], target) <= 0) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

export function juzOfPage(page: number): number {
  let juz = 1;
  for (const j of juzStarts) {
    if (j.page <= page) juz = j.juz;
    else break;
  }
  return juz;
}

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
export function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** Bismillah is printed above every surah except Al-Fatihah (it is ayah 1 there) and At-Tawbah. */
export function showsBismillah(surah: number): boolean {
  return surah !== 1 && surah !== 9;
}

export const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";
