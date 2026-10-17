import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE, ogImageFor } from "./page-metadata";

describe("ogImageFor", () => {
  it("falls back to the logo for SVG covers (social crawlers can't render them)", () => {
    expect(ogImageFor("/articles/x.svg")).toBe(DEFAULT_OG_IMAGE);
    expect(ogImageFor(undefined)).toBe(DEFAULT_OG_IMAGE);
  });
  it("keeps raster covers", () => expect(ogImageFor("/articles/x.jpg").url).toBe("/articles/x.jpg"));
});
