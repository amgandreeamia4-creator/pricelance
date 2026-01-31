import { NextRequest, NextResponse } from 'next/server';
import { getMerchantSession } from '@/lib/merchantAuth';
import { parseMerchantCsv, processMerchantListings, logMerchantFeedRun } from '@/lib/merchantCsv';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getMerchantSession();
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: session.merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { message: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No CSV file provided' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { message: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    if (!csvContent.trim()) {
      return NextResponse.json(
        { message: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Parse CSV
    const parseResult = parseMerchantCsv(csvContent);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          message: 'CSV parsing failed',
          errors: parseResult.errors
        },
        { status: 400 }
      );
    }

    if (parseResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'No valid rows found in CSV' },
        { status: 400 }
      );
    }

    // Process listings
    const processResult = await processMerchantListings(
      parseResult.rows,
      merchant.id,
      merchant.storeName
    );

    // Log the feed run
    await logMerchantFeedRun(merchant.id, file.name, processResult);

    // Return results
    return NextResponse.json(
      {
        message: processResult.success
          ? 'CSV processed successfully'
          : 'CSV processed with some errors',
        rowsTotal: processResult.rowsTotal,
        rowsProcessed: processResult.rowsSuccess,
        rowsError: processResult.rowsError,
        errors: processResult.errors,
        success: processResult.success,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
