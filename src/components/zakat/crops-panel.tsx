"use client";

import { useMemo, useState } from "react";
import { Wheat } from "lucide-react";
import { calcCrops } from "@/lib/zakat/calc";
import type { CropSchool, Irrigation } from "@/lib/zakat/constants";
import { formatNumber, getZakatCopy } from "@/lib/zakat/copy";
import { parseNum } from "@/lib/zakat/parse";
import { PanelLayout } from "./panel-layout";
import { BigResult, Message, NumberField, RadioCards, Row } from "./ui";

export function CropsPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const t = c.crops;

  const [yieldKg, setYieldKg] = useState("");
  const [irrigation, setIrrigation] = useState<Irrigation>("rain");
  const [school, setSchool] = useState<CropSchool>("hanafi");
  const [price, setPrice] = useState("");

  const r = useMemo(
    () => calcCrops({ yieldKg: parseNum(yieldKg), irrigation, school, pricePerKg: parseNum(price) }),
    [yieldKg, irrigation, school, price],
  );

  const results = (
    <>
      <dl className="divide-y divide-border">
        <Row label={t.rate} value={`${formatNumber(r.rate * 100, locale)}%`} />
      </dl>
      {r.status === "need_yield" && <Message>{t.status.need_yield}</Message>}
      {r.status === "below_nisab" && <Message>{t.status.below_nisab}</Message>}
      {r.status === "due" && (
        <>
          <BigResult label={t.zakatKg} value={`${formatNumber(r.zakatKg, locale)} ${c.kg}`} />
          {r.zakatCash !== null && (
            <dl>
              <Row label={t.zakatCash} value={`${formatNumber(r.zakatCash, locale)} ${c.currency}`} strong />
            </dl>
          )}
        </>
      )}
    </>
  );

  return (
    <PanelLayout locale={locale} icon={Wheat} title={t.title} intro={t.intro} results={results}>
      <NumberField label={t.yield} value={yieldKg} onChange={setYieldKg} suffix={c.kg} />
      <RadioCards
        legend={t.irrigation}
        value={irrigation}
        onChange={setIrrigation}
        options={[
          { value: "rain", label: t.rain },
          { value: "machine", label: t.machine },
          { value: "mixed", label: t.mixed },
        ]}
      />
      <RadioCards
        legend={t.school}
        value={school}
        onChange={setSchool}
        options={[
          { value: "hanafi", label: t.hanafi },
          { value: "jumhur", label: t.jumhur },
        ]}
      />
      <NumberField label={t.price} value={price} onChange={setPrice} suffix={c.currency} />
      <p className="px-1 text-xs text-ink-muted">{t.note}</p>
    </PanelLayout>
  );
}
