import { describe, expect, it } from "vitest";
import { hasArabic, normalizeArabic, skeletonArabic } from "./arabic";

describe("normalizeArabic", () => {
  it("strips tashkeel and Quranic marks", () => {
    expect(normalizeArabic("ٱللَّهُ")).toBe("الله");
    expect(normalizeArabic("ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ")).toBe("الرحمن الرحيم");
  });
  it("unifies alef, ya and ta marbuta forms and drops hamza", () => {
    expect(normalizeArabic("لَآ إِلَٰهَ")).toBe(normalizeArabic("لا إله"));
    expect(normalizeArabic("ٱلۡقُرۡءَانِ")).toBe(normalizeArabic("القرآن"));
    expect(normalizeArabic("رحمة")).toBe("رحمه");
    expect(normalizeArabic("هدى")).toBe("هدي");
  });
  it("collapses whitespace", () => expect(normalizeArabic("  أ   ب ")).toBe("ا ب"));
});

describe("skeletonArabic", () => {
  it("meets Uthmani and modern spelling", () => {
    expect(skeletonArabic("ٱلصَّلَوٰةَ")).toBe(skeletonArabic("الصلاة"));
    expect(skeletonArabic("ٱلزَّكَوٰةَ")).toBe(skeletonArabic("الزكاة"));
    expect(skeletonArabic("ٱلۡحَيَوٰةُ")).toBe(skeletonArabic("الحياة"));
  });
});

describe("hasArabic", () => {
  it("detects Arabic letters", () => {
    expect(hasArabic("abc")).toBe(false);
    expect(hasArabic("2:255")).toBe(false);
    expect(hasArabic("الله")).toBe(true);
  });
});
