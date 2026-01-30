// scripts/test-profitshare-import-simple.js
// Simple test using built-in Node.js modules

const fs = require('fs');
const http = require('http');
const path = require('path');

const API_URL = 'http://localhost:3001/api/admin/import-csv';
const ADMIN_TOKEN = 'oneeverywhereharadevharapld3s3r112369';

// Create a minimal valid Profitshare CSV for testing
const testCsv = `product_name,product_url,affiliate_link,price,currency,category
"Test Product 1","https://example.com/p1","https://aff.example.com/p1","123.45","RON","Test Category"
"Test Product 2","https://example.com/p2","https://aff.example.com/p2","234.56","RON","Test Category"
"Test Product 3","https://example.com/p3","https://aff.example.com/p3","345.67","RON","Test Category"`;

function createFormData(boundary, data, fileField, fileName, fileContent) {
  let formData = '';
  
  // Add form fields
  for (const [key, value] of Object.entries(data)) {
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    formData += `${value}\r\n`;
  }
  
  // Add file
  formData += `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="${fileField}"; filename="${fileName}"\r\n`;
  formData += `Content-Type: text/csv\r\n\r\n`;
  formData += fileContent + '\r\n';
  formData += `--${boundary}--\r\n`;
  
  return formData;
}

async function runTest() {
  console.log('🧪 Starting Profitshare import smoke test...');
  
  return new Promise((resolve, reject) => {
    try {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2, 16);
      
      const formData = createFormData(
        boundary,
        { provider: 'profitshare' },
        'file',
        'test-profitshare.csv',
        testCsv
      );
      
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/admin/import-csv',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'x-admin-token': ADMIN_TOKEN,
          'Content-Length': Buffer.byteLength(formData)
        }
      };
      
      console.log('📤 Sending request to API...');
      
      const req = http.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          console.log('\n📊 Response status:', res.statusCode);
          
          try {
            const result = JSON.parse(body);
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
                result.errors.slice(0, 3).forEach((err, i) => {
                  console.log(`  ${i + 1}. Row ${err.rowNumber}: ${err.message}`);
                });
              }
            }
            
            resolve(result);
          } catch (parseError) {
            console.log('❌ Failed to parse response as JSON:');
            console.log('Raw response:', body);
            reject(parseError);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Request failed:', error);
        reject(error);
      });
      
      req.write(formData);
      req.end();
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      reject(error);
    }
  });
}

runTest().catch(console.error);
