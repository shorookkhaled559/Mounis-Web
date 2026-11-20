import { NextRequest, NextResponse } from "next/server";
import { isValidAyah } from "@/lib/quran";
import { fetchTafsir, isTafsirEdition } from "@/lib/quran/tafsir";

export interface QuranTafsirResponse {
  edition: string;
  surah: number;
  ayah: number;
  text: string;
}

export type QuranTafsirError = { error: "bad_request" | "not_found" | "unavailable" };

/** Digits only, so "2e1" / "0x10" / " 2" never reach the lookup. */
function parseIntParam(value: string | null): number {
  return value !== null && /^\d{1,4}$/.test(value) ? Number(value) : NaN;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const edition = params.get("edition") ?? "";
  const surah = parseIntParam(params.get("surah"));
  const ayah = parseIntParam(params.get("ayah"));

  // Edition is checked against a fixed list and the numbers against the real surah lengths,
  // so nothing a visitor sends is ever placed in the upstream URL as-is.
  if (!isTafsirEdition(edition) || !isValidAyah(surah, ayah)) {
    return NextResponse.json<QuranTafsirError>({ error: "bad_request" }, { status: 400 });
  }

  const result = await fetchTafsir(edition, surah, ayah);

  if (result.status === "ok") {
    // The data is pinned to a release tag, so it is safe to cache hard.
    return NextResponse.json<QuranTafsirResponse>(
      { edition, surah, ayah, text: result.text },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800" } },
    );
  }
  if (result.status === "not_found") {
    return NextResponse.json<QuranTafsirError>(
      { error: "not_found" },
      { status: 404, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  }
  return NextResponse.json<QuranTafsirError>({ error: "unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
}
