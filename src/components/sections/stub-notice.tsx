import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";

export function StubNotice() {
  const t = useTranslations("common");

  return (
    <Container className="py-16 text-center">
      <p className="text-ink-muted">{t("comingSoon")}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full border border-border px-5 py-2 text-sm text-ink hover:border-primary hover:text-primary"
      >
        {t("backHome")}
      </Link>
    </Container>
  );
}
