// src/lib/bestOffer.ts

export type ListingLike = {
  id: string;
  price: number;
  currency: string;
  shippingCost?: number | null;
  deliveryTimeDays?: number | null;
  estimatedDeliveryDays?: number | null;
  deliveryDays?: number | null;
  fastDelivery?: boolean | null;
  isFastDelivery?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
  location?: string | null;
};

export type BestOffers = {
  cheapest?: ListingLike & { totalPrice: number };
  fastest?: ListingLike & { deliveryDays: number | null };
  bestOverall?: ListingLike & { score: number };
};

function getDeliveryDays(listing: ListingLike): number | null {
  if (typeof listing.deliveryDays === "number") return listing.deliveryDays;
  if (typeof listing.estimatedDeliveryDays === "number")
    return listing.estimatedDeliveryDays;
  if (typeof listing.deliveryTimeDays === "number")
    return listing.deliveryTimeDays;
  return null;
}

function computeListingScore(listing: ListingLike, userLocation: string | null | undefined): number {
  const price = typeof listing.price === "number" ? listing.price : 0;
  const shipping = typeof listing.shippingCost === "number" ? listing.shippingCost : 0;
  const total = price + shipping;

  const days = getDeliveryDays(listing);

  const fastDelivery =
    typeof listing.fastDelivery === "boolean"
      ? listing.fastDelivery
      : typeof listing.isFastDelivery === "boolean"
      ? listing.isFastDelivery
      : false;

  const locationText = (listing.location ?? "").toLowerCase();
  const userLoc = (userLocation ?? "").toLowerCase().trim();

  let score = 0;

  if (total > 0) {
    score += 1000 / total;
  }

  if (typeof days === "number" && days > 0) {
    score += 5 / days;
  }

  if (fastDelivery) {
    score += 0.5;
  }

  if (userLoc && locationText) {
    if (locationText.includes(userLoc) || userLoc.includes(locationText)) {
      score += 1.0;
    } else {
      const userTokens = userLoc.split(/[ ,]+/).filter(Boolean);
      for (const token of userTokens) {
        if (token.length >= 3 && locationText.includes(token)) {
          score += 0.3;
          break;
        }
      }
    }
  }

  if (typeof listing.rating === "number") {
    score += (listing.rating / 5) * 0.3;
  }

  if (typeof listing.reviewCount === "number" && listing.reviewCount > 0) {
    score += Math.min(Math.log10(listing.reviewCount + 1) * 0.2, 0.6);
  }

  return score;
}

export function computeBestOffers(
  listings: ListingLike[],
  userLocation?: string | null
): BestOffers {
  if (!Array.isArray(listings) || listings.length === 0) {
    return {};
  }

  let cheapest: BestOffers["cheapest"] = undefined;
  let fastest: BestOffers["fastest"] = undefined;
  let bestOverall: BestOffers["bestOverall"] = undefined;

  for (const l of listings) {
    const shipping = l.shippingCost ?? 0;
    const totalPrice = l.price + shipping;
    const days = getDeliveryDays(l);
    const score = computeListingScore(l, userLocation ?? null);

    if (!cheapest || totalPrice < cheapest.totalPrice) {
      cheapest = { ...l, totalPrice };
    }

    if (days != null) {
      if (!fastest || days < (fastest.deliveryDays ?? Number.POSITIVE_INFINITY)) {
        fastest = { ...l, deliveryDays: days };
      }
    }

    if (!bestOverall || score > bestOverall.score) {
      bestOverall = { ...l, score };
    }
  }

  if (!fastest && cheapest) {
    fastest = { ...cheapest, deliveryDays: getDeliveryDays(cheapest) };
  }
  if (!bestOverall && cheapest) {
    bestOverall = {
      ...cheapest,
      score: computeListingScore(cheapest, userLocation ?? null),
    };
  }

  return { cheapest, fastest, bestOverall };
}
