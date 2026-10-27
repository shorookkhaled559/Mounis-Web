"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errors.error");

  return (
    <Container className="py-20 text-center">
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("description")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-deep"
      >
        {t("retry")}
      </button>
    </Container>
  );
}
