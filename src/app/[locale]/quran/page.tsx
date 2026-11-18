import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { BookOpenIcon } from "@heroicons/react/24/solid";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";
import { QuranHub } from "@/components/quran/quran-hub";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "quran");
}

export default async function QuranPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "quran" });

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-gradient-to-b from-primary-subtle to-background py-14 sm:py-16">
        <Container>
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <BookOpenIcon className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display mb-3 text-3xl text-ink sm:text-4xl lg:text-5xl">{t("title")}</h1>
              <p className="mx-auto max-w-2xl text-base text-ink-muted sm:text-lg">{t("subtitle")}</p>
            </div>
          </div>
        </Container>
      </section>
      <QuranHub locale={locale} />
    </div>
  );
}
