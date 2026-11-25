"use client";

import { useId, useMemo, useState } from "react";
import { Calculator, Gem, Info } from "lucide-react";
import { calcMoney, type GoldItem } from "@/lib/zakat/calc";
import { GOLD_KARATS } from "@/lib/zakat/constants";
import { formatNumber, getZakatCopy } from "@/lib/zakat/copy";
import { parseNum } from "@/lib/zakat/parse";
import { PanelLayout } from "./panel-layout";
import { BigResult, Checkbox, Message, NumberField, Row, fieldClass } from "./ui";
import { cn } from "@/lib/utils";

type GoldState = Record<number, { saved: string; worn: string }>;

const emptyGold = (): GoldState => Object.fromEntries(GOLD_KARATS.map((k) => [k, { saved: "", worn: "" }]));

const GOLD_GRID = "grid grid-cols-[3.5rem_1fr_1fr] items-center gap-2 sm:grid-cols-[4.5rem_1fr_1fr] sm:gap-3";

export function MoneyPanel({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const m = c.money;
  const f = (n: number) => `${formatNumber(n, locale)} ${c.currency}`;
  const goldHeadingId = useId();

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
  const statusText = result.status === "due" ? null : m.status[result.status as keyof typeof m.status];

  const results = (
    <>
      {!needsPrice && (
        <dl className="divide-y divide-border">
          <Row label={m.nisab} value={f(result.nisabValue)} />
          <Row label={m.totalAssets} value={f(result.totalAssets)} />
          <Row label={m.dueDebtsRow} value={f(result.dueDebts)} />
          <Row label={m.net} value={f(result.netWealth)} strong />
        </dl>
      )}
      {statusText && <Message>{statusText}</Message>}
      {result.status === "due" && <BigResult label={c.due} value={f(result.zakatDue)} />}
    </>
  );

  return (
    <PanelLayout locale={locale} icon={Calculator} title={m.title} intro={m.intro} results={results}>
      <div className="space-y-5">
        <NumberField label={m.goldPrice} help={m.goldPriceHelp} value={goldPrice} onChange={setGoldPrice} suffix={c.currency} />
        <NumberField label={m.cash} help={m.cashHelp} value={cash} onChange={setCash} suffix={c.currency} />
        <NumberField label={m.trade} value={trade} onChange={setTrade} suffix={c.currency} />
        <NumberField label={m.investments} value={investments} onChange={setInvestments} suffix={c.currency} />
        <NumberField label={m.debtsOwed} value={debtsOwed} onChange={setDebtsOwed} suffix={c.currency} />
      </div>

      <div>
        <h3 id={goldHeadingId} className="flex items-center gap-2 px-1 text-sm font-medium text-ink">
          <Gem className="size-4 text-primary-deep" aria-hidden />
          {m.goldSection}
        </h3>

        <div role="group" aria-labelledby={goldHeadingId} className="mt-3 overflow-hidden rounded-3xl border border-border">
          <div className={cn(GOLD_GRID, "bg-surface-raised px-4 py-3 text-xs text-ink-muted")}>
            <span />
            <span>
              {m.goldSaved}
              <span className="block opacity-80">{m.goldSavedHelp}</span>
            </span>
            <span>{m.goldWorn}</span>
          </div>
          <div className={cn(GOLD_GRID, "gap-y-3 px-4 py-4")}>
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
        </div>

        <p className="mt-3 flex items-start gap-2 px-1 text-xs leading-relaxed text-ink-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {m.goldWornHelp}
        </p>
        <div className="mt-3 px-1">
          <Checkbox label={m.includeWorn} checked={includeWorn} onChange={setIncludeWorn} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField label={m.silver} value={silverGrams} onChange={setSilverGrams} />
        <NumberField label={m.silverPrice} value={silverPrice} onChange={setSilverPrice} suffix={c.currency} />
      </div>

      <NumberField label={m.dueDebts} value={dueDebts} onChange={setDueDebts} suffix={c.currency} />
      <div className="px-1">
        <Checkbox label={m.hawl} checked={hawl} onChange={setHawl} />
      </div>
    </PanelLayout>
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
      className={cn(fieldClass, "px-3 py-2 text-sm sm:px-4")}
    />
  );
  return (
    <>
      <span className="text-sm text-ink">{label}</span>
      {input("saved")}
      {input("worn")}
    </>
  );
}
