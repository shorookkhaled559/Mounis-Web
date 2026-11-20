import { useTranslations } from "next-intl";
import { BookOpenCheck, ExternalLink, Lightbulb, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { refLabel, refUrl } from "@/lib/adhkar/refs";
import type { AdhkarNote, NoteKind } from "@/lib/adhkar/types";

const STYLE: Record<NoteKind, { box: string; label: string; icon: typeof Lightbulb }> = {
  fadl: { box: "border-primary/40 bg-primary-subtle", label: "text-primary-deep", icon: BookOpenCheck },
  sunnah: { box: "border-border bg-surface-raised", label: "text-ink", icon: ScrollText },
  meaning: { box: "border-border bg-surface-raised", label: "text-ink", icon: Lightbulb },
};

/** The note under each dhikr: virtue / Sunnah / meaning, plus the hadith(s) it rests on. */
export function NoteBox({ note, locale }: { note: AdhkarNote; locale: string }) {
  const t = useTranslations("adhkar");
  const style = STYLE[note.kind];
  const Icon = style.icon;
  const label = note.kind === "fadl" ? t("kindFadl") : note.kind === "sunnah" ? t("kindSunnah") : t("kindMeaning");

  return (
    <div className={cn("rounded-xl border p-3.5 sm:p-4", style.box)}>
      <p className={cn("mb-1.5 flex items-center gap-2 text-sm font-semibold", style.label)}>
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </p>
      <p lang="ar" dir="rtl" className="text-start text-base leading-loose text-ink">
        {note.text}
      </p>
      {note.refs && note.refs.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/70 pt-2.5">
          <span className="text-xs text-ink-muted">{t("evidence")}:</span>
          {note.refs.map((r) => (
            <a
              key={`${r.c}:${r.n}`}
              href={refUrl(r)}
              target="_blank"
              rel="noopener noreferrer"
              title={t("openHadith")}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-ink transition-colors hover:border-primary/50 hover:text-primary"
            >
              {refLabel(r, locale)}
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
      {note.origin === "seen" && !note.refs?.length && (
        <p className="mt-2 border-t border-border/70 pt-2 text-xs text-ink-muted">{t("sourceHisn")}</p>
      )}
    </div>
  );
}
