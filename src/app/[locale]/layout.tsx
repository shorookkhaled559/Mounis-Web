import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
// Self-hosted fonts (no runtime dependency on fonts.googleapis.com).
// Only load essential weights: 400 (regular), 600 (semibold), 700 (bold)
import "@fontsource/reem-kufi/400.css";
import "@fontsource/noto-naskh-arabic/400.css";
import "@fontsource/noto-naskh-arabic/600.css";
import "@fontsource/noto-naskh-arabic/700.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/600.css";
import "@fontsource/newsreader/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { routing, localeDirection, type AppLocale } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SkipLink } from "@/components/ui/skip-link";
import { NavigationProgressLoader } from "@/components/navigation-progress-loader";

// Lazy-load NavigationProgress — nprogress is only relevant after the first
// page load when the user navigates. No need to block the initial render.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: `%s | ${t("siteName")}` },
    description: t("description"),
    icons: {
      icon: [
        { url: "/favicons/favicon.ico", sizes: "any" },
        { url: "/favicons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/favicons/site.webmanifest",
    alternates: {
      languages: {
        ar: "/ar",
        en: "/en",
      },
      canonical: `${siteUrl}/${locale}`,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: t("siteName"),
      locale,
      type: "website",
      url: `${siteUrl}/${locale}`,
      images: [
        {
          url: "/brand/logo.png",
          width: 1200,
          height: 630,
          alt: t("siteName"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/brand/logo.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for this locale's server components.
  setRequestLocale(locale);
  const dir = localeDirection[locale as AppLocale];

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Preload the hero background image so the browser fetches it immediately,
            reducing LCP element render delay. fetchpriority=high ensures it is
            prioritised over other resources discovered later in the page. */}
        <link
          rel="preload"
          as="image"
          href="/_next/image?url=%2Fbrand%2Fheader_background.png&w=1920&q=75"
          fetchPriority="high"
        />
        <link rel="icon" href="/favicons/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicons/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/favicons/site.webmanifest" />
        <meta name="theme-color" content="#4f9d2f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider>
          <NavigationProgressLoader />
          <SkipLink />
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}