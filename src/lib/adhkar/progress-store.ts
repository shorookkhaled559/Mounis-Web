/**
 * localStorage-backed store for the daily counters (useSyncExternalStore: server and first client render
 * both see EMPTY_STATE, so there is no hydration mismatch). Everything is try/catch-guarded.
 */
import { useSyncExternalStore } from "react";
import {
  EMPTY_STATE,
  FONT_MAX,
  FONT_MIN,
  PROGRESS_KEY,
  dayKey,
  resetCategory as resetCategoryLogic,
  resetItem as resetItemLogic,
  sanitizeProgress,
  tap as tapLogic,
  type AdhkarState,
} from "./progress";

let state: AdhkarState = EMPTY_STATE;
let loaded = false;
let listeningToStorage = false;
const listeners = new Set<() => void>();

function read(): AdhkarState {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return sanitizeProgress(raw ? JSON.parse(raw) : null, dayKey());
  } catch {
    return sanitizeProgress(null, dayKey());
  }
}

function commit(next: AdhkarState) {
  state = next;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked or full: keep counting in memory */
  }
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== null && e.key !== PROGRESS_KEY) return;
  state = read();
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!listeningToStorage) {
    listeningToStorage = true;
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
  };
}

/** A tab left open past midnight starts the new day with empty counters. */
export function getSnapshot(): AdhkarState {
  if (!loaded) {
    loaded = true;
    state = read();
  } else if (state.day && state.day !== dayKey()) {
    state = sanitizeProgress(state, dayKey());
  }
  return state;
}

export const getServerSnapshot = (): AdhkarState => EMPTY_STATE;

export function tapItem(cat: number, item: number, target: number) {
  commit(tapLogic(getSnapshot(), cat, item, target, dayKey()));
}
export function resetItem(cat: number, item: number) {
  commit(resetItemLogic(getSnapshot(), cat, item));
}
export function resetCategory(cat: number) {
  commit(resetCategoryLogic(getSnapshot(), cat));
}
export function setFontSize(size: number) {
  const s = getSnapshot();
  commit({ ...s, fontSize: Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(size))) });
}

export function useAdhkarState(): AdhkarState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
