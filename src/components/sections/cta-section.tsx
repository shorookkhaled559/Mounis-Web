import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { UserPlus, CheckCircle } from "lucide-react";

export function CTASection() {
  const locale = useLocale();

  const benefits = [
    locale === "ar" ? "احفظ المقالات المفضلة" : "Save favorite articles",
    locale === "ar" ? "تتبع تقدمك في القراءة" : "Track your reading progress",
    locale === "ar" ? "احصل على توصيات مخصصة" : "Get personalized recommendations",
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
            color: "var(--color-primary)",
          }}
        />
      </div>

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface border border-border rounded-3xl p-8 sm:p-12 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div>
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-5">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>

                {/* Heading */}
                <h2 className="font-display text-2xl sm:text-3xl text-ink mb-3">
                  {locale === "ar"
                    ? "انضم إلى مجتمعنا المعرفي"
                    : "Join Our Knowledge Community"}
                </h2>

                {/* Description */}
                <p className="text-sm sm:text-base text-ink-muted mb-6">
                  {locale === "ar"
                    ? "سجّل الآن واستمتع بتجربة أفضل مع محتوى إسلامي متميز ومصادر موثوقة"
                    : "Register now and enjoy a better experience with distinguished Islamic content and reliable sources"}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3 mb-6">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2.5 text-sm text-ink">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right CTA */}
              <div className="flex flex-col items-center justify-center text-center md:border-s md:border-border md:ps-8">
                {/* Visual Element */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>

                <p className="text-sm text-ink-muted mb-6">
                  {locale === "ar"
                    ? "ابدأ رحلتك المعرفية اليوم"
                    : "Start your knowledge journey today"}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Link
                    href="/register"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-deep hover:shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    {locale === "ar" ? "إنشاء حساب" : "Sign Up"}
                  </Link>
                  <Link
                    href="/login"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-transparent px-6 py-3.5 text-sm font-medium text-ink transition-all hover:border-primary hover:bg-primary/5"
                  >
                    {locale === "ar" ? "تسجيل الدخول" : "Login"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
