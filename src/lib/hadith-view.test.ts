import { describe, expect, it } from "vitest";
import {
  arabicReference,
  excerpt,
  hadithBodyAr,
  hadithPath,
  isValidHadithNumber,
  narratorArabic,
  normalizeGrade,
  originalSourceAr,
  parseInBookReference,
} from "./hadith-view";

describe("hadithPath / isValidHadithNumber", () => {
  it("builds the path", () => {
    expect(hadithPath("bukhari", 1, "1")).toBe("/hadith/bukhari/1/1");
  });
  it("encodes the number", () => {
    expect(hadithPath("x", 2, "a b")).toBe("/hadith/x/2/a%20b");
  });
  it.each(["1", "532", "5a", "12.1"])("accepts %s", (v) =>
    expect(isValidHadithNumber(v)).toBe(true));
  it.each(["", "../x", "1/2", "a b", "1234567890123"])("rejects %j", (v) =>
    expect(isValidHadithNumber(v)).toBe(false));
});

describe("references", () => {
  it("writes the reference in Arabic", () => {
    expect(arabicReference("صحيح البخاري", "1")).toBe("صحيح البخاري 1");
  });
  it("parses the in-book reference", () => {
    expect(parseInBookReference("Book 3, Hadith 12")).toEqual({ book: 3, hadith: 12 });
  });
  it.each(["", null, undefined, "Book 3", "Hadith 3, Book 1"])("rejects %j", (v) =>
    expect(parseInBookReference(v)).toBeNull());
  it("translates the original source of compilations", () => {
    expect(originalSourceAr("[Al-Bukhari and Muslim]")).toBe("البخاري ومسلم");
    expect(originalSourceAr("[an-Nasa'i]")).toBe("النسائي");
    expect(originalSourceAr("[Somebody Else]")).toBeNull();
    expect(originalSourceAr(null)).toBeNull();
  });
});

describe("normalizeGrade", () => {
  it("handles the plain forms with the grader", () => {
    expect(normalizeGrade("Sahih (Darussalam)")).toEqual({
      labelAr: "صحيح",
      raw: "Sahih (Darussalam)",
      graderAr: "دار السلام",
      tone: "accepted",
    });
    expect(normalizeGrade("Sahih (Al-Albani)")).toMatchObject({ labelAr: "صحيح", graderAr: "الألباني" });
    expect(normalizeGrade("Hasan (Zubair `Aliza'i)")).toMatchObject({
      labelAr: "حسن",
      graderAr: "الزبير علي زئي",
    });
  });
  it("normalises the different spellings of da'if", () => {
    for (const g of ["Da'if (Darussalam)", "Da’if (Darussalam)", "Da'if (Al-Albani)"]) {
      expect(normalizeGrade(g)).toMatchObject({ labelAr: "ضعيف", tone: "weak" });
    }
  });
  it("copes with the scraper's broken brackets", () => {
    expect(normalizeGrade("Hasan (Darussalam)] (Darussalam)")).toMatchObject({ labelAr: "حسن" });
    expect(normalizeGrade("Sahih (Darussalam) [] (Darussalam)")).toMatchObject({ labelAr: "صحيح" });
    expect(normalizeGrade("Lts isnad is Sahih] (Darussalam)")).toMatchObject({ labelAr: "إسناده صحيح" });
    expect(normalizeGrade("Sahih Hadeeth] (Darussalam)")).toMatchObject({ labelAr: "صحيح" });
  });
  it("understands qualified rulings", () => {
    expect(normalizeGrade("Sahih Isnād (Zubair `Aliza'i)")).toMatchObject({ labelAr: "إسناده صحيح" });
    expect(normalizeGrade("Da'if in chain (Al-Albani)")).toMatchObject({ labelAr: "إسناده ضعيف", tone: "weak" });
    expect(normalizeGrade("Hasan Sahih (Al-Albani)")).toMatchObject({ labelAr: "حسن صحيح" });
    expect(normalizeGrade("Sahih li ghairih (Al-Albani)")).toMatchObject({ labelAr: "صحيح لغيره" });
    expect(normalizeGrade("Muttafaqun 'alayh (Zubair `Aliza'i)")).toMatchObject({ labelAr: "متفق عليه" });
    expect(normalizeGrade("Maudu’ (Darussalam)")).toMatchObject({ labelAr: "موضوع", tone: "weak" });
  });
  it("never guesses a translation for mixed or unknown rulings", () => {
    const mixed = normalizeGrade(
      "Hasan because of corroborating evidence; this is a Da'if isnad] (Darussalam)",
    );
    expect(mixed?.labelAr).toBeNull();
    expect(mixed?.tone).toBe("neutral");
    expect(mixed?.raw).toMatch(/Da'if isnad/);
    expect(normalizeGrade("Something new (Nobody)")?.labelAr).toBeNull();
  });
  it("falls back to the simplified source grade", () => {
    expect(normalizeGrade(null, "hasan")).toMatchObject({ labelAr: "حسن", graderAr: null });
    expect(normalizeGrade("", "daif")).toMatchObject({ labelAr: "ضعيف", tone: "weak" });
  });
  it("returns null when there is no grade at all", () => {
    expect(normalizeGrade(null)).toBeNull();
    expect(normalizeGrade("  ", null)).toBeNull();
    expect(normalizeGrade(null, "weird")).toBeNull();
  });
});

describe("narratorArabic", () => {
  it("translates only the vetted companions", () => {
    expect(narratorArabic("Abu Hurairah")).toBe("أبو هريرة رضي الله عنه");
    expect(narratorArabic("Abu Huraira")).toBe("أبو هريرة رضي الله عنه");
    expect(narratorArabic("Aisha")).toBe("عائشة أم المؤمنين رضي الله عنها");
    expect(narratorArabic("Ibn `Abbas")).toBe("عبد الله بن عباس رضي الله عنهما");
    expect(narratorArabic("Ibn 'Umar")).toBe("عبد الله بن عمر رضي الله عنهما");
    expect(narratorArabic("Umar bin Al-Khattab")).toBe("عمر بن الخطاب رضي الله عنه");
    expect(narratorArabic("Anas b. Malik")).toBe("أنس بن مالك رضي الله عنه");
  });
  it("refuses ambiguous or noisy values", () => {
    for (const v of ["It was", "Abdullah", "Umar", "the Prophet", "Husain", "", null, undefined]) {
      expect(narratorArabic(v)).toBeNull();
    }
  });
  it("does not match when the field holds a sentence", () => {
    expect(narratorArabic("It was narrated that Abu Hurairah")).toBeNull();
  });
});

describe("excerpt", () => {
  it("keeps short text", () => expect(excerpt("a  b", 10)).toBe("a b"));
  it("cuts on a word boundary", () => expect(excerpt("alpha beta gamma delta", 14)).toBe("alpha beta…"));
});

describe("hadithBodyAr", () => {
  it("drops only leading scraper residue", () => {
    expect(hadithBodyAr({ matn_ar: " : قَالَ: نَعَمْ", text_ar: "x" })).toBe("قَالَ: نَعَمْ");
  });
  it("falls back to the full text", () => {
    expect(hadithBodyAr({ matn_ar: "", text_ar: "نص" })).toBe("نص");
  });
});
