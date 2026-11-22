import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { pickHadithOfDay } from "@/lib/hadith-of-day";
import { arabicReference, hadithPath } from "@/lib/hadith-view";

const COLLECTION_NAMES = {
  bukhari: { ar: "صحيح البخاري", en: "Sahih al-Bukhari" },
  muslim: { ar: "صحيح مسلم", en: "Sahih Muslim" },
} as const;

/**
 * Home page "hadith of the day": one hadith from the reviewed pool
 * (scripts/build-hadith-of-day-pool.mjs), the same for everyone all day.
 * The home page revalidates regularly so the card changes at midnight (Cairo).
 */
export async function HadithOfTheDay({ locale }: { locale: string }) {
  const entry = pickHadithOfDay(new Date());
  if (!entry) return null;

  const t = await getTranslations({ locale, namespace: "home.hadithOfDay" });
  const isArabic = locale === "ar";
  const names = COLLECTION_NAMES[entry.c as keyof typeof COLLECTION_NAMES];
  const collectionName = names ? (isArabic ? names.ar : names.en) : entry.c;
  const reference = isArabic
    ? arabicReference(collectionName, entry.n)
    : `${collectionName} ${entry.n}`;
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section className="border-t border-border py-10 sm:py-14" aria-labelledby="hadith-of-day-title">
      <Container>
        <p className="text-sm font-medium text-accent">{t("eyebrow")}</p>
        <h2 id="hadith-of-day-title" className="mt-1 text-2xl font-bold text-ink">
          {t("hadithLabel")}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t("intro")}</p>

        <figure className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
          <blockquote
            lang={isArabic ? "ar" : "en"}
            className={isArabic ? "text-xl leading-loose text-ink sm:text-2xl sm:leading-loose" : "text-lg leading-relaxed text-ink"}
          >
            {isArabic ? entry.ar : entry.en}
          </blockquote>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
            <span>
              {t("source")}: <span className="font-medium text-ink">{reference}</span>
            </span>
            <Link
              href={hadithPath(entry.c, entry.b, entry.n)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("readMore")}
              <Arrow aria-hidden="true" className="h-4 w-4" />
            </Link>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
