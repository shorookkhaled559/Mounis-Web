"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { primaryNav } from "@/lib/nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t("openMenu")}
          className="inline-flex items-center justify-center rounded-md p-2 text-white md:hidden hover:bg-white/10 transition-colors"
        >
          <Menu aria-hidden="true" className="h-6 w-6 text-white" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col gap-1 bg-surface p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="font-display text-lg text-primary">
              {t("home")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("closeMenu")}
                className="rounded-md p-2 text-ink-muted hover:text-ink hover:bg-background transition-colors"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          
          <nav aria-label={t("home")} className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              aria-current={pathname === "/" ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                pathname === "/"
                  ? "bg-primary/8 font-medium text-primary"
                  : "text-ink hover:bg-background",
              ].join(" ")}
            >
              {t("home")}
            </Link>
            {primaryNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/8 font-medium text-primary"
                      : "text-ink hover:bg-background",
                  ].join(" ")}
                >
                  <Icon
                    aria-hidden="true"
                    className={[
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-ink-muted",
                    ].join(" ")}
                  />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          {/* Search & Language Switch - Mobile Only */}
          <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
            {/* Search Button */}
            <button
              type="button"
              aria-label={t("search")}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-background transition-colors"
            >
              <Search aria-hidden="true" className="h-4 w-4 text-ink-muted" />
              {t("search")}
            </button>

            {/* Language Switch */}
            <Link
              href={pathname}
              locale={nextLocale}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium bg-primary/8 text-primary hover:bg-primary/12 transition-colors"
            >
              {t("switchLanguage")}
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
