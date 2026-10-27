export type AnimalKind = "camel" | "cattle" | "sheep";

export type DueKey =
  | "sheep"
  | "bintMakhad" // camel, 1 year
  | "bintLabun" // camel, 2 years
  | "hiqqa" // camel, 3 years
  | "jadha" // camel, 4 years
  | "tabi" // cow/buffalo, 1 year
  | "musinna"; // cow/buffalo, 2 years

export interface DueItem {
  key: DueKey;
  qty: number;
}

export type LivestockStatus = "need_count" | "not_grazing" | "below_nisab" | "due";

export interface LivestockResult {
  status: LivestockStatus;
  /** What is due. When `alternatives` is non-empty, any ONE of {due, ...alternatives} is valid. */
  due: DueItem[];
  alternatives: DueItem[][];
}

/**
 * All (a, b) with sizeA*a + sizeB*b <= n leaving the smallest remainder.
 * Several answers => the rule lets the payer choose (e.g. 120 cattle: 4 tabi' OR 3 musinna).
 */
function bestCombos(n: number, sizeA: number, sizeB: number) {
  let best = Infinity;
  let combos: { a: number; b: number }[] = [];
  // For a fixed number of B-animals, taking as many A-animals as fit leaves the smallest remainder.
  for (let b = 0; b * sizeB <= n; b++) {
    const a = Math.floor((n - b * sizeB) / sizeA);
    const left = n - a * sizeA - b * sizeB;
    if (left < best) {
      best = left;
      combos = [{ a, b }];
    } else if (left === best) {
      combos.push({ a, b });
    }
  }
  return combos;
}

function toItems(parts: [DueKey, number][]): DueItem[] {
  return parts.filter(([, q]) => q > 0).map(([key, qty]) => ({ key, qty }));
}

const CAMEL_TABLE: { from: number; to: number; due: DueItem[] }[] = [
  { from: 5, to: 9, due: [{ key: "sheep", qty: 1 }] },
  { from: 10, to: 14, due: [{ key: "sheep", qty: 2 }] },
  { from: 15, to: 19, due: [{ key: "sheep", qty: 3 }] },
  { from: 20, to: 24, due: [{ key: "sheep", qty: 4 }] },
  { from: 25, to: 35, due: [{ key: "bintMakhad", qty: 1 }] },
  { from: 36, to: 45, due: [{ key: "bintLabun", qty: 1 }] },
  { from: 46, to: 60, due: [{ key: "hiqqa", qty: 1 }] },
  { from: 61, to: 75, due: [{ key: "jadha", qty: 1 }] },
  { from: 76, to: 90, due: [{ key: "bintLabun", qty: 2 }] },
  { from: 91, to: 120, due: [{ key: "hiqqa", qty: 2 }] },
];

function camels(n: number): Pick<LivestockResult, "due" | "alternatives"> {
  const row = CAMEL_TABLE.find((r) => n >= r.from && n <= r.to);
  if (row) return { due: row.due, alternatives: [] };

  // 121+: one bint labun per 40, one hiqqa per 50.
  const [first, ...rest] = bestCombos(n, 40, 50).map(({ a, b }) =>
    toItems([
      ["bintLabun", a],
      ["hiqqa", b],
    ]),
  );
  return { due: first, alternatives: rest };
}

function cattle(n: number): Pick<LivestockResult, "due" | "alternatives"> {
  if (n <= 39) return { due: [{ key: "tabi", qty: 1 }], alternatives: [] };
  if (n <= 59) return { due: [{ key: "musinna", qty: 1 }], alternatives: [] };

  // 60+: one tabi' per 30, one musinna per 40.
  const [first, ...rest] = bestCombos(n, 30, 40).map(({ a, b }) =>
    toItems([
      ["tabi", a],
      ["musinna", b],
    ]),
  );
  return { due: first, alternatives: rest };
}

function sheep(n: number): Pick<LivestockResult, "due" | "alternatives"> {
  let qty: number;
  if (n <= 120) qty = 1;
  else if (n <= 200) qty = 2;
  else if (n <= 399) qty = 3;
  else qty = Math.floor(n / 100);
  return { due: [{ key: "sheep", qty }], alternatives: [] };
}

export const LIVESTOCK_NISAB: Record<AnimalKind, number> = { camel: 5, cattle: 30, sheep: 40 };

/**
 * `grazing`: the animals graze freely most of the year (sa'ima). Fed (ma'lufa) animals
 * carry no livestock zakat — if they are for trade, count them as trade goods instead.
 */
export function calcLivestock(kind: AnimalKind, count: number, grazing: boolean): LivestockResult {
  const n = Math.floor(Number.isFinite(count) && count > 0 ? count : 0);
  if (n <= 0) return { status: "need_count", due: [], alternatives: [] };
  if (!grazing) return { status: "not_grazing", due: [], alternatives: [] };
  if (n < LIVESTOCK_NISAB[kind]) return { status: "below_nisab", due: [], alternatives: [] };

  const fn = kind === "camel" ? camels : kind === "cattle" ? cattle : sheep;
  return { status: "due", ...fn(n) };
}
