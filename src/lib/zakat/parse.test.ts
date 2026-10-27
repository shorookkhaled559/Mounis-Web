import { describe, expect, it } from "vitest";
import { parseNum, round2 } from "./parse";

describe("parseNum", () => {
  it("parses plain, Arabic-Indic and separator-formatted numbers", () => {
    expect(parseNum("1500")).toBe(1500);
    expect(parseNum("١٢٣٤")).toBe(1234);
    expect(parseNum("۱۲۳")).toBe(123);
    expect(parseNum("1,250,000")).toBe(1250000);
    expect(parseNum("١٬٢٥٠٫٥")).toBe(1250.5);
    expect(parseNum("12.5")).toBe(12.5);
  });
  it("returns 0 for empty, negative or garbage input", () => {
    expect(parseNum("")).toBe(0);
    expect(parseNum(undefined)).toBe(0);
    expect(parseNum("-5")).toBe(0);
    expect(parseNum("abc")).toBe(0);
    expect(parseNum("1.2.3")).toBe(0);
  });
});

describe("round2", () => {
  it("rounds to two decimals", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(7500)).toBe(7500);
  });
});
