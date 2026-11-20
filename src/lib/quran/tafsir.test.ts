import { describe, expect, it } from "vitest";
import {
  DEFAULT_TAFSIR_BY_LOCALE,
  TAFSIR_DATA_VERSION,
  TAFSIR_EDITIONS,
  defaultEditionForLocale,
  editionsForLocale,
  fetchTafsir,
  getTafsirEdition,
  isTafsirEdition,
  parseTafsirPayload,
  tafsirUrls,
  type FetchLike,
} from "./tafsir";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const status = (code: number) => new Response("", { status: code });
const good = (surah: number, ayah: number, text = "شرح الآية") => ok({ surah, ayah, text });

/** A fetch stub that serves one scripted answer per call and records the URLs it was asked for. */
function scripted(...answers: Array<Response | Error>) {
  const urls: string[] = [];
  const fetchImpl: FetchLike = async (url) => {
    urls.push(url);
    const next = answers[urls.length - 1];
    if (!next) throw new Error("unexpected extra request");
    if (next instanceof Error) throw next;
    return next;
  };
  return { fetchImpl, urls };
}

describe("editions", () => {
  it("have unique ids and slugs", () => {
    expect(new Set(TAFSIR_EDITIONS.map((e) => e.id)).size).toBe(TAFSIR_EDITIONS.length);
    expect(new Set(TAFSIR_EDITIONS.map((e) => e.slug)).size).toBe(TAFSIR_EDITIONS.length);
  });

  it("recognises only known ids", () => {
    expect(isTafsirEdition("muyassar")).toBe(true);
    expect(isTafsirEdition("../../etc/passwd")).toBe(false);
    expect(isTafsirEdition("")).toBe(false);
    expect(isTafsirEdition(undefined)).toBe(false);
    expect(isTafsirEdition(5)).toBe(false);
    expect(getTafsirEdition("nope")).toBeUndefined();
  });

  it("defaults point at real editions in the matching language", () => {
    for (const locale of ["ar", "en"] as const) {
      const id = defaultEditionForLocale(locale);
      expect(isTafsirEdition(id)).toBe(true);
      expect(getTafsirEdition(id)?.lang).toBe(locale);
    }
    expect(DEFAULT_TAFSIR_BY_LOCALE.ar).toBe("muyassar");
    // any other locale behaves like Arabic, the site's default
    expect(defaultEditionForLocale("fr")).toBe("muyassar");
  });

  it("lists the UI language's own editions first without losing any", () => {
    const en = editionsForLocale("en");
    expect(en).toHaveLength(TAFSIR_EDITIONS.length);
    expect(en[0].lang).toBe("en");
    expect(en.slice(0, 2).every((e) => e.lang === "en")).toBe(true);
    expect(editionsForLocale("ar")[0].lang).toBe("ar");
  });
});

