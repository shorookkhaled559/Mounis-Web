import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export function AppTeaser() {
  const t = useTranslations("home.appTeaser");

  return (
    <section className="border-t border-border bg-primary/[0.04] py-10 sm:py-14">
      <Container className="max-w-2xl text-center">
        <h2 className="font-display text-xl text-ink sm:text-2xl">
          {t("heading")}
        </h2>
        <p className="mt-3 text-sm text-ink-muted">{t("description")}</p>
      </Container>
    </section>
  );
}
