#!/usr/bin/env node
/**
 * Builds public/data/hadith-related/<collection>.json: for every hadith, the few
 * hadiths of the SAME collection whose Arabic wording is closest to it.
 *
 * Method: TF-IDF over the normalised Arabic matn + cosine similarity. It measures
 * shared wording, not meaning, so the UI calls the result "similar in wording"
 * and never claims the hadiths are on the same topic or confirm one another.
 * Only references are stored ("book:number"); the page looks the text up itself.
 *
 * Usage: node scripts/build-hadith-related.mjs [collectionId ...]
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "public/data/hadiths");
const OUT = path.join(ROOT, "public/data/hadith-related");
const TOP = 4;
const MIN_SCORE = 0.35;
const MIN_TOKENS = 4; // very short texts match on a word or two and are noise
const MAX_DF_RATIO = 0.05; // words in >5% of hadiths ("said", "Allah"...) carry no signal

const STRIP_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

function tokens(text) {
  const t = text
    .replace(STRIP_MARKS, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي\s]/g, " ");
  const out = [];
  for (let w of t.split(/\s+/)) {
    if (!w) continue;
    w = w.replace(/^(?:وال|بال|فال|كال|لل|ال)(?=.{3})/, "").replace(/^و(?=.{4})/, "");
    if (w.length >= 3) out.push(w);
  }
  return out;
}

const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(DATA).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));

fs.mkdirSync(OUT, { recursive: true });

for (const id of ids) {
  const t0 = Date.now();
  const data = JSON.parse(fs.readFileSync(path.join(DATA, `${id}.json`), "utf8"));
  const docs = [];
  for (const book of data.books) {
    for (const h of book.hadiths) {
      const toks = tokens(h.matn_ar || h.text_ar || "");
      docs.push({ key: `${book.book_number}:${h.hadith_number}`, toks });
    }
  }
  const N = docs.length;
  const df = new Map();
  for (const d of docs) for (const w of new Set(d.toks)) df.set(w, (df.get(w) ?? 0) + 1);

  // sparse unit vectors
  const inverted = new Map();
  const vecs = docs.map((d, i) => {
    if (d.toks.length < MIN_TOKENS) return null;
    const tf = new Map();
    for (const w of d.toks) {
      if ((df.get(w) ?? 0) > N * MAX_DF_RATIO || df.get(w) < 2) continue;
      tf.set(w, (tf.get(w) ?? 0) + 1);
    }
    let norm = 0;
    const v = new Map();
    for (const [w, c] of tf) {
      const x = (1 + Math.log(c)) * Math.log(N / df.get(w));
      v.set(w, x);
      norm += x * x;
    }
    if (v.size < 2) return null;
    norm = Math.sqrt(norm);
    for (const [w, x] of v) {
      v.set(w, x / norm);
      let list = inverted.get(w);
      if (!list) inverted.set(w, (list = []));
      list.push(i);
    }
    return v;
  });

  const result = {};
  for (let i = 0; i < N; i++) {
    const v = vecs[i];
    if (!v) continue;
    const scores = new Map();
    for (const [w, x] of v) {
      for (const j of inverted.get(w)) {
        if (j === i) continue;
        scores.set(j, (scores.get(j) ?? 0) + x * vecs[j].get(w));
      }
    }
    const best = [...scores]
      .filter(([, s]) => s >= MIN_SCORE)
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, TOP)
      .map(([j]) => docs[j].key);
    if (best.length) result[docs[i].key] = best;
  }
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(result));
  const kb = Math.round(fs.statSync(path.join(OUT, `${id}.json`)).size / 1024);
  console.log(`${id}: ${Object.keys(result).length}/${N} have related, ${kb} KB, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
