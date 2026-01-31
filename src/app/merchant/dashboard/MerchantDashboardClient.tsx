"use client";

import { useState } from 'react';
import { MerchantWithUser } from '@/lib/merchantAuth';

interface MerchantDashboardClientProps {
  merchant: MerchantWithUser;
}

export default function MerchantDashboardClient({ merchant }: MerchantDashboardClientProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        setUploadStatus({
          type: 'error',
          message: 'Please select a CSV file',
        });
        return;
      }
      setCsvFile(file);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a CSV file first',
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: 'info', message: 'Uploading and processing CSV...' });

    try {
      const formData = new FormData();
      formData.append('csv', csvFile);

      const response = await fetch('/api/merchant/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      setUploadStatus({
        type: 'success',
        message: `CSV uploaded successfully! ${result.rowsProcessed || 0} rows processed.`,
      });
      setCsvFile(null);

      // Reset file input
      const fileInput = document.getElementById('csvFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/merchant/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/merchant/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Force redirect even if the API call fails
      window.location.href = '/merchant/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-6 py-4 sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {merchant.storeName} - Merchant Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your product listings and store information
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Store Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Store Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{merchant.storeName}</dd>
              </div>
              {merchant.website && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={merchant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500"
                    >
                      {merchant.website}
                    </a>
                  </dd>
                </div>
              )}
              {merchant.country && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Country</dt>
                  <dd className="mt-1 text-sm text-gray-900">{merchant.country}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{merchant.users[0]?.email}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Upload Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Product CSV</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Upload a CSV file with your product listings. The CSV should include columns for:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li><strong>productTitle</strong> - Product name</li>
                <li><strong>brand</strong> - Product brand</li>
                <li><strong>category</strong> - Product category</li>
                <li><strong>url</strong> - Product URL</li>
                <li><strong>price</strong> - Product price (numeric)</li>
                <li><strong>currency</strong> - Currency code (e.g., RON, USD)</li>
                <li><strong>gtin</strong> - Product GTIN/EAN (optional)</li>
                <li><strong>imageUrl</strong> - Product image URL (optional)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700">
                  Select CSV File
                </label>
                <div className="mt-1">
                  <input
                    id="csvFile"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                </div>
                {csvFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {csvFile.name} ({Math.round(csvFile.size / 1024)}KB)
                  </p>
                )}
              </div>

              {uploadStatus.message && (
                <div className={`rounded-md p-4 ${
                  uploadStatus.type === 'success' ? 'bg-green-50' :
                  uploadStatus.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
                }`}>
                  <div className={`text-sm ${
                    uploadStatus.type === 'success' ? 'text-green-700' :
                    uploadStatus.type === 'error' ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {uploadStatus.message}
                  </div>
                </div>
              )}

              <div>
                <button
                  onClick={handleUpload}
                  disabled={!csvFile || uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Upload CSV'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
