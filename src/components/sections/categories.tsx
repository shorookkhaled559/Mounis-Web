import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { 
  BookOpenIcon, 
  BuildingLibraryIcon, 
  SparklesIcon, 
  HeartIcon, 
  SunIcon 
} from "@heroicons/react/24/solid";

export function Categories() {
  const locale = useLocale();

  const categories = [
    {
      icon: BookOpenIcon,
      label: locale === "ar" ? "القرآن الكريم" : "Holy Quran",
      href: "/quran",
    },
    {
      icon: BuildingLibraryIcon,
      label: locale === "ar" ? "السيرة النبوية" : "Prophet's Biography",
      href: "/seerah",
    },
    {
      icon: SparklesIcon,
      label: locale === "ar" ? "الأذكار والأدعية" : "Remembrance",
      href: "/thought",
    },
    {
      icon: HeartIcon,
      label: locale === "ar" ? "القيم والأخلاق" : "Values & Ethics",
      href: "/support",
    },
    {
      icon: SunIcon,
      label: locale === "ar" ? "الحياة اليومية" : "Daily Life",
      href: "/purification",
    },
  ];

  return (
    <section className="py-12 sm:py-16 border-t border-border">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl text-ink mb-3">
            {locale === "ar" ? "تصنيفات رئيسية" : "Main Categories"}
          </h2>
          <p className="text-sm text-ink-muted max-w-2xl mx-auto">
            {locale === "ar"
              ? "اكتشف محتوى متنوع يغطي جوانب مختلفة من المعرفة الإسلامية"
              : "Discover diverse content covering various aspects of Islamic knowledge"}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={index}
                href={category.href}
                className="group flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-md transition-all"
              >
                {/* Icon Container */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary-subtle flex items-center justify-center group-hover:scale-110 transition-transform text-primary">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                {/* Label */}
                <span className="text-sm sm:text-base font-medium text-ink text-center leading-tight group-hover:text-primary transition-colors">
                  {category.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-deep transition-colors"
          >
            {locale === "ar" ? "عرض كل التصنيفات" : "View All Categories"}
            <svg
              className="w-4 h-4 rtl:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  );
}
