/**
 * Server-side access to the full Quran text. These JSON files are ~2 MB, so
 * only server components / route handlers may import this module - client
 * components receive just the slice they render as props.
 */
import arJson from "./data/quran-ar.json";
import enJson from "./data/quran-en.json";
import { getSurah, isValidPage, pageRange, surahs } from "./index";
import type { ReaderAyah, ReaderSection } from "./types";

const ar = arJson as string[][];
const en = enJson as string[][];

/** Arabic text of one ayah ("" when out of range). */
export function getAyahText(surah: number, ayah: number): string {
  return ar[surah - 1]?.[ayah - 1] ?? "";
}

export function getAyahTranslation(surah: number, ayah: number): string {
  return en[surah - 1]?.[ayah - 1] ?? "";
}

function build(surah: number, from: number, to: number): ReaderSection {
  const ayahs: ReaderAyah[] = [];
  for (let n = from; n <= to; n++) {
    ayahs.push({ n, text: ar[surah - 1][n - 1], en: en[surah - 1][n - 1] });
  }
  return { surah, startsSurah: from === 1, ayahs };
}

export function getSurahSection(surah: number): ReaderSection {
  const meta = getSurah(surah);
  if (!meta) throw new RangeError(`invalid surah ${surah}`);
  return build(surah, 1, meta.ayahs);
}

/** The surahs (usually 1, sometimes 2-3 on the short-surah pages) printed on a mushaf page. */
export function getPageSections(page: number): ReaderSection[] {
  if (!isValidPage(page)) throw new RangeError(`invalid page ${page}`);
  const { first, last } = pageRange(page);
  const sections: ReaderSection[] = [];
  for (let s = first[0]; s <= last[0]; s++) {
    const from = s === first[0] ? first[1] : 1;
    const to = s === last[0] ? last[1] : surahs[s - 1].ayahs;
    sections.push(build(s, from, to));
  }
  return sections;
}

export function* iterateAyahs(): Generator<{ surah: number; ayah: number; text: string; en: string }> {
  for (let s = 0; s < ar.length; s++) {
    for (let a = 0; a < ar[s].length; a++) {
      yield { surah: s + 1, ayah: a + 1, text: ar[s][a], en: en[s][a] };
    }
  }
}
