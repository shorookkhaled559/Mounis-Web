import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

// Single source of truth for per-locale text direction.
// Every RTL/LTR decision in the app reads from here instead of being
// hardcoded in components.
export const localeDirection: Record<AppLocale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};
