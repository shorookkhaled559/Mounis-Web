import { NextRequest, NextResponse } from "next/server";
import { getCollection, isValidCollectionId } from "@/lib/hadith";
import {
  DEFAULT_SEARCH_SCOPE,
  SEARCH_MAX_LENGTH,
  parseQuery,
  searchCollection,
  type HadithSearchHit,
} from "@/lib/hadith-search";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** Always returns a number in [1, MAX_LIMIT]; junk like "abc" or "-5" falls back to the default. */
function parseLimit(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export interface HadithSearchResponse {
  results: HadithSearchHit[];
  /** true when more matches exist than were returned */
  truncated: boolean;
  query: string;
}

/**
 * GET /api/hadith/search?q=…&collection=<id>&limit=20
 *  - q: words from the hadith (all must appear) or a hadith number
 *  - collection: one collection id; omitted = Sahih al-Bukhari + Sahih Muslim
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const limit = parseLimit(searchParams.get("limit"));
  const collectionParam = searchParams.get("collection");

  if (query.length > SEARCH_MAX_LENGTH) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }
  if (collectionParam !== null && !isValidCollectionId(collectionParam)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const parsed = parseQuery(query);
  if (parsed.kind === "empty") {
    return NextResponse.json<HadithSearchResponse>({ results: [], truncated: false, query });
  }

  const scope: readonly string[] = collectionParam ? [collectionParam] : DEFAULT_SEARCH_SCOPE;
  const results: HadithSearchHit[] = [];
  let truncated = false;

  try {
    for (const id of scope) {
      const data = await getCollection(id);
      if (!data) {
        if (collectionParam) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
        continue;
      }
      // ask for one extra hit so we know whether the list was cut
      const hits = searchCollection(data, parsed, limit - results.length + 1);
      for (const hit of hits) {
        if (results.length >= limit) {
          truncated = true;
          break;
        }
        results.push(hit);
      }
      if (truncated) break;
    }
  } catch (error) {
    console.error("Hadith search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json<HadithSearchResponse>(
    { results, truncated, query },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
