import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  MAX_BOOKMARKS,
  isBookmarked,
  sanitizeSettings,
  sanitizeState,
  toggleBookmark,
} from "./store-logic";

describe("sanitizeState", () => {
  it("falls back to defaults on garbage", () => {
    for (const raw of [null, undefined, 5, "x", [], true]) expect(sanitizeState(raw)).toBe(DEFAULT_STATE);
  });

  it("clamps and validates settings", () => {
    expect(sanitizeSettings({ fontSize: 99 }).fontSize).toBe(4);
    expect(sanitizeSettings({ fontSize: -3 }).fontSize).toBe(0);
    expect(sanitizeSettings({ fontSize: "big" }).fontSize).toBe(DEFAULT_SETTINGS.fontSize);
    expect(sanitizeSettings({ fontSize: 1.6 }).fontSize).toBe(2);
    expect(sanitizeSettings({ reciter: "nobody" }).reciter).toBe(DEFAULT_SETTINGS.reciter);
    expect(sanitizeSettings({ reciter: "husary" }).reciter).toBe("husary");
    expect(sanitizeSettings({ view: "weird" }).view).toBe("cards");
    expect(sanitizeSettings({ view: "flow" }).view).toBe("flow");
    expect(sanitizeSettings({ translation: "yes" }).translation).toBeNull();
    expect(sanitizeSettings({ translation: false }).translation).toBe(false);
    expect(sanitizeSettings({ autoNextPage: false }).autoNextPage).toBe(false);
  });

  it("drops invalid, duplicate bookmarks and sorts newest first", () => {
    const s = sanitizeState({
      bookmarks: [
        { surah: 2, ayah: 255, ts: 10 },
        { surah: 2, ayah: 255, ts: 99 },
        { surah: 1, ayah: 8, ts: 50 },
        { surah: 200, ayah: 1, ts: 50 },
        { surah: "2", ayah: 1, ts: 50 },
        null,
        { surah: 3, ayah: 1, ts: 30 },
      ],
    });
    expect(s.bookmarks.map((b) => `${b.surah}:${b.ayah}`)).toEqual(["3:1", "2:255"]);
  });

  it("validates last read and derives a missing page", () => {
    expect(sanitizeState({ lastRead: { surah: 2, ayah: 255, mode: "surah", ts: 1 } }).lastRead).toEqual({
      surah: 2,
      ayah: 255,
      page: 42,
      mode: "surah",
      ts: 1,
    });
    expect(sanitizeState({ lastRead: { surah: 2, ayah: 999 } }).lastRead).toBeNull();
    expect(sanitizeState({ lastRead: { surah: 2, ayah: 1, page: 9999, mode: "page" } }).lastRead?.page).toBe(2);
  });
});

describe("toggleBookmark", () => {
  it("adds then removes", () => {
    const a = toggleBookmark([], 2, 255, 1);
    expect(a).toEqual([{ surah: 2, ayah: 255, ts: 1 }]);
    expect(isBookmarked(a, 2, 255)).toBe(true);
    const b = toggleBookmark(a, 1, 1, 2);
    expect(b.map((x) => x.surah)).toEqual([1, 2]);
    expect(toggleBookmark(b, 2, 255, 3)).toEqual([{ surah: 1, ayah: 1, ts: 2 }]);
  });
  it("ignores invalid refs and respects the cap", () => {
    expect(toggleBookmark([], 2, 999, 1)).toEqual([]);
    let list: ReturnType<typeof toggleBookmark> = [];
    for (let i = 1; i <= MAX_BOOKMARKS + 20; i++) list = toggleBookmark(list, 2, ((i - 1) % 286) + 1, i);
    expect(list.length).toBeLessThanOrEqual(MAX_BOOKMARKS);
  });
});
