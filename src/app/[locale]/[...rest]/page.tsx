import { notFound } from "next/navigation";

// Catch-all so URLs that match no page (e.g. /ar/foo) are rendered by
// [locale]/not-found.tsx - inside the layout, localized, with a real 404 status.
export default function CatchAll() {
  notFound();
}
