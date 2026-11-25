import { Heart, Leaf, Lightbulb, ShieldCheck, Sprout, Zap } from "lucide-react";
import { getZakatCopy } from "@/lib/zakat/copy";
import { Card } from "./ui";

const WHY_ICONS = [Zap, ShieldCheck, Heart] as const;

/** The quiet side card: one reminder about zakat, three reasons to use the tool, one closing line. */
export function ZakatAside({ locale }: { locale: string }) {
  const a = getZakatCopy(locale).aside;

  return (
    <Card className="space-y-7 sm:p-7">
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-primary-subtle p-5">
        <Leaf
          aria-hidden
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-3 -start-2 size-24 -rotate-12 text-primary/25"
        />
        <div className="relative">
          <p className="flex items-center gap-2 font-display text-lg text-ink">
            <Lightbulb className="size-5 text-primary-deep" aria-hidden />
            {a.tipTitle}
          </p>
          <p className="mt-2 text-sm leading-loose text-ink-muted">{a.tip}</p>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl text-ink">{a.whyTitle}</h3>
        <ul className="mt-4 space-y-3">
          {a.why.map((text, i) => {
            const Icon = WHY_ICONS[i];
            return (
              <li key={text} className="flex items-center gap-3 text-sm text-ink">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                {text}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex w-full items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
          <Sprout className="size-5 text-primary-deep" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
        <p className="font-display text-lg text-primary-deep">{a.closing}</p>
      </div>
    </Card>
  );
}
