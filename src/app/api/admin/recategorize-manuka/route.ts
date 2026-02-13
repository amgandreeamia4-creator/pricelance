// src/app/api/admin/recategorize-manuka/route.ts
// Admin-only helper to recategorize existing Manuka products

import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { inferCategorySlugFromIngestion, type IngestionCategoryInput } from "@/lib/categoryInference";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/recategorize-manuka
 * 
 * Finds all products from Manuka/ManukaShop campaigns and recategorizes them
 * using the updated inference logic.
 * 
 * Protected by ADMIN_TOKEN header (same as other admin APIs).
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
    console.log("[recategorize-manuka] Starting Manuka product recategorization");

    // 2) Find all products from Manuka campaigns via listings
    // We look for listings where storeName contains manuka/manukashop
    const manukaListings = await prisma.listing.findMany({
      where: {
        OR: [
          { storeName: { contains: "manuka", mode: "insensitive" } },
          { storeName: { contains: "manukashop", mode: "insensitive" } },
        ],
      },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            category: true,
          },
        },
      },
      distinct: ["productId"], // Avoid duplicate products
    });

    console.log(`[recategorize-manuka] Found ${manukaListings.length} Manuka listings`);

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 3) Process each unique product
    for (const listing of manukaListings) {
      const product = listing.Product;
      
      try {
        // Build ingestion input for existing product
        const ingestionInput: IngestionCategoryInput = {
          title: product.name,
          description: product.description,
          campaignName: listing.storeName, // Use storeName as campaign hint
          explicitCategorySlug: product.category,
        };

        // Infer category using updated logic
        const inferredCategory = inferCategorySlugFromIngestion(ingestionInput);

        // Only update if category changed and inference succeeded
        if (inferredCategory && inferredCategory !== product.category) {
          await prisma.product.update({
            where: { id: product.id },
            data: { 
              category: inferredCategory,
            },
          });

          console.log(`[recategorize-manuka] Updated product ${product.id}: "${product.name}" -> ${inferredCategory}`);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Product ${product.id}: ${errorMessage}`);
        console.error(`[recategorize-manuka] Error processing product ${product.id}:`, error);
      }
    }

    console.log(`[recategorize-manuka] Complete: ${updatedCount} updated, ${skippedCount} skipped, ${errors.length} errors`);

    return NextResponse.json({
      ok: true,
      summary: {
        totalManukaProducts: manukaListings.length,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("[recategorize-manuka] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to recategorize Manuka products" },
      { status: 500 },
    );
  }
}
