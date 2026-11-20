"use client";

import { useEffect, useState } from "react";
import type { QuranTafsirResponse } from "@/app/api/quran/tafsir/route";

export type TafsirState =
  | { status: "loading" }
  | { status: "ready"; text: string }
  | { status: "empty" }
  | { status: "error" };

type Settled = { status: "ready"; text: string } | { status: "empty" } | { status: "error" };

/** Answers already fetched in this tab, so flipping between ayahs/books never refetches. Bounded. */
const CACHE_LIMIT = 80;
const cache = new Map<string, string>();

function remember(key: string, text: string) {
  cache.delete(key);
  cache.set(key, text);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

/**
 * Loads one ayah's tafsir from /api/quran/tafsir.
 * `retry()` re-runs a failed request. Switching ayah/book mid-request discards the old answer.
 * State is only set from the async callback (never synchronously inside the effect).
 */
export function useTafsir(edition: string, surah: number, ayah: number): TafsirState & { retry: () => void } {
  const key = `${edition}:${surah}:${ayah}`;
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<(Settled & { id: string }) | null>(null);

  const id = `${key}#${attempt}`;
  const cached = cache.get(key);

  useEffect(() => {
    if (cache.has(key)) return;
    const ctrl = new AbortController();
    const params = new URLSearchParams({ edition, surah: String(surah), ayah: String(ayah) });

    /** The settled answer, or null when this request was cancelled (nothing to show for it). */
    const load = async (): Promise<Settled | null> => {
      try {
        const res = await fetch(`/api/quran/tafsir?${params}`, { signal: ctrl.signal });
        if (res.status === 404) return { status: "empty" };
        if (!res.ok) return { status: "error" };
        const data = (await res.json()) as Partial<QuranTafsirResponse>;
        if (typeof data.text !== "string" || data.text === "") return { status: "error" };
        remember(key, data.text);
        return { status: "ready", text: data.text };
      } catch (e) {
        return (e as { name?: string })?.name === "AbortError" ? null : { status: "error" };
      }
    };

    // setSettled only runs in this callback, never synchronously in the effect body.
    load().then((next) => {
      if (next && !ctrl.signal.aborted) setSettled({ ...next, id });
    });

    return () => ctrl.abort();
  }, [key, id, edition, surah, ayah]);

  const retry = () => setAttempt((n) => n + 1);

  if (cached !== undefined) return { status: "ready", text: cached, retry };
  if (settled && settled.id === id) {
    return settled.status === "ready" ? { status: "ready", text: settled.text, retry } : { status: settled.status, retry };
  }
  return { status: "loading", retry };
}
