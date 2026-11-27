"use client";

import { useEffect, useId, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { HadithSearchResponse } from "@/app/api/hadith/search/route";
import type { HadithSearchHit } from "@/lib/hadith-search";
import { arabicReference, excerpt, hadithPath } from "@/lib/hadith-view";

export interface SearchScopeOption {
  id: string;
  name_ar: string;
  name_en: string;
}

interface HadithSearchProps {
  locale: string;
  /** Collections the user may pick from (home of hadiths). Omit when `fixedCollection` is set. */
  options?: SearchScopeOption[];
  /** Search only this collection and hide the picker (collection page). */
  fixedCollection?: string;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; results: HadithSearchHit[]; truncated: boolean };

const SAHIHAYN = "sahihayn";
const DEBOUNCE_MS = 350;

export function HadithSearch({ locale, options = [], fixedCollection }: HadithSearchProps) {
  const t = useTranslations("hadithSearch");
  const isArabic = locale === "ar";
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState(SAHIHAYN);
  const [state, setState] = useState<State>({ status: "idle" });

  const collection = fixedCollection ?? (scope === SAHIHAYN ? null : scope);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ status: "loading" });
      const params = new URLSearchParams({ q: trimmed });
      if (collection) params.set("collection", collection);
      fetch(`/api/hadith/search?${params}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
          return res.json() as Promise<HadithSearchResponse>;
        })
        .then((data) => setState({ status: "done", results: data.results, truncated: data.truncated }))
        .catch((error: unknown) => {
          if ((error as { name?: string }).name !== "AbortError") setState({ status: "error" });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, collection]);

  const showResults = trimmed.length > 0;

  return (
    <section aria-label={t("label")} className="mb-8 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink">
        {fixedCollection ? t("labelInCollection") : t("label")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id={inputId}
            type="search"
            inputMode="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!event.target.value.trim()) setState({ status: "idle" });
            }}
            placeholder={t("placeholder")}
            maxLength={100}
            autoComplete="off"
            className="w-full rounded-md border border-border bg-surface py-2.5 pe-3 ps-9 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
        {!fixedCollection && (
          <select
            aria-label={t("scope")}
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2.5 text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value={SAHIHAYN}>{t("scopeSahihayn")}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {isArabic ? option.name_ar : option.name_en}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-muted">{t("hint")}</p>

      {showResults && (
        <div className="mt-4" aria-live="polite">
          {state.status === "loading" && <p className="text-sm text-ink-muted">{t("loading")}</p>}
          {state.status === "error" && <p className="text-sm text-ink">{t("error")}</p>}
          {state.status === "done" && state.results.length === 0 && (
            <p className="text-sm text-ink-muted">{t("none")}</p>
          )}
          {state.status === "done" && state.results.length > 0 && (
            <>
              <p className="mb-2 text-sm text-ink-muted">
                {t("count", { count: state.results.length })}
                {state.truncated ? ` ${t("truncated")}` : ""}
              </p>
              <ul className="space-y-2">
                {state.results.map((hit) => (
                  <li key={`${hit.collectionId}:${hit.bookNumber}:${hit.hadithNumber}`}>
                    <Link
                      href={hadithPath(hit.collectionId, hit.bookNumber, hit.hadithNumber)}
                      className="block rounded-md border border-border p-3 transition-colors hover:border-primary"
                    >
                      <span className="text-xs text-ink-muted">
                        {isArabic ? arabicReference(hit.collectionName_ar, hit.hadithNumber) : hit.reference}
                        {" · "}
                        {isArabic ? hit.bookName_ar : hit.bookName_en}
                      </span>
                      <span lang={isArabic ? "ar" : "en"} className="mt-1 block text-ink">
                        {excerpt(isArabic ? hit.matn_ar : hit.matn_en, 180)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
