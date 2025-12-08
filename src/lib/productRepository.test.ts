import { describe, it, expect } from "vitest";
import { normalizeSearchQuery } from "./productRepository";

describe("normalizeSearchQuery", () => {
  it("normalizes whitespace and case", () => {
    expect(normalizeSearchQuery("  Coffee  ")).toBe("coffee");
    expect(normalizeSearchQuery("PHONE")).toBe(
      normalizeSearchQuery("phone")
    );
  });

  it("maps phone-related terms to a canonical form", () => {
    const canonical = normalizeSearchQuery("smartphone");

    expect(normalizeSearchQuery("phone")).toBe(canonical);
    expect(normalizeSearchQuery("phones")).toBe(canonical);
    expect(normalizeSearchQuery("SmartPhones")).toBe(canonical);
  });

  it("returns empty string for empty/whitespace-only input", () => {
    expect(normalizeSearchQuery("")).toBe("");
    expect(normalizeSearchQuery("   ")).toBe("");
  });
});
