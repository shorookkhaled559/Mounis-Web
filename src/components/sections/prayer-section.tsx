import { Container } from "@/components/ui/container";
import { QiblaCompass } from "./qibla-compass";
import { PrayerTimesSection } from "./prayer-times-section";

interface PrayerSectionProps {
  locale: string;
}

export function PrayerSection({ locale }: PrayerSectionProps) {
  const isArabic = locale === "ar";

  return (
    <section className="py-10 sm:py-14 bg-background">
      <Container>
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {/* Order flips automatically via dir — compass always on the "start" side */}
          <QiblaCompass locale={locale} />
          <PrayerTimesSection locale={locale} />
        </div>
      </Container>
    </section>
  );
}
