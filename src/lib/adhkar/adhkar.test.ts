import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { skeletonArabic } from "@/lib/quran/arabic";
import quranAr from "@/lib/quran/data/quran-ar.json";
import { categoryIds, getCategory, getHub, getNeighbours, searchAdhkar } from "./data";
import refsCheck from "./data/refs-check.json";
import raw from "./data/adhkar.json";
import {
  EMPTY_STATE,
  completedCount,
  dayKey,
  getDone,
  resetCategory,
  resetItem,
  sanitizeProgress,
  tap,
} from "./progress";
import { collectionName, refLabel, refUrl } from "./refs";
import type { AdhkarCategory } from "./types";

const all = (raw as unknown as { categories: AdhkarCategory[] }).categories;

describe("adhkar data", () => {
  it("has all 136 categories, each in exactly one group", () => {
    expect(all).toHaveLength(136);
    const inGroups = getHub().flatMap((g) => g.categories.map((c) => c.id));
    expect(inGroups).toHaveLength(136);
    expect([...inGroups].sort((a, b) => a - b)).toEqual([...categoryIds].sort((a, b) => a - b));
    expect(getHub()).toHaveLength(16);
  });

  it("every category has Arabic + English titles and at least one dhikr with a note", () => {
    for (const c of all) {
      expect(c.ar.trim().length, `ar ${c.id}`).toBeGreaterThan(2);
      expect(c.en.trim().length, `en ${c.id}`).toBeGreaterThan(2);
      expect(c.items.length, `items ${c.id}`).toBeGreaterThan(0);
      c.items.forEach((it, i) => {
        expect(it.id, `${c.id} id order`).toBe(c.items[i].id);
        expect(it.text.trim().length, `${c.id}.${it.id} text`).toBeGreaterThan(3);
        expect(it.note.text.trim().length, `${c.id}.${it.id} note`).toBeGreaterThan(10);
        expect(["fadl", "sunnah", "meaning"]).toContain(it.note.kind);
        if (it.count !== null) expect(Number.isInteger(it.count) && it.count > 0, `${c.id}.${it.id} count`).toBe(true);
      });
      expect(new Set(c.items.map((i) => i.id)).size).toBe(c.items.length);
    }
  });

  it("never states a reward without evidence (a hadith reference or the dataset's own takhrij)", () => {
    for (const c of all) {
      for (const it of c.items) {
        if (it.note.kind !== "fadl") continue;
        const evidence = (it.note.refs?.length ?? 0) > 0 || it.note.origin === "seen";
        expect(evidence, `${c.id}.${it.id}`).toBe(true);
      }
    }
  });

  it("has no leftover markup or encoding artefacts in the texts", () => {
    for (const c of all) {
      for (const it of c.items) {
        for (const s of [it.text, it.note.text, it.title ?? "", it.source ?? ""]) {
          expect(/[\uFB50-\uFD3D\uFD40-\uFDF9\uFDFC-\uFEFF]/.test(s), `presentation forms in ${c.id}.${it.id}`).toBe(false);
          expect(s.includes("\r"), `CR in ${c.id}.${it.id}`).toBe(false);
          expect(/undefined|null|\[object/.test(s), `junk in ${c.id}.${it.id}`).toBe(false);
        }
      }
    }
  });

  it("Quranic verses inside adhkar are real Quran text", () => {
    // Consonant skeleton with repeated letters collapsed: tolerates the Uthmani/Imla'i spelling differences
    // between the datasets (السَّمَوَاتِ / ٱلسَّمَٰوَٰتِ, اللَّيْلِ / ٱلَّيۡلِ) but still catches a wrong or missing word.
    const key = (t: string) =>
      skeletonArabic(t.replace(/[^\u0621-\u064A\u064B-\u065F\u0670\u06D6-\u06ED\s]/g, " "))
        .replace(/ /g, "")
        .replace(/(.)\1+/g, "$1");
    const quranJoined = key((quranAr as string[][]).flat().join(" "));
    const missing: string[] = [];
    for (const c of all) {
      for (const it of c.items) {
        for (const m of it.text.matchAll(/﴿([^﴾]+)﴾/g)) {
          const body = key(m[1]);
          if (body.length >= 8 && !quranJoined.includes(body)) missing.push(`${c.id}.${it.id}: ${m[1].slice(0, 40)}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("neighbours follow the hub order", () => {
    const order = getHub().flatMap((g) => g.categories.map((c) => c.id));
    expect(getNeighbours(order[0])).toEqual({ prev: null, next: order[1] });
    expect(getNeighbours(order[10])).toEqual({ prev: order[9], next: order[11] });
    expect(getNeighbours(order[order.length - 1]).next).toBeNull();
    expect(getCategory(1)?.ar).toBe("أذكار الصباح");
    expect(getCategory(9999)).toBeUndefined();
  });
});

// Same normalisation as scripts/build-adhkar-data.py (which resolved the references).
const normRef = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("hadith references are real", () => {
  const dir = path.join(process.cwd(), "public", "data", "hadiths");
  const cache = new Map<string, Map<string, { text: string; url?: string }>>();
  const load = (c: string) => {
    if (!cache.has(c)) {
      const d = JSON.parse(readFileSync(path.join(dir, `${c}.json`), "utf8")) as {
        books: { hadiths: { hadith_number: string | number; text_ar?: string; matn_ar?: string; url_source?: string }[] }[];
      };
      const m = new Map<string, { text: string; url?: string }>();
      for (const b of d.books) for (const h of b.hadiths) m.set(String(h.hadith_number), { text: normRef(h.text_ar || h.matn_ar || ""), url: h.url_source });
      cache.set(c, m);
    }
    return cache.get(c)!;
  };

  it("every cited hadith exists and contains the wording the note relies on", { timeout: 120_000 }, () => {
    expect(refsCheck.length).toBeGreaterThan(80);
    for (const r of refsCheck as { c: string; n: string; phrase: string }[]) {
      const h = load(r.c).get(r.n);
      expect(h, `${r.c}:${r.n} missing`).toBeDefined();
      expect(h!.text.includes(normRef(r.phrase)), `${r.c}:${r.n} lacks «${r.phrase}»`).toBe(true);
      if (h!.url) expect(h!.url.endsWith(`${r.c}:${r.n}`), `${r.c}:${r.n} url`).toBe(true);
    }
  });

  it("every reference in the data has a matching verified check", () => {
    const checked = new Set((refsCheck as { c: string; n: string }[]).map((r) => `${r.c}:${r.n}`));
    for (const c of all) for (const it of c.items) for (const r of it.note.refs ?? []) expect(checked.has(`${r.c}:${r.n}`), `${r.c}:${r.n}`).toBe(true);
  });

  it("formats labels and links", () => {
    expect(refLabel({ c: "muslim", n: "2723a", g: null }, "ar")).toBe("صحيح مسلم 2723a");
    expect(refLabel({ c: "abudawud", n: "5095", g: "sahih" }, "en")).toBe("Sunan Abi Dawud 5095 · Sahih");
    expect(refUrl({ c: "tirmidhi", n: "3505", g: "sahih" })).toBe("https://sunnah.com/tirmidhi:3505");
    expect(collectionName("unknown", "ar")).toBe("unknown");
  });
});

describe("search", () => {
  it("finds a dhikr by Arabic text with or without tashkeel", () => {
    expect(searchAdhkar("سبحان الله وبحمده").hits.length).toBeGreaterThan(3);
    const kursi = searchAdhkar("الله لا اله الا هو الحي القيوم");
    expect(kursi.hits.some((h) => h.category === 1 && h.item === 2)).toBe(true);
  });
  it("matches category titles first", () => {
    const r = searchAdhkar("دخول المسجد");
    expect(r.hits[0].category).toBe(11);
  });
  it("ignores too-short input and caps results", () => {
    expect(searchAdhkar("ا").hits).toEqual([]);
    expect(searchAdhkar("   ").hits).toEqual([]);
    const many = searchAdhkar("الله");
    expect(many.hits).toHaveLength(25);
    expect(many.truncated).toBe(true);
  });
});

describe("daily progress", () => {
  const today = "2026-11-20";
  it("counts taps up to the target and then stops", () => {
    let s = tap(EMPTY_STATE, 1, 3, 3, today);
    s = tap(s, 1, 3, 3, today);
    expect(getDone(s, 1, 3)).toBe(2);
    s = tap(s, 1, 3, 3, today);
    s = tap(s, 1, 3, 3, today);
    expect(getDone(s, 1, 3)).toBe(3);
  });
  it("is immutable", () => {
    const before = tap(EMPTY_STATE, 1, 1, 1, today);
    const copy = JSON.stringify(before);
    tap(before, 1, 2, 5, today);
    resetItem(before, 1, 1);
    expect(JSON.stringify(before)).toBe(copy);
    expect(EMPTY_STATE.done).toEqual({});
  });
  it("resets one item or a whole category", () => {
    let s = tap(tap(EMPTY_STATE, 5, 1, 2, today), 5, 2, 2, today);
    s = resetItem(s, 5, 1);
    expect(getDone(s, 5, 1)).toBe(0);
    expect(getDone(s, 5, 2)).toBe(1);
    expect(resetCategory(s, 5).done).toEqual({});
  });
  it("counts completed items", () => {
    let s = EMPTY_STATE;
    s = tap(s, 7, 1, 1, today);
    s = tap(s, 7, 2, 2, today);
    expect(completedCount(s, 7, [{ id: 1, target: 1 }, { id: 2, target: 2 }])).toBe(1);
    s = tap(s, 7, 2, 2, today);
    expect(completedCount(s, 7, [{ id: 1, target: 1 }, { id: 2, target: 2 }])).toBe(2);
  });
  it("starts fresh on a new day and keeps the font size", () => {
    const s = { day: today, done: { "1": { "1": 3 } }, fontSize: 4 };
    expect(sanitizeProgress(s, today).done).toEqual({ "1": { "1": 3 } });
    const next = sanitizeProgress(s, "2026-11-21");
    expect(next.done).toEqual({});
    expect(next.fontSize).toBe(4);
    expect(tap(s, 1, 1, 5, "2026-11-21").done).toEqual({ "1": { "1": 1 } });
  });
  it("sanitises garbage from storage", () => {
    for (const bad of [null, 1, "x", [], undefined]) expect(sanitizeProgress(bad, today)).toBe(EMPTY_STATE);
    const s = sanitizeProgress({ day: today, fontSize: 99, done: { "1": { "1": -2, "2": 1.5, x: 3, "3": 4 }, bad: { "1": 1 }, "2": 5 } }, today);
    expect(s.done).toEqual({ "1": { "3": 4 } });
    expect(s.fontSize).toBe(4);
  });
  it("formats the local day key", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dayKey(new Date(2026, 10, 20))).toBe("2026-11-20");
  });
});
