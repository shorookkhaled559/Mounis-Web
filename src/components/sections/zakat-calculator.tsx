"use client";

import { useState } from "react";
import { Coins, HandHeart, Gem, Wheat, Beef } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CropsPanel } from "@/components/zakat/crops-panel";
import { LivestockPanel } from "@/components/zakat/livestock-panel";
import { MoneyPanel } from "@/components/zakat/money-panel";
import { FitrPanel, RikazPanel } from "@/components/zakat/simple-panels";
import { getZakatCopy } from "@/lib/zakat/copy";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "money", Icon: Coins },
  { key: "crops", Icon: Wheat },
  { key: "livestock", Icon: Beef },
  { key: "rikaz", Icon: Gem },
  { key: "fitr", Icon: HandHeart },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ZakatCalculator({ locale, title }: { locale: string; title: string }) {
  const c = getZakatCopy(locale);
  const [tab, setTab] = useState<TabKey>("money");

  return (
    <section className="zakat-surface py-8 sm:py-12">
      <Container>
        <div role="tablist" aria-label={title} className="mb-6 flex flex-wrap gap-2.5">
          {TABS.map(({ key, Icon }, i) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`zakat-tab-${key}`}
                aria-selected={active}
                aria-controls={`zakat-panel-${key}`}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors",
                  active
                    ? "border-primary-deep bg-primary-deep text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border/80 bg-surface text-ink shadow-sm hover:border-primary hover:text-primary-deep",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {i + 1}. {c.tabs[key]}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`zakat-panel-${tab}`} aria-labelledby={`zakat-tab-${tab}`}>
          {tab === "money" && <MoneyPanel locale={locale} />}
          {tab === "crops" && <CropsPanel locale={locale} />}
          {tab === "livestock" && <LivestockPanel locale={locale} />}
          {tab === "rikaz" && <RikazPanel locale={locale} />}
          {tab === "fitr" && <FitrPanel locale={locale} />}
        </div>
      </Container>
    </section>
  );
}
