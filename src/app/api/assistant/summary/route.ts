import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleSummary(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    const query: string | undefined = body?.query;
    const products: any[] | undefined = Array.isArray(body?.products)
      ? body.products
      : undefined;
    const meta = (body?.meta ?? {}) as any;

    const parts: string[] = [];

    if (query && typeof query === "string") {
      parts.push(
        `You asked about "${query}". I'll look at the products and prices to help you reason about the best options.`,
      );
    }

    if (products && products.length > 0) {
      const total = products.length;
      const top = products[0] as any;
      const topName = top.displayName ?? top.name ?? "a top matching product";

      parts.push(
        `There ${total === 1 ? "is" : "are"} ${total} product${
          total === 1 ? "" : "s"
        } in view. A key option is ${topName}.`,
      );
    }

    if (meta && typeof meta === "object") {
      const productCount =
        typeof meta.productCount === "number" ? meta.productCount : undefined;
      const offerCount =
        typeof meta.offerCount === "number" ? meta.offerCount : undefined;

      if (productCount != null || offerCount != null) {
        const pieces: string[] = [];
        if (productCount != null) {
          pieces.push(
            `${productCount} product${productCount === 1 ? "" : "s"}`,
          );
        }
        if (offerCount != null) {
          pieces.push(
            `${offerCount} offer${offerCount === 1 ? "" : "s"}`,
          );
        }
        if (pieces.length > 0) {
          parts.push(`Overall there are ${pieces.join(" with ")}.`);
        }
      }

      if (meta.cheapestTotalPriceText && meta.cheapestStore) {
        parts.push(
          `The cheapest overall option is ${meta.cheapestTotalPriceText} at ${meta.cheapestStore}.`,
        );
      }

      if (typeof meta.fastestDays === "number" && meta.fastestStore) {
        parts.push(
          `The fastest delivery is about ${meta.fastestDays} day${
            meta.fastestDays === 1 ? "" : "s"
          } from ${meta.fastestStore}.`,
        );
      }
    }

    if (parts.length === 0) {
      parts.push(
        "The assistant is running in demo mode. I can help you think about your search, prices, and delivery options even without calling the OpenAI API.",
      );
    }

    const summary = parts.join(" ");

    return NextResponse.json(
      {
        summary,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Assistant summary error:", e);
    return NextResponse.json(
      {
        summary:
          "Sorry, I couldn't generate a detailed summary right now, but you can still use the rest of the page to compare prices and delivery options.",
      },
      { status: 200 }
    );
  }
}

// Frontend is probably using POST – support that:
export async function POST(req: NextRequest) {
  return handleSummary(req);
}

// Also support GET just in case:
export async function GET(req: NextRequest) {
  return handleSummary(req);
}