import type { HadithRef } from "./types";

const COLLECTIONS: Record<string, { ar: string; en: string }> = {
  bukhari: { ar: "صحيح البخاري", en: "Sahih al-Bukhari" },
  muslim: { ar: "صحيح مسلم", en: "Sahih Muslim" },
  abudawud: { ar: "سنن أبي داود", en: "Sunan Abi Dawud" },
  tirmidhi: { ar: "جامع الترمذي", en: "Jami' at-Tirmidhi" },
  nasai: { ar: "سنن النسائي", en: "Sunan an-Nasa'i" },
  ibnmajah: { ar: "سنن ابن ماجه", en: "Sunan Ibn Majah" },
  ahmad: { ar: "مسند أحمد", en: "Musnad Ahmad" },
  adab: { ar: "الأدب المفرد", en: "Al-Adab Al-Mufrad" },
  malik: { ar: "موطأ مالك", en: "Muwatta Malik" },
  darimi: { ar: "سنن الدارمي", en: "Sunan ad-Darimi" },
};

const GRADES: Record<string, { ar: string; en: string }> = {
  sahih: { ar: "صحيح", en: "Sahih" },
  hasan: { ar: "حسن", en: "Hasan" },
  "hasan-sahih": { ar: "حسن صحيح", en: "Hasan Sahih" },
};

export function collectionName(c: string, locale: string): string {
  const x = COLLECTIONS[c];
  return x ? (locale === "en" ? x.en : x.ar) : c;
}

export function gradeLabel(g: HadithRef["g"], locale: string): string | null {
  if (!g) return null;
  return locale === "en" ? GRADES[g].en : GRADES[g].ar;
}

/** "صحيح مسلم 2723" / "Sunan Abi Dawud 5095 · Sahih" */
export function refLabel(ref: HadithRef, locale: string): string {
  const grade = gradeLabel(ref.g, locale);
  return `${collectionName(ref.c, locale)} ${ref.n}${grade ? ` · ${grade}` : ""}`;
}

/** Same URL scheme as the url_source field of the local hadith corpus. */
export function refUrl(ref: HadithRef): string {
  return `https://sunnah.com/${ref.c}:${ref.n}`;
}
