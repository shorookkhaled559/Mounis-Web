import { describe, expect, it } from "vitest";
import { buildHijriMonth } from "./hijri-calendar";
import { toHijri } from "./prayer";
import { noonUtc } from "./hijri-calendar";

const today = { y: 2026, m: 11, d: 26 };

describe("buildHijriMonth", () => {
  const g = buildHijriMonth(today, 0, false, 6);

  it("starts at Hijri day 1 and counts up without gaps", () => {
    expect(g.cells[0].hDay).toBe(1);
    g.cells.forEach((c, i) => expect(c.hDay).toBe(i + 1));
    expect([29, 30]).toContain(g.cells.length);
  });

  it("contains today at the right Hijri day", () => {
    const h = toHijri(noonUtc(today), "UTC", false);
    const cell = g.cells.find((c) => c.g.y === 2026 && c.g.m === 11 && c.g.d === 26);
    expect(cell?.hDay).toBe(h.day);
    expect(g.year).toBe(h.year);
  });

  it("aligns day 1 with the week header", () => {
    const dow = new Date(Date.UTC(g.cells[0].g.y, g.cells[0].g.m - 1, g.cells[0].g.d, 12)).getUTCDay();
    expect((6 + g.blanks) % 7).toBe(dow);
  });

  it("navigates forward and back consistently", () => {
    const next = buildHijriMonth(today, 1, false, 6);
    const last = g.cells[g.cells.length - 1].g;
    const nextFirst = next.cells[0].g;
    const gap = Date.UTC(nextFirst.y, nextFirst.m - 1, nextFirst.d) - Date.UTC(last.y, last.m - 1, last.d);
    expect(gap).toBe(86_400_000);
    expect(next.cells[0].hDay).toBe(1);
    expect(buildHijriMonth(today, -1, false, 6).cells.at(-1)!.g.d).not.toBeUndefined();
    // +N then the same N back from a shifted anchor must give the original month
    const fwd = buildHijriMonth(next.cells[0].g, -1, false, 6);
    expect(fwd.monthName).toBe(g.monthName);
    expect(fwd.year).toBe(g.year);
  });

  it("crosses a Hijri year boundary", () => {
    const names = new Set<string>();
    let year = g.year;
    for (let i = 0; i < 13; i++) {
      const m = buildHijriMonth(today, i, false, 6);
      names.add(m.monthName);
      year = Math.max(year, m.year);
    }
    expect(names.size).toBe(12);
    expect(year).toBe(g.year + 1);
  });

  it("works in Arabic", () => {
    const ar = buildHijriMonth(today, 0, true, 6);
    expect(ar.monthName).toMatch(/[؀-ۿ]/);
    expect(ar.cells.length).toBe(g.cells.length);
  });
});
