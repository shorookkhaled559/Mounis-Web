"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BookmarkCheck, BookOpen, Loader2, Search, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { normalizeArabic } from "@/lib/quran/arabic";
import { TOTAL_PAGES, getSurah, hasDistinctEnglishName, isValidPage, juzStarts, surahs, type SurahType } from "@/lib/quran";
import { toggleBookmarkAt, useQuranState } from "@/lib/quran/store";
import type { SearchHit } from "@/lib/quran/search";
import type { QuranSearchResponse } from "@/app/api/quran/search/route";
import { IconButton, Segmented } from "./quran-ui";

type Tab = "surahs" | "juz" | "bookmarks";
type TypeFilter = "all" | SurahType;

interface SearchState {
  status: "idle" | "loading" | "done" | "error";
  query: string;
  hits: SearchHit[];
  truncated: boolean;
}

const IDLE: SearchState = { status: "idle", query: "", hits: [], truncated: false };

export function QuranHub({ locale }: { locale: string }) {
  const t = useTranslations("quran");
  const router = useRouter();
  const isEn = locale === "en";
  const { lastRead, bookmarks } = useQuranState();

  const [tab, setTab] = useState<Tab>("surahs");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState<SearchState>(IDLE);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [pageValue, setPageValue] = useState("");

  const surahName = (n: number) => {
    const s = getSurah(n);
    return s ? (isEn ? s.tr : s.ar) : String(n);
  };

  // Debounced verse search against /api/quran/search (stale answers are discarded).
  const query = q.trim();
  useEffect(() => {
    if (query.length < 2) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearch((s) => ({ ...s, status: "loading" }));
      try {
        const res = await fetch(`/api/quran/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as QuranSearchResponse;
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
  const resultsReady = searching && search.query === query && (search.status === "done" || search.status === "error");

  const filteredSurahs = useMemo(() => {
    const f = filter.trim();
    const nf = normalizeArabic(f);
    const lf = f.toLowerCase();
    return surahs.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (!f) return true;
      if (/^\d+$/.test(f)) return String(s.n) === f;
      return (
        (nf.length > 0 && normalizeArabic(s.ar).includes(nf)) ||
        s.tr.toLowerCase().includes(lf) ||
        s.en.toLowerCase().includes(lf)
      );
    });
  }, [filter, typeFilter]);

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(pageValue);
    if (isValidPage(n)) router.push(`/quran/page/${n}`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "surahs", label: t("tabs.surahs") },
    { id: "juz", label: t("tabs.juz") },
    { id: "bookmarks", label: `${t("tabs.bookmarks")}${bookmarks.length ? ` (${bookmarks.length})` : ""}` },
  ];

  const card = "rounded-2xl border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-md";

  return (
    <Container className="py-8 sm:py-10">
      {/* Search */}
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            maxLength={100}
            className="w-full rounded-xl border border-border bg-surface py-4 ps-12 pe-12 text-ink shadow-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear"
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted hover:bg-primary-subtle hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searching && (
          <div className="mt-3 rounded-xl border border-border bg-surface" aria-live="polite">
            {!resultsReady ? (
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
                {search.hits.map((h) => (
                  <li key={`${h.surah}:${h.ayah}`}>
                    <Link href={`/quran/${h.surah}#ayah-${h.ayah}`} className="block p-4 transition-colors hover:bg-primary-subtle">
                      <span className="text-xs font-medium text-primary">
                        {t("surahName", { name: surahName(h.surah) })} · {h.surah}:{h.ayah}
                      </span>
                      <span lang="ar" dir="rtl" className="font-quran mt-1 line-clamp-2 block text-xl leading-loose text-ink">
                        {h.text}
                      </span>
                      {isEn && (
                        <span lang="en" dir="ltr" className="mt-1 line-clamp-2 block text-start text-sm text-ink-muted">
                          {h.en}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {resultsReady && search.truncated && <p className="border-t border-border p-3 text-center text-xs text-ink-muted">{t("moreResults")}</p>}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
        {lastRead && (
          <Link
            href={lastRead.mode === "page" ? `/quran/page/${lastRead.page}` : `/quran/${lastRead.surah}#ayah-${lastRead.ayah}`}
            className={cn(card, "flex items-center gap-3 border-primary/40 bg-primary-subtle p-4 sm:col-span-2")}
          >
            <BookOpen className="h-6 w-6 shrink-0 text-primary" />
            <span>
              <span className="block font-medium text-ink">{t("continueReading")}</span>
              <span className="block text-sm text-ink-muted">
                {lastRead.mode === "page"
                  ? t("continuePage", { page: lastRead.page })
                  : t("continueFrom", { surah: surahName(lastRead.surah), ayah: lastRead.ayah })}
              </span>
            </span>
          </Link>
        )}
        <Link href="/quran/1" className={cn(card, "p-4 text-center font-medium text-ink")}>
          {t("startReading")}
        </Link>
        <Link href="/quran/page/1" className={cn(card, "p-4 text-center font-medium text-ink")}>
          {t("openMushaf")}
        </Link>
        <form onSubmit={goToPage} className={cn(card, "flex items-center gap-2 p-3 sm:col-span-2")}>
          <label htmlFor="quran-hub-page" className="shrink-0 ps-1 text-sm text-ink">
            {t("goToPage")}
          </label>
          <input
            id="quran-hub-page"
            type="number"
            inputMode="numeric"
            min={1}
            max={TOTAL_PAGES}
            value={pageValue}
            onChange={(e) => setPageValue(e.target.value)}
            placeholder={t("pageInput")}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
          />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {t("go")}
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label={t("title")} className="mt-10 flex justify-center gap-2 border-b border-border">
        {tabs.map((x) => (
          <button
            key={x.id}
            id={`tab-${x.id}`}
            role="tab"
            type="button"
            aria-selected={tab === x.id}
            aria-controls={`panel-${x.id}`}
            onClick={() => setTab(x.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:px-6 sm:text-base",
              tab === x.id ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "surahs" && (
          <>
            <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-center gap-3">
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label={t("filterPlaceholder")}
                placeholder={t("filterPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Segmented
                label={t("tabs.surahs")}
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: "all", label: t("filterAll") },
                  { value: "meccan", label: t("meccan") },
                  { value: "medinan", label: t("medinan") },
                ]}
              />
            </div>
            {filteredSurahs.length === 0 ? (
              <p className="py-10 text-center text-ink-muted">{t("noSurahs")}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSurahs.map((s) => (
                  <li key={s.n} className="relative min-w-0">
                    <Link href={`/quran/${s.n}`} className={cn(card, "flex items-center gap-4 p-4 pb-9")}>
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
                        {s.n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span lang="ar" dir="rtl" className="font-display block truncate text-xl text-ink">
                          {s.ar}
                        </span>
                        <span className="block truncate text-sm text-ink-muted">
                          {hasDistinctEnglishName(s) ? `${s.tr} · ${s.en}` : s.tr}
                        </span>
                      </span>
                    </Link>
                    <span className="pointer-events-none absolute bottom-2.5 start-[4.75rem] text-xs text-ink-muted">
                      {t(s.type)} · {t("ayahsCount", { count: s.ayahs })}
                    </span>
                    <Link
                      href={`/quran/page/${s.page}`}
                      className="absolute bottom-2 end-3 rounded-full px-2 py-0.5 text-xs text-primary hover:bg-primary-subtle"
                    >
                      {t("pageShort", { n: s.page })}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "juz" && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {juzStarts.map((j) => (
              <li key={j.juz} className="min-w-0">
                <Link href={`/quran/page/${j.page}`} className={cn(card, "flex items-center gap-4 p-4")}>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
                    {j.juz}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{t("juzLabel", { n: j.juz })}</span>
                    <span className="block truncate text-sm text-ink-muted">
                      {surahName(j.surah)} · {t("ayahRef", { ayah: j.ayah })} · {t("pageShort", { n: j.page })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {tab === "bookmarks" &&
          (bookmarks.length === 0 ? (
            <p className="mx-auto max-w-md py-10 text-center text-ink-muted">{t("bookmarksEmpty")}</p>
          ) : (
            <ul className="mx-auto grid max-w-3xl gap-3">
              {bookmarks.map((b) => (
                <li key={`${b.surah}:${b.ayah}`} className={cn(card, "flex items-center gap-3 p-3 ps-4")}>
                  <BookmarkCheck className="h-5 w-5 shrink-0 text-primary" />
                  <Link href={`/quran/${b.surah}#ayah-${b.ayah}`} className="min-w-0 flex-1 py-1">
                    <span className="block truncate font-medium text-ink">{t("surahName", { name: surahName(b.surah) })}</span>
                    <span className="block text-sm text-ink-muted">
                      {t("ayahRef", { ayah: b.ayah })} · {b.surah}:{b.ayah}
                    </span>
                  </Link>
                  <IconButton label={t("removeBookmark")} onClick={() => toggleBookmarkAt(b.surah, b.ayah)}>
                    <X className="h-4 w-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          ))}
      </div>

      <p className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-ink-muted">{t("credits")}</p>
    </Container>
  );
}
