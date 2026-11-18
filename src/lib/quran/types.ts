/** One ayah as handed to the reader components (plain data, safe to serialise). */
export interface ReaderAyah {
  /** Ayah number inside its surah (1-based). */
  n: number;
  /** Uthmani text. */
  text: string;
  /** English translation (Saheeh International). */
  en: string;
}

/** A run of consecutive ayahs that belong to the same surah. */
export interface ReaderSection {
  surah: number;
  /** True when ayah 1 is part of this section (so the surah banner is shown). */
  startsSurah: boolean;
  ayahs: ReaderAyah[];
}

export interface AyahRefObj {
  surah: number;
  ayah: number;
}
