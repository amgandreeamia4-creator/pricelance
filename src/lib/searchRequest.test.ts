import { describe, expect, it } from "vitest";
import { resolveSearchQuery } from "./searchRequest";

describe("resolveSearchQuery", () => {
  it("prefers the live input value over stale state when submitting a search", () => {
    expect(
      resolveSearchQuery({
        currentQuery: "",
        inputValue: "laptop",
      }),
    ).toBe("laptop");
  });

  it("falls back to the current query state when the input is blank", () => {
    expect(
      resolveSearchQuery({
        currentQuery: "monitor",
        inputValue: "",
      }),
    ).toBe("monitor");
  });
});
