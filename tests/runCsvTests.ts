import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Lightweight validators (mirror production expectations)
function isValidAbsoluteUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidPrice(price: any): boolean {
  return typeof price === 'number' && Number.isFinite(price) && price > 0;
}

async function runFile(filePath: string) {
  const fileName = path.basename(filePath);
  const raw = fs.readFileSync(filePath, 'utf-8');
  console.log('\n--- Running test for', fileName, '---');
  // Lightweight parsers to avoid importing project modules in this simple runner
  function parseCsv(content: string): string[][] {
    const rows: string[][] = [];
    const clean = content.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      rows.push(parts);
    }
    return rows;
  }

  function normalizeProfitshareCsv(content: string) {
    const csv = parseCsv(content);
    if (csv.length < 2) return [];
    const header = csv[0].map((h) => h.toLowerCase().trim());
    const idx = (name: string) => header.findIndex((h) => h.includes(name));
    const nameIdx = idx('product_name') !== -1 ? idx('product_name') : idx('name');
    const urlIdx = idx('product_url') !== -1 ? idx('product_url') : idx('product link');
    const affiliateIdx = idx('affiliate') !== -1 ? idx('affiliate') : idx('affiliate_link');
    const priceIdx = idx('price');
    const currencyIdx = idx('currency');
    const storeIdx = header.findIndex((h) => h.includes('storename') || h.includes('storename'.toLowerCase()) || h.includes('storename'));

    const rows = [] as any[];
    for (let i = 1; i < csv.length; i++) {
      const r = csv[i];
      const name = r[nameIdx] || r[0] || '';
      const url = r[urlIdx] || r[affiliateIdx] || '';
      const price = Number((r[priceIdx] || '').replace(',', '.')) || NaN;
      const currency = (r[currencyIdx] || 'RON').toUpperCase();
      const storeName = r[storeIdx] || (url ? new URL(url).hostname.replace(/^www\./, '') : 'unknown');

      rows.push({
        productTitle: name,
        brand: undefined,
        category: undefined,
        gtin: undefined,
        storeId: (storeName || 'unknown').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_'),
        storeName,
        url,
        price: Number.isFinite(price) ? price : NaN,
        currency,
        imageUrl: undefined,
        inStock: true,
        source: 'affiliate',
      });
    }
    return rows;
  }

  function normalizeTwoPerformantCsv(content: string) {
    const csv = parseCsv(content);
    if (csv.length < 2) return [];
    const header = csv[0].map((h) => h.toLowerCase().trim());
    const nameIdx = header.findIndex((h) => h.includes('product name') || h.includes('nume produs'));
    const priceIdx = header.findIndex((h) => h.includes('price'));
    const advertiserIdx = header.findIndex((h) => h.includes('advertiser'));
    const productLinkIdx = header.findIndex((h) => h.includes('product link'));

    const rows: any[] = [];
    for (let i = 1; i < csv.length; i++) {
      const r = csv[i];
      const name = r[nameIdx] || r[4] || '';
      const url = r[productLinkIdx] || r[6] || '';
      const price = Number((r[priceIdx] || '').replace(',', '.')) || NaN;
      const storeName = r[advertiserIdx] || (url ? new URL(url).hostname.replace(/^www\./, '') : 'unknown');

      rows.push({
        productTitle: name,
        brand: undefined,
        category: undefined,
        gtin: undefined,
        storeId: (storeName || 'unknown').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_'),
        storeName,
        url,
        price: Number.isFinite(price) ? price : NaN,
        currency: 'RON',
        imageUrl: undefined,
        inStock: true,
        source: 'affiliate',
      });
    }
    return rows;
  }

  let normalized: any[] = [];
  if (fileName.includes('profitshare')) normalized = normalizeProfitshareCsv(raw);
  else if (fileName.includes('performant')) normalized = normalizeTwoPerformantCsv(raw);
  else if (fileName.includes('broken')) normalized = normalizeProfitshareCsv(raw);

  const errors: any[] = [];
  let created = 0;
  let createdCounter = 0;

  function mockWriteToDatabase(input: any) {
    createdCounter++;
    return { id: `mock_${createdCounter}` };
  }

  for (let i = 0; i < normalized.length; i++) {
    const row = normalized[i];
    const rowIndex = i + 2; // approximate CSV row number (header + 1)

    // Basic validation
    if (!row) {
      errors.push({ rowIndex, reason: 'Empty normalized row', rawRow: row });
      continue;
    }

    if (!isValidPrice(row.price)) {
      errors.push({ rowIndex, reason: 'Invalid price', rawRow: row });
      continue;
    }

    if (!isValidAbsoluteUrl(row.url)) {
      errors.push({ rowIndex, reason: 'Invalid or missing URL', rawRow: row });
      continue;
    }

    if (!row.storeName || String(row.storeName).trim() === '') {
      errors.push({ rowIndex, reason: 'Missing storeName', rawRow: row });
      continue;
    }

    // All good -> mock write
    mockWriteToDatabase(row);
    created++;
  }

  const totalRows = normalized.length;
  const failed = errors.length;

  console.log('=== CSV TEST RESULTS ===');
  console.log('File:', fileName);
  console.log('Total rows:', totalRows);
  console.log('Created:', created);
  console.log('Failed:', failed);
  if (errors.length) {
    console.log('Top errors:', errors.slice(0, 5).map((e) => ({ rowIndex: e.rowIndex, reason: e.reason })));
  }

  // Lightweight assertions
  if (fileName.includes('broken')) {
    if (created !== 0) throw new Error('Broken CSV should not create listings');
  }

  if (fileName.includes('profitshare')) {
    if (created === 0) throw new Error('Valid Profitshare CSV should create listings');
  }

  if (fileName.includes('performant')) {
    if (created === 0) throw new Error('Valid 2Performant CSV should create listings');
  }

  return { fileName, totalRows, created, failed, errors };
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fixturesDir = path.join(__dirname, 'csv');
  const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.csv'));

  const results = [] as any[];

  for (const f of files) {
    const full = path.join(fixturesDir, f);
    try {
      const r = await runFile(full);
      results.push(r);
    } catch (err) {
      console.error('Test failed for', f, err);
      process.exit(2);
    }
  }

  console.log('\nAll CSV tests completed. Summary:');
  for (const r of results) {
    console.log(`- ${r.fileName}: created=${r.created} failed=${r.failed} total=${r.totalRows}`);
  }
}

main().catch((err) => {
  console.error('Run failed:', err);
  process.exit(1);
});
