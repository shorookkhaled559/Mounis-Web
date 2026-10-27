import { describe, expect, it } from "vitest";
import { getCollection, getCollectionIds, isValidCollectionId } from "./hadith";

describe("collection id validation", () => {
  it.each(["bukhari", "riyadussalihin", "abu-dawud"])("accepts %s", (id) =>
    expect(isValidCollectionId(id)).toBe(true));
  it.each(["../package", "..%2Fpackage", "a/b", "A", "", "bukhari.json"])("rejects %j", (id) =>
    expect(isValidCollectionId(id)).toBe(false));
});

describe("data access", () => {
  it("never reads files outside the data directory", async () => {
    expect(await getCollection("../../../package")).toBeNull();
  });
  it("returns null for an unknown collection", async () => {
    expect(await getCollection("nope")).toBeNull();
  });
  it("lists the collections on disk", async () => {
    expect(await getCollectionIds()).toContain("bukhari");
  });
  it("loads a small collection", async () => {
    const c = await getCollection("shamail");
    expect(c?.collection.id).toBe("shamail");
    expect(c?.books.length).toBeGreaterThan(0);
  });
});
