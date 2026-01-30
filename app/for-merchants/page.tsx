// app/for-merchants/page.tsx

import Link from 'next/link';

export default function ForMerchants() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            List Your Store on PriceLance
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Reach thousands of customers looking for the best deals on electronics. 
            Free listing, no hidden fees, direct traffic to your store.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mx-auto">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Free Listing</h3>
              <p className="mt-2 text-base text-gray-500">
                No listing fees, no feed/API fees. Upload your products and start getting traffic immediately.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mx-auto">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Direct Traffic</h3>
              <p className="mt-2 text-base text-gray-500">
                Customers click directly to your product pages. No middleman, no commission on sales.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mx-auto">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Full Control</h3>
              <p className="mt-2 text-base text-gray-500">
                Update your inventory anytime. Replace or remove your feed whenever you want.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-medium text-gray-900">Create Account</h3>
              <p className="mt-2 text-sm text-gray-500">
                Sign up for a free merchant account in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-medium text-gray-900">Upload CSV</h3>
              <p className="mt-2 text-sm text-gray-500">
                Export your products to CSV and upload through our dashboard.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-medium text-gray-900">Go Live</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your products appear in PriceLance search results instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-medium text-gray-900">Get Sales</h3>
              <p className="mt-2 text-sm text-gray-500">
                Customers find your products and buy directly from your store.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Always Free for Merchants
            </h3>
            <p className="text-blue-700 max-w-2xl mx-auto">
              Appearing in PriceLance comparisons and sending us your product feed will remain free for merchants, 
              even as we grow. Our business model is based on bringing you customers, not charging for data access.
            </p>
          </div>

          <Link
            href="/merchant/signup"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            List Your Store
          </Link>
          <p className="mt-4 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/merchant/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-16 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            CSV Format Requirements
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              Your CSV file should include these columns (required fields marked with *):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">product_name*</code>
                <p className="text-sm text-gray-500 mt-1">Product name/title</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">brand</code>
                <p className="text-sm text-gray-500 mt-1">Brand name (optional)</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">category</code>
                <p className="text-sm text-gray-500 mt-1">Product category (optional)</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">price*</code>
                <p className="text-sm text-gray-500 mt-1">Product price (numeric)</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">currency</code>
                <p className="text-sm text-gray-500 mt-1">Currency code (defaults to USD)</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">product_url*</code>
                <p className="text-sm text-gray-500 mt-1">Direct link to product page</p>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">sku</code>
                <p className="text-sm text-gray-500 mt-1">Product SKU/ID (optional)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
