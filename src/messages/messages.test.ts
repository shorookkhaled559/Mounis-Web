import { describe, expect, it } from "vitest";
import ar from "./ar.json";
import en from "./en.json";

function keys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    keys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("messages", () => {
  it("ar and en define exactly the same keys", () => {
    const a = keys(ar).sort();
    const e = keys(en).sort();
    expect(a.filter((k) => !e.includes(k))).toEqual([]);
    expect(e.filter((k) => !a.includes(k))).toEqual([]);
  });
});
