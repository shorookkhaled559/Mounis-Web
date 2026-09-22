import { Container } from "@/components/ui/container";

export function PageHero({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-border py-12 sm:py-16">
      <Container>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
