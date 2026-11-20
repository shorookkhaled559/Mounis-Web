/** fadl = reward/protection stated in a hadith · sunnah = what the Prophet ﷺ did/taught · meaning = what the dua asks for */
export type NoteKind = "fadl" | "sunnah" | "meaning";

export interface HadithRef {
  /** Collection id, same as public/data/hadiths/<id>.json (bukhari, muslim, abudawud, ...). */
  c: string;
  /** Hadith number in that collection (sunnah.com numbering, e.g. "2723a"). */
  n: string;
  /** Grade given in the local corpus for non-Bukhari/Muslim narrations. */
  g: "sahih" | "hasan" | "hasan-sahih" | null;
}

export interface AdhkarNote {
  kind: NoteKind;
  text: string;
  refs?: HadithRef[];
  /** "seen": taken from the Hisn al-Muslim based Seen-Arabic dataset (MIT), with its takhrij in `source`. */
  origin?: "seen";
}

export interface AdhkarItem {
  id: number;
  title?: string;
  text: string;
  /** Times to repeat; null when the text gives no number. */
  count: number | null;
  /** Takhrij line from the source dataset, when it has one. */
  source?: string | null;
  note: AdhkarNote;
}

export interface AdhkarCategory {
  id: number;
  ar: string;
  en: string;
  items: AdhkarItem[];
}

export interface AdhkarGroup {
  id: string;
  ar: string;
  en: string;
  categories: number[];
}

/** What the hub needs for each category (no dhikr text). */
export interface HubCategory {
  id: number;
  ar: string;
  en: string;
  /** Required repetitions of each dhikr (1 when the text gives no number), for daily progress. */
  targets: { id: number; target: number }[];
}

export interface HubGroup {
  id: string;
  ar: string;
  en: string;
  categories: HubCategory[];
}
