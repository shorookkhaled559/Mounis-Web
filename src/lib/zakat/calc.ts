import {
  CROP_NISAB_KG,
  CROP_RATES,
  MONEY_NISAB_GRAMS_21K,
  MONEY_RATE,
  RIKAZ_RATE,
  type CropSchool,
  type Irrigation,
} from "./constants";
import { round2 } from "./parse";

/* ───────────────────────── Money, gold, silver, trade ───────────────────────── */

export interface GoldItem {
  grams: number;
  /** 24, 22, 21, 18 ... */
  karat: number;
}

export interface MoneyInput {
  /** Price of one gram of 21K gold today (EGP) — without making charges. */
  gold21PerGram: number;
  /** Price of one gram of silver today (EGP). Optional (needed only if silverGrams > 0). */
  silverPerGram: number;
  cash: number;
  tradeGoods: number;
  investments: number;
  /** Debts owed TO you that you can realistically collect. */
  debtsOwedToYou: number;
  /** Gold kept as savings / investment / not worn. */
  savedGold: GoldItem[];
  /** Gold worn as ordinary adornment. Not zakatable under the jumhur / Dar al-Ifta view. */
  adornmentGold: GoldItem[];
  /** Hanafi opinion: adornment jewellery is zakatable too. */
  includeAdornment: boolean;
  silverGrams: number;
  /** Debts YOU owe that are due now / within the year. */
  dueDebts: number;
  /** A full lunar year passed while the wealth stayed at or above the nisab. */
  hawlComplete: boolean;
}

export type MoneyStatus = "need_price" | "need_silver_price" | "hawl_pending" | "below_nisab" | "due";

export interface MoneyResult {
  status: MoneyStatus;
  nisabValue: number;
  breakdown: {
    cash: number;
    tradeGoods: number;
    investments: number;
    debtsOwedToYou: number;
    savedGold: number;
    adornmentGold: number;
    silver: number;
  };
  totalAssets: number;
  dueDebts: number;
  netWealth: number;
  zakatDue: number;
}

const nz = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Value of gold priced off the 21K gram price: purity ratio karat/21. */
export function goldValue(items: GoldItem[], gold21PerGram: number): number {
  return items.reduce((sum, it) => sum + nz(it.grams) * gold21PerGram * (nz(it.karat) / 21), 0);
}

export function moneyNisabValue(gold21PerGram: number): number {
  return round2(MONEY_NISAB_GRAMS_21K * nz(gold21PerGram));
}

export function calcMoney(input: MoneyInput): MoneyResult {
  const price = nz(input.gold21PerGram);
  const silverPrice = nz(input.silverPerGram);

  const savedGold = goldValue(input.savedGold, price);
  const adornmentRaw = goldValue(input.adornmentGold, price);
  const adornmentGold = input.includeAdornment ? adornmentRaw : 0;
  const silver = nz(input.silverGrams) * silverPrice;

  const breakdown = {
    cash: round2(nz(input.cash)),
    tradeGoods: round2(nz(input.tradeGoods)),
    investments: round2(nz(input.investments)),
    debtsOwedToYou: round2(nz(input.debtsOwedToYou)),
    savedGold: round2(savedGold),
    adornmentGold: round2(adornmentGold),
    silver: round2(silver),
  };

  const totalAssets = round2(Object.values(breakdown).reduce((a, b) => a + b, 0));
  const dueDebts = round2(nz(input.dueDebts));
  const netWealth = round2(Math.max(0, totalAssets - dueDebts));
  const nisabValue = moneyNisabValue(price);

  const base = { nisabValue, breakdown, totalAssets, dueDebts, netWealth, zakatDue: 0 };

  if (price <= 0) return { ...base, status: "need_price" };
  if (nz(input.silverGrams) > 0 && silverPrice <= 0) return { ...base, status: "need_silver_price" };
  if (netWealth < nisabValue) return { ...base, status: "below_nisab" };
  if (!input.hawlComplete) return { ...base, status: "hawl_pending" };

  return { ...base, status: "due", zakatDue: round2(netWealth * MONEY_RATE) };
}

/* ───────────────────────────── Crops and fruits ───────────────────────────── */

export interface CropsInput {
  yieldKg: number;
  irrigation: Irrigation;
  school: CropSchool;
  /** Optional: price per kg, to show the cash equivalent. */
  pricePerKg: number;
}

export type CropsStatus = "need_yield" | "below_nisab" | "due";

export interface CropsResult {
  status: CropsStatus;
  rate: number;
  nisabKg: number | null;
  zakatKg: number;
  zakatCash: number | null;
}

export function calcCrops(input: CropsInput): CropsResult {
  const yieldKg = nz(input.yieldKg);
  const rate = CROP_RATES[input.irrigation];
  const nisabKg = input.school === "jumhur" ? CROP_NISAB_KG : null;

  if (yieldKg <= 0) return { status: "need_yield", rate, nisabKg, zakatKg: 0, zakatCash: null };
  if (nisabKg !== null && yieldKg < nisabKg) {
    return { status: "below_nisab", rate, nisabKg, zakatKg: 0, zakatCash: null };
  }

  const zakatKg = round2(yieldKg * rate);
  const price = nz(input.pricePerKg);
  return { status: "due", rate, nisabKg, zakatKg, zakatCash: price > 0 ? round2(zakatKg * price) : null };
}

/* ───────────────────────────── Rikaz (treasure) ───────────────────────────── */

export function calcRikaz(value: number): { zakatDue: number } {
  return { zakatDue: round2(nz(value) * RIKAZ_RATE) };
}

/* ───────────────────────────────── Zakat al-Fitr ───────────────────────────────── */

export function calcFitr(persons: number, amountPerPerson: number): { total: number } {
  const p = Math.floor(nz(persons));
  return { total: round2(p * nz(amountPerPerson)) };
}
