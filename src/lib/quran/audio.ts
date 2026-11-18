/**
 * Reciters and where their per-ayah recordings live. Every reciter lists one
 * or more sources; the player falls back to the next one when a file fails to
 * load, so a single CDN outage does not silence the page.
 */
import { globalAyahNumber } from "./index";

export type AudioSource = (surah: number, ayah: number) => string;

export interface Reciter {
  id: string;
  ar: string;
  en: string;
  sources: AudioSource[];
}

const pad3 = (n: number) => String(n).padStart(3, "0");

/** cdn.islamic.network: files are numbered 1..6236 across the whole Quran. */
const islamicNetwork =
  (edition: string, bitrate: number): AudioSource =>
  (surah, ayah) =>
    `https://cdn.islamic.network/quran/audio/${bitrate}/${edition}/${globalAyahNumber(surah, ayah)}.mp3`;

/** everyayah.com: files are SSSAAA.mp3 inside a folder per reciter. */
const everyAyah =
  (folder: string): AudioSource =>
  (surah, ayah) =>
    `https://everyayah.com/data/${folder}/${pad3(surah)}${pad3(ayah)}.mp3`;

export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    ar: "مشاري راشد العفاسي",
    en: "Mishary Alafasy",
    sources: [islamicNetwork("ar.alafasy", 128), everyAyah("Alafasy_128kbps")],
  },
  {
    id: "husary",
    ar: "محمود خليل الحصري",
    en: "Mahmoud Khalil Al-Husary",
    sources: [islamicNetwork("ar.husary", 128), everyAyah("Husary_128kbps")],
  },
  {
    id: "abdulbasit",
    ar: "عبد الباسط عبد الصمد (مرتّل)",
    en: "Abdul Basit (Murattal)",
    sources: [islamicNetwork("ar.abdulbasitmurattal", 192), everyAyah("Abdul_Basit_Murattal_192kbps")],
  },
  {
    id: "minshawi",
    ar: "محمد صديق المنشاوي (مرتّل)",
    en: "Mohamed Siddiq Al-Minshawi (Murattal)",
    sources: [islamicNetwork("ar.minshawi", 128), everyAyah("Minshawy_Murattal_128kbps")],
  },
  {
    id: "sudais",
    ar: "عبد الرحمن السديس",
    en: "Abdurrahman As-Sudais",
    sources: [islamicNetwork("ar.abdurrahmaansudais", 192), everyAyah("Abdurrahmaan_As-Sudais_192kbps")],
  },
  {
    id: "muaiqly",
    ar: "ماهر المعيقلي",
    en: "Maher Al-Muaiqly",
    sources: [islamicNetwork("ar.mahermuaiqly", 128)],
  },
];

export const DEFAULT_RECITER_ID = RECITERS[0].id;

export function getReciter(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}

export function isReciterId(id: unknown): id is string {
  return typeof id === "string" && RECITERS.some((r) => r.id === id);
}
