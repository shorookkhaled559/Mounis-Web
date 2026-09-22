import { useLocale } from "next-intl";
import { Container } from "@/components/ui/container";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

export function AppComingSoon() {
  const locale = useLocale();

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-y border-border">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center sm:text-left">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DevicePhoneMobileIcon className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Text */}
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-ink mb-1">
              {locale === "ar" ? (
                <>
                  انتظروا تطبيق <span className="text-primary">مؤنس</span> قريباً
                </>
              ) : (
                <>
                  <span className="text-primary">Mounis</span> App Coming Soon
                </>
              )}
            </h2>
            <p className="text-sm text-ink-muted">
              {locale === "ar"
                ? "تجربة جديدة للوصول إلى المحتوى الإسلامي"
                : "A new experience for Islamic content"}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
