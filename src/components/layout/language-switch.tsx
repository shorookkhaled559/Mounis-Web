"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";

export function LanguageSwitch() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={nextLocale}
      className="lang-switch"
    >
      {t("switchLanguage")}
    </Link>
  );
}
