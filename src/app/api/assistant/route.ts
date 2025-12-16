import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const query: string = body.query ?? "";
    const searchQuery: string = body.searchQuery ?? "";
    const location: string | undefined = body.location ?? undefined;
    const products: unknown[] = Array.isArray(body.products) ? body.products : [];

    type Listing = {
      price?: number | string | null;
      storeName?: string | null;
      store?: string | null;
      shippingDays?: number | null;
    };

    type Product = {
      name?: string | null;
      listings?: Listing[];
    };

    const typedProducts = products as Product[];

    const numProducts = typedProducts.length;
    const storeSet = new Set<string>();

    let cheapestPrice = Number.POSITIVE_INFINITY;
    let cheapestStore = "";
    let cheapestProductName = "";

    for (const p of typedProducts) {
      const name = typeof p?.name === "string" ? p.name : "this item";
      const listings = Array.isArray(p?.listings) ? p.listings : [];

      for (const l of listings) {
        if (!l) continue;

        const store =
          (typeof l.storeName === "string" && l.storeName) ||
          (typeof l.store === "string" && l.store) ||
          "";

        if (store) {
          storeSet.add(store);
        }

        let priceValue: number | null = null;

        if (typeof l.price === "number") {
          priceValue = l.price;
        } else if (typeof l.price === "string") {
          const parsed = Number(l.price.replace(/[^\d.]/g, ""));
          if (Number.isFinite(parsed)) {
            priceValue = parsed;
          }
        }

        if (priceValue == null) continue;

        if (priceValue < cheapestPrice) {
          cheapestPrice = priceValue;
          cheapestStore = store || "one of the stores";
          cheapestProductName = name;
        }
      }
    }

    const numStores = storeSet.size;

    let cheapestSentence = "";

    if (cheapestPrice < Number.POSITIVE_INFINITY) {
      cheapestSentence = `The lowest price I can see is about ${cheapestPrice.toFixed(
        2
      )} at ${cheapestStore} for ${cheapestProductName}.`;
    } else if (numProducts > 0) {
      cheapestSentence =
        "I couldn't reliably read individual prices, but there are multiple offers available.";
    } else {
      cheapestSentence = "I don't see any results yet for this search.";
    }

    const baseSearch = searchQuery || query || "this search";
    const locationSentence = location ? ` for you in ${location}` : "";

    const lines: string[] = [];

    lines.push(`Here's a quick read of the results${locationSentence}:`, "");

    if (numProducts > 0) {
      lines.push(`- I found around ${numProducts} product matches for "${baseSearch}".`);
    } else {
      lines.push(`- I don't see any products yet for "${baseSearch}".`);
    }

    if (numStores > 0) {
      lines.push(`- These come from about ${numStores} different stores.`);
    }

    if (cheapestSentence) {
      lines.push(`- ${cheapestSentence}`);
    }

    if (query && query !== searchQuery) {
      lines.push(
        "",
        `You asked: "${query}". Based on that, you might start with the lowest-price option if budget matters most, or compare delivery times and store reputation if speed and trust are more important.`
      );
    } else {
      lines.push(
        "",
        "If you tell me what matters most (cheapest, fastest delivery, or most trusted store), I can help you interpret these options further."
      );
    }

    const answer = lines.join("\n");

    return NextResponse.json({
      answer,
      meta: {
        numProducts,
        numStores,
        cheapestPrice: Number.isFinite(cheapestPrice) ? cheapestPrice : null,
        cheapestStore: cheapestStore || null,
        cheapestProductName: cheapestProductName || null,
      },
    });
  } catch (error) {
    console.error("Assistant API error:", error);
    return NextResponse.json(
      { error: "Assistant failed to analyze results." },
      { status: 500 }
    );
  }
}
