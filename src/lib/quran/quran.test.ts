import { describe, expect, it } from "vitest";
import {
  TOTAL_AYAHS,
  TOTAL_PAGES,
  globalAyahNumber,
  hasDistinctEnglishName,
  isValidAyah,
  juzOfPage,
  juzStarts,
  pageOf,
  pageRange,
  pageStart,
  parseRouteNumber,
  showsBismillah,
  surahs,
  toArabicIndic,
} from "./index";
import { getAyahText, getPageSections, getSurahSection } from "./data";
import { normalizeArabic } from "./arabic";

describe("metadata", () => {
  it("has 114 surahs and 6236 ayahs", () => {
    expect(surahs).toHaveLength(114);
    expect(surahs.reduce((n, s) => n + s.ayahs, 0)).toBe(TOTAL_AYAHS);
    expect(surahs.map((s) => s.n)).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
  });

  it("numbers ayahs globally the way the audio CDNs do", () => {
    expect(globalAyahNumber(1, 1)).toBe(1);
    expect(globalAyahNumber(2, 1)).toBe(8);
    expect(globalAyahNumber(2, 255)).toBe(262);
    expect(globalAyahNumber(114, 6)).toBe(6236);
    expect(() => globalAyahNumber(1, 8)).toThrow(RangeError);
    expect(() => globalAyahNumber(0, 1)).toThrow(RangeError);
  });

  it("validates refs", () => {
    expect(isValidAyah(2, 286)).toBe(true);
    expect(isValidAyah(2, 287)).toBe(false);
    expect(isValidAyah(115, 1)).toBe(false);
    expect(isValidAyah(1.5, 1)).toBe(false);
  });

  it("finds the mushaf page of an ayah", () => {
    expect(pageOf(1, 1)).toBe(1);
    expect(pageOf(2, 1)).toBe(2);
    expect(pageOf(2, 5)).toBe(2);
    expect(pageOf(2, 6)).toBe(3);
    expect(pageOf(2, 255)).toBe(42); // Ayat al-Kursi
    expect(pageOf(112, 1)).toBe(604);
    expect(pageOf(114, 6)).toBe(TOTAL_PAGES);
  });

  it("pages tile the Quran exactly once, in order", () => {
    let expectedSurah = 1;
    let expectedAyah = 1;
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      const { first, last } = pageRange(p);
      expect(first).toEqual([expectedSurah, expectedAyah]);
      expect(pageOf(first[0], first[1])).toBe(p);
      expect(pageOf(last[0], last[1])).toBe(p);
      if (last[1] === surahs[last[0] - 1].ayahs) {
        expectedSurah = last[0] + 1;
        expectedAyah = 1;
      } else {
        expectedSurah = last[0];
        expectedAyah = last[1] + 1;
      }
    }
    expect([expectedSurah, expectedAyah]).toEqual([115, 1]);
    expect(() => pageStart(0)).toThrow(RangeError);
    expect(() => pageStart(605)).toThrow(RangeError);
  });

  it("maps pages to juz", () => {
    expect(juzStarts).toHaveLength(30);
    expect(juzOfPage(1)).toBe(1);
    expect(juzOfPage(21)).toBe(1);
    expect(juzOfPage(22)).toBe(2);
    expect(juzOfPage(42)).toBe(3);
    expect(juzOfPage(582)).toBe(30);
    expect(juzOfPage(604)).toBe(30);
  });

  it("hides duplicate English names", () => {
    expect(hasDistinctEnglishName(surahs[35])).toBe(false); // Ya-Sin / Ya Sin
    expect(hasDistinctEnglishName(surahs[0])).toBe(true); // Al-Fatihah / The Opener
  });

  it("parses route params strictly", () => {
    expect(parseRouteNumber("12")).toBe(12);
    expect(parseRouteNumber("012")).toBe(12);
    for (const bad of ["", "abc", "12abc", "-1", "1e3", "1.5", " 1", "12345", undefined]) {
      expect(Number.isNaN(parseRouteNumber(bad))).toBe(true);
    }
  });

  it("renders Arabic-Indic digits and bismillah rules", () => {
    expect(toArabicIndic(255)).toBe("٢٥٥");
    expect(showsBismillah(1)).toBe(false);
    expect(showsBismillah(9)).toBe(false);
    expect(showsBismillah(2)).toBe(true);
  });
});

describe("text data", () => {
  it("has a non-empty ayah for every reference and no stray spaces", () => {
    for (const s of surahs) {
      for (let a = 1; a <= s.ayahs; a++) {
        const t = getAyahText(s.n, a);
        expect(t.trim().length, `${s.n}:${a}`).toBeGreaterThan(0);
        expect(t.includes("\u2009"), `${s.n}:${a}`).toBe(false);
      }
    }
  });

  it("returns known ayahs", () => {
    // compare on the letter skeleton: mark order (shadda/fatha) is a font-level detail
    expect(normalizeArabic(getAyahText(1, 1))).toBe("بسم الله الرحمن الرحيم");
    expect(normalizeArabic(getAyahText(2, 255)).startsWith("الله لا اله الا هو الحي القيوم")).toBe(true);
    expect(normalizeArabic(getAyahText(112, 1))).toBe("قل هو الله احد");
  });

  it("builds a surah section", () => {
    const s = getSurahSection(2);
    expect(s.startsSurah).toBe(true);
    expect(s.ayahs).toHaveLength(286);
    expect(s.ayahs[0].n).toBe(1);
    expect(() => getSurahSection(0)).toThrow(RangeError);
  });

  it("page sections cover every ayah exactly once", () => {
    let count = 0;
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      const sections = getPageSections(p);
      expect(sections.length).toBeGreaterThan(0);
      for (const sec of sections) {
        expect(sec.startsSurah).toBe(sec.ayahs[0].n === 1);
        count += sec.ayahs.length;
      }
    }
    expect(count).toBe(TOTAL_AYAHS);
    expect(getPageSections(3)[0].startsSurah).toBe(false);
    expect(getPageSections(2)[0].startsSurah).toBe(true);
    expect(getPageSections(604).map((s) => s.surah)).toEqual([112, 113, 114]);
  });
});
