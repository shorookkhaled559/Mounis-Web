"use client";

import { useState } from "react";
import { Gem, HandHeart } from "lucide-react";
import { calcFitr, calcRikaz } from "@/lib/zakat/calc";
import { formatNumber, getZakatCopy } from "@/lib/zakat/copy";
import { parseNum } from "@/lib/zakat/parse";
import { PanelLayout } from "./panel-layout";
import { BigResult, Message, NumberField } from "./ui";

export function RikazPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const t = c.rikaz;
  const [value, setValue] = useState("");
  const v = parseNum(value);

  const results =
    v > 0 ? <BigResult label={t.result} value={`${formatNumber(calcRikaz(v).zakatDue, locale)} ${c.currency}`} /> : null;

  return (
    <PanelLayout locale={locale} icon={Gem} title={t.title} intro={t.intro} results={results}>
      <NumberField label={t.value} value={value} onChange={setValue} suffix={c.currency} />
      <Message>{t.note}</Message>
    </PanelLayout>
  );
}

export function FitrPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const t = c.fitr;
  const [persons, setPersons] = useState("");
  const [amount, setAmount] = useState("");
  const total = calcFitr(parseNum(persons), parseNum(amount)).total;

  const results =
    total > 0 ? <BigResult label={t.total} value={`${formatNumber(total, locale)} ${c.currency}`} /> : null;

  return (
    <PanelLayout locale={locale} icon={HandHeart} title={t.title} intro={t.intro} results={results}>
      <NumberField label={t.persons} value={persons} onChange={setPersons} />
      <NumberField label={t.amount} value={amount} onChange={setAmount} suffix={c.currency} />
    </PanelLayout>
  );
}
