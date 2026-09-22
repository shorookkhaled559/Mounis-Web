import { Clock, Calculator, BookOpen, CalendarDays, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavKey = "prayer" | "zakat" | "hadith" | "thisDay" | "fatwas" | "about";

// href uses the localized pathname keys from routing; labels are resolved
// via next-intl messages ("nav.<key>") at render time, so nothing here is
// hardcoded per-language text.
export const primaryNav: { key: NavKey; href: string; icon: LucideIcon }[] = [
  { key: "prayer", href: "/prayer", icon: Clock },
  { key: "zakat", href: "/zakat", icon: Calculator },
  { key: "hadith", href: "/hadith", icon: BookOpen },
  { key: "thisDay", href: "/this-day", icon: CalendarDays },
  { key: "fatwas", href: "/fatwas", icon: Scale },
];

export const footerExploreNav: { key: NavKey; href: string }[] = [
  { key: "prayer", href: "/prayer" },
  { key: "zakat", href: "/zakat" },
  { key: "hadith", href: "/hadith" },
  { key: "thisDay", href: "/this-day" },
  { key: "fatwas", href: "/fatwas" },
];

export const footerAboutNav: { labelKey: "about" | "contact" | "privacy" | "terms" | "cookies"; href: string }[] = [
  { labelKey: "about", href: "/about" },
  { labelKey: "contact", href: "/contact" },
  { labelKey: "privacy", href: "/privacy" },
  { labelKey: "terms", href: "/terms" },
  { labelKey: "cookies", href: "/cookies" },
];
