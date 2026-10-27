"use client";

import { useMemo, useState } from "react";
import { calcCrops } from "@/lib/zakat/calc";
import type { CropSchool, Irrigation } from "@/lib/zakat/constants";
import { formatNumber, getZakatCopy } from "@/lib/zakat/copy";
import { parseNum } from "@/lib/zakat/parse";
import { BigResult, Card, Message, NumberField, RadioCards, Row } from "./ui";

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl text-ink">{t.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.intro}</p>
        </div>
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
        <p className="text-xs text-ink-muted">{t.note}</p>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <h3 className="font-display text-lg text-ink">{c.results}</h3>
          <dl className="mt-3 divide-y divide-border">
            <Row label={t.rate} value={`${formatNumber(r.rate * 100, locale)}%`} />
          </dl>
          <div className="mt-4 space-y-3">
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
          </div>
        </Card>
        <p className="text-xs text-ink-muted">{c.disclaimer}</p>
      </div>
    </div>
  );
}
