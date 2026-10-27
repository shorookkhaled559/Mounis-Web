const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXT_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Parses what a person typed into a non-negative number.
 * Accepts Arabic-Indic digits (٠-٩), Persian digits, the Arabic decimal
 * separator (٫) and thousands separators (, ٬ space). Garbage -> 0.
 */
export function parseNum(raw: string | undefined | null): number {
  if (!raw) return 0;
  let s = String(raw).trim();
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
  s = s.replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)));
  s = s.replace(/[٬,\s]/g, "").replace(/٫/g, ".");
  if (!/^\d*\.?\d*$/.test(s)) return 0;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
