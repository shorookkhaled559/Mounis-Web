/**
 * Generates the static Quran data files used by /quran.
 *
 *   mkdir /tmp/qsrc && cd /tmp/qsrc && npm i quran-json quran-meta
 *   QSRC=/tmp/qsrc node scripts/build-quran-data.mjs
 *
 * Output (committed, so the site never depends on a third-party API at runtime):
 *   src/lib/quran/data/quran-ar.json   Uthmani text      [surah][ayah]
 *   src/lib/quran/data/quran-en.json   Saheeh Intl.      [surah][ayah]
 *   src/lib/quran/data/meta.json       surahs, 604 page starts, 30 juz starts
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = process.env.QSRC ?? "/tmp/qsrc";
const require = createRequire(path.join(src, "package.json"));
const read = (p) => JSON.parse(readFileSync(path.join(src, "node_modules", p), "utf8"));
const { createHafs } = await import(require.resolve("quran-meta"));
const hafs = createHafs();

const ar = read("quran-json/dist/quran.json");
const en = read("quran-json/dist/quran_en.json");
const names = read("quran-json/dist/chapters/en/index.json");

// The source has one stray THIN SPACE (2:72) that splits a word; drop it.
const clean = (t) => t.replace(/\u2009/g, "");

const textAr = ar.map((s) => s.verses.map((v) => clean(v.text)));
const textEn = en.map((s) => s.verses.map((v) => v.translation.trim()));

const total = textAr.reduce((n, s) => n + s.length, 0);
if (total !== 6236) throw new Error(`expected 6236 ayahs, got ${total}`);
textAr.forEach((s, i) => {
  if (s.length !== ar[i].total_verses || textEn[i].length !== s.length) throw new Error(`surah ${i + 1} length mismatch`);
});

const pages = [];
for (let p = 1; p <= 604; p++) pages.push(hafs.getPageMeta(p).first); // [surah, ayah]
const juz = [];
for (let j = 1; j <= 30; j++) {
  const [s, a] = hafs.getJuzMeta(j).first;
  juz.push([s, a, hafs.findPage(s, a)]);
}

const surahs = ar.map((s) => {
  const info = names.find((c) => c.id === s.id);
  const [firstSurah, firstAyah] = [s.id, 1];
  return {
    n: s.id,
    ar: s.name,
    tr: s.transliteration,
    en: info?.translation ?? s.transliteration,
    ayahs: s.total_verses,
    type: s.type === "medinan" ? "medinan" : "meccan",
    page: hafs.findPage(firstSurah, firstAyah),
    juz: hafs.findJuz(firstSurah, firstAyah),
  };
});

const out = path.join(root, "src/lib/quran/data");
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "quran-ar.json"), JSON.stringify(textAr));
writeFileSync(path.join(out, "quran-en.json"), JSON.stringify(textEn));
writeFileSync(path.join(out, "meta.json"), JSON.stringify({ surahs, pages, juz }));
console.log("ok:", total, "ayahs,", pages.length, "pages,", juz.length, "juz");
