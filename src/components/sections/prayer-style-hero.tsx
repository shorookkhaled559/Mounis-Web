import Image from "next/image";
import { Container } from "@/components/ui/container";

interface PrayerStyleHeroProps {
  title: string;
  description?: string;
  breadcrumb: string;
  locale: string;
}

export function PrayerStyleHero({
  title,
  description,
  breadcrumb,
  locale,
}: PrayerStyleHeroProps) {
  const isArabic = locale === "ar";

  return (
    <div className="relative overflow-hidden min-h-[40svh] sm:min-h-[50svh] md:min-h-[60svh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/prayer/background.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <Container className="relative z-10 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div
            className={`flex items-center gap-2 text-sm text-white/90 my-4 ${
              isArabic ? "justify-end flex-row-reverse" : "justify-start"
            }`}
          >
            <span className="text-white font-medium">{breadcrumb}</span>
            <span>•</span>
            <span>{isArabic ? "الرئيسية" : "Home"}</span>
          </div>

          {/* Title */}
          <h1
            className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p
              className={`text-lg md:text-xl text-white/95 mb-4 drop-shadow-md ${
                isArabic ? "text-right" : "text-left"
              }`}
            >
              {description}
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
