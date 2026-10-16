import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
} from "adhan";

// ── Types ────────────────────────────────────────────────────────────────────
export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PrayerTimesMap = Record<PrayerKey, Date>;

export interface PrayerLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  tz: string; // IANA timezone, e.g. "Africa/Cairo"
}

export interface DayParts {
  y: number;
  m: number; // 1-12
  d: number;
}

// ── Cities (used for the "change location" list) ─────────────────────────────
export const CITIES: PrayerLocation[] = [
  { id: "cairo", nameAr: "القاهرة، مصر", nameEn: "Cairo, Egypt", lat: 30.0444, lng: 31.2357, tz: "Africa/Cairo" },
  { id: "giza", nameAr: "الجيزة، مصر", nameEn: "Giza, Egypt", lat: 30.0131, lng: 31.2089, tz: "Africa/Cairo" },
  { id: "alexandria", nameAr: "الإسكندرية، مصر", nameEn: "Alexandria, Egypt", lat: 31.2001, lng: 29.9187, tz: "Africa/Cairo" },
  { id: "fayoum", nameAr: "الفيوم، مصر", nameEn: "Fayoum, Egypt", lat: 29.3084, lng: 30.8428, tz: "Africa/Cairo" },
  { id: "beni-suef", nameAr: "بني سويف، مصر", nameEn: "Beni Suef, Egypt", lat: 29.0661, lng: 31.0994, tz: "Africa/Cairo" },
  { id: "minya", nameAr: "المنيا، مصر", nameEn: "Minya, Egypt", lat: 28.1099, lng: 30.7503, tz: "Africa/Cairo" },
  { id: "asyut", nameAr: "أسيوط، مصر", nameEn: "Asyut, Egypt", lat: 27.1783, lng: 31.1859, tz: "Africa/Cairo" },
  { id: "sohag", nameAr: "سوهاج، مصر", nameEn: "Sohag, Egypt", lat: 26.5569, lng: 31.6948, tz: "Africa/Cairo" },
  { id: "qena", nameAr: "قنا، مصر", nameEn: "Qena, Egypt", lat: 26.1551, lng: 32.716, tz: "Africa/Cairo" },
  { id: "luxor", nameAr: "الأقصر، مصر", nameEn: "Luxor, Egypt", lat: 25.6872, lng: 32.6396, tz: "Africa/Cairo" },
  { id: "aswan", nameAr: "أسوان، مصر", nameEn: "Aswan, Egypt", lat: 24.0889, lng: 32.8998, tz: "Africa/Cairo" },
  { id: "port-said", nameAr: "بورسعيد، مصر", nameEn: "Port Said, Egypt", lat: 31.2653, lng: 32.3019, tz: "Africa/Cairo" },
  { id: "suez", nameAr: "السويس، مصر", nameEn: "Suez, Egypt", lat: 29.9668, lng: 32.5498, tz: "Africa/Cairo" },
  { id: "ismailia", nameAr: "الإسماعيلية، مصر", nameEn: "Ismailia, Egypt", lat: 30.5965, lng: 32.2715, tz: "Africa/Cairo" },
  { id: "mansoura", nameAr: "المنصورة، مصر", nameEn: "Mansoura, Egypt", lat: 31.0409, lng: 31.3785, tz: "Africa/Cairo" },
  { id: "tanta", nameAr: "طنطا، مصر", nameEn: "Tanta, Egypt", lat: 30.7865, lng: 31.0004, tz: "Africa/Cairo" },
  { id: "zagazig", nameAr: "الزقازيق، مصر", nameEn: "Zagazig, Egypt", lat: 30.5877, lng: 31.502, tz: "Africa/Cairo" },
  { id: "damietta", nameAr: "دمياط، مصر", nameEn: "Damietta, Egypt", lat: 31.4165, lng: 31.8133, tz: "Africa/Cairo" },
  { id: "hurghada", nameAr: "الغردقة، مصر", nameEn: "Hurghada, Egypt", lat: 27.2579, lng: 33.8116, tz: "Africa/Cairo" },
  { id: "sharm", nameAr: "شرم الشيخ، مصر", nameEn: "Sharm El-Sheikh, Egypt", lat: 27.9158, lng: 34.33, tz: "Africa/Cairo" },
  { id: "matruh", nameAr: "مرسى مطروح، مصر", nameEn: "Marsa Matruh, Egypt", lat: 31.3543, lng: 27.2373, tz: "Africa/Cairo" },
  { id: "makkah", nameAr: "مكة المكرمة، السعودية", nameEn: "Makkah, Saudi Arabia", lat: 21.3891, lng: 39.8579, tz: "Asia/Riyadh" },
  { id: "madinah", nameAr: "المدينة المنورة، السعودية", nameEn: "Madinah, Saudi Arabia", lat: 24.4672, lng: 39.6111, tz: "Asia/Riyadh" },
  { id: "riyadh", nameAr: "الرياض، السعودية", nameEn: "Riyadh, Saudi Arabia", lat: 24.7136, lng: 46.6753, tz: "Asia/Riyadh" },
  { id: "jeddah", nameAr: "جدة، السعودية", nameEn: "Jeddah, Saudi Arabia", lat: 21.4858, lng: 39.1925, tz: "Asia/Riyadh" },
  { id: "dubai", nameAr: "دبي، الإمارات", nameEn: "Dubai, UAE", lat: 25.2048, lng: 55.2708, tz: "Asia/Dubai" },
  { id: "doha", nameAr: "الدوحة، قطر", nameEn: "Doha, Qatar", lat: 25.2854, lng: 51.531, tz: "Asia/Qatar" },
  { id: "kuwait", nameAr: "مدينة الكويت، الكويت", nameEn: "Kuwait City, Kuwait", lat: 29.3759, lng: 47.9774, tz: "Asia/Kuwait" },
  { id: "amman", nameAr: "عمّان، الأردن", nameEn: "Amman, Jordan", lat: 31.9454, lng: 35.9284, tz: "Asia/Amman" },
  { id: "jerusalem", nameAr: "القدس، فلسطين", nameEn: "Jerusalem, Palestine", lat: 31.7683, lng: 35.2137, tz: "Asia/Jerusalem" },
  { id: "istanbul", nameAr: "إسطنبول، تركيا", nameEn: "Istanbul, Türkiye", lat: 41.0082, lng: 28.9784, tz: "Europe/Istanbul" },
  { id: "london", nameAr: "لندن، المملكة المتحدة", nameEn: "London, UK", lat: 51.5074, lng: -0.1278, tz: "Europe/London" },
  { id: "new-york", nameAr: "نيويورك، الولايات المتحدة", nameEn: "New York, USA", lat: 40.7128, lng: -74.006, tz: "America/New_York" },
];

