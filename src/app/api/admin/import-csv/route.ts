// src/app/api/admin/import-csv/route.ts
// CSV bulk import for Products + Listings (file upload)
//
// This route now has two paths:
// - provider = "2performant" → uses twoPerformantAdapter + importNormalizedListings
// - provider = "profitshare" → uses legacy ProfitshareRow pipeline (parseProfitshareCsv + processBatch)

import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  parseProfitshareCsv,
  parseAvailability,
  normalizeProfitshareRows,
  type ProfitshareRow,
} from "@/lib/affiliates/profitshare";
import { isValidProvider } from "@/config/affiliateIngestion.server";
import { importNormalizedListings } from "@/lib/importService";
import { parse } from "csv-parse/sync";
import { detectBrandFromName } from "@/lib/brandDetector";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 100;
const MAX_IMPORT_ROWS = 300;

// Use loose typing to avoid TS complaining if schema drifts
const db: any = prisma;

// Helper functions for 2Performant CSV processing
function detectDelimiter(raw: string): string {
  const firstLine = raw.split(/\r?\n/)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;

  for (const d of candidates) {
    const regex = new RegExp(`\\${d}`, "g");
    const count = (firstLine.match(regex) || []).length;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }

  return best;
}

function normalizeHeaders<T extends Record<string, any>>(row: T): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.trim().toLowerCase();
    out[normalizedKey] = value;
  }
  return out;
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;

  // Handles "392,4", "392.40", "392,40 lei", etc.
  const normalized = s.replace(",", ".").replace(/[^0-9.]/g, "");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}

type TwoPerformantImportRow = {
  title: string;
  affCode: string;
  price: number;
  campaignName?: string;
  imageUrls?: string;
  description?: string;
  storeName?: string;
  currency?: string;
  categoryRaw?: string;
  availability?: string;
};

/**
 * POST /api/admin/import-csv
 */
