import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/page-metadata";
import { getExtras } from "@/lib/hadith-extras";
import { findHadith, getRelatedHadiths } from "@/lib/hadith-page";
import {
  arabicReference,
  excerpt,
  hadithBodyAr,
  hadithPath,
  narratorArabic,
  normalizeGrade,
  originalSourceAr,
  parseInBookReference,
} from "@/lib/hadith-view";
import { HadithActions } from "@/components/sections/hadith-actions";
import { HadithGradeBadge } from "@/components/sections/hadith-grade";

// Tens of thousands of hadiths: pages are rendered on the first visit and then cached.
export function generateStaticParams() {
  return [];
}

type Params = { locale: string; collection: string; book: string; number: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, collection, book, number } = await params;
  const loc = await findHadith(collection, book, number);
  if (!loc) return { title: "Not Found" };

  const isArabic = locale === "ar";
  const name = isArabic ? loc.collection.collection.name_ar : loc.collection.collection.name_en;
  const body = isArabic ? hadithBodyAr(loc.hadith) : loc.hadith.matn_en;
  return {
    title: `${name} ${loc.hadith.hadith_number}`,
    description: excerpt(body, 160),
    alternates: buildAlternates(locale, hadithPath(collection, loc.book.book_number, number)),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-3 text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{children}</dd>
    </div>
  );
}

