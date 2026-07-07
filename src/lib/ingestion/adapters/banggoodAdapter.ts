import { fetchBanggoodProducts } from "@/lib/affiliates/banggood";
import type { NormalizedListing } from "@/lib/affiliates/types";

export type BanggoodFetchParams = {
  categoryId?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
  currency?: string;
  lang?: string;
};

export async function fetchBanggoodListings(
  params: BanggoodFetchParams,
): Promise<NormalizedListing[]> {
  return fetchBanggoodProducts(params);
}
