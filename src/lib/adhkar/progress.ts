/** Pure logic for the daily "done" counters (kept free of React/localStorage so it can be unit-tested). */

export const PROGRESS_KEY = "mounis:adhkar:v1";
export const FONT_MIN = 0;
export const FONT_MAX = 4;

export interface AdhkarState {
  /** Local calendar day the counters belong to (YYYY-MM-DD); counters reset when the day changes. */
  day: string;
  /** categoryId -> itemId -> times recited today */
  done: Record<string, Record<string, number>>;
  fontSize: number;
}

export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const EMPTY_STATE: AdhkarState = Object.freeze({
  day: "",
  done: Object.freeze({}) as Record<string, Record<string, number>>,
  fontSize: 2,
}) as AdhkarState;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Validates stored data and drops counters from previous days. */
export function sanitizeProgress(raw: unknown, today: string): AdhkarState {
  if (!isObj(raw)) return EMPTY_STATE;
  const fs = typeof raw.fontSize === "number" && Number.isFinite(raw.fontSize) ? Math.round(raw.fontSize) : 2;
  const fontSize = Math.min(FONT_MAX, Math.max(FONT_MIN, fs));
  if (raw.day !== today || !isObj(raw.done)) return { day: today, done: {}, fontSize };
  const done: Record<string, Record<string, number>> = {};
  for (const [cat, items] of Object.entries(raw.done)) {
    if (!/^\d{1,4}$/.test(cat) || !isObj(items)) continue;
    const clean: Record<string, number> = {};
    for (const [item, n] of Object.entries(items)) {
      if (/^\d{1,4}$/.test(item) && typeof n === "number" && Number.isInteger(n) && n > 0 && n <= 10000) clean[item] = n;
    }
    if (Object.keys(clean).length) done[cat] = clean;
  }
  return { day: today, done, fontSize };
}

export function getDone(state: AdhkarState, cat: number, item: number): number {
  return state.done[String(cat)]?.[String(item)] ?? 0;
}

/** One tap on a counter: +1, capped at the required repetitions (a tap on a finished item does nothing). */
export function tap(state: AdhkarState, cat: number, item: number, target: number, today: string): AdhkarState {
  const base = state.day === today ? state : { ...state, day: today, done: {} };
  const current = getDone(base, cat, item);
  if (current >= target) return base;
  return {
    ...base,
    done: { ...base.done, [String(cat)]: { ...base.done[String(cat)], [String(item)]: current + 1 } },
  };
}

export function resetItem(state: AdhkarState, cat: number, item: number): AdhkarState {
  const items = { ...state.done[String(cat)] };
  delete items[String(item)];
  const done = { ...state.done, [String(cat)]: items };
  if (!Object.keys(items).length) delete done[String(cat)];
  return { ...state, done };
}

export function resetCategory(state: AdhkarState, cat: number): AdhkarState {
  const done = { ...state.done };
  delete done[String(cat)];
  return { ...state, done };
}

/** How many items of a category are finished, given each item's required count. */
export function completedCount(state: AdhkarState, cat: number, targets: readonly { id: number; target: number }[]): number {
  return targets.filter((t) => getDone(state, cat, t.id) >= t.target).length;
}
