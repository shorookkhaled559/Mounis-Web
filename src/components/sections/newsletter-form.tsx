"use client";

// Isolated client component for the newsletter form interactivity.
// Keeping this separate lets the parent Newsletter component stay as a
// server component, avoiding shipping the entire section to the client bundle.
export function NewsletterForm({ placeholder, buttonLabel }: { placeholder: string; buttonLabel: string }) {
  return (
    <form
      className="flex flex-col sm:flex-row gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder={placeholder}
        className="flex-1 rounded-full border border-ink/10 bg-white/60 px-5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
      />
      <button
        type="submit"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-deep whitespace-nowrap"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
