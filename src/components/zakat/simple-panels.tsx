"use client";

import { useState } from "react";
import { calcFitr, calcRikaz } from "@/lib/zakat/calc";
import { formatNumber, getZakatCopy } from "@/lib/zakat/copy";
import { parseNum } from "@/lib/zakat/parse";
import { BigResult, Card, Message, NumberField } from "./ui";

export function RikazPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const t = c.rikaz;
  const [value, setValue] = useState("");
  const v = parseNum(value);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl text-ink">{t.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.intro}</p>
        </div>
        <NumberField label={t.value} value={value} onChange={setValue} suffix={c.currency} />
        <Message>{t.note}</Message>
      </Card>
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <h3 className="font-display text-lg text-ink">{c.results}</h3>
          <div className="mt-4">
            {v > 0 && <BigResult label={t.result} value={`${formatNumber(calcRikaz(v).zakatDue, locale)} ${c.currency}`} />}
          </div>
        </Card>
        <p className="text-xs text-ink-muted">{c.disclaimer}</p>
      </div>
    </div>
  );
}

export function FitrPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const t = c.fitr;
  const [persons, setPersons] = useState("");
  const [amount, setAmount] = useState("");
  const total = calcFitr(parseNum(persons), parseNum(amount)).total;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl text-ink">{t.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.intro}</p>
        </div>
        <NumberField label={t.persons} value={persons} onChange={setPersons} />
        <NumberField label={t.amount} value={amount} onChange={setAmount} suffix={c.currency} />
      </Card>
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <h3 className="font-display text-lg text-ink">{c.results}</h3>
          <div className="mt-4">
            {total > 0 && <BigResult label={t.total} value={`${formatNumber(total, locale)} ${c.currency}`} />}
          </div>
        </Card>
        <p className="text-xs text-ink-muted">{c.disclaimer}</p>
      </div>
    </div>
  );
}