describe("tafsirUrls", () => {
  it("pins the release tag on every mirror and follows the dataset layout", () => {
    const urls = tafsirUrls("muyassar", 2, 255);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toBe(`https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@${TAFSIR_DATA_VERSION}/tafsir/ar-tafsir-muyassar/2/255.json`);
    expect(urls[1]).toBe(`https://raw.githubusercontent.com/spa5k/tafsir_api/${TAFSIR_DATA_VERSION}/tafsir/ar-tafsir-muyassar/2/255.json`);
    for (const u of urls) {
      expect(u.startsWith("https://")).toBe(true);
      expect(u).toContain(TAFSIR_DATA_VERSION);
      expect(u).not.toMatch(/@(main|v\d+)\//);
    }
  });

  it("uses the dataset's own folder names", () => {
    expect(tafsirUrls("ibn-kathir-en", 1, 1)[0]).toContain("/en-tafisr-ibn-kathir/1/1.json");
    expect(tafsirUrls("jalalayn-en", 114, 6)[0]).toContain("/en-al-jalalayn/114/6.json");
  });

  it("rejects unknown editions and ayahs that do not exist", () => {
    expect(() => tafsirUrls("nope", 1, 1)).toThrow(RangeError);
    expect(() => tafsirUrls("muyassar", 1, 8)).toThrow(RangeError);
    expect(() => tafsirUrls("muyassar", 115, 1)).toThrow(RangeError);
    expect(() => tafsirUrls("muyassar", 2, 0)).toThrow(RangeError);
    expect(() => tafsirUrls("muyassar", 2, Number.NaN)).toThrow(RangeError);
    expect(() => tafsirUrls("muyassar", 2, 1.5)).toThrow(RangeError);
  });
});

describe("parseTafsirPayload", () => {
  it("returns the text of a well-formed file", () => {
    expect(parseTafsirPayload({ surah: 1, ayah: 2, text: "نص" }, 1, 2)).toBe("نص");
  });

  it("only tidies line endings and blank-line runs, never the wording", () => {
    expect(parseTafsirPayload({ surah: 1, ayah: 1, text: "  أ\r\n\r\n\r\n\r\nب\n  " }, 1, 1)).toBe("أ\n\nب");
  });

  it("refuses files that belong to another ayah", () => {
    expect(parseTafsirPayload({ surah: 1, ayah: 3, text: "x" }, 1, 2)).toBeNull();
    expect(parseTafsirPayload({ surah: 2, ayah: 2, text: "x" }, 1, 2)).toBeNull();
    expect(parseTafsirPayload({ text: "x" }, 1, 2)).toBeNull();
  });

  it("refuses blank, missing or non-string text and non-objects", () => {
    expect(parseTafsirPayload({ surah: 1, ayah: 2, text: "  \n " }, 1, 2)).toBeNull();
    expect(parseTafsirPayload({ surah: 1, ayah: 2, text: 7 }, 1, 2)).toBeNull();
    expect(parseTafsirPayload({ surah: 1, ayah: 2 }, 1, 2)).toBeNull();
    for (const raw of [null, undefined, "x", 5, [], true]) expect(parseTafsirPayload(raw, 1, 2)).toBeNull();
  });
});

describe("fetchTafsir", () => {
  it("returns the first mirror's answer and stops there", async () => {
    const { fetchImpl, urls } = scripted(good(2, 255, "نص التفسير"));
    await expect(fetchTafsir("muyassar", 2, 255, fetchImpl)).resolves.toEqual({ status: "ok", text: "نص التفسير" });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("cdn.jsdelivr.net");
  });

  it("falls back to the next mirror after a network error", async () => {
    const { fetchImpl, urls } = scripted(new Error("boom"), good(2, 255));
    await expect(fetchTafsir("saadi", 2, 255, fetchImpl)).resolves.toMatchObject({ status: "ok" });
    expect(urls[1]).toContain("raw.githubusercontent.com");
  });

  it("falls back after a 404 or a 5xx from a mirror", async () => {
    const a = scripted(status(404), good(1, 1));
    await expect(fetchTafsir("muyassar", 1, 1, a.fetchImpl)).resolves.toMatchObject({ status: "ok" });
    const b = scripted(status(503), status(502), good(1, 1));
    await expect(fetchTafsir("muyassar", 1, 1, b.fetchImpl)).resolves.toMatchObject({ status: "ok" });
    expect(b.urls).toHaveLength(3);
  });

  it("skips a mirror that serves another ayah's text or bad JSON", async () => {
    const wrongAyah = good(1, 2, "ده تفسير آية تانية");
    const badJson = new Response("<html>not json</html>", { status: 200 });
    const { fetchImpl } = scripted(wrongAyah, badJson, good(1, 1, "الصح"));
    await expect(fetchTafsir("muyassar", 1, 1, fetchImpl)).resolves.toEqual({ status: "ok", text: "الصح" });
  });

  it("reports not_found only when every mirror says 404", async () => {
    const { fetchImpl, urls } = scripted(status(404), status(404), status(404));
    await expect(fetchTafsir("muyassar", 1, 1, fetchImpl)).resolves.toEqual({ status: "not_found" });
    expect(urls).toHaveLength(3);
  });

  it("reports unavailable when mirrors fail, even if some said 404", async () => {
    const all = scripted(new Error("a"), new Error("b"), new Error("c"));
    await expect(fetchTafsir("muyassar", 1, 1, all.fetchImpl)).resolves.toEqual({ status: "unavailable" });
    const mixed = scripted(status(404), new Error("b"), status(404));
    await expect(fetchTafsir("muyassar", 1, 1, mixed.fetchImpl)).resolves.toEqual({ status: "unavailable" });
  });

  it("never touches the network for an invalid request", async () => {
    const { fetchImpl, urls } = scripted();
    await expect(fetchTafsir("nope", 1, 1, fetchImpl)).rejects.toThrow(RangeError);
    await expect(fetchTafsir("muyassar", 1, 99, fetchImpl)).rejects.toThrow(RangeError);
    expect(urls).toHaveLength(0);
  });
});
