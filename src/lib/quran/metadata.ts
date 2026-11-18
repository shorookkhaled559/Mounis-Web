import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, buildAlternates, getSiteUrl } from "@/lib/page-metadata";

/** Metadata for the surah / mushaf-page routes (child openGraph replaces the parent's, so it is repeated in full). */
export function buildQuranRouteMetadata(opts: {
  locale: string;
  path: string;
  title: string;
  description: string;
  siteName: string;
}): Metadata {
  const { locale, path, title, description, siteName } = opts;
  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: {
      title,
      description,
      url: `${getSiteUrl()}/${locale}${path}`,
      siteName,
      locale,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
