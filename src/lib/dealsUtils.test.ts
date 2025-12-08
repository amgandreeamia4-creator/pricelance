import { describe, it, expect } from "vitest";
import { computeDiscountPercent } from "./dealsUtils";

describe("computeDiscountPercent", () => {
  it("returns null when there is no historical price", () => {
    expect(computeDiscountPercent(100, null)).toBeNull();
  });

  it("returns null when historical price is zero or negative", () => {
    expect(computeDiscountPercent(100, 0)).toBeNull();
    expect(computeDiscountPercent(100, -10)).toBeNull();
  });

  it("returns a positive discount when current is lower than historical", () => {
    // current 80, historical 100 → 20% discount
    expect(computeDiscountPercent(80, 100)).toBe(20);
  });

  it("returns 0 when current equals historical", () => {
    expect(computeDiscountPercent(100, 100)).toBe(0);
  });

  it("returns a negative discount when current is higher than historical", () => {
    // current 120, historical 100 → -20%
    expect(computeDiscountPercent(120, 100)).toBe(-20);
  });

  it("handles small differences and rounding", () => {
    // current 90, historical 100 → 10% discount
    expect(computeDiscountPercent(90, 100)).toBe(10);
  });
});
