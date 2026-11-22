"use client";

import { useRef, useState, useEffect } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface HadithActionsProps {
  /** What gets copied / shared: the hadith wording plus its reference. */
  text: string;
  /** Reference line, e.g. "صحيح البخاري 1". Used as the share title. */
  title: string;
}

type Done = "copy" | "link" | null;

export function HadithActions({ text, title }: HadithActionsProps) {
  const t = useTranslations("hadithPage");
  const [done, setDone] = useState<Done>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function flash(kind: Exclude<Done, null>) {
    setDone(kind);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(null), 2000);
  }

  async function copy(value: string, kind: Exclude<Done, null>) {
    try {
      await navigator.clipboard.writeText(value);
      flash(kind);
    } catch {
      // Clipboard unavailable (insecure context / denied): nothing to show.
    }
  }

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Share sheet dismissed.
      }
    } else {
      await copy(`${text}\n\n${url}`, "copy");
    }
  }

  const button =
    "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={button} onClick={() => copy(`${text}\n\n${window.location.href}`, "copy")}>
        {done === "copy" ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
        {done === "copy" ? t("copied") : t("copy")}
      </button>
      <button type="button" className={button} onClick={share}>
        <Share2 aria-hidden="true" className="h-4 w-4" />
        {t("share")}
      </button>
      <button type="button" className={button} onClick={() => copy(window.location.href, "link")}>
        {done === "link" ? <Check aria-hidden="true" className="h-4 w-4" /> : <Link2 aria-hidden="true" className="h-4 w-4" />}
        {done === "link" ? t("copied") : t("copyLink")}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {done ? t("copied") : ""}
      </span>
    </div>
  );
}
