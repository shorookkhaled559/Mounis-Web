import { describe, expect, it } from "vitest";
import { normalizeSearchText, parseQuery, searchCollection } from "./hadith-search";
import { getCollection } from "./hadith";
import type { Hadith, HadithCollection } from "@/types/hadith";

function hadith(n: string, ar: string, en = ""): Hadith {
  return {
    hadith_number: n, reference: `Ref ${n}`, in_book_reference: "", chapter_number: null,
    text_ar: ar, text_en: en, isnad_ar: null, isnad_en: null, matn_ar: ar, matn_en: en,
    closing_ar: null, narrator: "", has_variants: false, source_reference: null,
    source_grade: null, grade_en: null, grade_ar: null, url_source: "",
  };
}

const fake: HadithCollection = {
  collection: { id: "t", name_en: "T", name_ar: "ت", author_en: "", author_ar: "", type: "primary", scraped_at: "" },
  books: [
    { book_number: 1, book_key: null, name_en: "B1", name_ar: "ب١", hadiths: [hadith("1", "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ"), hadith("2", "الدِّينُ النَّصِيحَةُ")] },
    { book_number: 2, book_key: null, name_en: "B2", name_ar: "ب٢", hadiths: [hadith("3", "الطُّهُورُ شَطْرُ الْإِيمَانِ", "Cleanliness is half of faith")] },
  ],
};

describe("normalizeSearchText", () => {
  it("removes diacritics and unifies letters and digits", () => {
    expect(normalizeSearchText("إِنَّمَا الْأَعْمَالُ")).toBe("انما الاعمال");
    expect(normalizeSearchText("رحمة")).toBe("رحمه");
    expect(normalizeSearchText("١٢٣")).toBe("123");
  });
});

describe("parseQuery", () => {
  it("recognises numbers (also Arabic-Indic)", () => {
    expect(parseQuery("12")).toEqual({ kind: "number", number: "12" });
    expect(parseQuery("١٢")).toEqual({ kind: "number", number: "12" });
    expect(parseQuery("1")).toEqual({ kind: "number", number: "1" });
    expect(parseQuery("8a")).toEqual({ kind: "number", number: "8a" });
  });
  it("splits words and ignores junk", () => {
    expect(parseQuery("  الأعمال   بالنيات ")).toEqual({ kind: "words", tokens: ["الاعمال", "بالنيات"] });
    expect(parseQuery("")).toEqual({ kind: "empty" });
    expect(parseQuery("ا")).toEqual({ kind: "empty" });
  });
  it("caps the number of words", () => {
    const q = parseQuery("a1 b2 c3 d4 e5 f6 g7 h8 i9 j0");
    expect(q.kind === "words" && q.tokens.length).toBe(8);
  });
});

describe("searchCollection", () => {
  it("requires every word, ignoring diacritics", () => {
    const hits = searchCollection(fake, parseQuery("الاعمال النيات"), 10);
    expect(hits.map((h) => h.hadithNumber)).toEqual(["1"]);
    expect(searchCollection(fake, parseQuery("الاعمال الدين"), 10)).toEqual([]);
  });
  it("finds English text too and reports the book", () => {
    const [hit] = searchCollection(fake, parseQuery("half faith"), 10);
    expect(hit.hadithNumber).toBe("3");
    expect(hit.bookNumber).toBe(2);
  });
  it("looks a number up", () => {
    expect(searchCollection(fake, parseQuery("2"), 10).map((h) => h.hadithNumber)).toEqual(["2"]);
    expect(searchCollection(fake, parseQuery("99"), 10)).toEqual([]);
  });
  it("matches lettered numbers like Muslim's", () => {
    const lettered = { ...fake, books: [{ ...fake.books[0], hadiths: [hadith("8a", "الف"), hadith("8b", "باء"), hadith("80", "جيم")] }] };
    expect(searchCollection(lettered, parseQuery("8"), 10).map((h) => h.hadithNumber)).toEqual(["8a", "8b"]);
    expect(searchCollection(lettered, parseQuery("8b"), 10).map((h) => h.hadithNumber)).toEqual(["8b"]);
  });
  it("respects the limit", () => {
    expect(searchCollection(fake, parseQuery("ال"), 2).length).toBe(2);
  });
  it("returns nothing for an empty query", () => {
    expect(searchCollection(fake, { kind: "empty" }, 5)).toEqual([]);
  });
});

describe("searchCollection (real data)", () => {
  it("finds the intentions hadith in Bukhari by its words", async () => {
    const data = await getCollection("bukhari");
    const hits = data ? searchCollection(data, parseQuery("إنما الأعمال بالنيات"), 5) : [];
    expect(hits.some((h) => h.hadithNumber === "1" && h.bookNumber === 1)).toBe(true);
  });
  it("finds Bukhari hadith 1 by number", async () => {
    const data = await getCollection("bukhari");
    const hits = data ? searchCollection(data, parseQuery("1"), 5) : [];
    expect(hits[0]?.hadithNumber).toBe("1");
  });
  it("finds Muslim hadith 8 despite its letter suffix", async () => {
    const data = await getCollection("muslim");
    const hits = data ? searchCollection(data, parseQuery("8"), 5) : [];
    expect(hits.some((h) => h.hadithNumber === "8a")).toBe(true);
  });
  it("is fast on a warm collection", async () => {
    const data = await getCollection("bukhari");
    expect(data).not.toBeNull();
    const t = Date.now();
    if (data) searchCollection(data, parseQuery("الصلاه"), 20);
    searchCollection(data!, parseQuery("زكاه الفطر"), 20);
    expect(Date.now() - t < 1500).toBe(true);
  });
});