export const DEFAULT_LOCATION = CITIES[0];

// ── Calculation methods ──────────────────────────────────────────────────────
export interface MethodInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  create: () => CalculationParameters;
}

export const METHODS: MethodInfo[] = [
  { id: "egyptian", nameAr: "هيئة المساحة المصرية", nameEn: "Egyptian General Authority of Survey", create: CalculationMethod.Egyptian },
  { id: "mwl", nameAr: "رابطة العالم الإسلامي", nameEn: "Muslim World League", create: CalculationMethod.MuslimWorldLeague },
  { id: "ummalqura", nameAr: "أم القرى (مكة المكرمة)", nameEn: "Umm al-Qura (Makkah)", create: CalculationMethod.UmmAlQura },
  { id: "karachi", nameAr: "جامعة العلوم الإسلامية بكراتشي", nameEn: "Univ. of Islamic Sciences, Karachi", create: CalculationMethod.Karachi },
  { id: "isna", nameAr: "أمريكا الشمالية (ISNA)", nameEn: "North America (ISNA)", create: CalculationMethod.NorthAmerica },
  { id: "dubai", nameAr: "دبي", nameEn: "Dubai", create: CalculationMethod.Dubai },
  { id: "kuwait", nameAr: "الكويت", nameEn: "Kuwait", create: CalculationMethod.Kuwait },
  { id: "qatar", nameAr: "قطر", nameEn: "Qatar", create: CalculationMethod.Qatar },
  { id: "turkey", nameAr: "رئاسة الشؤون الدينية التركية", nameEn: "Diyanet (Türkiye)", create: CalculationMethod.Turkey },
];

