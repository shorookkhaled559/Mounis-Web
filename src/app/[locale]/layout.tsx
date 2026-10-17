import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { routing, localeDirection, type AppLocale } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SkipLink } from "@/components/ui/skip-link";
import { NavigationProgressLoader } from "@/components/navigation-progress-loader";
import { DEFAULT_OG_IMAGE, getSiteUrl } from "@/lib/page-metadata";

// Lazy-load NavigationProgress — nprogress is only relevant after the first
// page load when the user navigates. No need to block the initial render.

// Runs synchronously in <head> BEFORE first paint, so the saved/system theme is
// applied immediately (no light->dark flash). Keep it tiny and dependency-free.
const themeInitScript = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export const viewport: Viewport = {
  themeColor: "#4f9d2f",
  colorScheme: "light dark",
};

// Fonts above the fold, per language. Preloaded through React's preload() so
// React dedupes and hoists them (hand-written <link> tags in <head> were being
// emitted twice).
const CRITICAL_FONTS: Record<string, string[]> = {
  ar: [
    "/fonts/reem-kufi-arabic-400-normal.woff2",
    "/fonts/noto-naskh-arabic-arabic-400-normal.woff2",
  ],
  en: [
    "/fonts/newsreader-latin-400-normal.woff2",
    "/fonts/inter-latin-400-normal.woff2",
  ],
};

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

  return {
    metadataBase: new URL(getSiteUrl()),
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
    appleWebApp: { capable: true, statusBarStyle: "default" },
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: t("siteName"),
      locale,
      type: "website",
      images: [{ ...DEFAULT_OG_IMAGE, alt: t("siteName") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [DEFAULT_OG_IMAGE.url],
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

  for (const href of CRITICAL_FONTS[locale] ?? []) {
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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