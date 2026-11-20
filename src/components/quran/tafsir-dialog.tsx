"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { getSurah } from "@/lib/quran";
import {
  TAFSIR_EDITIONS,
  defaultEditionForLocale,
  editionsForLocale,
  getTafsirEdition,
  isTafsirEdition,
} from "@/lib/quran/tafsir";
import { IconButton } from "./quran-ui";
import { useTafsir } from "./use-tafsir";

const EDITION_KEY = "mounis:quran:tafsir";

/** The book the reader chose last time, or the default for the UI language. Storage may be blocked. */
function loadEdition(locale: string): string {
  try {
    const saved = window.localStorage.getItem(EDITION_KEY);
    if (isTafsirEdition(saved)) return saved;
  } catch {
    /* private mode / blocked storage: just use the default */
  }
  return defaultEditionForLocale(locale);
}

function saveEdition(id: string) {
  try {
    window.localStorage.setItem(EDITION_KEY, id);
  } catch {
    /* ignore */
  }
}

interface TafsirDialogProps {
  /** The ayah whose tafsir is shown; null = closed. */
  target: { surah: number; ayah: number } | null;
  locale: string;
  /** Uthmani text of the target ayah. */
  ayahText: string;
  onClose: () => void;
  /** Move to the neighbouring ayah on the page, or null at the ends. */
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

/** Bottom sheet (phones) / centred dialog (larger screens) with the tafsir of one ayah. */
export function TafsirDialog({ target, locale, ayahText, onClose, onPrev, onNext }: TafsirDialogProps) {
  return (
    <Dialog.Root open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        >
          {target && (
            <TafsirBody
              surah={target.surah}
              ayah={target.ayah}
              locale={locale}
              ayahText={ayahText}
              onClose={onClose}
              onPrev={onPrev}
              onNext={onNext}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TafsirBody({
  surah,
  ayah,
  locale,
  ayahText,
  onClose,
  onPrev,
  onNext,
}: {
  surah: number;
  ayah: number;
  locale: string;
  ayahText: string;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const t = useTranslations("quran");
  const isEn = locale === "en";
  // Mounted only while the dialog is open (after a click), so reading localStorage here cannot cause a hydration mismatch.
  const [editionId, setEditionId] = useState(() => loadEdition(locale));
  const edition = getTafsirEdition(editionId) ?? TAFSIR_EDITIONS[0];
  const state = useTafsir(edition.id, surah, ayah);

  const meta = getSurah(surah);
  const surahLabel = meta ? (isEn ? meta.tr : meta.ar) : String(surah);

  const choose = (id: string) => {
    if (!isTafsirEdition(id)) return;
    setEditionId(id);
    saveEdition(id);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <Dialog.Title className="text-sm font-medium text-primary">
          {t("tafsir")} · {t("surahName", { name: surahLabel })} — {t("ayahRef", { ayah })}
        </Dialog.Title>
        <IconButton label={t("closePanel")} onClick={onClose} className="-m-1 h-8 w-8">
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="space-y-3 border-b border-border px-4 py-3">
        <p
          lang="ar"
          dir="rtl"
          className="font-quran max-h-32 overflow-y-auto rounded-xl bg-primary-subtle px-4 py-2 text-ink"
          style={{ fontSize: "1.5rem", lineHeight: 2.1 }}
        >
          {ayahText}
        </p>
        <div className="flex items-center gap-2">
          <IconButton label={t("prevAyah")} onClick={() => onPrev?.()} disabled={!onPrev} className="rtl:rotate-180">
            <ChevronLeft className="h-5 w-5" />
          </IconButton>
          <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
            <span className="shrink-0 text-ink-muted">{t("tafsirBook")}</span>
            <select
              value={edition.id}
              onChange={(e) => choose(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
            >
              {editionsForLocale(locale).map((e) => (
                <option key={e.id} value={e.id}>
                  {isEn ? e.en : e.ar}
                </option>
              ))}
            </select>
          </label>
          <IconButton label={t("nextAyah")} onClick={() => onNext?.()} disabled={!onNext} className="rtl:rotate-180">
            <ChevronRight className="h-5 w-5" />
          </IconButton>
        </div>
      </div>

      {/* Keyed so each ayah/book opens scrolled to the top. */}
      <div key={`${edition.id}:${surah}:${ayah}`} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {state.status === "loading" && (
          <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("tafsirLoading")}
          </p>
        )}
        {state.status === "error" && (
          <div role="alert" className="py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{t("tafsirError")}</p>
            <button
              type="button"
              onClick={state.retry}
              className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("retry")}
            </button>
          </div>
        )}
        {state.status === "empty" && <p className="py-8 text-center text-sm text-ink-muted">{t("tafsirEmpty")}</p>}
        {state.status === "ready" && (
          <>
            <p
              lang={edition.lang}
              dir={edition.lang === "ar" ? "rtl" : "ltr"}
              className="whitespace-pre-line text-start text-base leading-loose text-ink sm:text-lg"
            >
              {state.text}
            </p>
            <p className="mt-4 text-xs text-ink-muted">{t("tafsirGroupNote")}</p>
          </>
        )}
      </div>

      <p className="border-t border-border px-4 py-3 text-xs text-ink-muted">
        {isEn ? edition.en : edition.ar} · {t("tafsirDisclaimer")}
      </p>
    </>
  );
}
