import type { ReactNode } from "react";
import { CalendarDays, MoonStar, MapPin, Calculator } from "lucide-react";
import { LeafSprig } from "./prayer-art";

export interface InfoBarProps {
  labels: { gregorian: string; hijri: string; location: string; method: string };
  values: { gregorian: string; hijri: string; location: string; method: string };
}

function Item({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-primary-deep">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-ink">{label}</p>
        <p className="truncate text-xs text-ink-muted">{value || "…"}</p>
      </div>
    </div>
  );
}

/** Four-item strip under the photo: dates, current location, calculation method. */
export function PrayerInfoBar({ labels, values }: InfoBarProps) {
  const icon = "h-6 w-6";
  return (
    <div className="relative border-y border-border bg-primary-subtle/70">
      <LeafSprig className="pointer-events-none absolute -top-3 left-0 hidden h-14 w-20 -scale-x-100 text-primary-deep/60 md:block" />
      <LeafSprig className="pointer-events-none absolute -top-3 right-0 hidden h-14 w-20 text-primary-deep/60 md:block" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border lg:rtl:divide-x-reverse">
        <Item icon={<CalendarDays className={icon} />} label={labels.gregorian} value={values.gregorian} />
        <Item icon={<MoonStar className={icon} />} label={labels.hijri} value={values.hijri} />
        <Item icon={<MapPin className={icon} />} label={labels.location} value={values.location} />
        <Item icon={<Calculator className={icon} />} label={labels.method} value={values.method} />
      </div>
    </div>
  );
}
