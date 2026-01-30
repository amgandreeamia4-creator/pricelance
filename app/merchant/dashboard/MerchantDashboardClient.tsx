// app/merchant/dashboard/MerchantDashboardClient.tsx

'use client';

import { useState } from 'react';

interface Merchant {
  id: string;
  name: string;
  website?: string;
  country?: string;
  listingCount: number;
  feedRuns: any[];
}

export default function MerchantDashboardClient({ merchant }: { merchant: Merchant }) {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/merchant/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
      } else {
        setUploadResult({ error: result.error || 'Upload failed' });
      }
    } catch (error) {
      setUploadResult({ error: 'An error occurred during upload' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Merchant Dashboard
            </h1>

            {/* Merchant Info */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Store Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Store Name</p>
                  <p className="text-lg text-gray-900">{merchant.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Website</p>
                  <p className="text-lg text-gray-900">
                    {merchant.website ? (
                      <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {merchant.website}
                      </a>
                    ) : (
                      'Not set'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Country</p>
                  <p className="text-lg text-gray-900">{merchant.country || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Listings</p>
                  <p className="text-lg text-gray-900">{merchant.listingCount}</p>
                </div>
              </div>
            </div>

            {/* CSV Upload */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Product Feed</h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Upload a CSV file with your product listings. The file should include these columns:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">product_name</code> (required)</li>
                  <li><code className="bg-gray-100 px-1 rounded">brand</code> (optional)</li>
                  <li><code className="bg-gray-100 px-1 rounded">category</code> (optional)</li>
                  <li><code className="bg-gray-100 px-1 rounded">price</code> (required)</li>
                  <li><code className="bg-gray-100 px-1 rounded">currency</code> (optional, defaults to USD)</li>
                  <li><code className="bg-gray-100 px-1 rounded">product_url</code> (required)</li>
                  <li><code className="bg-gray-100 px-1 rounded">sku</code> (optional)</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Choose CSV File'}
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  {uploading ? 'Processing your file...' : 'Select a CSV file to upload'}
                </p>
              </div>

              {uploadResult && (
                <div className={`mt-4 p-4 rounded-md ${
                  uploadResult.error 
                    ? 'bg-red-50 border border-red-200 text-red-700' 
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  {uploadResult.error ? (
                    <p className="font-medium">Error: {uploadResult.error}</p>
                  ) : (
                    <div>
                      <p className="font-medium">Upload completed successfully!</p>
                      <p className="text-sm mt-1">
                        Total rows: {uploadResult.rowsTotal} | 
                        Imported: {uploadResult.rowsImported} | 
                        Failed: {uploadResult.rowsFailed}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Feed Runs */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Uploads</h2>
              {merchant.feedRuns.length === 0 ? (
                <p className="text-gray-500">No uploads yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Imported
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Failed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {merchant.feedRuns.map((run: any) => (
                        <tr key={run.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(run.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.filename || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.rowsTotal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.rowsImported}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.rowsFailed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
