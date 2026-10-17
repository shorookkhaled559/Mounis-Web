# Mounis Web (مؤنس)

Bilingual (Arabic / English) Islamic content website: articles, hadith library,
prayer times and Qibla compass. Next.js (App Router) + next-intl + Tailwind v4.

## Getting started

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL
npm ci
npm run dev                  # http://localhost:3000  (redirects to /ar)
```

| Script | What it does |
| --- | --- |
| `npm run check` | lint + typecheck + tests (run before pushing) |
| `npm test` | unit tests (Vitest) for the pure logic in `src/lib` |
| `npm run build` | production build |

## Structure

```
src/app/[locale]/…     pages (all content routes live under the locale segment)
src/app/api/…          route handlers (hadith search)
src/components/        layout/ · sections/ · ui/
src/lib/               pure logic: prayer times, qibla math, hadith data access, SEO helpers
src/lib/data/          placeholder content (swap for CMS/API later)
src/messages/{ar,en}.json   UI strings (next-intl)
public/data/hadiths/   hadith corpus (JSON, ~156 MB) read on the server
```

## Notes

- **i18n:** new UI text goes in `src/messages/*.json`, not inline `locale === "ar" ? … : …`.
- **Hadith pages:** collection pages are prebuilt; book pages are rendered on the first
  visit and cached. Parsed collections are kept in a small LRU (`MAX_CACHED` in `src/lib/hadith.ts`).
- **Dark mode:** use theme tokens (`bg-surface`, `text-ink`, `text-primary-foreground`),
  never `bg-white` / `text-white` on theme-dependent surfaces.
- **Site URL:** `getSiteUrl()` in `src/lib/page-metadata.ts` is the only place that reads
  `NEXT_PUBLIC_SITE_URL`.
