"use client";

import { useMemo, useState } from "react";
import { Beef } from "lucide-react";
import { formatNumber, getZakatCopy } from "@/lib/zakat/copy";
import { calcLivestock, type AnimalKind, type DueItem } from "@/lib/zakat/livestock";
import { parseNum } from "@/lib/zakat/parse";
import { PanelLayout } from "./panel-layout";
import { Checkbox, Message, NumberField, RadioCards } from "./ui";

export function LivestockPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const t = c.livestock;

  const [kind, setKind] = useState<AnimalKind>("sheep");
  const [count, setCount] = useState("");
  const [grazing, setGrazing] = useState(true);

  const r = useMemo(() => calcLivestock(kind, parseNum(count), grazing), [kind, count, grazing]);

  const describe = (items: DueItem[]) =>
    items.map((i) => `${formatNumber(i.qty, locale, 0)} × ${t.names[i.key]}`).join(" + ");

  const results =
    r.status !== "due" ? (
      <Message>{t.status[r.status]}</Message>
    ) : (
      <div className="rounded-2xl bg-gradient-to-r from-primary-deep to-primary px-5 py-4 text-primary-foreground">
        <p className="text-sm opacity-90">{t.result}</p>
        <p className="mt-1 font-display text-2xl">{describe(r.due)}</p>
        {r.alternatives.length > 0 && (
          <div className="mt-3 border-t border-primary-foreground/30 pt-3 text-sm">
            <p className="opacity-90">{t.or}</p>
            {r.alternatives.map((alt, i) => (
              <p key={i} className="mt-1 font-display text-xl">
                {describe(alt)}
              </p>
            ))}
          </div>
        )}
      </div>
    );

  return (
    <PanelLayout locale={locale} icon={Beef} title={t.title} intro={t.intro} results={results}>
      <RadioCards
        legend={t.kindLegend}
        value={kind}
        onChange={setKind}
        options={[
          { value: "sheep", label: t.kind.sheep },
          { value: "cattle", label: t.kind.cattle },
          { value: "camel", label: t.kind.camel },
        ]}
      />
      <NumberField label={t.count} value={count} onChange={setCount} />
      <div className="px-1">
        <Checkbox label={t.grazing} help={t.grazingHelp} checked={grazing} onChange={setGrazing} />
      </div>
    </PanelLayout>
  );
}
