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

export function ZakatCalculator({ locale }: { locale: string }) {
  const c = getZakatCopy(locale);
  const [tab, setTab] = useState<TabKey>("money");

  return (
    <section className="bg-background py-10 sm:py-14">
      <Container>
        <div role="tablist" aria-label={c.tabs.money} className="mb-6 flex flex-wrap gap-2">
          {TABS.map(({ key, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                id={`zakat-tab-${key}`}
                aria-selected={active}
                aria-controls={`zakat-panel-${key}`}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-ink hover:border-primary hover:text-primary",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {c.tabs[key]}
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
