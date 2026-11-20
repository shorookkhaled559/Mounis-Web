"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Square,
  X,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import {
  BISMILLAH,
  TOTAL_PAGES,
  getSurah,
  hasDistinctEnglishName,
  isValidPage,
  pageOf,
  showsBismillah,
} from "@/lib/quran";
import { RECITERS, getReciter } from "@/lib/quran/audio";
import { isBookmarked } from "@/lib/quran/store-logic";
import { setLastRead, toggleBookmarkAt, updateSettings, useQuranState } from "@/lib/quran/store";
import type { QueueItem } from "@/lib/quran/player";
import type { ReaderSection } from "@/lib/quran/types";
import { AyahActions, AyahCard, type AyahHandlers } from "./ayah-card";
import { AyahMarker } from "./ayah-marker";
import { IconButton, Segmented, Switch } from "./quran-ui";
import { TafsirDialog } from "./tafsir-dialog";
import { useAyahPlayer } from "./use-ayah-player";

/** Arabic font size ladder (rem) behind the A- / A+ buttons. */
const FONT_REM = [1.6, 1.9, 2.2, 2.6, 3.1];
const AUTOPLAY_KEY = "mounis:quran:autoplay";

interface QuranReaderProps {
  locale: string;
  mode: "surah" | "page";
  sections: ReaderSection[];
  /** Mushaf page number (page mode only). */
  page?: number;
  /** Juz of the first ayah shown. */
  juz: number;
  /** Hrefs without the locale prefix, or null at the ends of the Quran. */
  prev: string | null;
  next: string | null;
}

