import { describe, expect, it } from "vitest";
import { searchQuran } from "./search";

const refs = (q: string) => searchQuran(q).hits.map((h) => `${h.surah}:${h.ayah}`);

describe("searchQuran", () => {
  it("finds an ayah by Arabic text without tashkeel", () => {
    const r = searchQuran("الله لا اله الا هو الحي القيوم");
    expect(r.kind).toBe("arabic");
    expect(refs("الله لا اله الا هو الحي القيوم")).toContain("2:255");
  });
  it("finds modern spellings of Uthmani words (skeleton pass)", () => {
    expect(refs("اقيموا الصلاة واتوا الزكاة")).toContain("2:43");
  });
  it("supports references like 2:255", () => {
    const r = searchQuran("2:255");
    expect(r.kind).toBe("reference");
    expect(r.hits).toHaveLength(1);
    expect(r.hits[0]).toMatchObject({ surah: 2, ayah: 255, page: 42 });
    expect(r.hits[0].text.length).toBeGreaterThan(10);
    expect(searchQuran("112 1").hits[0]).toMatchObject({ surah: 112, ayah: 1 });
  });
  it("rejects impossible references", () => {
    expect(searchQuran("2:999").hits).toEqual([]);
    expect(searchQuran("115:1").hits).toEqual([]);
    expect(searchQuran("0:1").hits).toEqual([]);
  });
  it("searches the English translation", () => {
    const r = searchQuran("Lord of the worlds");
    expect(r.kind).toBe("english");
    expect(refs("Lord of the worlds")).toContain("1:2");
  });
  it("ignores too-short or empty queries", () => {
    for (const q of ["", "   ", "ا", "ab", "12345"]) expect(searchQuran(q).hits).toEqual([]);
  });
  it("caps results and reports truncation", () => {
    const r = searchQuran("الله");
    expect(r.hits).toHaveLength(30);
    expect(r.truncated).toBe(true);
    expect(searchQuran("الله", 5).hits).toHaveLength(5);
  });
  it("does not choke on regex characters", () => {
    for (const q of ["a(b", "[[[", "a.*", "\\", "((("]) expect(() => searchQuran(q)).not.toThrow();
  });
  it("returns results in Quran order", () => {
    const hits = searchQuran("الرحمن الرحيم").hits;
    const keys = hits.map((h) => h.surah * 1000 + h.ayah);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });
});
