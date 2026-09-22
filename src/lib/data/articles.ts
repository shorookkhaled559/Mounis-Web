export type Article = {
  slug: string;
  category: { ar: string; en: string };
  readMinutes: number;
  publishedAt: string; // ISO date
  title: { ar: string; en: string };
  excerpt: { ar: string; en: string };
  cover: string;
  body?: { ar: string[]; en: string[] };
};

// Placeholder/demo content only. Structure is designed to be swapped for a
// real CMS or API response with the same shape.
export const articles: Article[] = [
  {
    slug: "sakinah",
    category: { ar: "تدبر وتأمل", en: "Reflection" },
    readMinutes: 6,
    publishedAt: "2026-08-24",
    title: {
      ar: "السكينة التي تأتي من الذكر لا من الضجيج",
      en: "The stillness that comes from remembrance, not noise",
    },
    excerpt: {
      ar: "قراءة هادئة في أثر الذكر على القلب، وكيف يتحوّل التدبر من عادة سريعة إلى رفقة يومية.",
      en: "A quiet read on how remembrance settles the heart, and how reflection becomes a daily companion rather than a quick habit.",
    },
    cover: "/articles/sakinah.svg",
    body: {
      ar: [
        "يفتح كثير من الناس يومهم على شاشات مزدحمة، ثم يبحثون عن سكينة في اللحظة الأخيرة قبل النوم.",
        "التدبر ليس تحليلًا باردًا للنص، بل جلوس بجانب المعنى كما يجلس الصديق.",
      ],
      en: [
        "Many people open their day to crowded screens, then look for stillness only in the last moment before sleep.",
        "Reflection isn't a cold analysis of text; it's sitting beside meaning the way you sit beside a friend.",
      ],
    },
  },
  {
    slug: "mercy-in-small-habits",
    category: { ar: "تدبر وتأمل", en: "Reflection" },
    readMinutes: 4,
    publishedAt: "2026-08-18",
    title: {
      ar: "الرحمة التي تُبنى بالعادات الصغيرة",
      en: "Mercy built from small habits",
    },
    excerpt: {
      ar: "كيف تتحول النية الصادقة إلى عمل يومي بسيط لا يثقل النفس ولا ينقطع.",
      en: "How a sincere intention turns into a simple daily practice that neither burdens nor breaks.",
    },
    cover: "/articles/mercy.svg",
  },
  {
    slug: "hadith-of-gentleness",
    category: { ar: "حديث", en: "Hadith" },
    readMinutes: 5,
    publishedAt: "2026-08-10",
    title: {
      ar: "الرفق الذي لا يُنقص القوة",
      en: "Gentleness that costs no strength",
    },
    excerpt: {
      ar: "وقفات مع معاني الرفق في القول والعمل، بعيدًا عن الحدة التي تُلبس ثوب الغيرة.",
      en: "Reflections on gentleness in word and deed, apart from harshness dressed up as zeal.",
    },
    cover: "/articles/gentleness.svg",
  },
  {
    slug: "on-this-day-first-revelation",
    category: { ar: "في مثل هذا اليوم", en: "On This Day" },
    readMinutes: 3,
    publishedAt: "2026-08-02",
    title: {
      ar: "في مثل هذا اليوم: معنى البداية لا تاريخها فقط",
      en: "On this day: the meaning of a beginning, not just its date",
    },
    excerpt: {
      ar: "تذكير بأن الذاكرة الإسلامية ليست تقويمًا للذكرى، بل دعوة لإحياء المعنى في الحاضر.",
      en: "A reminder that Islamic memory isn't a calendar of anniversaries, but an invitation to revive meaning in the present.",
    },
    cover: "/articles/on-this-day.svg",
  },
];

export async function getArticleBySlug(slug: string) {
  // Add artificial delay in development to see loading states
  if (process.env.NODE_ENV === "development") {
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return articles.find((a) => a.slug === slug);
}

export function getLatestArticles(count = 3) {
  return articles.slice(0, count);
}
