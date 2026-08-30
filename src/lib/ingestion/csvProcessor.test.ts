import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  normalizeWithMeta: vi.fn(),
  importNormalizedListings: vi.fn(),
}));

vi.mock("@/lib/ingestion/adapters", () => ({
  googleSheetAdapter: { normalizeWithMeta: mocks.normalizeWithMeta },
  profitshareAdapter: { normalizeWithMeta: vi.fn() },
  twoPerformantAdapter: { normalizeWithMeta: vi.fn() },
}));

vi.mock("@/lib/ingestion/importService", () => ({
  importNormalizedListings: mocks.importNormalizedListings,
}));

import { processCsvImport } from "./csvProcessor";

describe("processCsvImport", () => {
  it("routes generic CSV uploads through the standard GoogleSheet adapter", async () => {
    const normalized = [{ productTitle: "International product" }];
    mocks.normalizeWithMeta.mockReturnValue({
      normalized,
      totalRows: 1,
      skippedRows: 0,
      skippedMissingFields: 0,
    });
    mocks.importNormalizedListings.mockResolvedValue({});

    await processCsvImport({ provider: "generic", csv: "product_title" });

    expect(mocks.normalizeWithMeta).toHaveBeenCalledWith("product_title");
    expect(mocks.importNormalizedListings).toHaveBeenCalledWith(
      normalized,
      expect.objectContaining({
        source: "sheet",
        affiliateProvider: undefined,
        affiliateProgram: undefined,
        network: undefined,
      }),
    );
  });
});
