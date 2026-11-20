import { NextRequest, NextResponse } from "next/server";
import { searchAdhkar, type AdhkarHit } from "@/lib/adhkar/data";

export interface AdhkarSearchResponse {
  query: string;
  hits: AdhkarHit[];
  truncated: boolean;
}

export function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  const { hits, truncated } = searchAdhkar(query);
  return NextResponse.json<AdhkarSearchResponse>(
    { query, hits, truncated },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
