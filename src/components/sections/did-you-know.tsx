import { getLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Lightbulb } from "lucide-react";

export async function DidYouKnow() {
  const locale = await getLocale();

  const facts = [
    {
      title: locale === "ar" ? "فضل العلم الشرعي" : "Virtue of Islamic Knowledge",
      content:
        locale === "ar"
          ? "قال رسول الله ﷺ: من سلك طريقاً يلتمس فيه علماً سهل الله له به طريقاً إلى الجنة"
          : "The Prophet ﷺ said: Whoever follows a path seeking knowledge, Allah will make easy for him a path to Paradise",
      source: locale === "ar" ? "رواه مسلم" : "Narrated by Muslim",
    },
    {
      title: locale === "ar" ? "أجر الصدقة الجارية" : "Reward of Ongoing Charity",
      content:
        locale === "ar"
          ? "إذا مات الإنسان انقطع عمله إلا من ثلاث: صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له"
          : "When a person dies, their deeds end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for them",
      source: locale === "ar" ? "رواه مسلم" : "Narrated by Muslim",
    },
    {
      title: locale === "ar" ? "أهمية الذكر" : "Importance of Remembrance",
      content:
        locale === "ar"
          ? "قال تعالى: الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
          : "Allah says: Those who believe and whose hearts find rest in the remembrance of Allah. Verily, in the remembrance of Allah do hearts find rest",
      source: locale === "ar" ? "سورة الرعد: ٢٨" : "Surah Ar-Ra'd: 28",
    },
    {
      title: locale === "ar" ? "الصبر مفتاح الفرج" : "Patience is the Key to Relief",
      content:
        locale === "ar"
          ? "قال ﷺ: واعلم أن النصر مع الصبر، وأن الفرج مع الكرب، وأن مع العسر يسراً"
          : "The Prophet ﷺ said: Know that victory comes with patience, relief comes with distress, and with hardship comes ease",
      source: locale === "ar" ? "رواه أحمد" : "Narrated by Ahmad",
    },
  ];

  return (
    <section className="py-12 sm:py-16 border-y border-border bg-surface">
      <Container>
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-ink">
            {locale === "ar" ? "هل تعلم أيضاً" : "Did You Know"}
          </h2>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Scroll wrapper */}
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-4 pb-2">
              {facts.map((fact, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[280px] sm:w-[320px] bg-gradient-to-br from-surface-raised to-surface border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  {/* Title */}
                  <h3 className="font-display text-base text-primary mb-3">
                    {fact.title}
                  </h3>

                  {/* Content */}
                  <p className="text-sm leading-relaxed text-ink mb-3 line-clamp-4">
                    {fact.content}
                  </p>

                  {/* Source */}
                  <p className="text-xs text-ink-muted italic">{fact.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
