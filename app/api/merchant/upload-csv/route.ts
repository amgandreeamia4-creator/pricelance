// app/api/merchant/upload-csv/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { requireMerchantAuth } from '@/lib/merchantAuth';

const prisma = new PrismaClient();

interface CSVRow {
  product_name: string;
  brand?: string;
  category?: string;
  price: string;
  currency?: string;
  product_url: string;
  sku?: string;
}

async function handleUpload(req: NextRequest, session: any): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const csvText = await file.text();
    let rows: CSVRow[];
    
    try {
      rows = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse CSV file' },
        { status: 400 }
      );
    }

    let rowsTotal = rows.length;
    let rowsImported = 0;
    let rowsFailed = 0;

    // Process each row
    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.product_name?.trim() || !row.price?.trim() || !row.product_url?.trim()) {
          rowsFailed++;
          continue;
        }

        // Parse price
        const price = parseFloat(row.price.replace(/[^\d.-]/g, ''));
        if (isNaN(price) || price <= 0) {
          rowsFailed++;
          continue;
        }

        // Normalize currency (default to USD)
        const currency = row.currency?.trim().toUpperCase() || 'USD';

        // Find or create product
        let product;
        const productName = row.product_name.trim();
        const brand = row.brand?.trim();
        const sku = row.sku?.trim();

        if (sku) {
          // Try to find by SKU first
          product = await prisma.product.findFirst({
            where: {
              OR: [
                { externalId: sku },
                { gtin: sku }
              ]
            }
          });
        }

        if (!product && brand) {
          // Try to find by brand + name combination
          product = await prisma.product.findFirst({
            where: {
              brand: brand,
              name: {
                contains: productName,
                mode: 'insensitive'
              }
            }
          });
        }

        if (!product) {
          // Create new product
          product = await prisma.product.create({
            data: {
              name: productName,
              brand: brand || null,
              category: row.category?.trim() || null,
              externalId: sku || null,
              source: 'merchant_csv',
            }
          });
        }

        // Create or update listing
        const existingListing = await prisma.listing.findFirst({
          where: {
            productId: product.id,
            merchantId: session.merchantId,
            url: row.product_url.trim()
          }
        });

        if (existingListing) {
          // Update existing listing
          await prisma.listing.update({
            where: { id: existingListing.id },
            data: {
              price,
              currency,
              storeName: '', // Will be filled from merchant name
              source: 'sheet' as any,
              updatedAt: new Date()
            }
          });
        } else {
          // Create new listing
          await prisma.listing.create({
            data: {
              productId: product.id,
              merchantId: session.merchantId,
              price,
              currency,
              url: row.product_url.trim(),
              storeName: '', // Will be filled from merchant name
              source: 'sheet' as any,
            }
          });
        }

        rowsImported++;
      } catch (rowError) {
        console.error('Error processing row:', rowError);
        rowsFailed++;
      }
    }

    // Create feed run record
    await prisma.merchantFeedRun.create({
      data: {
        merchantId: session.merchantId,
        filename: file.name,
        rowsTotal,
        rowsImported,
        rowsFailed,
      }
    });

    // Update merchant name in storeName field for all their listings
    const merchant = await prisma.merchant.findUnique({
      where: { id: session.merchantId }
    });

    if (merchant) {
      await prisma.listing.updateMany({
        where: { merchantId: session.merchantId },
        data: { storeName: merchant.name }
      });
    }

    return NextResponse.json({
      rowsTotal,
      rowsImported,
      rowsFailed,
      message: `Processed ${rowsTotal} rows. Imported: ${rowsImported}, Failed: ${rowsFailed}`
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireMerchantAuth(handleUpload);
