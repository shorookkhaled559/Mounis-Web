"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, BookmarkCheck, BookOpen, Copy, Loader2, Pause, Play, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./quran-ui";

export interface AyahHandlers {
  onPlay: (surah: number, ayah: number) => void;
  onTafsir: (surah: number, ayah: number) => void;
  onBookmark: (surah: number, ayah: number) => void;
  onCopy: (surah: number, ayah: number) => void;
  onShare: (surah: number, ayah: number) => void;
}

/** play/tafsir/bookmark/copy/share row, shared by the ayah cards and the page-reader panel. */
export function AyahActions({
  surah,
  ayah,
  playing,
  loading,
  bookmarked,
  handlers,
  labelledTafsir = false,
}: {
  surah: number;
  ayah: number;
  playing: boolean;
  loading: boolean;
  bookmarked: boolean;
  handlers: AyahHandlers;
  /** Show the tafsir action as a text button instead of an icon (the page-reader panel, where it is the main action). */
  labelledTafsir?: boolean;
}) {
  const t = useTranslations("quran");
  return (
    <div className="flex items-center">
      <IconButton label={playing ? t("pause") : t("play")} onClick={() => handlers.onPlay(surah, ayah)} pressed={playing}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </IconButton>
      {labelledTafsir ? (
        <button
          type="button"
          onClick={() => handlers.onTafsir(surah, ayah)}
          className="mx-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          <BookOpen className="h-4 w-4" />
          {t("tafsir")}
        </button>
      ) : (
        <IconButton label={t("tafsir")} onClick={() => handlers.onTafsir(surah, ayah)}>
          <BookOpen className="h-5 w-5" />
        </IconButton>
      )}
      <IconButton
        label={bookmarked ? t("removeBookmark") : t("addBookmark")}
        onClick={() => handlers.onBookmark(surah, ayah)}
        pressed={bookmarked}
      >
        {bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
      </IconButton>
      <IconButton label={t("copy")} onClick={() => handlers.onCopy(surah, ayah)}>
        <Copy className="h-5 w-5" />
      </IconButton>
      <IconButton label={t("share")} onClick={() => handlers.onShare(surah, ayah)}>
        <Share2 className="h-5 w-5" />
      </IconButton>
    </div>
  );
}

interface AyahCardProps {
  id: string;
  surah: number;
  n: number;
  text: string;
  en: string;
  showTranslation: boolean;
  fontRem: number;
  isCurrent: boolean;
  playing: boolean;
  loading: boolean;
  bookmarked: boolean;
  handlers: AyahHandlers;
}

/** One verse in "ayah by ayah" mode. Memoised: a 286-ayah surah must not re-render on every player tick. */
export const AyahCard = memo(function AyahCard({
  id,
  surah,
  n,
  text,
  en,
  showTranslation,
  fontRem,
  isCurrent,
  playing,
  loading,
  bookmarked,
  handlers,
}: AyahCardProps) {
  return (
    <article
      id={id}
      data-ayah={n}
      data-surah={surah}
      className={cn(
        "scroll-mt-28 rounded-2xl border border-border bg-surface p-4 transition-colors target:border-primary target:bg-primary-subtle sm:p-5",
        isCurrent && "border-primary bg-primary-subtle",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary-subtle px-2 text-sm font-medium text-primary">
          {surah}:{n}
        </span>
        <AyahActions surah={surah} ayah={n} playing={playing} loading={loading} bookmarked={bookmarked} handlers={handlers} />
      </div>
      {/* Clicking the ayah opens its tafsir, unless the reader is selecting text to copy it. The tafsir button covers keyboard users. */}
      <p
        lang="ar"
        dir="rtl"
        className="font-quran cursor-pointer text-ink"
        style={{ fontSize: `${fontRem}rem`, lineHeight: 2.1 }}
        onClick={() => {
          if (window.getSelection()?.toString()) return;
          handlers.onTafsir(surah, n);
        }}
      >
        {text}
      </p>
      {showTranslation && (
        <p lang="en" dir="ltr" className="mt-3 border-t border-border pt-3 text-start text-sm leading-relaxed text-ink-muted sm:text-base">
          {en}
        </p>
      )}
    </article>
  );
});
