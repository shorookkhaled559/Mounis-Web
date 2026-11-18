import { NextRequest, NextResponse } from "next/server";
import { MAX_QUERY_LENGTH, searchQuran, type SearchResult } from "@/lib/quran/search";

export type QuranSearchResponse = SearchResult & { query: string };

export function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const result = searchQuran(query);
  // The Quran text never changes, so responses can be cached hard.
  return NextResponse.json<QuranSearchResponse>(
    { ...result, query },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
