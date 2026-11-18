/**
 * Arabic text normalisation used by Quran search. The Uthmani text carries
 * tashkeel, Quranic annotation marks and dagger alefs that a user never types,
 * so both sides are reduced to a bare letter skeleton before comparing.
 */

// harakat, Quranic marks, small high letters, tatweel, ayah markers
const MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640\u06DD\u06DE\u06E9\u200C\u200D]/g;

/**
 * Light normalisation: strips marks (dagger alef included, so الرحمٰن matches
 * the usual spelling الرحمن) and unifies alef/ya/ta-marbuta forms.
 */
export function normalizeArabic(input: string): string {
  return input
    .replace(MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Consonant skeleton: additionally drops the long-vowel letters, so Uthmani
 * and modern spellings meet (الصلوة / الصلاة, الحيوة / الحياة, ...).
 */
export function skeletonArabic(input: string): string {
  return normalizeArabic(input).replace(/[اويى]/g, "");
}

export function hasArabic(input: string): boolean {
  return /[\u0600-\u06FF]/.test(input);
}
