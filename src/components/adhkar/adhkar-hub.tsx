"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MoonStar, Search, Sunrise, X, BedDouble, HandHeart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { completedCount, getDone } from "@/lib/adhkar/progress";
import { useAdhkarState } from "@/lib/adhkar/progress-store";
import type { AdhkarHit } from "@/lib/adhkar/data";
import type { HubCategory, HubGroup } from "@/lib/adhkar/types";
import type { AdhkarSearchResponse } from "@/app/api/adhkar/search/route";
import { toArabicIndic } from "@/lib/quran";

interface SearchState {
  status: "idle" | "loading" | "done" | "error";
  query: string;
  hits: AdhkarHit[];
  truncated: boolean;
}
const IDLE: SearchState = { status: "idle", query: "", hits: [], truncated: false };

const QUICK: { id: number; key: "quickMorning" | "quickEvening" | "quickSleep" | "quickAfterPrayer"; icon: typeof Sunrise }[] = [
  { id: 1, key: "quickMorning", icon: Sunrise },
  { id: 133, key: "quickEvening", icon: MoonStar },
  { id: 2, key: "quickSleep", icon: BedDouble },
  { id: 27, key: "quickAfterPrayer", icon: HandHeart },
];

export function AdhkarHub({ locale, groups }: { locale: string; groups: HubGroup[] }) {
  const t = useTranslations("adhkar");
  const isEn = locale === "en";
  const state = useAdhkarState();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState<SearchState>(IDLE);
  const [filter, setFilter] = useState("all");

  const catById = useMemo(() => new Map(groups.flatMap((g) => g.categories).map((c) => [c.id, c])), [groups]);
  const title = (c: HubCategory) => (isEn ? c.en : c.ar);
  const num = (n: number) => (isEn ? String(n) : toArabicIndic(n));

  const query = q.trim();
  useEffect(() => {
    if (query.length < 2) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearch((s) => ({ ...s, status: "loading" }));
      try {
        const res = await fetch(`/api/adhkar/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as AdhkarSearchResponse;
        setSearch({ status: "done", query, hits: data.hits, truncated: data.truncated });
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setSearch({ status: "error", query, hits: [], truncated: false });
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  const searching = query.length >= 2;
  const ready = searching && search.query === query && (search.status === "done" || search.status === "error");
  const visibleGroups = filter === "all" ? groups : groups.filter((g) => g.id === filter);
  const totals = useMemo(
    () => ({ categories: groups.reduce((n, g) => n + g.categories.length, 0), items: groups.reduce((n, g) => n + g.categories.reduce((m, c) => m + c.targets.length, 0), 0) }),
    [groups],
  );

  const progressOf = (c: HubCategory) => {
    const done = completedCount(state, c.id, c.targets);
    const started = c.targets.some((x) => getDone(state, c.id, x.id) > 0);
    return { done, started, complete: done === c.targets.length };
  };

  const card = "rounded-2xl border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-md";

  return (
    <Container className="py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            maxLength={80}
            className="w-full rounded-xl border border-border bg-surface py-4 ps-12 pe-12 text-ink shadow-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear" className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted hover:bg-primary-subtle hover:text-primary">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searching && (
          <div className="mt-3 rounded-xl border border-border bg-surface" aria-live="polite">
            {!ready ? (
              <p className="flex items-center gap-2 p-4 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("searching")}
              </p>
            ) : search.status === "error" ? (
              <p className="p-4 text-sm text-red-600 dark:text-red-400">{t("searchError")}</p>
            ) : search.hits.length === 0 ? (
              <p className="p-4 text-sm text-ink-muted">{t("noResults")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {search.hits.map((h) => {
                  const cat = catById.get(h.category);
                  return (
                    <li key={`${h.category}:${h.item}`}>
                      <Link href={`/thought/${h.category}#item-${h.item}`} className="block p-4 transition-colors hover:bg-primary-subtle">
                        <span className="text-xs font-medium text-primary">{cat ? title(cat) : h.category}</span>
                        <span lang="ar" dir="rtl" className="font-quran mt-1 line-clamp-2 block text-xl leading-loose text-ink">
                          {h.text}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {ready && search.truncated && <p className="border-t border-border p-3 text-center text-xs text-ink-muted">{t("moreResults")}</p>}
          </div>
        )}
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK.map(({ id, key, icon: Icon }) => {
          const c = catById.get(id);
          const p = c ? progressOf(c) : null;
          return (
            <Link key={id} href={`/thought/${id}`} className={cn(card, "flex flex-col items-center gap-2 p-4 text-center", p?.complete && "border-primary/50 bg-primary-subtle")}>
              <Icon aria-hidden="true" className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium text-ink">{t(key)}</span>
              {p && p.started && c && (
                <span className="text-xs text-primary">{p.complete ? t("completedToday") : t("progressShort", { done: num(p.done), total: num(c.targets.length) })}</span>
              )}
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-ink-muted">{t("stats", { categories: num(totals.categories), items: num(totals.items) })}</p>

      <div role="group" aria-label={t("allGroups")} className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
        {[{ id: "all", ar: t("allGroups"), en: t("allGroups") }, ...groups].map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={filter === g.id}
            onClick={() => setFilter(g.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
              filter === g.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-ink hover:border-primary/40",
            )}
          >
            {isEn ? g.en : g.ar}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-10">
        {visibleGroups.map((g) => (
          <section key={g.id} aria-labelledby={`group-${g.id}`}>
            <h2 id={`group-${g.id}`} className="font-display mb-4 text-2xl text-ink">
              {isEn ? g.en : g.ar}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.categories.map((c) => {
                const p = progressOf(c);
                return (
                  <li key={c.id} className="min-w-0">
                    <Link href={`/thought/${c.id}`} className={cn(card, "flex h-full flex-col gap-1 p-4", p.complete && "border-primary/50 bg-primary-subtle")}>
                      <span className="line-clamp-2 font-medium text-ink">{title(c)}</span>
                      <span className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-muted">
                        <span>{t("itemsCount", { count: num(c.targets.length) })}</span>
                        {p.started && (
                          <span className="text-primary">{p.complete ? t("completedToday") : t("progressShort", { done: num(p.done), total: num(c.targets.length) })}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-2 text-center text-xs leading-relaxed text-ink-muted">
        <p>{t("noteHelp")}</p>
        <p>{t("dailyReset")}</p>
        {isEn && <p>{t("arabicOnly")}</p>}
        <p>{t("credits")}</p>
      </div>
    </Container>
  );
}

