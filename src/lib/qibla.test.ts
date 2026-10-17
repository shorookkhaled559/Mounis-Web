import { describe, expect, it } from "vitest";
import { angleDiff, calcQibla, norm360 } from "./qibla";

describe("calcQibla (bearing from true north)", () => {
  it.each([
    ["Cairo", 30.0444, 31.2357, 136],
    ["London", 51.5074, -0.1278, 119],
    ["New York", 40.7128, -74.006, 58.5],
    ["Jakarta", -6.2088, 106.8456, 295],
  ])("%s", (_name, lat, lng, expected) => {
    expect(Math.abs(angleDiff(calcQibla(lat, lng), expected))).toBeLessThan(1);
  });
});

describe("angle helpers", () => {
  it("norm360 wraps negatives and overflow", () => {
    expect(norm360(-10)).toBe(350);
    expect(norm360(370)).toBe(10);
  });
  it("angleDiff takes the shortest way round", () => {
    expect(angleDiff(10, 350)).toBe(20);
    expect(angleDiff(350, 10)).toBe(-20);
  });
});
