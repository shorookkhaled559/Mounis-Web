/**
 * Zakat constants — the single place that holds every nisab / rate.
 * Every value here is documented, with its source, in docs/zakat-sources.md.
 * Change a ruling HERE (and in that doc); the UI and calculations follow.
 */

/** 20 mithqal x 4.25 g = 85 g of pure (24K) gold. */
export const GOLD_NISAB_GRAMS = 85;

/** 200 dirham = 595 g of silver. */
export const SILVER_NISAB_GRAMS = 595;

/**
 * Egypt's Dar al-Ifta measures the nisab of money as the VALUE of 85 g of 21K gold
 * (the price is entered by the user because it changes every day).
 */
export const MONEY_NISAB_GRAMS_21K = 85;

/** Rub' al-'ushr — 2.5% on money, gold, silver, trade goods. */
export const MONEY_RATE = 0.025;

/** Rikaz (buried treasure) — one fifth, no nisab and no hawl. */
export const RIKAZ_RATE = 0.2;

/**
 * 5 awsuq. Sources give ~645–653 kg (Dar al-Ifta/IslamOnline mention 653; some say 612).
 * Only used under the majority (jumhur) opinion — see CropSchool.
 */
export const CROP_NISAB_KG = 653;

export type Irrigation = "rain" | "machine" | "mixed";

/** 10% rain / natural water, 5% machine-irrigated (cost), 7.5% when both are equal. */
export const CROP_RATES: Record<Irrigation, number> = {
  rain: 0.1,
  machine: 0.05,
  mixed: 0.075,
};

/**
 * hanafi — the opinion Egypt's Dar al-Ifta follows for crops: due on any harvest,
 *          no nisab, no hawl, costs are not deducted.
 * jumhur — Maliki / Shafi'i / Hanbali (and the two Hanafi companions):
 *          nisab of 5 awsuq, stored/dried staples only.
 */
export type CropSchool = "hanafi" | "jumhur";

export const GOLD_KARATS = [24, 22, 21, 18] as const;
