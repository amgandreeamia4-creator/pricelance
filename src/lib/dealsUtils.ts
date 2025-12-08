export function computeDiscountPercent(
  currentPrice: number,
  avgHistoricalPrice: number | null
): number | null {
  if (avgHistoricalPrice == null || avgHistoricalPrice <= 0) {
    return null;
  }

  const raw = ((avgHistoricalPrice - currentPrice) / avgHistoricalPrice) * 100;

  // Round to nearest integer for a stable UI representation.
  const percent = Math.round(raw);

  return percent;
}