export const DEFAULT_METHOD_ID = "egyptian";

// ── Date helpers (timezone aware) ────────────────────────────────────────────
/** The calendar day (y/m/d) that it currently is in the given timezone. */
export function dayPartsInTz(date: Date, tz: string): DayParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function addDays(day: DayParts, n: number): DayParts {
  const dt = new Date(Date.UTC(day.y, day.m - 1, day.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

// ── Prayer times ─────────────────────────────────────────────────────────────
export function getPrayerTimes(
  loc: Pick<PrayerLocation, "lat" | "lng">,
  methodId: string,
  day: DayParts
): PrayerTimesMap {
  const method = METHODS.find((m) => m.id === methodId) ?? METHODS[0];
  const coords = new Coordinates(loc.lat, loc.lng);
  const params = method.create();
  params.madhab = Madhab.Shafi; // standard Asr (shadow = 1x) — used in Egypt
  if (Math.abs(loc.lat) > 48) {
    params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  }
  // adhan reads the Y/M/D of the Date it receives, so build a local date
  const t = new PrayerTimes(coords, new Date(day.y, day.m - 1, day.d), params);
  return {
    fajr: t.fajr,
    sunrise: t.sunrise,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
  };
}

// ── Formatting ───────────────────────────────────────────────────────────────
const AR_PERIOD: Record<PrayerKey, string> = {
  fajr: "صباحاً",
  sunrise: "صباحاً",
  dhuhr: "ظهراً",
  asr: "عصراً",
  maghrib: "مساءً",
  isha: "مساءً",
};

/** → { time: "4:42", period: "صباحاً" | "AM" } shown in the location's timezone */
export function formatPrayerTime(
  date: Date,
  tz: string,
  key: PrayerKey,
  isArabic: boolean
): { time: string; period: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  return {
    time: `${hour}:${minute}`,
    period: isArabic ? AR_PERIOD[key] : dayPeriod,
  };
}

// ── Hijri ────────────────────────────────────────────────────────────────────
/**
 * Egypt (Dar al-Ifta) can differ from the astronomical/Umm al-Qura calendar by a
 * day. If the hijri date shown is off by one, change this to +1 or -1.
 */
export const HIJRI_OFFSET_DAYS = 0;

export interface HijriDate {
  day: number;
  monthName: string;
  year: number;
}

/** `date` must be a real instant; calendar day is read in the given timezone. */
export function toHijri(date: Date, tz: string, isArabic: boolean, offsetDays = HIJRI_OFFSET_DAYS): HijriDate {
  const shifted = new Date(date.getTime() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat(
    `${isArabic ? "ar" : "en"}-u-ca-islamic-umalqura-nu-latn`,
    { timeZone: tz, day: "numeric", month: "long", year: "numeric" }
  ).formatToParts(shifted);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    day: Number(get("day")),
    monthName: get("month"),
    year: Number(get("year").replace(/\D/g, "")),
  };
}

export function formatHijri(h: HijriDate, isArabic: boolean): string {
  return isArabic ? `${h.day} ${h.monthName} ${h.year} هـ` : `${h.day} ${h.monthName} ${h.year} AH`;
}

export function formatGregorian(date: Date, tz: string, isArabic: boolean): string {
  const parts = new Intl.DateTimeFormat(isArabic ? "ar-EG-u-nu-latn" : "en-US", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return isArabic
    ? `${get("weekday")}، ${get("day")} ${get("month")} ${get("year")}`
    : `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
}