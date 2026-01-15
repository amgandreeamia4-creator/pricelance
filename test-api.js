// Test API endpoint
const testAPI = async () => {
  try {
    console.log('Testing /api/products endpoint...');
    
    const response = await fetch('http://localhost:3000/api/products?q=laptop', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('Success! Products found:', data.products?.length || 0);
    } else {
      console.error('API Error:', response.status, text);
    }
  } catch (error) {
    console.error('Network Error:', error.message);
  }
};

testAPI();
