import { Container } from "@/components/ui/container";

interface HadithStyleHeroProps {
  title: string;
  description?: string;
  breadcrumb: string;
  locale: string;
}

export function HadithStyleHero({
  title,
  description,
  breadcrumb,
  locale,
}: HadithStyleHeroProps) {
  const isArabic = locale === "ar";

  return (
    <div className="relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
        style={{ backgroundImage: "url(/hadiths/hadith.png)" }}
      />

      {/* Content */}
      <Container className="relative py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div
            className={`flex items-center gap-2 text-sm text-gray-700 my-4 ${
              isArabic ? "justify-end flex-row-reverse" : "justify-start"
            }`}
          >
            <span className="text-primary font-medium">{breadcrumb}</span>
            <span>•</span>
            <span>{isArabic ? "الرئيسية" : "Home"}</span>
          </div>

          {/* Title */}
          <h1
            className={`font-display text-4xl md:text-5xl font-bold text-primary-deep mb-3 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p
              className={`text-lg text-gray-700 mb-4 ${
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
