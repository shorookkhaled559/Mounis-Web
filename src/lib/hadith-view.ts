/**
 * Pure helpers that turn the raw scraped hadith records into things that are
 * safe to show to readers.
 *
 * Rule for everything in here: when we are not sure, we return `null` (or keep
 * the original text) instead of guessing. A hadith site must never present an
 * invented grade, narrator or source as if it were verified.
 */
import type { Hadith } from "@/types/hadith";

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

/** hadith_number values look like "1", "12", "5a": letters, digits, . _ - only. */
const HADITH_NUMBER_PATTERN = /^[A-Za-z0-9._-]{1,12}$/;

export function isValidHadithNumber(value: string): boolean {
  return HADITH_NUMBER_PATTERN.test(value);
}

/** Locale-less path of a single hadith page (the i18n `Link` adds the locale). */
export function hadithPath(
  collectionId: string,
  bookNumber: number,
  hadithNumber: string,
): string {
  return `/hadith/${collectionId}/${bookNumber}/${encodeURIComponent(hadithNumber)}`;
}

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

/** "صحيح البخاري 1" - the English `reference` field, in Arabic. */
export function arabicReference(
  collectionNameAr: string,
  hadithNumber: string,
): string {
  return `${collectionNameAr} ${hadithNumber}`;
}

/** Parses "Book 3, Hadith 12". Returns null for anything else (682 records are empty). */
export function parseInBookReference(
  value: string | null | undefined,
): { book: number; hadith: number } | null {
  if (!value) return null;
  const match = /^Book\s+(\d+),\s*Hadith\s+(\d+)$/i.exec(value.trim());
  if (!match) return null;
  return { book: Number(match[1]), hadith: Number(match[2]) };
}

const ORIGINAL_SOURCES: Record<string, string> = {
  "al-bukhari": "البخاري",
  bukhari: "البخاري",
  muslim: "مسلم",
  "al-bukhari and muslim": "البخاري ومسلم",
  "bukhari and muslim": "البخاري ومسلم",
  "abu dawud": "أبو داود",
  "at-tirmidhi": "الترمذي",
  tirmidhi: "الترمذي",
  "an-nasa'i": "النسائي",
  "ibn majah": "ابن ماجه",
  malik: "مالك",
};

/**
 * Compilations (Bulugh al-Maram, Riyad as-Salihin...) record who originally
 * reported the hadith, e.g. "[Al-Bukhari and Muslim]". Returns it in Arabic,
 * or null when the value is missing or not one we know.
 */
