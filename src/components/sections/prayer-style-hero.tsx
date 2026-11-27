import Image from "next/image";
import { LeafSprig } from "./prayer-art";

interface PrayerStyleHeroProps {
  /** the page's real <h1> – kept for SEO / screen readers, visually hidden */
  title: string;
}

/** Slim photo strip at the very top of the prayer page (window + mosque). */
export function PrayerStyleHero({ title }: PrayerStyleHeroProps) {
  return (
    <div className="relative h-24 overflow-hidden sm:h-28 lg:h-32">
      <Image
        src="/prayer/background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[left_18%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/70" />
      <h1 className="sr-only">{title}</h1>
      <LeafSprig className="pointer-events-none absolute bottom-0 left-0 hidden h-16 w-24 -scale-x-100 text-primary-deep/70 sm:block" />
      <LeafSprig className="pointer-events-none absolute bottom-0 right-0 hidden h-16 w-24 text-primary-deep/70 sm:block" />
    </div>
  );
}
