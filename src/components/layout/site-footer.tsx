import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { AdSlot } from "@/components/ui/ad-slot";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { footerExploreNav, footerAboutNav } from "@/lib/nav";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tMeta = useTranslations("meta");
  const locale = useLocale();

  return (
    <footer className="border-t border-border bg-gradient-to-b from-surface to-surface-raised">
      {/* Ad Section */}
      <Container className="py-6">
        <AdSlot width={728} height={90} />
      </Container>

      {/* App Coming Soon Section */}
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

      {/* Main Footer Content */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-t border-border">
        <Container className="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-start">
              <div className="relative w-32 h-32">
                <Image 
                  src="/brand/icon.png" 
                  alt={tMeta("siteName")} 
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
              {t("tagline")}
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                aria-label="Twitter"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Explore Section */}
          <nav aria-label={t("exploreHeading")}>
            <h2 className="mb-4 text-sm font-bold text-ink border-b-2 border-primary/30 pb-2 inline-block">
              {t("exploreHeading")}
            </h2>
            <ul className="space-y-2.5">
              {footerExploreNav.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-primary"
                  >
                    <span className="h-1 w-1 rounded-full bg-primary/40 transition-all group-hover:w-2 group-hover:bg-primary" />
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* About Section */}
          <nav aria-label={t("aboutHeading")}>
            <h2 className="mb-4 text-sm font-bold text-ink border-b-2 border-primary/30 pb-2 inline-block">
              {t("aboutHeading")}
            </h2>
            <ul className="space-y-2.5">
              {footerAboutNav.map((item) => (
                <li key={item.labelKey}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-primary"
                  >
                    <span className="h-1 w-1 rounded-full bg-primary/40 transition-all group-hover:w-2 group-hover:bg-primary" />
                    {item.labelKey === "about" ? tNav("about") : t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact/Info Section */}
          <div className="space-y-4">
            <h2 className="mb-4 text-sm font-bold text-ink border-b-2 border-primary/30 pb-2 inline-block">
              {t("contact")}
            </h2>
            <div className="space-y-3 text-sm text-ink-muted">
              <p className="flex items-start gap-2">
                <svg className="mt-1 h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@example.com
              </p>
              <p className="flex items-start gap-2">
                <svg className="mt-1 h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +123 456 7890
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Copyright Section */}
      <div className="bg-primary/5 border-t border-border">
        <Container className="py-5">
          <p className="text-center text-xs text-ink-muted leading-relaxed">
            {t("note")}
          </p>
        </Container>
      </div>
    </footer>
  );
}
