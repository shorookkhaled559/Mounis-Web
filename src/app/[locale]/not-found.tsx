import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  const t = useTranslations("errors.notFound");
  const tCommon = useTranslations("common");

  return (
    <Container className="py-20 text-center">
      <p className="font-display text-6xl text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl text-ink">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("description")}</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-deep"
      >
        {tCommon("backHome")}
      </Link>
    </Container>
  );
}