export async function POST(req: NextRequest) {
  // 1) Admin token
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    const providerParam =
      (formData.get("provider") as string | null) ?? "profitshare";
    const provider = isValidProvider(providerParam)
      ? providerParam
      : "profitshare";

    console.log(
      "[import-csv] Provider selection - param:",
      providerParam,
      "validated:",
      provider,
    );

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing CSV file" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { ok: false, error: "File must be a CSV file" },
        { status: 400 },
      );
    }

    const content = await file.text();
    if (!content.trim()) {
      return NextResponse.json(
        { ok: false, error: "CSV file is empty" },
        { status: 400 },
      );
    }

    // -----------------------------------------------------------------------
    // 2Performant path — enhanced CSV parsing with delimiter auto-detection
    // -----------------------------------------------------------------------
    if (provider === "2performant") {
      console.log("[import-csv] Using enhanced 2Performant CSV parsing");

      const raw = await file.text();
      const delimiter = detectDelimiter(raw);
      
      console.log(`[import-csv] Detected delimiter: "${delimiter}"`);

      const records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        delimiter, // auto-detected , ; \t |
        relax_column_count: true,
        trim: true,
      });

      const normalizedRows = (records as Record<string, any>[]).map(normalizeHeaders);
      const totalRows = normalizedRows.length;
      const isCapped = totalRows > MAX_IMPORT_ROWS;

      console.log(`[import-csv] Parsed ${totalRows} rows with delimiter "${delimiter}"`);

      // Validate and extract 2Performant rows
      let invalidRows = 0;
      const validRows: TwoPerformantImportRow[] = [];

      for (const row of normalizedRows) {
        const title = (row["title"] ?? row["product name"] ?? row["name"] ?? "").trim();
        const affCode =
          (row["aff_code"] ?? row["aff link"] ?? row["affiliate_link"] ?? row["product affiliate"] ?? row["url"] ?? "").trim();
        const price = toNumber(row["price"] ?? row["sale_price"] ?? row["old_price"] ?? row["price with discount"] ?? row["price with vat"] ?? row["price without vat"]);

        const campaignName = (row["campaign_name"] ?? row["program_name"] ?? row["advertiser name"] ?? "").trim();
        
        // Robust image URL extraction
        const imageUrlsRaw =
          (row["image_urls"] ??
            row["image_url"] ??
            row["image"] ??
            row["img"] ??
            row["product picture"] ??
            "").trim();
        
        let extractedImageUrl: string | null = null;
        
        if (imageUrlsRaw) {
          const parts = imageUrlsRaw
            .split(/[|,]/)
            .map((p: string) => p.trim())
            .filter(Boolean);
          
          if (parts.length > 0) {
            const candidate = parts[0];
            extractedImageUrl = candidate && candidate.toLowerCase().startsWith("http")
              ? candidate
              : null;
          }
        }
        
        const imageUrls = extractedImageUrl || undefined;
        const description = (row["description"] ?? row["descriere"] ?? row["product description"] ?? "").trim();
        const storeName = (row["store_name"] ?? row["advertiser name"] ?? campaignName ?? "").trim();
        const currency = (row["currency"] ?? "RON").trim().toUpperCase();
        const categoryRaw = (row["category"] ?? "").trim();
        const availability = (row["availability"] ?? "").trim();

        // Required fields validation
        const hasRequiredFields = Boolean(title && affCode && price != null && price > 0);

        if (!hasRequiredFields) {
          invalidRows++;
          console.log(`[import-csv] Invalid row - title: "${title}", affCode: "${affCode}", price: ${price}`);
          continue;
        }

        validRows.push({
          title,
          affCode,
          price: price as number,
          campaignName: campaignName || undefined,
          imageUrls,
          description: description || undefined,
          storeName: storeName || undefined,
          currency: currency || "RON",
          categoryRaw: categoryRaw || undefined,
          availability: availability || undefined,
        });
      }

      const limitedRows = validRows.slice(0, MAX_IMPORT_ROWS);

      if (limitedRows.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            message:
              `Parsed ${normalizedRows.length} rows but 0 passed validation for 2Performant. ` +
              `Required fields: non-empty title, non-empty aff_code/affiliate link, numeric price > 0. ` +
              `Check that your CSV headers look like: title, aff_code, price, campaign_name, image_urls, description. ` +
              `Detected delimiter: "${delimiter}".`,
            totalRows: normalizedRows.length,
            processedRows: 0,
            skippedRows: normalizedRows.length,
            skipped: normalizedRows.length,
            createdProducts: 0,
            updatedProducts: 0,
            createdListings: 0,
            updatedListings: 0,
            skippedMissingFields: invalidRows,
            skippedMissingExternalId: 0,
            failedRows: invalidRows,
            failed: invalidRows,
            errors: [],
            truncated: isCapped,
            capped: isCapped,
            maxRowsPerImport: MAX_IMPORT_ROWS,
            provider,
            sampleRow: normalizedRows[0] ?? null,
          },
          { status: 400 },
        );
      }

      // Convert valid rows to NormalizedListing format
      const normalizedListings = limitedRows.map((row) => ({
        productTitle: row.title,
        brand: detectBrandFromName(row.title) || "Unknown",
        category: row.categoryRaw || "General",
        gtin: undefined,
        storeId: row.storeName?.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_") || "unknown",
        storeName: row.storeName || "Unknown",
        url: row.affCode,
        price: row.price,
        currency: row.currency || "RON",
        imageUrl: row.imageUrls, // Pass the extracted image URL
        deliveryDays: undefined,
        fastDelivery: undefined,
        inStock: true, // Default to true, could be enhanced with availability parsing
        countryCode: "RO",
        source: "affiliate" as const,
      }));

      const summary = await importNormalizedListings(normalizedListings, {
        source: "affiliate",
        defaultCountryCode: "RO",
        affiliateProvider: "2performant",
        affiliateProgram: "2performant_ro",
        network: "TWOPERFORMANT",
        startRowNumber: 2,
      });

      const processedRows =
        summary.listingRows + summary.productOnlyRows;
      const skippedRows = totalRows - processedRows;
      const failedRows = summary.errors.length;
      const ok = processedRows > 0;

      const errors = summary.errors.map((e) => ({
        rowNumber: e.rowNumber,
        message: e.message,
        code: null as string | null,
      }));

      const message = isCapped
        ? `Processed first ${limitedRows.length} rows out of ${totalRows}. Split your CSV and re-upload remaining rows.` 
        : null;

      return NextResponse.json(
        {
          ok,
          totalRows,
          processedRows,
          skippedRows,
          skipped: skippedRows,
          createdProducts: summary.productsCreated,
          updatedProducts: summary.productsMatched,
          createdListings: summary.listingsCreated,
          updatedListings: summary.listingsUpdated,
          skippedMissingFields: invalidRows,
          skippedMissingExternalId: 0,
          failedRows,
          failed: failedRows,
          errors,
          truncated: isCapped,
          message,
          capped: isCapped,
          maxRowsPerImport: MAX_IMPORT_ROWS,
          provider,
        },
        { status: 200 },
      );
    }

    // -----------------------------------------------------------------------
    // Profitshare path — unified CSV pipeline (parseProfitshareCsv + normalizeProfitshareRows + importNormalizedListings)
    // -----------------------------------------------------------------------

    let parseResult;
    try {
      parseResult = parseProfitshareCsv(content);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[admin/import-csv] CSV parse error (profitshare):", err);
      return NextResponse.json(
        { ok: false, error: `Failed to parse profitshare CSV: ${message}` },
        { status: 500 },
      );
    }

    const { rows, skippedMissingFields, headerError } = parseResult;

    if (headerError) {
      return NextResponse.json(
        { ok: false, error: headerError },
        { status: 400 },
      );
    }

    const totalRows = rows.length;
    const limitedRows = rows.slice(0, MAX_IMPORT_ROWS);
    const isCapped = totalRows > MAX_IMPORT_ROWS;

    console.log(
      `[import-csv] (profitshare) Starting import: totalRows=${totalRows}, processedRows=${limitedRows.length}, capped=${isCapped}`,
    );

    if (limitedRows.length === 0) {
      const skippedRows = skippedMissingFields;
      return NextResponse.json(
        {
          ok: true,
          totalRows,
          processedRows: 0,
          skippedRows,
          skipped: skippedRows,
          createdProducts: 0,
          updatedProducts: 0,
          createdListings: 0,
          updatedListings: 0,
          skippedMissingFields,
          skippedMissingExternalId: 0,
          failedRows: 0,
          failed: 0,
          errors: [],
          truncated: false,
          message: null,
          capped: isCapped,
          maxRowsPerImport: MAX_IMPORT_ROWS,
          provider,
        },
        { status: 200 },
      );
    }

    // Convert ProfitshareRow[] to NormalizedListing[]
    const normalizedListings = normalizeProfitshareRows(limitedRows);

    const summary = await importNormalizedListings(normalizedListings, {
      source: "affiliate",
      defaultCountryCode: "RO",
      affiliateProvider: "profitshare",
      affiliateProgram: "profitshare",
      startRowNumber: 2,
    });

    const processedRows = summary.listingRows + summary.productOnlyRows;
    const skippedRows = totalRows - processedRows;
    const failedRows = summary.errors.length;
    const ok = processedRows > 0;

    const errors = summary.errors.map((e) => ({
      rowNumber: e.rowNumber,
      message: e.message,
      code: null as string | null,
    }));

    const message = isCapped
      ? `Processed first ${limitedRows.length} rows out of ${totalRows}. Split your CSV and re-upload remaining rows.` 
      : null;

    return NextResponse.json(
      {
        ok,
        totalRows,
        processedRows,
        skippedRows,
        skipped: skippedRows,
        createdProducts: summary.productsCreated,
        updatedProducts: summary.productsMatched,
        createdListings: summary.listingsCreated,
        updatedListings: summary.listingsUpdated,
        skippedMissingFields,
        skippedMissingExternalId: 0,
        failedRows,
        failed: failedRows,
        errors,
        truncated: isCapped,
        message,
        capped: isCapped,
        maxRowsPerImport: MAX_IMPORT_ROWS,
        provider,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[admin/import-csv] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process CSV import" },
      { status: 500 },
    );
  }
}