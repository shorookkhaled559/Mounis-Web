import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function AdSlot({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className?: string;
}) {
  const t = useTranslations("ads");

  return (
    <div
      role="complementary"
      aria-label={t("label")}
      className={cn(
        "mx-auto flex max-w-full items-center justify-center rounded-md border border-dashed border-border bg-surface/50 text-xs text-ink-muted",
        className,
      )}
      style={{ width, height, maxWidth: "100%" }}
    >
      <span>
        {t("label")} · {t("reserved")} {width}×{height}
      </span>
    </div>
  );
}
