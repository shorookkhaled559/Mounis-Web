"use client";

import { useRef } from "react";
import { Calculator } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getZakatCopy } from "@/lib/zakat/copy";
import { ZakatAside } from "./aside";
import { Card } from "./ui";

/**
 * Shared frame for every calculator tab: the form card on the start side,
 * the live result + side card on the other. Result is `null` until there is something to show.
 */
export function PanelLayout({
  locale,
  icon: Icon,
  title,
  intro,
  results,
  children,
}: {
  locale: string;
  icon: LucideIcon;
  title: string;
  intro: string;
  results: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = getZakatCopy(locale);
  const resultsRef = useRef<HTMLDivElement>(null);

  // The result updates as you type; this button brings it into view (useful on phones,
  // where the result sits below the form) and moves focus to it for screen readers.
  function showResults() {
    const el = resultsRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    el.focus({ preventScroll: true });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
      <Card className="space-y-6">
        <header className="flex items-start gap-3">
          <Icon className="mt-1 size-7 shrink-0 text-primary-deep" aria-hidden />
          <div>
            <h2 className="font-display text-2xl text-ink">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{intro}</p>
          </div>
        </header>

        {children}

        <button
          type="button"
          onClick={showResults}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-deep to-primary px-6 py-3.5 font-medium text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99]"
        >
          <Calculator className="size-5" aria-hidden />
          {c.calculate}
        </button>
      </Card>

      <aside className="space-y-5 lg:sticky lg:top-24">
        <div
          ref={resultsRef}
          tabIndex={-1}
          aria-live="polite"
          className="scroll-mt-24 rounded-[1.75rem] outline-none"
        >
          <Card className="sm:p-7">
            <h3 className="font-display text-xl text-ink">{c.results}</h3>
            <div className="mt-4 space-y-3">
              {results ?? <p className="text-sm text-ink-muted">{c.resultsEmpty}</p>}
            </div>
          </Card>
        </div>
        <ZakatAside locale={locale} />
        <p className="px-2 text-xs leading-relaxed text-ink-muted">{c.disclaimer}</p>
      </aside>
    </div>
  );
}
