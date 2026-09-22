import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { AdSlot } from "@/components/ui/ad-slot";
import { hadithOfDay } from "@/lib/data/hadith-of-day";

export function HadithOfDaySection() {
  const t = useTranslations("home.hadithOfDay");
  const locale = useLocale() as "ar" | "en";

  return (
    <section className="border-t border-border py-10 sm:py-14">
      <Container className="grid gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-medium text-accent">{t("eyebrow")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-ink">
                {t("wirdLabel")}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {locale === "ar"
                  ? "سورة الرعد: ٢٨"
                  : "Surah Ar-Ra'd, verse 28"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-ink">
                {t("hadithLabel")}
              </p>
              <blockquote className="mt-2 text-sm leading-relaxed text-ink">
                {hadithOfDay.text[locale]}
              </blockquote>
              <cite className="mt-2 block text-xs not-italic text-ink-muted">
                {hadithOfDay.source[locale]}
              </cite>
            </div>
          </div>
        </div>
        <AdSlot width={300} height={250} className="lg:self-start" />
      </Container>
    </section>
  );
}
