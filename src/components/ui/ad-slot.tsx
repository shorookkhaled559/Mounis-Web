import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

export async function AdSlot({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className?: string;
}) {
  const t = await getTranslations("ads");

  return (
    // Wrapper with explicit min-height reserves space before content renders,
    // preventing layout shift (CLS) when the ad slot loads.
    <div style={{ minHeight: height }}>
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
    </div>
  );
}
