"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export function CommentsSection() {
  const t = useTranslations("home.comments");

  return (
    <section className="border-t border-border py-10 sm:py-14">
      <Container className="max-w-2xl">
        <h2 className="font-display text-xl text-ink sm:text-2xl">
          {t("heading")}
        </h2>
        <p className="mt-3 rounded-lg bg-surface p-4 text-sm text-ink-muted">
          {t("disabled")}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <div>
            <label htmlFor="comment-name" className="mb-1.5 block text-sm text-ink">
              {t("name")}
            </label>
            <input
              id="comment-name"
              name="name"
              type="text"
              disabled
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="comment-body" className="mb-1.5 block text-sm text-ink">
              {t("comment")}
            </label>
            <textarea
              id="comment-body"
              name="comment"
              rows={3}
              disabled
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground opacity-60"
          >
            {t("submit")}
          </button>
        </form>
      </Container>
    </section>
  );
}
