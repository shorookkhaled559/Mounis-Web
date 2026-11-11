import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";
import { SparklesIcon } from "@heroicons/react/24/solid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { 
    alternates: buildAlternates(locale, "/thought"),
    title: locale === "ar" ? "الأذكار والأدعية" : "Remembrance & Supplications",
  };
}

export default async function ThoughtPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-primary-subtle to-background border-b border-border">
        <Container>
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink mb-4">
                {locale === "ar" ? "الأذكار والأدعية" : "Remembrance & Supplications"}
              </h1>
              <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto">
                {locale === "ar"
                  ? "أذكار وأدعية مأثورة من الكتاب والسنة"
                  : "Authentic remembrance and supplications from Quran and Sunnah"}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="text-center py-20">
            <p className="text-ink-muted">
              {locale === "ar" 
                ? "المحتوى قريباً..." 
                : "Content coming soon..."}
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
