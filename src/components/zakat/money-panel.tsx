"use client";

import { useMemo, useState } from "react";
import { calcMoney, type GoldItem } from "@/lib/zakat/calc";
import { GOLD_KARATS } from "@/lib/zakat/constants";
import { formatNumber, getZakatCopy } from "@/lib/zakat/copy";
import { parseNum } from "@/lib/zakat/parse";
import { BigResult, Card, Checkbox, Message, NumberField, Row } from "./ui";

type GoldState = Record<number, { saved: string; worn: string }>;

const emptyGold = (): GoldState => Object.fromEntries(GOLD_KARATS.map((k) => [k, { saved: "", worn: "" }]));

export function MoneyPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const m = c.money;
  const f = (n: number) => `${formatNumber(n, locale)} ${c.currency}`;

  const [goldPrice, setGoldPrice] = useState("");
  const [silverPrice, setSilverPrice] = useState("");
  const [cash, setCash] = useState("");
  const [trade, setTrade] = useState("");
  const [investments, setInvestments] = useState("");
  const [debtsOwed, setDebtsOwed] = useState("");
  const [dueDebts, setDueDebts] = useState("");
  const [silverGrams, setSilverGrams] = useState("");
  const [gold, setGold] = useState<GoldState>(emptyGold);
  const [includeWorn, setIncludeWorn] = useState(false);
  const [hawl, setHawl] = useState(true);

  const result = useMemo(() => {
    const toItems = (key: "saved" | "worn"): GoldItem[] =>
      GOLD_KARATS.map((k) => ({ karat: k, grams: parseNum(gold[k][key]) }));
    return calcMoney({
      gold21PerGram: parseNum(goldPrice),
      silverPerGram: parseNum(silverPrice),
      cash: parseNum(cash),
      tradeGoods: parseNum(trade),
      investments: parseNum(investments),
      debtsOwedToYou: parseNum(debtsOwed),
      savedGold: toItems("saved"),
      adornmentGold: toItems("worn"),
      includeAdornment: includeWorn,
      silverGrams: parseNum(silverGrams),
      dueDebts: parseNum(dueDebts),
      hawlComplete: hawl,
    });
  }, [goldPrice, silverPrice, cash, trade, investments, debtsOwed, dueDebts, silverGrams, gold, includeWorn, hawl]);

  const setGoldCell = (karat: number, key: "saved" | "worn", v: string) =>
    setGold((g) => ({ ...g, [karat]: { ...g[karat], [key]: v } }));

  const needsPrice = result.status === "need_price";
  const statusText =
    result.status === "due" ? null : m.status[result.status as keyof typeof m.status];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl text-ink">{m.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{m.intro}</p>
        </div>

        <NumberField label={m.goldPrice} help={m.goldPriceHelp} value={goldPrice} onChange={setGoldPrice} suffix={c.currency} />
        <NumberField label={m.cash} help={m.cashHelp} value={cash} onChange={setCash} suffix={c.currency} />
        <NumberField label={m.trade} value={trade} onChange={setTrade} suffix={c.currency} />
        <NumberField label={m.investments} value={investments} onChange={setInvestments} suffix={c.currency} />
        <NumberField label={m.debtsOwed} value={debtsOwed} onChange={setDebtsOwed} suffix={c.currency} />

        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-medium text-ink">{m.goldSection}</legend>
          <div className="grid grid-cols-[4rem_1fr_1fr] items-end gap-x-3 gap-y-2 text-xs text-ink-muted">
            <span />
            <span>
              {m.goldSaved}
              <span className="block opacity-80">{m.goldSavedHelp}</span>
            </span>
            <span>{m.goldWorn}</span>
            {GOLD_KARATS.map((k) => (
              <GoldRow
                key={k}
                karat={k}
                label={`${m.karat} ${k}`}
                savedLabel={m.goldSaved}
                wornLabel={m.goldWorn}
                gold={gold}
                onChange={setGoldCell}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">{m.goldWornHelp}</p>
          <div className="mt-3">
            <Checkbox label={m.includeWorn} checked={includeWorn} onChange={setIncludeWorn} />
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label={m.silver} value={silverGrams} onChange={setSilverGrams} />
          <NumberField label={m.silverPrice} value={silverPrice} onChange={setSilverPrice} suffix={c.currency} />
        </div>

        <NumberField label={m.dueDebts} value={dueDebts} onChange={setDueDebts} suffix={c.currency} />
        <Checkbox label={m.hawl} checked={hawl} onChange={setHawl} />
      </Card>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <h3 className="font-display text-lg text-ink">{c.results}</h3>
          {!needsPrice && (
            <dl className="mt-3 divide-y divide-border">
              <Row label={m.nisab} value={f(result.nisabValue)} />
              <Row label={m.totalAssets} value={f(result.totalAssets)} />
              <Row label={m.dueDebtsRow} value={f(result.dueDebts)} />
              <Row label={m.net} value={f(result.netWealth)} strong />
            </dl>
          )}
          <div className="mt-4 space-y-3">
            {statusText && <Message>{statusText}</Message>}
            {result.status === "due" && <BigResult label={c.due} value={f(result.zakatDue)} />}
          </div>
        </Card>
        <p className="text-xs text-ink-muted">{c.disclaimer}</p>
      </div>
    </div>
  );
}

function GoldRow({
  karat,
  label,
  savedLabel,
  wornLabel,
  gold,
  onChange,
}: {
  karat: number;
  label: string;
  savedLabel: string;
  wornLabel: string;
  gold: GoldState;
  onChange: (k: number, key: "saved" | "worn", v: string) => void;
}) {
  const input = (key: "saved" | "worn") => (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={`${label} — ${key === "saved" ? savedLabel : wornLabel}`}
      value={gold[karat][key]}
      onChange={(e) => onChange(karat, key, e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
  return (
    <>
      <span className="self-center text-sm text-ink">{label}</span>
      {input("saved")}
      {input("worn")}
    </>
  );
}
