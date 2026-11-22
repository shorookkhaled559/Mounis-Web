#!/usr/bin/env node
/**
 * Builds src/data/hadith-of-day.json: the fixed pool "Hadith of the day" draws from.
 *
 * Why a pool file instead of picking at random from the whole corpus:
 *  - Only Sahih al-Bukhari and Sahih Muslim are used, so the featured hadith
 *    never depends on a weak or disputed narration.
 *  - Only books about faith, knowledge, manners, supplication and heart-softening
 *    are used (no rulings on purity, marriage, punishments, war...), because a
 *    daily one-liner on the home page should not need a scholar's context.
 *  - The result is a small, reviewable JSON file (every entry can be read and
 *    removed by a person) and the home page never has to parse a 28 MB file.
 *
 * Usage:  node scripts/build-hadith-of-day-pool.mjs
 * Re-running always produces the same file for the same input data.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "public/data/hadiths");
const OUT = path.join(ROOT, "src/data/hadith-of-day.json");
const POOL_SIZE = 366;

// collection -> allowed book numbers
const BOOKS = {
  bukhari: [2, 3, 53, 66, 78, 80, 81],
  muslim: [1, 38, 39, 45, 47, 49, 50, 55],
};
// dialogue / story markers: "a man said", "he was asked", "came", "I saw", ...
const NEEDS_CONTEXT =
  /فَقَالَ|فَقَالَتْ|وَقَالَ|قَالَ لِي|رَجُلٌ|رَجُلاً|سَأَلَ|سُئِلَ|جَاءَ|رَأَيْتُ|سَمِعْتُ|كَانَ النَّبِيُّ|كَانَ رَسُولُ|ثُمَّ قَالَ|خَرَجَ|دَخَلَ|حَدَّثَنَا|حَدَّثَنِي|أَخْبَرَنَا|أَخْبَرَنِي|رضى الله|رضي الله|صلى الله عليه وسلم|ـ|"/;

// English check. Bukhari's English matn spells out who said it, so it must read
// "The Prophet (ﷺ) said, "..."". Muslim's English is the bare saying, so we only
// reject text that starts like a story or an aside.
const BUKHARI_EN =
  /^(?:The Prophet|Allah['’]s (?:Messenger|Apostle)|Allah 's (?:Messenger|Apostle)|The Messenger of Allah)\s*(?:\(ﷺ\))?\s*said\s*[,:]?\s*["“][^"“”]+["”]\.?$/;
const MUSLIM_EN_STORY = /^(?:\(|That |Allow |I |We |A |An |Abu |Anas |`|Aisha|It |He (?:said|was|used)|She |They |There was|Once|When (?:the )?Allah|The (?:Prophet|Messenger))|narrated|\bsaid\b/i;

// References ("collection:book:number") a reviewer has removed by hand.
// Removed after reading the automatic selection: each one needs surrounding context
// (story, dialogue, cut-off sentence), is a topic that deserves a scholar's
// explanation next to it (medicine, omens, rulings on greeting non-Muslims, political
// statements), or is too heavy for an unprompted home-page card.
const EXCLUDE = new Set([
  "muslim:1:40", "muslim:1:63a", "muslim:1:98", "muslim:1:99", "muslim:1:100", "muslim:1:101",
  "muslim:1:120a", "muslim:1:141a", "muslim:1:157a", "muslim:1:170", "muslim:1:192", "muslim:1:219",
  "muslim:38:2158a", "muslim:39:2167a", "muslim:39:2204", "muslim:39:2209a", "muslim:39:2210a",
  "muslim:39:2215a", "muslim:39:2224a", "muslim:39:2225a", "muslim:39:2227",
  "muslim:45:2632a", "muslim:49:2738a", "muslim:55:3001",
]);

const MIN_LEN = 40;
const MAX_LEN = 380;

// Small seeded PRNG so the pool is reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const candidates = [];
for (const [id, books] of Object.entries(BOOKS)) {
  const data = JSON.parse(fs.readFileSync(path.join(DATA, `${id}.json`), "utf8"));
  for (const book of data.books) {
    if (!books.includes(book.book_number)) continue;
    for (const h of book.hadiths) {
      const ar = (h.matn_ar ?? "").replace(/\s+/g, " ").trim();
      const en = (h.matn_en ?? "").replace(/\s+/g, " ").trim();
      if (ar.length < MIN_LEN || ar.length > MAX_LEN) continue;
      if (en.length < MIN_LEN || en.length > MAX_LEN * 2) continue;
      if (/[\[\]]/.test(ar + en)) continue; // editorial brackets / commentary
      // The wording must stand on its own, as a saying of the Prophet:
      //  - the chain (isnad) has to end right before the quote ("... قَالَ" / "... يَقُولُ"),
      //  - the matn must not start with another chain ("حدثنا ...") and must not be
      //    a dialogue or story that needs its surrounding context.
      if (!/(?:قَالَ|يَقُولُ|قَالَتْ)\s*$/.test((h.isnad_ar ?? "").trim())) continue;
      if (/^(?:و?حَدَّثَ|و?أَخْبَرَ)/.test(ar)) continue;
      if (NEEDS_CONTEXT.test(ar)) continue;
      if (/^قَالَ/.test(ar) || /^.\u0652/.test(ar)) continue; // quoted attribution / cut-off first word
      // keep only narrations that quote or describe the Prophet (peace be upon him)
      if (!/رسول الله|النبي|صلى الله عليه وسلم/.test(h.text_ar ?? "")) continue;
      if (candidates.some((x) => x.ar === ar)) continue; // same wording under another number
      if (EXCLUDE.has(`${id}:${book.book_number}:${h.hadith_number}`)) continue;
      if (id === "bukhari" ? !BUKHARI_EN.test(en) : MUSLIM_EN_STORY.test(en)) continue;
      candidates.push({
        c: id,
        b: book.book_number,
        n: h.hadith_number,
        ar,
        en,
      });
    }
  }
}

// Fisher-Yates with a fixed seed, then keep the first POOL_SIZE.
const rand = mulberry32(20261120);
for (let i = candidates.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
}
const pool = candidates.slice(0, POOL_SIZE).sort((a, b) => a.c.localeCompare(b.c) || a.b - b.b || a.n.localeCompare(b.n, 'en', { numeric: true }));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(pool, null, 1) + "\n");
console.log(`candidates: ${candidates.length}, pool: ${pool.length} -> ${path.relative(ROOT, OUT)}`);
