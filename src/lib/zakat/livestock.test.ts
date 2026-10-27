import { describe, expect, it } from "vitest";
import { calcLivestock } from "./livestock";

const due = (kind: Parameters<typeof calcLivestock>[0], n: number) => calcLivestock(kind, n, true);

describe("camels", () => {
  it("nothing below 5", () => expect(due("camel", 4).status).toBe("below_nisab"));
  it.each([
    [5, [{ key: "sheep", qty: 1 }]],
    [10, [{ key: "sheep", qty: 2 }]],
    [24, [{ key: "sheep", qty: 4 }]],
    [25, [{ key: "bintMakhad", qty: 1 }]],
    [36, [{ key: "bintLabun", qty: 1 }]],
    [46, [{ key: "hiqqa", qty: 1 }]],
    [61, [{ key: "jadha", qty: 1 }]],
    [76, [{ key: "bintLabun", qty: 2 }]],
    [91, [{ key: "hiqqa", qty: 2 }]],
    [120, [{ key: "hiqqa", qty: 2 }]],
    [121, [{ key: "bintLabun", qty: 3 }]],
    [130, [{ key: "bintLabun", qty: 2 }, { key: "hiqqa", qty: 1 }]],
    [140, [{ key: "bintLabun", qty: 1 }, { key: "hiqqa", qty: 2 }]],
    [150, [{ key: "hiqqa", qty: 3 }]],
    [160, [{ key: "bintLabun", qty: 4 }]],
  ])("%i camels", (n, expected) => {
    expect(due("camel", n).due).toEqual(expected);
  });
  it("200 camels: either 5 bint labun or 4 hiqqa", () => {
    const r = due("camel", 200);
    expect(r.due).toEqual([{ key: "bintLabun", qty: 5 }]);
    expect(r.alternatives).toEqual([[{ key: "hiqqa", qty: 4 }]]);
  });
});

describe("cattle (cows and buffalo)", () => {
  it("nothing below 30", () => expect(due("cattle", 29).status).toBe("below_nisab"));
  it.each([
    [30, [{ key: "tabi", qty: 1 }]],
    [39, [{ key: "tabi", qty: 1 }]],
    [40, [{ key: "musinna", qty: 1 }]],
    [59, [{ key: "musinna", qty: 1 }]],
    [60, [{ key: "tabi", qty: 2 }]],
    [70, [{ key: "tabi", qty: 1 }, { key: "musinna", qty: 1 }]],
    [80, [{ key: "musinna", qty: 2 }]],
    [90, [{ key: "tabi", qty: 3 }]],
    [100, [{ key: "tabi", qty: 2 }, { key: "musinna", qty: 1 }]],
  ])("%i cattle", (n, expected) => {
    expect(due("cattle", n).due).toEqual(expected);
  });
  it("120 cattle: 4 tabi' or 3 musinna", () => {
    const r = due("cattle", 120);
    expect(r.due).toEqual([{ key: "tabi", qty: 4 }]);
    expect(r.alternatives).toEqual([[{ key: "musinna", qty: 3 }]]);
  });
});

describe("sheep and goats", () => {
  it("nothing below 40", () => expect(due("sheep", 39).status).toBe("below_nisab"));
  it.each([
    [40, 1],
    [120, 1],
    [121, 2],
    [200, 2],
    [201, 3],
    [399, 3],
    [400, 4],
    [520, 5],
  ])("%i sheep -> %i", (n, qty) => {
    expect(due("sheep", n).due).toEqual([{ key: "sheep", qty }]);
  });
});

describe("conditions", () => {
  it("no zakat on fed (non-grazing) animals", () => {
    expect(calcLivestock("sheep", 100, false).status).toBe("not_grazing");
  });
  it("needs a count", () => {
    expect(calcLivestock("camel", 0, true).status).toBe("need_count");
    expect(calcLivestock("camel", NaN, true).status).toBe("need_count");
  });
  it("handles very large herds quickly", () => {
    expect(due("cattle", 1_000_000).status).toBe("due");
  });
});
