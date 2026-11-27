import { describe, expect, it } from "vitest";
import { getRelatedHadiths, findHadith, parseBookNumber } from "./hadith-page";
import { parseExtras, parseExtrasEntry } from "./hadith-extras";

describe("parseBookNumber", () => {
  it("is strict", () => {
    expect(parseBookNumber("12")).toBe(12);
    expect(parseBookNumber("1abc")).toBeNull();
    expect(parseBookNumber("")).toBeNull();
    expect(parseBookNumber("-1")).toBeNull();
  });
});

describe("findHadith (real data)", () => {
  it("finds the first hadith of Bukhari", async () => {
    const loc = await findHadith("bukhari", "1", "1");
    expect(loc?.hadith.hadith_number).toBe("1");
    expect(loc?.collection.collection.id).toBe("bukhari");
  });
  it("returns null for unknown or malformed input", async () => {
    expect(await findHadith("bukhari", "1", "999999")).toBeNull();
    expect(await findHadith("bukhari", "999", "1")).toBeNull();
    expect(await findHadith("nope", "1", "1")).toBeNull();
    expect(await findHadith("bukhari", "1abc", "1")).toBeNull();
    expect(await findHadith("bukhari", "1", "../x")).toBeNull();
    expect(await findHadith("../bukhari", "1", "1")).toBeNull();
  });
  it("does not return a hadith under the wrong book", async () => {
    // Bukhari hadith 6 belongs to book 1; asking for it under book 2 must 404.
    expect((await findHadith("bukhari", "1", "6"))?.book.book_number).toBe(1);
    expect(await findHadith("bukhari", "2", "6")).toBeNull();
  });
});

describe("getRelatedHadiths (real data)", () => {
  it("links the 'deeds by intentions' hadith to its other routes", async () => {
    const loc = await findHadith("bukhari", "1", "1");
    const related = loc ? await getRelatedHadiths(loc) : [];
    expect(related.length > 0).toBe(true);
    for (const r of related) {
      expect(r.hadith.hadith_number === "1").toBe(false);
      const plain = r.hadith.matn_ar.replace(/[\u064b-\u0652\u0670]/g, "");
      expect(/النية|نية|نيات|نوى/.test(plain)).toBe(true);
    }
  });
});

describe("extras validation", () => {
  const good = {
    sharh: { text: "شرح", source: "مصدر", url: "https://example.com/x" },
    words: { items: [{ word: "أ", meaning: "ب" }], source: "مصدر" },
  };
  it("keeps entries that name their source", () => {
    expect(parseExtrasEntry(good)).toMatchObject({
      sharh: { text: "شرح", source: "مصدر", url: "https://example.com/x" },
      words: { items: [{ word: "أ", meaning: "ب" }], source: "مصدر" },
    });
  });
  it("drops an explanation without a source", () => {
    expect(parseExtrasEntry({ sharh: { text: "شرح" } })).toBeNull();
    expect(parseExtrasEntry({ sharh: { text: "شرح", source: "  " } })).toBeNull();
  });
  it("drops words without a source or without items", () => {
    expect(parseExtrasEntry({ words: { items: [{ word: "أ", meaning: "ب" }] } })).toBeNull();
    expect(parseExtrasEntry({ words: { source: "x", items: [{ word: "", meaning: "ب" }] } })).toBeNull();
  });
  it("ignores non-http urls", () => {
    const e = parseExtrasEntry({ sharh: { text: "t", source: "s", url: "javascript:alert(1)" } });
    expect(e?.sharh?.url).toBeUndefined();
  });
  it("ignores malformed keys and junk", () => {
    expect(parseExtras({ "1:1": good, "bad": good, "../x:1": good })).toEqual({ "1:1": parseExtrasEntry(good) });
    expect(parseExtras(null)).toEqual({});
    expect(parseExtras("x")).toEqual({});
  });
});
