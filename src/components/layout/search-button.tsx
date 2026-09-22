"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

export function SearchButton() {
  const t = useTranslations("nav");

  return (
    <button
      type="button"
      aria-label={t("search")}
      className="icon-btn"
    >
      <Search aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