export function originalSourceAr(
  sourceReference: string | null | undefined,
): string | null {
  if (!sourceReference) return null;
  const key = sourceReference
    .replace(/[[\]]/g, "")
    .replace(/[’‘`]/g, "'")
    .trim()
    .toLowerCase();
  return ORIGINAL_SOURCES[key] ?? null;
}

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------

export type GradeTone = "accepted" | "weak" | "neutral";

export interface GradeInfo {
  /** Arabic wording of the ruling, e.g. "صحيح" or "إسناده ضعيف". null when unknown. */
  labelAr: string | null;
  /** The ruling as the source wrote it (cleaned of brackets only). Always set. */
  raw: string;
  /** Who gave the ruling, in Arabic ("الألباني"), when the source says so. */
  graderAr: string | null;
  tone: GradeTone;
}

const GRADERS: Array<[RegExp, string]> = [
  [/al-?albani/i, "الألباني"],
  [/darussalam/i, "دار السلام"],
  [/zubair/i, "الزبير علي زئي"],
];

/** body (lower-case ascii) -> Arabic wording + tone. Anything else stays raw. */
const GRADE_BODIES: Record<string, [string, GradeTone]> = {
  sahih: ["صحيح", "accepted"],
  hasan: ["حسن", "accepted"],
  qawi: ["قوي", "accepted"],
  "hasan sahih": ["حسن صحيح", "accepted"],
  "sahih li ghairih": ["صحيح لغيره", "accepted"],
  "hasan li ghairih": ["حسن لغيره", "accepted"],
  "sahih lighairihi": ["صحيح لغيره", "accepted"],
  "hasan lighairihi": ["حسن لغيره", "accepted"],
  "a hasan": ["حسن", "accepted"],
  "da if jiddan": ["ضعيف جدًا", "weak"],
  "daif jiddan": ["ضعيف جدًا", "weak"],
  "sanad daif jiddan": ["إسناده ضعيف جدًا", "weak"],
  "sahih because of corroborating evidence": ["صحيح لغيره", "accepted"],
  "hasan because of corroborating evidence": ["حسن لغيره", "accepted"],
  "sahih maqtu": ["صحيح مقطوع", "accepted"],
  "sahih mauquf": ["صحيح موقوف", "accepted"],
  "muttafaqun alayh": ["متفق عليه", "accepted"],
  "sahih isnad": ["إسناده صحيح", "accepted"],
  "isnad sahih": ["إسناده صحيح", "accepted"],
  "sahih in chain": ["إسناده صحيح", "accepted"],
  "its isnad is sahih": ["إسناده صحيح", "accepted"],
  "hasan isnad": ["إسناده حسن", "accepted"],
  "isnad hasan": ["إسناده حسن", "accepted"],
  "hasan in chain": ["إسناده حسن", "accepted"],
  "its isnad is hasan": ["إسناده حسن", "accepted"],
  "its isnad is qawi": ["إسناده قوي", "accepted"],
  daif: ["ضعيف", "weak"],
  "da if": ["ضعيف", "weak"],
  munkar: ["منكر", "weak"],
  shadh: ["شاذ", "weak"],
  maudu: ["موضوع", "weak"],
  "daif isnad": ["إسناده ضعيف", "weak"],
  "isnad daif": ["إسناده ضعيف", "weak"],
  "daif in chain": ["إسناده ضعيف", "weak"],
  "its isnad is daif": ["إسناده ضعيف", "weak"],
};

// "Lts" is a typo for "Its" that appears in the scraped data.
function normalizeGradeBody(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sahīh -> sahih, isnād -> isnad
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // "(Darussalam)", "(Al-Albani)", "[]"
    .replace(/[^a-z\s]/g, "") // quotes, brackets, `
    .replace(/\blts\b/g, "its")
    .replace(/\bdaeef\b/g, "daif")
    .replace(/\bhadeeth\b|\bhadith\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function graderOf(value: string): string | null {
  for (const [pattern, name] of GRADERS) {
    if (pattern.test(value)) return name;
  }
  return null;
}

function cleanRaw(value: string): string {
  return value.replace(/\]\s*\(/g, " (").replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Turns the scraped `grade_en` (825 different spellings) - or, as a fallback,
 * the already simplified `source_grade` - into a labelled ruling.
 *
 * Only strings we recognise exactly get an Arabic label. Anything stranger
 * (for example "Hasan because of corroborating evidence; this is a Da'if isnad")
 * keeps `labelAr: null` and the UI shows the source's own wording instead of a
 * guessed translation.
 */
export function normalizeGrade(
  gradeEn: string | null | undefined,
  sourceGrade?: string | null,
): GradeInfo | null {
  const primary = gradeEn?.trim();
  if (primary) {
    const known = GRADE_BODIES[normalizeGradeBody(primary)];
    return {
      labelAr: known ? known[0] : null,
      raw: cleanRaw(primary),
      graderAr: graderOf(primary),
      tone: known ? known[1] : "neutral",
    };
  }

  const fallback = sourceGrade?.trim();
  if (fallback) {
    const known = GRADE_BODIES[normalizeGradeBody(fallback)];
    if (known) {
      return { labelAr: known[0], raw: fallback, graderAr: null, tone: known[1] };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Narrators
// ---------------------------------------------------------------------------

/**
 * The scraped `narrator` field is English and noisy (4,564 records just say
 * "It was", 8,985 are empty, and several spellings exist per person). Machine
 * translating names would risk attributing a hadith to the wrong person, so we
 * only translate a short, hand-checked list of famous Companions, and only
 * when the whole field matches one of their known spellings. Everything else
 * returns null and the page falls back to showing the Arabic chain (isnad).
 *
 * TODO(review): have someone with hadith-sciences knowledge approve this list.
 */
const NARRATORS: Array<{ ar: string; honorific: string; names: string[] }> = [
  { ar: "أبو هريرة", honorific: "رضي الله عنه", names: ["abu hurairah", "abu huraira", "abu hurayrah", "abu hurayra", "abuhurayrah", "abuhurairah"] },
  { ar: "عائشة أم المؤمنين", honorific: "رضي الله عنها", names: ["aisha", "aishah", "aaishah", "aisha bint abu bakr", "aishah bint abu bakr"] },
  { ar: "أنس بن مالك", honorific: "رضي الله عنه", names: ["anas bin malik", "anas ibn malik"] },
  { ar: "عبد الله بن عباس", honorific: "رضي الله عنهما", names: ["ibn abbas", "abdullah ibn abbas", "abdullah bin abbas"] },
  { ar: "عبد الله بن عمر", honorific: "رضي الله عنهما", names: ["ibn umar", "abdullah bin umar", "abdullah ibn umar"] },
  { ar: "جابر بن عبد الله", honorific: "رضي الله عنهما", names: ["jabir bin abdullah", "jabir ibn abdullah"] },
  { ar: "أبو سعيد الخدري", honorific: "رضي الله عنه", names: ["abu said al khudri", "abu said alkhudri", "abu said al-khudri"] },
  { ar: "عبد الله بن مسعود", honorific: "رضي الله عنه", names: ["ibn masud", "abdullah bin masud", "abdullah ibn masud"] },
  { ar: "أبو ذر الغفاري", honorific: "رضي الله عنه", names: ["abu dharr"] },
  { ar: "أبو موسى الأشعري", honorific: "رضي الله عنه", names: ["abu musa"] },
  { ar: "عمر بن الخطاب", honorific: "رضي الله عنه", names: ["umar bin al khattab", "umar bin alkhattab", "umar ibn al khattab"] },
  { ar: "علي بن أبي طالب", honorific: "رضي الله عنه", names: ["ali ibn abu talib", "ali bin abu talib", "ali ibn abi talib", "ali bin abi talib"] },
  { ar: "أم سلمة", honorific: "رضي الله عنها", names: ["umm salamah", "umm salama"] },
  { ar: "عبد الله بن عمرو بن العاص", honorific: "رضي الله عنهما", names: ["abdullah ibn amr ibn al as", "abdullah bin amr bin al as"] },
  { ar: "البراء بن عازب", honorific: "رضي الله عنهما", names: ["al bara bin azib", "al bara ibn azib"] },
  { ar: "معاذ بن جبل", honorific: "رضي الله عنه", names: ["muadh bin jabal", "muadh ibn jabal"] },
];

export function normalizeNarratorKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[`'’‘ʿʾ]/g, "")
    .replace(/-/g, " ")
    .replace(/\b(ibn|b)\b\.?/g, "bin")
    .replace(/\s+/g, " ")
    .trim();
}

const NARRATOR_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>();
  for (const entry of NARRATORS) {
    for (const name of entry.names) {
      index.set(
        normalizeNarratorKey(name),
        `${entry.ar} ${entry.honorific}`,
      );
    }
  }
  return index;
})();

/** "أبو هريرة رضي الله عنه", or null when we can't be certain. */
export function narratorArabic(
  narrator: string | null | undefined,
): string | null {
  if (!narrator) return null;
  return NARRATOR_INDEX.get(normalizeNarratorKey(narrator)) ?? null;
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/**
 * The hadith wording to show: the matn, falling back to the full text. Only
 * scraper residue at the very start (a stray ":" or space left over from the
 * chain) is removed; the wording itself is untouched.
 */
export function hadithBodyAr(hadith: Pick<Hadith, "matn_ar" | "text_ar">): string {
  const text = hadith.matn_ar?.trim() || hadith.text_ar?.trim() || "";
  return text.replace(/^[\s:]+/, "");
}

/** First `max` characters on a word boundary, with an ellipsis when cut. */
export function excerpt(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
