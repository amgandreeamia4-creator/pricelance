// scripts/test-profitshare-import.ts
// Quick smoke test for Profitshare CSV import API

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api/admin/import-csv';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-token';

// Create a minimal valid Profitshare CSV for testing
const testCsv = `product_name,product_url,affiliate_link,price,currency,category
"Test Product 1","https://example.com/p1","https://aff.example.com/p1","123.45","RON","Test Category"
"Test Product 2","https://example.com/p2","https://aff.example.com/p2","234.56","RON","Test Category"
"Test Product 3","https://example.com/p3","https://aff.example.com/p3","345.67","RON","Test Category"`;

async function runTest() {
  console.log('🧪 Starting Profitshare import smoke test...');
  
  try {
    // Create a temporary CSV file
    const tempCsvPath = './temp-test-profitshare.csv';
    fs.writeFileSync(tempCsvPath, testCsv);
    console.log('✅ Created temporary CSV file');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempCsvPath));
    formData.append('provider', 'profitshare');
    
    console.log('📤 Sending request to API...');
    
    // Send request to API
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'x-admin-token': ADMIN_TOKEN,
        ...formData.getHeaders(),
      },
    });
    
    const result = await response.json() as any;
    
    console.log('\n📊 Response status:', response.status);
    console.log('📊 Response body:');
    console.log(JSON.stringify(result, null, 2));
    
    // Analyze results
    console.log('\n🔍 Analysis:');
    console.log('- ok:', result.ok);
    console.log('- createdProducts:', result.createdProducts || 0);
    console.log('- createdListings:', result.createdListings || 0);
    console.log('- failedRows:', result.failedRows || 0);
    
    if (result.ok && (result.createdProducts > 0 || result.createdListings > 0) && (result.failedRows || 0) === 0) {
      console.log('✅ Test PASSED - Import successful!');
    } else {
      console.log('❌ Test FAILED - Import issues detected');
      if (result.errors && result.errors.length > 0) {
        console.log('First few errors:');
        result.errors.slice(0, 3).forEach((err: any, i: number) => {
          console.log(`  ${i + 1}. Row ${err.rowNumber}: ${err.message}`);
        });
      }
    }
    
    // Cleanup
    fs.unlinkSync(tempCsvPath);
    console.log('🧹 Cleaned up temporary file');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

runTest();
