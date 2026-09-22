"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

export function Newsletter() {
  const locale = useLocale();

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/brand/subscribe_background.png"
          alt=""
          fill
          className="object-cover"
          quality={100}
        />
      </div>

      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-8">
              {/* Right: Decorative leaves */}
              <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Bottom left large leaf */}
                  <path
                    d="M15 75 Q8 60 10 45 Q12 30 25 25 Q30 40 28 55 Q26 70 15 75 Z"
                    fill="#7FB069"
                  />
                  {/* Middle leaf */}
                  <path
                    d="M35 85 Q28 73 30 60 Q32 47 45 43 Q48 56 47 69 Q45 82 35 85 Z"
                    fill="#8DBE6F"
                  />
                  {/* Top right leaf */}
                  <path
                    d="M55 70 Q50 60 51 50 Q52 40 62 37 Q64 47 63 57 Q62 67 55 70 Z"
                    fill="#9DCB75"
                  />
                  {/* Small top leaf */}
                  <path
                    d="M68 55 Q65 48 66 41 Q67 34 74 32 Q75 39 75 46 Q74 53 68 55 Z"
                    fill="#A8D67E"
                  />
                </svg>
              </div>

              {/* Left: Content */}
              <div className="flex-1 w-full">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="w-6 h-6 text-ink" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg sm:text-xl text-ink mb-1 leading-tight">
                      {locale === "ar" ? "اشترك في نشرتنا" : "Subscribe to Our Newsletter"}
                    </h2>
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {locale === "ar"
                        ? "ليصلك جديد المقالات والمحتوى المفيد مباشرة إلى بريدك الإلكتروني"
                        : "Get the latest articles and useful content directly to your email"}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form
                  className="flex flex-col sm:flex-row gap-2"
                  onSubmit={(event) => event.preventDefault()}
                >
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    placeholder={
                      locale === "ar"
                        ? "بريدك الإلكتروني"
                        : "Your email address"
                    }
                    className="flex-1 rounded-full border border-ink/10 bg-white/60 px-5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-deep whitespace-nowrap"
                  >
                    {locale === "ar" ? "اشترك" : "Subscribe"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