export function QuranReader({ locale, mode, sections, page, juz, prev, next }: QuranReaderProps) {
  const t = useTranslations("quran");
  const router = useRouter();
  const { settings, bookmarks } = useQuranState();
  const isEn = locale === "en";
  const showTranslation = settings.translation ?? isEn;
  const view = mode === "page" ? "flow" : settings.view;
  const fontRem = FONT_REM[settings.fontSize] ?? FONT_REM[2];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<{ surah: number; ayah: number } | null>(null);
  const [tafsirTarget, setTafsirTarget] = useState<{ surah: number; ayah: number } | null>(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);

  const surahLabel = useCallback(
    (n: number) => {
      const s = getSurah(n);
      return s ? (isEn ? s.tr : s.ar) : String(n);
    },
    [isEn],
  );

  const queue = useMemo<QueueItem[]>(
    () => sections.flatMap((s) => s.ayahs.map((a) => ({ surah: s.surah, ayah: a.n }))),
    [sections],
  );
  const indexByKey = useMemo(() => new Map(queue.map((q, i) => [`${q.surah}:${q.ayah}`, i])), [queue]);
  const ayahByKey = useMemo(() => {
    const m = new Map<string, { text: string; en: string }>();
    for (const s of sections) for (const a of s.ayahs) m.set(`${s.surah}:${a.n}`, { text: a.text, en: a.en });
    return m;
  }, [sections]);

  const domId = useCallback(
    (surah: number, ayah: number) => (mode === "surah" ? `ayah-${ayah}` : `ayah-${surah}-${ayah}`),
    [mode],
  );

  // --- audio ---------------------------------------------------------------
  const autoNext = settings.autoNextPage;
  const goNext = useCallback(() => {
    if (!next || !autoNext) return;
    try {
      window.sessionStorage.setItem(AUTOPLAY_KEY, "1");
    } catch {
      /* ignore */
    }
    router.push(next);
  }, [next, autoNext, router]);
  const { player, index, status } = useAyahPlayer(queue, settings.reciter, goNext);
  const current = index !== null ? (queue[index] ?? null) : null;
  const curSurah = current?.surah ?? 0;
  const curAyah = current?.ayah ?? 0;
  const audioActive = status !== "idle";

  // Hand-off from the previous page/surah: keep listening.
  useEffect(() => {
    let flagged = false;
    try {
      flagged = window.sessionStorage.getItem(AUTOPLAY_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!flagged) return;
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.removeItem(AUTOPLAY_KEY);
      } catch {
        /* ignore */
      }
    }, 800);
    player.play(0);
    return () => window.clearTimeout(timer);
  }, [player]);

  // Keep the playing ayah on screen.
  useEffect(() => {
    if (!curAyah) return;
    const el = document.getElementById(domId(curSurah, curAyah));
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top >= 96 && r.bottom <= vh - 200) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [curSurah, curAyah, domId]);

  // Lock-screen / headset controls.
  useEffect(() => {
    if (!curAyah || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    try {
      ms.metadata = new MediaMetadata({
        title: `${surahLabel(curSurah)} — ${curAyah}`,
        artist: isEn ? getReciter(settings.reciter).en : getReciter(settings.reciter).ar,
        album: isEn ? "Mounis — Holy Quran" : "مؤنس — القرآن الكريم",
      });
      ms.setActionHandler("play", () => player.resume());
      ms.setActionHandler("pause", () => player.pause());
      ms.setActionHandler("nexttrack", () => player.next());
      ms.setActionHandler("previoustrack", () => player.prev());
    } catch {
      /* unsupported action */
    }
    return () => {
      try {
        ms.setActionHandler("play", null);
        ms.setActionHandler("pause", null);
        ms.setActionHandler("nexttrack", null);
        ms.setActionHandler("previoustrack", null);
      } catch {
        /* ignore */
      }
    };
  }, [curSurah, curAyah, player, settings.reciter, isEn, surahLabel]);

  // --- reading position ----------------------------------------------------
  useEffect(() => {
    if (mode === "page") {
      const first = sections[0]?.ayahs[0];
      if (first && page) setLastRead({ surah: sections[0].surah, ayah: first.n, page, mode: "page" });
      return;
    }
    let timer: number | undefined;
    const update = () => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-ayah]")) {
        if (el.getBoundingClientRect().bottom > 120) {
          setLastRead({ surah: Number(el.dataset.surah), ayah: Number(el.dataset.ayah), mode: "surah" });
          break;
        }
      }
    };
    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, ms);
    };
    const onScroll = () => schedule(700);
    window.addEventListener("scroll", onScroll, { passive: true });
    schedule(1500);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [mode, page, sections]);

  // Arrow keys turn pages in the mushaf view (direction follows the UI direction).
  useEffect(() => {
    if (mode !== "page") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      const rtl = document.documentElement.dir === "rtl";
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const backward = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward && next) router.push(next);
      else if (e.key === backward && prev) router.push(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, next, prev, router]);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  // --- actions -------------------------------------------------------------
  const flash = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const handlePlay = useCallback(
    (surah: number, ayah: number) => {
      const i = indexByKey.get(`${surah}:${ayah}`);
      if (i !== undefined) player.toggle(i);
    },
    [indexByKey, player],
  );

  const ayahUrl = useCallback(
    (surah: number, ayah: number) => `${window.location.origin}/${locale}/quran/${surah}#ayah-${ayah}`,
    [locale],
  );

  const ayahText = useCallback(
    (surah: number, ayah: number) => {
      const a = ayahByKey.get(`${surah}:${ayah}`);
      if (!a) return "";
      const lines = [`﴿ ${a.text} ﴾`, `— ${surahLabel(surah)} (${surah}:${ayah})`];
      if (showTranslation) lines.splice(1, 0, a.en);
      return lines.join("\n");
    },
    [ayahByKey, showTranslation, surahLabel],
  );

  const copyText = useCallback(
    async (text: string, okMessage: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flash(okMessage);
      } catch {
        flash(t("copyFailed"));
      }
    },
    [flash, t],
  );

  const handlers = useMemo<AyahHandlers>(
    () => ({
      onPlay: handlePlay,
      onTafsir: (surah, ayah) => setTafsirTarget({ surah, ayah }),
      onBookmark: (surah, ayah) => toggleBookmarkAt(surah, ayah),
      onCopy: (surah, ayah) => void copyText(`${ayahText(surah, ayah)}\n${ayahUrl(surah, ayah)}`, t("copied")),
      onShare: async (surah, ayah) => {
        const url = ayahUrl(surah, ayah);
        if (typeof navigator.share === "function") {
          try {
            await navigator.share({ title: `${surahLabel(surah)} ${surah}:${ayah}`, text: ayahText(surah, ayah), url });
            return;
          } catch (e) {
            if ((e as { name?: string })?.name === "AbortError") return;
          }
        }
        await copyText(url, t("linkCopied"));
      },
    }),
    [handlePlay, copyText, ayahText, ayahUrl, surahLabel, t],
  );

  // Previous/next ayah inside the tafsir dialog follows the ayahs shown on this page; null at its ends.
  const tafsirIndex = tafsirTarget ? indexByKey.get(`${tafsirTarget.surah}:${tafsirTarget.ayah}`) : undefined;
  const tafsirStep = (delta: number) => {
    const item = tafsirIndex === undefined ? undefined : queue[tafsirIndex + delta];
    return item ? () => setTafsirTarget({ surah: item.surah, ayah: item.ayah }) : null;
  };

  const isPlayingNow = status === "playing" || status === "loading";
  const listen = () => {
    if (status === "idle") {
      const start = selected ? indexByKey.get(`${selected.surah}:${selected.ayah}`) : undefined;
      player.play(start ?? 0);
    } else if (status === "paused" || status === "error") player.resume();
    else player.pause();
  };

  const surahMeta = mode === "surah" ? getSurah(sections[0].surah) : undefined;
  const titleSurah = surahMeta ?? getSurah(sections[0].surah);
  const pageNo = mode === "page" ? (page ?? 1) : pageOf(sections[0].surah, sections[0].ayahs[0].n);
  const selectedData = selected ? ayahByKey.get(`${selected.surah}:${selected.ayah}`) : undefined;
  const dockOpen = audioActive || (view === "flow" && selected !== null);

  return (
    <div className={cn("min-h-screen bg-background", dockOpen ? "pb-60" : "pb-12")}>
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-b from-primary-subtle to-background py-8 sm:py-10">
        <Container>
          <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/quran" className="text-primary hover:underline">
              {t("breadcrumb")}
            </Link>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-ink sm:text-4xl">
                {mode === "page"
                  ? t("pageOf", { page: pageNo, total: TOTAL_PAGES })
                  : t("surahName", { name: isEn ? `${titleSurah?.tr}` : `${titleSurah?.ar}` })}
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                {mode === "surah" && titleSurah ? (
                  <>
                    {isEn && hasDistinctEnglishName(titleSurah) ? `${titleSurah.en} · ` : ""}
                    {t(titleSurah.type)} · {t("ayahsCount", { count: titleSurah.ayahs })} · {t("juzLabel", { n: juz })} ·{" "}
                    <Link href={`/quran/page/${pageNo}`} className="text-primary hover:underline">
                      {t("openInMushaf", { page: pageNo })}
                    </Link>
                  </>
                ) : (
                  <>
                    {t("juzLabel", { n: juz })} ·{" "}
                    {sections.map((s, i) => (
                      <span key={s.surah}>
                        {i > 0 && "، "}
                        <Link href={`/quran/${s.surah}`} className="text-primary hover:underline">
                          {t("surahName", { name: surahLabel(s.surah) })}
                        </Link>
                      </span>
                    ))}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={listen}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlayingNow ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Headphones className="h-4 w-4" />
                )}
                {isPlayingNow ? t("pause") : t("listen")}
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                aria-expanded={settingsOpen}
                aria-controls="quran-settings"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-ink transition-colors hover:border-primary/40",
                  settingsOpen && "border-primary text-primary",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t("settings")}
              </button>
            </div>
          </div>

          {settingsOpen && (
            <div id="quran-settings" className="mt-5 grid gap-5 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{t("fontSize")}</span>
                <div className="flex items-center gap-2">
                  <IconButton
                    label={t("decrease")}
                    onClick={() => updateSettings({ fontSize: settings.fontSize - 1 })}
                    disabled={settings.fontSize <= 0}
                    className="border-border"
                  >
                    <Minus className="h-4 w-4" />
                  </IconButton>
                  <span className="w-8 text-center text-sm tabular-nums text-ink-muted" aria-live="polite">
                    {settings.fontSize + 1}/{FONT_REM.length}
                  </span>
                  <IconButton
                    label={t("increase")}
                    onClick={() => updateSettings({ fontSize: settings.fontSize + 1 })}
                    disabled={settings.fontSize >= FONT_REM.length - 1}
                    className="border-border"
                  >
                    <Plus className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{t("translation")}</span>
                <Switch checked={showTranslation} onChange={(v) => updateSettings({ translation: v })} label={t("translation")} />
              </div>

              {mode === "surah" && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink">{t("view")}</span>
                  <Segmented
                    label={t("view")}
                    value={settings.view}
                    onChange={(v) => updateSettings({ view: v })}
                    options={[
                      { value: "cards", label: t("viewCards") },
                      { value: "flow", label: t("viewFlow") },
                    ]}
                  />
                </div>
              )}

              <label className="flex items-center justify-between gap-3 text-sm text-ink">
                <span>{t("reciter")}</span>
                <select
                  value={settings.reciter}
                  onChange={(e) => updateSettings({ reciter: e.target.value })}
                  className="max-w-[60%] rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {isEn ? r.en : r.ar}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <span className="text-sm text-ink">{t("autoNext")}</span>
                <Switch checked={settings.autoNextPage} onChange={(v) => updateSettings({ autoNextPage: v })} label={t("autoNext")} />
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Text */}
      <Container className="max-w-4xl py-8">
        {mode === "page" && <PageNav prev={prev} next={next} page={pageNo} />}
        {view === "flow" && <p className="mb-4 text-center text-sm text-ink-muted">{t("tapAyah")}</p>}

        <div className="space-y-6">
          {sections.map((section) => {
            const meta = getSurah(section.surah);
            return (
              <section key={`${section.surah}-${section.ayahs[0].n}`} className="space-y-4">
                {section.startsSurah && meta && (
                  <header className="rounded-2xl border border-border bg-surface px-4 py-6 text-center">
                    <h2 lang="ar" dir="rtl" className="font-display text-3xl text-primary-deep sm:text-4xl">
                      سورة {meta.ar}
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      {isEn ? (hasDistinctEnglishName(meta) ? `${meta.tr} · ${meta.en} · ` : `${meta.tr} · `) : ""}
                      {t(meta.type)} · {t("ayahsCount", { count: meta.ayahs })}
                    </p>
                    {showsBismillah(section.surah) && (
                      <p lang="ar" dir="rtl" className="font-quran mt-5 text-ink" style={{ fontSize: `${fontRem + 0.2}rem` }}>
                        {BISMILLAH}
                      </p>
                    )}
                  </header>
                )}

                {view === "cards" ? (
                  <div className="space-y-4">
                    {section.ayahs.map((a) => {
                      const isCurrent = curSurah === section.surah && curAyah === a.n;
                      return (
                        <AyahCard
                          key={a.n}
                          id={domId(section.surah, a.n)}
                          surah={section.surah}
                          n={a.n}
                          text={a.text}
                          en={a.en}
                          showTranslation={showTranslation}
                          fontRem={fontRem}
                          isCurrent={isCurrent}
                          playing={isCurrent && isPlayingNow}
                          loading={isCurrent && status === "loading"}
                          bookmarked={isBookmarked(bookmarks, section.surah, a.n)}
                          handlers={handlers}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div
                    lang="ar"
                    dir="rtl"
                    className="font-quran rounded-2xl border border-border bg-surface px-4 py-6 text-justify text-ink sm:px-8 sm:py-8"
                    style={{ fontSize: `${fontRem}rem`, lineHeight: 2.4 }}
                  >
                    {section.ayahs.map((a) => {
                      const isCurrent = curSurah === section.surah && curAyah === a.n;
                      const isSelected = selected?.surah === section.surah && selected.ayah === a.n;
                      return (
                        <span
                          key={a.n}
                          id={domId(section.surah, a.n)}
                          data-ayah={a.n}
                          data-surah={section.surah}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          onClick={() => setSelected(isSelected ? null : { surah: section.surah, ayah: a.n })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected(isSelected ? null : { surah: section.surah, ayah: a.n });
                            }
                          }}
                          className={cn(
                            "scroll-mt-28 cursor-pointer rounded px-0.5 transition-colors hover:bg-primary-subtle target:bg-primary-subtle",
                            isCurrent && "bg-primary-subtle",
                            isSelected && "bg-primary/20",
                          )}
                        >
                          {a.text}
                          <AyahMarker n={a.n} />{" "}
                        </span>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <PageNav prev={prev} next={next} page={mode === "page" ? pageNo : undefined} mode={mode} bottom />
      </Container>

      {/* Bottom dock: selected-ayah panel (flow view) + audio bar */}
      {dockOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 px-3 pb-3">
          {view === "flow" && selected && selectedData && (
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-surface p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-primary">
                  {t("surahName", { name: surahLabel(selected.surah) })} — {t("ayahRef", { ayah: selected.ayah })}
                </p>
                <IconButton label={t("closePanel")} onClick={() => setSelected(null)} className="-m-1 h-8 w-8">
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
              <p lang="en" dir="ltr" className="mt-2 max-h-28 overflow-y-auto text-start text-sm leading-relaxed text-ink-muted">
                {selectedData.en}
              </p>
              <div className="mt-2 flex justify-end">
                <AyahActions
                  surah={selected.surah}
                  ayah={selected.ayah}
                  playing={curSurah === selected.surah && curAyah === selected.ayah && isPlayingNow}
                  loading={curSurah === selected.surah && curAyah === selected.ayah && status === "loading"}
                  bookmarked={isBookmarked(bookmarks, selected.surah, selected.ayah)}
                  handlers={handlers}
                  labelledTafsir
                />
              </div>
            </div>
          )}

          {audioActive && (
            <div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-lg">
              <div className="min-w-0 flex-1" aria-live="polite">
                {status === "error" ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{t("audioError")}</p>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium text-ink">
                      {t("surahName", { name: surahLabel(curSurah) })} — {t("ayahRef", { ayah: curAyah })}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {status === "loading" ? t("loadingAudio") : t("nowPlaying")} · {isEn ? getReciter(settings.reciter).en : getReciter(settings.reciter).ar}
                    </p>
                  </>
                )}
              </div>
              <IconButton label={t("prevAyah")} onClick={() => player.prev()} className="rtl:rotate-180">
                <SkipBack className="h-5 w-5" />
              </IconButton>
              {status === "error" ? (
                <button
                  type="button"
                  onClick={() => player.resume()}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {t("retry")}
                </button>
              ) : (
                <IconButton
                  label={isPlayingNow ? t("pause") : t("play")}
                  onClick={() => (isPlayingNow ? player.pause() : player.resume())}
                  className="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : isPlayingNow ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </IconButton>
              )}
              <IconButton label={t("nextAyah")} onClick={() => player.next()} className="rtl:rotate-180">
                <SkipForward className="h-5 w-5" />
              </IconButton>
              <IconButton label={t("stop")} onClick={() => player.stop()}>
                <Square className="h-5 w-5" />
              </IconButton>
            </div>
          )}
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {notice}
      </div>
      {notice && (
        <div
          aria-hidden="true"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-background shadow-lg"
        >
          {notice}
        </div>
      )}

      <TafsirDialog
        target={tafsirTarget}
        locale={locale}
        ayahText={tafsirTarget ? (ayahByKey.get(`${tafsirTarget.surah}:${tafsirTarget.ayah}`)?.text ?? "") : ""}
        onClose={() => setTafsirTarget(null)}
        onPrev={tafsirStep(-1)}
        onNext={tafsirStep(1)}
      />
    </div>
  );
}

/** prev / next links (+ page jump in the mushaf view). Chevrons flip in RTL so they always point the right way. */
function PageNav({
  prev,
  next,
  page,
  mode = "page",
  bottom = false,
}: {
  prev: string | null;
  next: string | null;
  page?: number;
  mode?: "surah" | "page";
  bottom?: boolean;
}) {
  const t = useTranslations("quran");
  const router = useRouter();
  const [value, setValue] = useState("");
  const link =
    "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-primary/40 hover:text-primary";

  const jump = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (isValidPage(n)) {
      router.push(`/quran/page/${n}`);
      setValue("");
    }
  };

  return (
    <nav className={cn("flex flex-wrap items-center justify-between gap-3", bottom ? "mt-8" : "mb-6")}>
      {prev ? (
        <Link href={prev} className={link} rel="prev">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t(mode === "page" ? "prevPage" : "prevSurah")}
        </Link>
      ) : (
        <span />
      )}
      {mode === "page" && page !== undefined && !bottom && (
        <form onSubmit={jump} className="flex items-center gap-2">
          <label className="sr-only" htmlFor="quran-page-jump">
            {t("pageInput")}
          </label>
          <input
            id="quran-page-jump"
            type="number"
            inputMode="numeric"
            min={1}
            max={TOTAL_PAGES}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`${page}`}
            className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm text-ink"
          />
          <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
            {t("go")}
          </button>
        </form>
      )}
      {next ? (
        <Link href={next} className={link} rel="next">
          {t(mode === "page" ? "nextPage" : "nextSurah")}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

