export interface HadithCollection {
  collection: {
    id: string;
    name_en: string;
    name_ar: string;
    author_en: string;
    author_ar: string;
    type: "primary" | "compilation" | "dua";
    cover_image?: string;
    scraped_at: string;
  };
  books: HadithBook[];
}

export interface HadithBook {
  book_number: number;
  book_key: string | null;
  name_en: string;
  name_ar: string;
  chapters?: HadithChapter[];
  hadiths: Hadith[];
}

export interface HadithChapter {
  chapter_number: number;
  name_en: string;
  name_ar: string;
}

export interface Hadith {
  hadith_number: string;
  reference: string;
  in_book_reference: string;
  chapter_number: number | null;
  text_ar: string;
  text_en: string;
  isnad_ar: string | null;
  isnad_en: string | null;
  matn_ar: string;
  matn_en: string;
  closing_ar: string | null;
  narrator: string;
  has_variants: boolean;
  source_reference: string | null;
  source_grade: string | null;
  grade_en: string | null;
  grade_ar: string | null;
  url_source: string;
}

// Summary info for collection listing
export interface CollectionSummary {
  id: string;
  name_ar: string;
  name_en: string;
  author_ar: string;
  author_en: string;
  type: "primary" | "compilation" | "dua";
  cover_image?: string;
  totalHadiths: number;
  totalBooks: number;
}
