/**
 * Tiny external store over localStorage (settings, bookmarks, last read).
 * Built for useSyncExternalStore: the server and the first client render both
 * see DEFAULT_STATE, then the saved state is applied - no hydration mismatch.
 * Everything is wrapped in try/catch: private mode or blocked storage just
 * means nothing is remembered.
 */
import { useSyncExternalStore } from "react";
import { pageOf } from "./index";
import {
  DEFAULT_STATE,
  STORAGE_KEY,
  sanitizeSettings,
  sanitizeState,
  toggleBookmark,
  type LastRead,
  type QuranSettings,
  type QuranState,
} from "./store-logic";

let state: QuranState = DEFAULT_STATE;
let loaded = false;
let listeningToStorage = false;
const listeners = new Set<() => void>();

function readStorage(): QuranState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: QuranState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: keep the in-memory state */
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== null && e.key !== STORAGE_KEY) return;
  state = readStorage();
  emit();
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

export function getSnapshot(): QuranState {
  if (!loaded) {
    loaded = true;
    state = readStorage();
  }
  return state;
}

export function getServerSnapshot(): QuranState {
  return DEFAULT_STATE;
}

export function updateSettings(patch: Partial<QuranSettings>) {
  const current = getSnapshot();
  commit({ ...current, settings: sanitizeSettings({ ...current.settings, ...patch }) });
}

export function toggleBookmarkAt(surah: number, ayah: number) {
  const current = getSnapshot();
  commit({ ...current, bookmarks: toggleBookmark(current.bookmarks, surah, ayah, Date.now()) });
}

export function setLastRead(value: { surah: number; ayah: number; mode: LastRead["mode"]; page?: number }) {
  const current = getSnapshot();
  const page = value.page ?? pageOf(value.surah, value.ayah);
  const prev = current.lastRead;
  if (prev && prev.surah === value.surah && prev.ayah === value.ayah && prev.page === page && prev.mode === value.mode) {
    return;
  }
  commit({ ...current, lastRead: { surah: value.surah, ayah: value.ayah, page, mode: value.mode, ts: Date.now() } });
}

export function useQuranState(): QuranState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
