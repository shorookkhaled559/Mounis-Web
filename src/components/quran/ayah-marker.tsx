import { toArabicIndic } from "@/lib/quran";

/** The ornamental ayah-end circle (number in Arabic-Indic digits, as in the printed mushaf). */
export function AyahMarker({ n }: { n: number }) {
  return (
    <span className="ayah-marker" aria-hidden="true">
      {toArabicIndic(n)}
    </span>
  );
}
