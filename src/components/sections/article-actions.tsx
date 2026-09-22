"use client";

import { useState } from "react";
import { Share2, Link2, Bookmark, Printer, Check } from "lucide-react";
import { useTranslations } from "next-intl";

export function ArticleActions() {
  const t = useTranslations("article");
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; silently ignore.
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url: window.location.href });
      } catch {
        // User cancelled share sheet; no action needed.
      }
    } else {
      handleCopyLink();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-border py-3 text-sm text-ink-muted">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-background hover:text-primary"
      >
        <Share2 aria-hidden="true" className="h-4 w-4" />
        {t("share")}
      </button>
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-background hover:text-primary"
      >
        {copied ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Link2 aria-hidden="true" className="h-4 w-4" />
        )}
        {t("copyLink")}
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-background hover:text-primary"
      >
        <Bookmark aria-hidden="true" className="h-4 w-4" />
        {t("save")}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-background hover:text-primary"
      >
        <Printer aria-hidden="true" className="h-4 w-4" />
        {t("print")}
      </button>
    </div>
  );
}
