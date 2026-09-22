export type HadithOfDay = {
  text: { ar: string; en: string };
  source: { ar: string; en: string };
};

// Placeholder. In production this would be selected server-side by day
// from a verified hadith dataset.
export const hadithOfDay: HadithOfDay = {
  text: {
    ar: "إن الرفق لا يكون في شيء إلا زانه، ولا يُنزع من شيء إلا شانه.",
    en: "Gentleness is not found in anything except that it beautifies it, and it is not removed from anything except that it disgraces it.",
  },
  source: { ar: "رواه مسلم", en: "Narrated by Muslim" },
};
