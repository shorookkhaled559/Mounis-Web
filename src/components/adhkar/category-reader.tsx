"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, Copy, Minus, Plus, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { FONT_MAX, FONT_MIN, completedCount, getDone } from "@/lib/adhkar/progress";
import { resetCategory, resetItem, setFontSize, tapItem, useAdhkarState } from "@/lib/adhkar/progress-store";
import type { AdhkarCategory } from "@/lib/adhkar/types";
import { toArabicIndic } from "@/lib/quran";
import { IconButton } from "@/components/quran/quran-ui";
import { NoteBox } from "./note-box";

const FONT_REM = [1.4, 1.65, 1.9, 2.25, 2.7];

interface Props {
  locale: string;
  category: AdhkarCategory;
  groupTitle: string;
  prev: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
}

export function CategoryReader({ locale, category, groupTitle, prev, next }: Props) {
  const t = useTranslations("adhkar");
  const isEn = locale === "en";
  const num = (n: number) => (isEn ? String(n) : toArabicIndic(n));
  const state = useAdhkarState();
  const fontRem = FONT_REM[state.fontSize] ?? FONT_REM[2];
  const [notice, setNotice] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const targets = category.items.map((i) => ({ id: i.id, target: i.count ?? 1 }));
  const done = completedCount(state, category.id, targets);
  const total = category.items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const title = isEn ? category.en : category.ar;

  const flash = useCallback((m: string) => {
    setNotice(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNotice(""), 2000);
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flash(t("copied"));
      } catch {
        flash(t("copyFailed"));
      }
    },
    [flash, t],
  );

  const onTap = (itemId: number, target: number) => {
    const before = getDone(state, category.id, itemId);
    tapItem(category.id, itemId, target);
    if (before < target) {
      try {
        navigator.vibrate?.(before + 1 === target ? [20, 40, 20] : 10);
      } catch {
        /* vibration unsupported */
      }
    }
  };

  const navLink =
    "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-primary/40 hover:text-primary";

  return (
    <div className="min-h-screen bg-background pb-16">
      <section className="border-b border-border bg-gradient-to-b from-primary-subtle to-background py-8 sm:py-10">
        <Container className="max-w-4xl">
          <nav aria-label="breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <Link href="/thought" className="text-primary hover:underline">
              {t("breadcrumb")}
            </Link>
            <span aria-hidden="true">•</span>
            <span>{groupTitle}</span>
          </nav>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("itemsCount", { count: num(total) })}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[14rem] flex-1">
              <div className="mb-1.5 flex items-center justify-between text-sm text-ink-muted">
                <span aria-live="polite">{t("progress", { done: num(done), total: num(total) })}</span>
                <span>{num(pct)}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
                aria-label={t("progress", { done: num(done), total: num(total) })}
                className="h-2 overflow-hidden rounded-full bg-border"
              >
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-muted">{t("fontSize")}</span>
              <IconButton
                label={t("decrease")}
                onClick={() => setFontSize(state.fontSize - 1)}
                disabled={state.fontSize <= FONT_MIN}
                className="border-border"
              >
                <Minus className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={t("increase")}
                onClick={() => setFontSize(state.fontSize + 1)}
                disabled={state.fontSize >= FONT_MAX}
                className="border-border"
              >
                <Plus className="h-4 w-4" />
              </IconButton>
              <button
                type="button"
                onClick={() => resetCategory(category.id)}
                disabled={done === 0 && !Object.keys(state.done[String(category.id)] ?? {}).length}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-primary/40 disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                {t("resetCategory")}
              </button>
            </div>
          </div>
          {isEn && <p className="mt-3 text-xs text-ink-muted">{t("arabicOnly")}</p>}
        </Container>
      </section>

      <Container className="max-w-4xl py-8">
        <ol className="space-y-5">
          {category.items.map((item, idx) => {
            const target = item.count ?? 1;
            const count = getDone(state, category.id, item.id);
            const finished = count >= target;
            return (
              <li
                key={item.id}
                id={`item-${item.id}`}
                className={cn(
                  "scroll-mt-28 rounded-2xl border bg-surface p-4 transition-colors target:border-primary sm:p-5",
                  finished ? "border-primary/50" : "border-border",
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary-subtle px-2 text-sm font-medium text-primary">
                    {num(idx + 1)}
                  </span>
                  <span className="text-xs text-ink-muted">{target > 1 ? t("repeatTimes", { count: num(target) }) : t("repeatOnce")}</span>
                  <IconButton label={t("copy")} onClick={() => void copy(item.text)}>
                    <Copy className="h-4 w-4" />
                  </IconButton>
                </div>

                {item.title && <p className="mb-2 text-sm font-semibold text-primary-deep">{item.title}</p>}
                <p
                  lang="ar"
                  dir="rtl"
                  className="font-quran whitespace-pre-line text-ink"
                  style={{ fontSize: `${fontRem}rem`, lineHeight: 2.2 }}
                >
                  {item.text}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onTap(item.id, target)}
                    disabled={finished}
                    aria-label={`${finished ? t("doneLabel") : target > 1 ? t("tapToCount") : t("markDone")} — ${t("counterLabel", { done: num(count), count: num(target) })}`}
                    className={cn(
                      "inline-flex min-h-12 min-w-36 items-center justify-center gap-2 rounded-full px-6 py-2 text-base font-medium transition-colors",
                      finished ? "bg-primary-subtle text-primary" : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]",
                    )}
                  >
                    {finished ? (
                      <>
                        <Check className="h-5 w-5" />
                        {t("doneLabel")}
                      </>
                    ) : target > 1 ? (
                      <span className="tabular-nums">
                        {num(count)} / {num(target)}
                      </span>
                    ) : (
                      t("markDone")
                    )}
                  </button>
                  {count > 0 && (
                    <button
                      type="button"
                      onClick={() => resetItem(category.id, item.id)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-ink-muted transition-colors hover:text-primary"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("resetItem")}
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <NoteBox note={item.note} locale={locale} />
                  {item.source && (
                    <details className="rounded-lg text-sm text-ink-muted">
                      <summary className="cursor-pointer select-none py-1 hover:text-primary">{t("source")}</summary>
                      <p lang="ar" dir="rtl" className="whitespace-pre-line pt-1 text-start leading-relaxed">
                        {item.source}
                      </p>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {done === total && total > 0 && (
          <p className="mt-6 rounded-2xl border border-primary/40 bg-primary-subtle p-4 text-center font-medium text-primary-deep">
            {t("allDone")}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-ink-muted">{t("noteHelp")}</p>
        <p className="mt-2 text-center text-xs text-ink-muted">{t("dailyReset")}</p>

        <nav className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {prev ? (
            <Link href={`/thought/${prev.id}`} className={navLink} rel="prev">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              <span className="max-w-[12rem] truncate">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/thought/${next.id}`} className={navLink} rel="next">
              <span className="max-w-[12rem] truncate">{next.title}</span>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </Container>

      <div role="status" aria-live="polite" className="sr-only">
        {notice}
      </div>
      {notice && (
        <div aria-hidden="true" className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-background shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}