export default async function HadithPage({ params }: { params: Promise<Params> }) {
  const { locale, collection: collectionId, book: bookParam, number } = await params;
  setRequestLocale(locale);

  const loc = await findHadith(collectionId, bookParam, number);
  if (!loc) notFound();

  const t = await getTranslations({ locale, namespace: "hadithPage" });
  const isArabic = locale === "ar";
  const { collection, book, hadith, index } = loc;
  const meta = collection.collection;

  const collectionName = isArabic ? meta.name_ar : meta.name_en;
  const bookName = isArabic ? book.name_ar : book.name_en;
  const reference = isArabic ? arabicReference(meta.name_ar, hadith.hadith_number) : hadith.reference;
  const body = isArabic ? hadithBodyAr(hadith) : hadith.matn_en || hadith.text_en;
  const inBook = parseInBookReference(hadith.in_book_reference);
  const grade = normalizeGrade(hadith.grade_en, hadith.source_grade);
  const narrator = isArabic ? narratorArabic(hadith.narrator) : hadith.narrator || null;
  const original = originalSourceAr(hadith.source_reference);
  const isSahihayn = meta.id === "bukhari" || meta.id === "muslim";

  const [extras, related] = await Promise.all([
    getExtras(meta.id),
    getRelatedHadiths(loc),
  ]);
  const extra = extras[`${book.book_number}:${hadith.hadith_number}`];

  const prev = index > 0 ? book.hadiths[index - 1] : null;
  const next = index < book.hadiths.length - 1 ? book.hadiths[index + 1] : null;
  const Prev = isArabic ? ChevronRight : ChevronLeft;
  const Next = isArabic ? ChevronLeft : ChevronRight;

  const shareText = `${body}\n\n${reference}${grade?.labelAr && isArabic ? ` - ${grade.labelAr}` : ""}`;
  const numberFormat = (n: string | number) => (isArabic ? Number(n).toLocaleString("ar-EG", { useGrouping: false }) : String(n));
  const showNumber = (n: string) => (/^\d+$/.test(n) ? numberFormat(n) : n);

  return (
    <Container className="py-8">
      <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <Link href="/hadith" className="hover:text-primary">{t("breadcrumbRoot")}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/hadith/${meta.id}`} className="hover:text-primary">{collectionName}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/hadith/${meta.id}/${book.book_number}`} className="hover:text-primary">{bookName}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{reference}</span>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{reference}</h1>
          {grade && <HadithGradeBadge grade={grade} isArabic={isArabic} />}
        </header>

        <Section title={t("text")}>
          <blockquote
            lang={isArabic ? "ar" : "en"}
            className={isArabic ? "text-xl leading-loose text-ink sm:text-2xl sm:leading-loose" : "text-lg leading-relaxed text-ink"}
          >
            {body}
          </blockquote>

          {isArabic && hadith.isnad_ar && (
            <details className="mt-4 rounded-md border border-border p-3 text-sm">
              <summary className="cursor-pointer font-medium text-primary">{t("chain")}</summary>
              <p lang="ar" className="mt-2 leading-loose text-ink-muted">{hadith.isnad_ar}</p>
            </details>
          )}
          {!isArabic && hadith.isnad_en && (
            <details className="mt-4 rounded-md border border-border p-3 text-sm">
              <summary className="cursor-pointer font-medium text-primary">{t("chain")}</summary>
              <p lang="en" className="mt-2 text-ink-muted">{hadith.isnad_en}</p>
            </details>
          )}
          {isArabic && hadith.closing_ar && (
            <div className="mt-4">
              <p className="text-xs text-ink-muted">{t("authorComment")}</p>
              <p lang="ar" className="mt-1 leading-loose text-ink">{hadith.closing_ar.replace(/^[\s.]+/, "")}</p>
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <HadithActions text={shareText} title={reference} />
          </div>
        </Section>

        <Section title={t("documentation")}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Fact label={t("source")}>{collectionName}</Fact>
            <Fact label={t("number")}>{showNumber(hadith.hadith_number)}</Fact>
            <Fact label={t("book")}>{bookName}</Fact>
            {inBook && <Fact label={t("numberInBook")}>{numberFormat(inBook.hadith)}</Fact>}
            <Fact label={t("narrator")}>
              {narrator ?? <span className="text-sm font-normal text-ink-muted">{t("narratorMissing")}</span>}
            </Fact>
            {original && isArabic && <Fact label={t("originalSource")}>{original}</Fact>}
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-1 text-xs text-ink-muted">{t("grade")}</p>
            {grade ? (
              <div className="space-y-1 text-sm">
                {isArabic && grade.labelAr ? (
                  <p className="text-ink">
                    <span className="font-medium">{grade.labelAr}</span>
                    {grade.graderAr && <span className="text-ink-muted"> — {t("gradeBy", { grader: grade.graderAr })}</span>}
                  </p>
                ) : (
                  <p className="text-ink">{t("gradeRaw", { raw: grade.raw })}</p>
                )}
                {isArabic && !grade.labelAr && <p className="text-ink-muted">{t("gradeRaw", { raw: grade.raw })}</p>}
                {!grade.graderAr && (
                  <p className="text-ink-muted">{t("gradeNoGrader")}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                {isSahihayn ? t("gradeSahihayn", { collection: collectionName }) : t("gradeNone")}
              </p>
            )}
          </div>

          <p className="mt-5 border-t border-border pt-4 text-sm text-ink-muted">
            {t("documentationText", { collection: collectionName })}{" "}
            <a href={hadith.url_source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {t("verify")}
            </a>
          </p>
        </Section>

        <Section title={t("sharh")}>
          {extra?.sharh ? (
            <>
              <p className="whitespace-pre-line leading-loose text-ink">{extra.sharh.text}</p>
              <p className="mt-3 text-sm text-ink-muted">
                {extra.sharh.url ? (
                  <a href={extra.sharh.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {t("fromSource", { source: extra.sharh.source })}
                  </a>
                ) : (
                  t("fromSource", { source: extra.sharh.source })
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">{t("sharhMissing")}</p>
          )}
        </Section>

        <Section title={t("words")}>
          {extra?.words ? (
            <>
              <dl className="space-y-2">
                {extra.words.items.map((item) => (
                  <div key={item.word} className="flex flex-wrap gap-x-2">
                    <dt className="font-bold text-ink">{item.word}:</dt>
                    <dd className="text-ink">{item.meaning}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-ink-muted">{t("fromSource", { source: extra.words.source })}</p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">{t("wordsMissing")}</p>
          )}
        </Section>

        <Section title={t("related")}>
          {related.length > 0 ? (
            <>
              <ul className="space-y-3">
                {related.map((r) => (
                  <li key={`${r.bookNumber}:${r.hadith.hadith_number}`}>
                    <Link
                      href={hadithPath(meta.id, r.bookNumber, r.hadith.hadith_number)}
                      className="block rounded-md border border-border p-3 transition-colors hover:border-primary"
                    >
                      <span className="text-xs text-ink-muted">
                        {isArabic ? arabicReference(meta.name_ar, r.hadith.hadith_number) : r.hadith.reference}
                        {" · "}
                        {isArabic ? r.bookNameAr : r.bookNameEn}
                      </span>
                      <span lang={isArabic ? "ar" : "en"} className="mt-1 block text-ink">
                        {excerpt(isArabic ? hadithBodyAr(r.hadith) : r.hadith.matn_en, 160)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-muted">{t("relatedNote")}</p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">{t("relatedNone")}</p>
          )}
        </Section>

        <nav aria-label={bookName} className="flex items-center justify-between gap-3 text-sm">
          {prev ? (
            <Link href={hadithPath(meta.id, book.book_number, prev.hadith_number)} className="inline-flex items-center gap-1 text-primary hover:underline">
              <Prev aria-hidden="true" className="h-4 w-4" />
              {t("previous")}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={hadithPath(meta.id, book.book_number, next.hadith_number)} className="inline-flex items-center gap-1 text-primary hover:underline">
              {t("next")}
              <Next aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : <span />}
        </nav>
      </div>
    </Container>
  );
}
