/** Server-side verse search (Arabic text, English translation, or a "2:255" reference). */
import { hasArabic, normalizeArabic, skeletonArabic } from "./arabic";
import { getAyahText, getAyahTranslation, iterateAyahs } from "./data";
import { isValidAyah, pageOf } from "./index";

export interface SearchHit {
  surah: number;
  ayah: number;
  page: number;
  text: string;
  en: string;
}

export interface SearchResult {
  kind: "reference" | "arabic" | "english" | "none";
  hits: SearchHit[];
  /** More matches exist than were returned. */
  truncated: boolean;
}

export const MAX_QUERY_LENGTH = 100;
const REFERENCE = /^(\d{1,3})\s*[:/.\-\s]\s*(\d{1,3})$/;

interface Entry {
  surah: number;
  ayah: number;
  norm: string;
  skeleton: string;
  en: string;
}

let index: Entry[] | null = null;
function getIndex(): Entry[] {
  if (!index) {
    index = [];
    for (const a of iterateAyahs()) {
      index.push({
        surah: a.surah,
        ayah: a.ayah,
        norm: normalizeArabic(a.text),
        skeleton: skeletonArabic(a.text),
        en: a.en.toLowerCase(),
      });
    }
  }
  return index;
}

function toHit(e: { surah: number; ayah: number }): SearchHit {
  return {
    surah: e.surah,
    ayah: e.ayah,
    page: pageOf(e.surah, e.ayah),
    text: getAyahText(e.surah, e.ayah),
    en: getAyahTranslation(e.surah, e.ayah),
  };
}

function collect(entries: Entry[], match: (e: Entry) => boolean, limit: number, seen: Set<string>, out: Entry[]) {
  for (const e of entries) {
    if (out.length > limit) return; // one extra to know whether results were cut off
    const key = `${e.surah}:${e.ayah}`;
    if (seen.has(key) || !match(e)) continue;
    seen.add(key);
    out.push(e);
  }
}

export function searchQuran(rawQuery: string, limit = 30): SearchResult {
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  const none: SearchResult = { kind: "none", hits: [], truncated: false };
  if (!query) return none;

  const ref = REFERENCE.exec(query);
  if (ref) {
    const surah = Number(ref[1]);
    const ayah = Number(ref[2]);
    return isValidAyah(surah, ayah) ? { kind: "reference", hits: [toHit({ surah, ayah })], truncated: false } : none;
  }

  const entries = getIndex();
  const found: Entry[] = [];
  const seen = new Set<string>();

  if (hasArabic(query)) {
    const nq = normalizeArabic(query);
    if (nq.length < 2) return none;
    collect(entries, (e) => e.norm.includes(nq), limit, seen, found);
    const sq = skeletonArabic(query);
    // Spelling-tolerant pass (Uthmani vs modern spelling), only to top up exact matches.
    if (found.length <= limit && sq.length >= 2) collect(entries, (e) => e.skeleton.includes(sq), limit, seen, found);
    return { kind: "arabic", hits: found.slice(0, limit).map(toHit), truncated: found.length > limit };
  }

  const lq = query.toLowerCase();
  if (lq.length < 3 || !/[a-z]/.test(lq)) return none;
  const escaped = lq.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordStart = new RegExp(`(^|[^a-z])${escaped}`);
  collect(entries, (e) => wordStart.test(e.en), limit, seen, found);
  if (found.length <= limit) collect(entries, (e) => e.en.includes(lq), limit, seen, found);
  return { kind: "english", hits: found.slice(0, limit).map(toHit), truncated: found.length > limit };
}
