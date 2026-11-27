import type { ReactNode } from "react";
import { ArabesqueCorner } from "./prayer-art";

type Corner = "tl" | "tr" | "bl" | "br";

// physical positions (not logical): the art is a quarter-circle lattice that is
// mirrored with scale so it always hugs the chosen corner
const CORNER_CLASS: Record<Corner, string> = {
  tl: "left-0 top-0",
  tr: "right-0 top-0 -scale-x-100",
  bl: "left-0 bottom-0 -scale-y-100",
  br: "right-0 bottom-0 -scale-100",
};

/** Rounded, softly-shadowed card with optional arabesque corner ornaments. */
export function PrayerCard({
  children,
  className = "",
  corners = [],
}: {
  children: ReactNode;
  className?: string;
  corners?: Corner[];
}) {
  return (
    <section
      className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface/90 shadow-[0_8px_30px_-12px_rgba(40,90,50,0.25)]"
    >
      {corners.map((c) => (
        <ArabesqueCorner
          key={c}
          className={`pointer-events-none absolute h-24 w-24 text-primary/60 ${CORNER_CLASS[c]}`}
        />
      ))}
      <div className={`relative flex flex-1 flex-col ${className}`}>{children}</div>
    </section>
  );
}

/** Round icon badge + title + subtitle, the header of every card. */
export function CardHeading({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold leading-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
