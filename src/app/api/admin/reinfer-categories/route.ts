// src/app/api/admin/reinfer-categories/route.ts
// Admin-only helper to re-run category and subcategory inference on existing products

import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { inferCategorySlugFromIngestion, inferSubcategoryFromText, type IngestionCategoryInput } from "@/lib/categoryInference";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reinfer-categories
 * 
 * Re-runs category and subcategory inference on existing products
 * without requiring re-import of CSV data.
 * 
 * Protected by ADMIN_TOKEN header (same as other admin APIs).
 * 
 * Query parameters:
 * - campaign: Filter by campaign/store name (optional)
 * - limit: Max products to process per batch (default: 1000, max: 5000)
 * - offset: Number of products to skip for pagination (default: 0)
 */
export async function POST(req: NextRequest) {
  // 1) Admin token validation
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const campaign = searchParams.get("campaign")?.trim() || undefined;
    const limitParam = searchParams.get("limit") || "1000";
    const offsetParam = searchParams.get("offset") || "0";
    
    const limit = Math.min(Math.max(parseInt(limitParam, 10), 1), 5000); // Cap at 5000 for safety
    const offset = Math.max(parseInt(offsetParam, 10), 0);

    console.log(`[reinfer-categories] Starting batch: campaign=${campaign || "all"}, limit=${limit}, offset=${offset}`);

    // 2) Build query to select products with optional campaign filtering
    let whereClause: any = {};
    
    if (campaign) {
      // Filter by products that have listings from the specified campaign/store
      whereClause = {
        listings: {
          some: {
            OR: [
              { storeName: { contains: campaign, mode: "insensitive" } },
              { affiliateProgram: { contains: campaign, mode: "insensitive" } },
            ],
          },
        },
      };
    }

    // 3) Fetch batch of products (without listings for now to avoid type issues)
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        id: "asc",
      },
      take: limit,
      skip: offset,
    });

    console.log(`[reinfer-categories] Found ${products.length} products to process`);

    let totalProcessed = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    // 4) Process each product
    for (const product of products) {
      totalProcessed++;
      
      try {
        // Build ingestion input using existing product data (no campaign context for now)
        const ingestionInput: IngestionCategoryInput = {
          title: product.name,
          description: product.description,
          campaignName: undefined, // Could be added later if needed
          explicitCategorySlug: product.category,
          feedCategory: product.category, // Pass existing feed category as hint
        };

        // Infer new category (subcategory field doesn't exist in current schema)
        const newCategory = inferCategorySlugFromIngestion(ingestionInput);

        // Check if category update is needed
        const categoryChanged = newCategory !== product.category;

        if (categoryChanged) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              category: newCategory,
            },
          });

          console.log(`[reinfer-categories] Updated product ${product.id}: "${product.name}"`);
          console.log(`  Category: ${product.category} → ${newCategory}`);
          
          totalUpdated++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Product ${product.id}: ${errorMessage}`);
        console.error(`[reinfer-categories] Error processing product ${product.id}:`, error);
      }
    }

    // 5) Determine if there are more products to process
    const remainingCount = await prisma.product.count({
      where: whereClause,
    });
    const hasMore = offset + limit < remainingCount;
    const nextOffset = hasMore ? offset + limit : null;

    console.log(`[reinfer-categories] Batch complete: ${totalProcessed} processed, ${totalUpdated} updated, ${errors.length} errors`);

    return NextResponse.json({
      ok: true,
      summary: {
        totalProcessed,
        totalUpdated,
        totalErrors: errors.length,
        batchLimit: limit,
        currentOffset: offset,
        nextOffset,
        hasMore,
        remainingProducts: Math.max(0, remainingCount - offset - limit),
      },
      errors: errors.length > 0 ? errors.slice(0, 50) : undefined, // Limit error output
    });

  } catch (error) {
    console.error("[reinfer-categories] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to re-run category inference" },
      { status: 500 },
    );
  }
}
