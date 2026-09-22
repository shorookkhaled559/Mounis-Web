import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { BookOpen, Search, Info } from "lucide-react";

export function Hero() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden h-[80vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/brand/header_background.png"
          alt=""
          fill
          priority
          className="object-cover"
          quality={100}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
      </div>

      <Container className={`relative z-10 ${locale === "ar" ? "py-10 sm:py-16" : "py-4 sm:py-8"}`}>
        <div className="max-w-3xl mx-auto text-center animate-slide-in-left">
          {/* Eyebrow */}
          <p className="text-xs sm:text-sm font-medium text-white/90 mb-2 sm:mb-4">
            {locale === "ar" ? "مرحباً بك" : "Welcome"}
          </p>

          {/* Main Heading */}
          <h1 className={`font-display text-3xl sm:text-5xl lg:text-6xl leading-tight text-white drop-shadow-lg ${locale === "ar" ? "mb-4 sm:mb-6" : "mb-2 sm:mb-4"}`}>
            {locale === "ar" ? (
              <>
                محتوى يأهلك
                <br />
                <span className="text-accent">للتقرب والمعرفة الإسلامية</span>
              </>
            ) : (
              <>
                Content that qualifies you
                <br />
                <span className="text-accent">for Islamic knowledge and closeness</span>
              </>
            )}
          </h1>

          {/* Description */}
          <p className={`text-sm sm:text-lg leading-relaxed text-white/90 max-w-2xl mx-auto drop-shadow ${locale === "ar" ? "mb-6 sm:mb-8" : "mb-3 sm:mb-6"}`}>
            {locale === "ar"
              ? "نقدم لك محتوى عربي أصيل مدعّم بأحاديث نبوية موثوقة ومراجع شرعية موثّقة، لنساعدك في رحلتك للبحث عن الحقيقة والسكينة والتقرّب من الله في حياتك اليومية"
              : "We provide you with authentic Arabic content supported by verified Prophetic hadiths and documented sources, to help you in your journey seeking truth, tranquility, and closeness to God in your daily life"}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-4">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-primary-foreground transition-all hover:bg-primary-deep hover:shadow-lg"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {locale === "ar" ? "ابدأ القراءة" : "Start Reading"}
            </Link>
            
            <Link
              href="/hadith"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-white transition-all hover:border-white/50 hover:bg-white/20"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {locale === "ar" ? "تصفح المقالات" : "Browse Articles"}
            </Link>
            
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-white transition-all hover:border-white/50 hover:bg-white/20"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {locale === "ar" ? "من نحن" : "About Us"}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
